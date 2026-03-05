/**
 * Run:
 * cd modules && node --env-file=.env --experimental-strip-types ./routing-patterns/coordinator-routing.workflow.example.ts
 */
import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import {
  RunnableBranch,
  RunnablePassthrough,
  RunnableSequence,
  type RunnableAssign,
} from "@langchain/core/runnables";
import { ChatOpenAI } from "@langchain/openai";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const ROUTER_SYSTEM_PROMPT: string = [
  "Analyze the user's request and determine which specialist handler should process it.",
  "- If the request is related to booking flights or hotels, output 'booker'.",
  "- For all other general information questions, output 'info'.",
  "- If the request is unclear or doesn't fit either category, output 'unclear'.",
  "ONLY output one word: 'booker', 'info', or 'unclear'.",
].join("\n");

const DEFAULT_WORKFLOW_REQUESTS: Array<string> = [
  "Book me a flight to London.",
  "Book a hotel in Busan for next weekend.",
  "What is the capital of Italy?",
  "Please handle this.",
];

type CoordinatorDecision = "booker" | "info" | "unclear";
type CoordinatorAgentName = "booking_agent" | "info_agent" | "unclear_agent";

export type RuntimeConfig = {
  apiKey: string;
  baseUrl: string;
  modelName: string;
};

export type CoordinatorRoutingResult = {
  request: string;
  decision: CoordinatorDecision;
  output: string;
  agentName: CoordinatorAgentName;
  modelName: string;
};

type CoordinatorRequest = {
  request: string;
};

type CoordinatorBranchPayload = {
  decision: string;
  request: CoordinatorRequest;
};

type CoordinatorBranchResult = CoordinatorBranchPayload & {
  output: string;
  agentName: CoordinatorAgentName;
};

type CoordinatorAgent = {
  invoke(input: CoordinatorRequest): Promise<CoordinatorBranchResult>;
};

type RouterDecisionChain = {
  invoke(input: CoordinatorRequest): Promise<string>;
};

type DelegationAssignment = RunnableAssign<
  CoordinatorBranchPayload,
  CoordinatorBranchResult
>;

type CoordinatorRequestHandler = (requestText: string) => string;

function requireEnvValue(env: NodeJS.ProcessEnv, key: string): string {
  const envValue: string | undefined = env[key]?.trim();
  if (!envValue) {
    throw new Error(`${key} is missing.`);
  }
  return envValue;
}

function buildRuntimeConfigFromEnv(env: NodeJS.ProcessEnv): RuntimeConfig {
  return {
    apiKey: requireEnvValue(env, "API_KEY"),
    baseUrl: requireEnvValue(env, "BASE_URL"),
    modelName: requireEnvValue(env, "MODEL"),
  };
}

function bookingHandler(requestText: string): string {
  return `Booking Handler processed request: '${requestText}'. Result: Simulated booking action.`;
}

function infoHandler(requestText: string): string {
  return `Info Handler processed request: '${requestText}'. Result: Simulated information retrieval.`;
}

function unclearHandler(requestText: string): string {
  return `Coordinator could not delegate request: '${requestText}'. Please clarify.`;
}

const HANDLER_BY_AGENT_TYPE: Record<
  CoordinatorAgentName,
  CoordinatorRequestHandler
> = {
  booking_agent: bookingHandler,
  info_agent: infoHandler,
  unclear_agent: unclearHandler,
};

function getHandlerByAgentType(
  agentType: CoordinatorAgentName,
): CoordinatorRequestHandler {
  return HANDLER_BY_AGENT_TYPE[agentType];
}

function normalizeDecision(rawDecision: string): CoordinatorDecision {
  const normalizedDecision: string = rawDecision.trim().toLowerCase();
  if (normalizedDecision === "booker") {
    return "booker";
  }
  if (normalizedDecision === "info") {
    return "info";
  }
  return "unclear";
}

function createDelegationAssignment(
  agentName: CoordinatorAgentName,
): DelegationAssignment {
  const handler: CoordinatorRequestHandler = getHandlerByAgentType(agentName);
  return RunnablePassthrough.assign({
    output: (input: CoordinatorBranchPayload): string =>
      handler(input.request.request),
    agentName: (_input: CoordinatorBranchPayload): CoordinatorAgentName =>
      agentName,
  });
}

function createRouterPrompt(): ReturnType<
  typeof ChatPromptTemplate.fromMessages
> {
  return ChatPromptTemplate.fromMessages([
    ["system", ROUTER_SYSTEM_PROMPT],
    ["user", "{request}"],
  ]);
}

function createRouterModel(runtimeConfig: RuntimeConfig): ChatOpenAI {
  return new ChatOpenAI({
    apiKey: runtimeConfig.apiKey,
    model: runtimeConfig.modelName,
    temperature: 0,
    timeout: 180000,
    maxRetries: 1,
    configuration: {
      baseURL: runtimeConfig.baseUrl,
    },
  });
}

function createRouterParser(): StringOutputParser {
  return new StringOutputParser();
}

function createRouterDecisionChain(
  runtimeConfig: RuntimeConfig,
): RouterDecisionChain {
  const prompt: ReturnType<typeof ChatPromptTemplate.fromMessages> =
    createRouterPrompt();
  const model: ChatOpenAI = createRouterModel(runtimeConfig);
  const parser: StringOutputParser = createRouterParser();
  return prompt.pipe(model).pipe(parser) as RouterDecisionChain;
}

function createCoordinatorDelegationBranch(): RunnableBranch<
  CoordinatorBranchPayload,
  CoordinatorBranchResult
> {
  return RunnableBranch.from<CoordinatorBranchPayload, CoordinatorBranchResult>(
    [
      [
        (input: CoordinatorBranchPayload): boolean =>
          normalizeDecision(input.decision) === "booker",
        createDelegationAssignment("booking_agent"),
      ],
      [
        (input: CoordinatorBranchPayload): boolean =>
          normalizeDecision(input.decision) === "info",
        createDelegationAssignment("info_agent"),
      ],
      createDelegationAssignment("unclear_agent"),
    ],
  );
}

function createCoordinatorSequence(
  routerChain: RouterDecisionChain,
  delegationBranch: RunnableBranch<
    CoordinatorBranchPayload,
    CoordinatorBranchResult
  >,
): CoordinatorAgent {
  return RunnableSequence.from([
    {
      decision: routerChain,
      request: new RunnablePassthrough<CoordinatorRequest>(),
    },
    delegationBranch,
  ]) as CoordinatorAgent;
}

function buildCoordinatorAgent(runtimeConfig: RuntimeConfig): CoordinatorAgent {
  const routerChain: RouterDecisionChain =
    createRouterDecisionChain(runtimeConfig);
  const delegationBranch: RunnableBranch<
    CoordinatorBranchPayload,
    CoordinatorBranchResult
  > = createCoordinatorDelegationBranch();
  return createCoordinatorSequence(routerChain, delegationBranch);
}

function runCoordinatorAgentForRequest(
  coordinatorAgent: CoordinatorAgent,
  requestText: string,
): Promise<CoordinatorBranchResult> {
  return coordinatorAgent.invoke({
    request: requestText,
  });
}

function toRoutingResult(
  requestText: string,
  modelName: string,
  branchResult: CoordinatorBranchResult,
): CoordinatorRoutingResult {
  return {
    request: requestText,
    decision: normalizeDecision(branchResult.decision),
    output: branchResult.output,
    agentName: branchResult.agentName,
    modelName,
  };
}

export async function runCoordinatorWorkflow(
  env: NodeJS.ProcessEnv = process.env,
): Promise<Array<CoordinatorRoutingResult>> {
  const runtimeConfig: RuntimeConfig = buildRuntimeConfigFromEnv(env);

  const coordinatorAgent: CoordinatorAgent =
    buildCoordinatorAgent(runtimeConfig);

  const results: Array<CoordinatorRoutingResult> = [];

  for (const requestText of DEFAULT_WORKFLOW_REQUESTS) {
    const branchResult: CoordinatorBranchResult =
      await runCoordinatorAgentForRequest(coordinatorAgent, requestText);
    const routingResult: CoordinatorRoutingResult = toRoutingResult(
      requestText,
      runtimeConfig.modelName,
      branchResult,
    );
    results.push(routingResult);
  }

  return results;
}

function isDirectExecution(
  moduleUrl: string,
  argv: readonly string[],
): boolean {
  const scriptPath: string | undefined = argv[1];
  if (!scriptPath) {
    return false;
  }

  const scriptUrl: string = pathToFileURL(resolve(scriptPath)).href;
  return scriptUrl === moduleUrl;
}

async function runCoordinatorWorkflowFromCli(): Promise<void> {
  const results: Array<CoordinatorRoutingResult> = await runCoordinatorWorkflow(
    process.env,
  );
  console.log(JSON.stringify(results, null, 2));
}

async function runCoordinatorWorkflowFromCliIfDirectExecution(
  moduleUrl: string,
  argv: readonly string[],
): Promise<void> {
  const isDirectMode: boolean = isDirectExecution(moduleUrl, argv);
  if (!isDirectMode) {
    return;
  }

  await runCoordinatorWorkflowFromCli();
}

void runCoordinatorWorkflowFromCliIfDirectExecution(
  import.meta.url,
  process.argv,
).catch((error: unknown): void => {
  const errorMessage: string =
    error instanceof Error ? error.message : String(error);
  console.error(errorMessage);
  process.exitCode = 1;
});
