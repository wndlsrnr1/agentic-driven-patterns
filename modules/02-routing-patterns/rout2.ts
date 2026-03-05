/**
 * Run:
 * cd modules && node --env-file=.env --experimental-strip-types ./routing-patterns/rout2.ts -- "Book me a hotel in Paris."
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

const DEFAULT_BASE_URL: string = "https://api.synthetic.new/openai/v1";
const DEFAULT_MODEL: string = "hf:moonshotai/Kimi-K2.5";
const DEFAULT_SINGLE_REQUEST: string = "Book me a hotel in Paris.";

const ROUTER_SYSTEM_PROMPT: string = [
  "Analyze the user's request and determine which specialist handler should process it.",
  "- If the request is related to booking flights or hotels, output 'booker'.",
  "- For all other general information questions, output 'info'.",
  "- If the request is unclear or doesn't fit either category, output 'unclear'.",
  "ONLY output one word: 'booker', 'info', or 'unclear'.",
].join("\n");

type CoordinatorDecision = "booker" | "info" | "unclear";
type CoordinatorAgentName = "booking_agent" | "info_agent" | "unclear_agent";

export type RuntimeConfig = {
  apiKey: string;
  baseUrl: string;
  modelName: string;
};

export type RoutingResult = {
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

type CoordinatorRequestHandler = (requestText: string) => string;

type RouterDecisionChain = {
  invoke(input: CoordinatorRequest): Promise<string>;
};

type CoordinatorAgent = {
  invoke(input: CoordinatorRequest): Promise<CoordinatorBranchResult>;
};

type DelegationAssignment = RunnableAssign<
  CoordinatorBranchPayload,
  CoordinatorBranchResult
>;

function requireEnvValue(env: NodeJS.ProcessEnv, key: string): string {
  const rawValue: string | undefined = env[key]?.trim();
  if (!rawValue) {
    throw new Error(`${key} is missing.`);
  }
  return rawValue;
}

export function buildRuntimeConfigFromEnv(
  env: NodeJS.ProcessEnv,
): RuntimeConfig {
  const runtimeConfig: RuntimeConfig = {
    apiKey: requireEnvValue(env, "API_KEY"),
    baseUrl: env.BASE_URL?.trim() ?? DEFAULT_BASE_URL,
    modelName: env.MODEL?.trim() ?? DEFAULT_MODEL,
  };
  return runtimeConfig;
}

export function resolveCliRequest(argv: readonly string[]): string | undefined {
  const requestText: string = argv.slice(2).join(" ").trim();
  return requestText.length > 0 ? requestText : undefined;
}

function resolveRequestFromCliOrDefault(argv: readonly string[]): string {
  const cliRequest: string | undefined = resolveCliRequest(argv);
  return cliRequest ?? DEFAULT_SINGLE_REQUEST;
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

const HANDLER_BY_AGENT_NAME: Record<
  CoordinatorAgentName,
  CoordinatorRequestHandler
> = {
  booking_agent: bookingHandler,
  info_agent: infoHandler,
  unclear_agent: unclearHandler,
};

function getHandlerByAgentName(
  agentName: CoordinatorAgentName,
): CoordinatorRequestHandler {
  return HANDLER_BY_AGENT_NAME[agentName];
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

function createRouterChain(runtimeConfig: RuntimeConfig): RouterDecisionChain {
  const prompt: ReturnType<typeof ChatPromptTemplate.fromMessages> =
    createRouterPrompt();
  const model: ChatOpenAI = createRouterModel(runtimeConfig);
  const parser: StringOutputParser = createRouterParser();
  return prompt.pipe(model).pipe(parser) as RouterDecisionChain;
}

function createDelegationAssignment(
  agentName: CoordinatorAgentName,
): DelegationAssignment {
  const handler: CoordinatorRequestHandler = getHandlerByAgentName(agentName);
  return RunnablePassthrough.assign({
    output: (input: CoordinatorBranchPayload): string =>
      handler(input.request.request),
    agentName: (_input: CoordinatorBranchPayload): CoordinatorAgentName =>
      agentName,
  });
}

function createDelegationBranch(): RunnableBranch<
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

function createCoordinatorAgent(
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
  const routerChain: RouterDecisionChain = createRouterChain(runtimeConfig);
  const delegationBranch: RunnableBranch<
    CoordinatorBranchPayload,
    CoordinatorBranchResult
  > = createDelegationBranch();
  return createCoordinatorAgent(routerChain, delegationBranch);
}

function toRoutingResult(
  requestText: string,
  modelName: string,
  branchResult: CoordinatorBranchResult,
): RoutingResult {
  return {
    request: requestText,
    decision: normalizeDecision(branchResult.decision),
    output: branchResult.output,
    agentName: branchResult.agentName,
    modelName,
  };
}

export async function runRout2Workflow(
  requestText: string,
  env: NodeJS.ProcessEnv = process.env,
): Promise<RoutingResult> {
  const runtimeConfig: RuntimeConfig = buildRuntimeConfigFromEnv(env);
  const coordinatorAgent: CoordinatorAgent =
    buildCoordinatorAgent(runtimeConfig);
  const branchResult: CoordinatorBranchResult = await coordinatorAgent.invoke({
    request: requestText,
  });
  const routingResult: RoutingResult = toRoutingResult(
    requestText,
    runtimeConfig.modelName,
    branchResult,
  );
  return routingResult;
}

export async function runRout2FromCli(
  env: NodeJS.ProcessEnv = process.env,
  argv: readonly string[] = process.argv,
): Promise<void> {
  const requestText: string = resolveRequestFromCliOrDefault(argv);
  const routingResult: RoutingResult = await runRout2Workflow(requestText, env);
  console.log(JSON.stringify(routingResult, null, 2));
}

void runRout2FromCli(process.env, process.argv).catch(
  (error: unknown): void => {
    const errorMessage: string =
      error instanceof Error ? error.message : String(error);
    console.error(errorMessage);
    process.exitCode = 1;
  },
);
