/**
 * Run:
 * cd modules && node --env-file=.env --experimental-strip-types ./routing-patterns/coordinator-routing-openai.ts -- "Book me a hotel in Paris."
 */
import {
  Agent,
  OpenAIProvider,
  Runner,
  setOpenAIAPI,
  setDefaultOpenAIKey,
  tool,
} from "@openai/agents";
import { z } from "zod";

const DEFAULT_SYNTHETIC_BASE_URL: string =
  "https://api.synthetic.new/openai/v1";
const DEFAULT_SYNTHETIC_MODEL: string = "hf:moonshotai/Kimi-K2.5";
const DEFAULT_SINGLE_REQUEST: string = "Book me a hotel in Paris.";

type CoordinatorDecision = "booker" | "info" | "unclear";
type CoordinatorAgentName = "booking_agent" | "info_agent" | "unclear_agent";

type RoutingPayload = {
  decision: CoordinatorDecision;
  agentName: CoordinatorAgentName;
  output: string;
};

type AgentsRunnerOutput = {
  finalOutput: unknown;
};

type AgentsRunner = (requestText: string) => Promise<AgentsRunnerOutput>;
type OpenAiApiMode = "responses" | "chat_completions";
type Logger = (message: string) => void;

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

export type RunRout3WorkflowOptions = {
  env?: NodeJS.ProcessEnv;
  agentsRunner?: AgentsRunner;
  log?: Logger;
};

const ROUTING_TOOL_INPUT_SCHEMA: z.ZodObject<{ request: z.ZodString }> =
  z.object({
    request: z.string(),
  });

type RoutingToolInput = z.infer<typeof ROUTING_TOOL_INPUT_SCHEMA>;

const AGENT_NAME_BY_DECISION: Record<
  CoordinatorDecision,
  CoordinatorAgentName
> = {
  booker: "booking_agent",
  info: "info_agent",
  unclear: "unclear_agent",
};

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
    apiKey: requireEnvValue(env, "SYNTHETIC_API_KEY"),
    baseUrl: env.SYNTHETIC_BASE_URL?.trim() ?? DEFAULT_SYNTHETIC_BASE_URL,
    modelName: env.SYNTHETIC_MODEL?.trim() ?? DEFAULT_SYNTHETIC_MODEL,
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

function normalizeAgentName(
  rawAgentName: string | undefined,
  decision: CoordinatorDecision,
): CoordinatorAgentName {
  if (rawAgentName === "booking_agent") {
    return "booking_agent";
  }
  if (rawAgentName === "info_agent") {
    return "info_agent";
  }
  if (rawAgentName === "unclear_agent") {
    return "unclear_agent";
  }
  return AGENT_NAME_BY_DECISION[decision];
}

function buildRoutingPayloadJson(
  requestText: string,
  decision: CoordinatorDecision,
  agentName: CoordinatorAgentName,
  output: string,
): string {
  const payload: RoutingPayload = {
    decision,
    agentName,
    output,
  };
  return JSON.stringify(payload);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toRecordFromUnknown(
  value: unknown,
): Record<string, unknown> | undefined {
  if (isRecord(value)) {
    return value;
  }
  if (typeof value !== "string") {
    return undefined;
  }
  try {
    const parsedValue: unknown = JSON.parse(value);
    return isRecord(parsedValue) ? parsedValue : undefined;
  } catch (_error: unknown) {
    return undefined;
  }
}

function toRoutingPayload(
  requestText: string,
  finalOutput: unknown,
): RoutingPayload {
  const outputRecord: Record<string, unknown> | undefined =
    toRecordFromUnknown(finalOutput);
  if (!outputRecord) {
    const fallbackOutput: string = unclearHandler(requestText);
    return {
      decision: "unclear",
      agentName: "unclear_agent",
      output: fallbackOutput,
    };
  }

  const rawDecision: string =
    typeof outputRecord.decision === "string"
      ? outputRecord.decision
      : "unclear";
  const normalizedDecision: CoordinatorDecision =
    normalizeDecision(rawDecision);
  const rawAgentName: string | undefined =
    typeof outputRecord.agentName === "string"
      ? outputRecord.agentName
      : undefined;
  const normalizedAgentName: CoordinatorAgentName = normalizeAgentName(
    rawAgentName,
    normalizedDecision,
  );
  const rawOutput: string | undefined =
    typeof outputRecord.output === "string" ? outputRecord.output : undefined;
  const fallbackOutput: string = unclearHandler(requestText);
  const outputText: string = rawOutput ?? fallbackOutput;

  return {
    decision: normalizedDecision,
    agentName: normalizedAgentName,
    output: outputText,
  };
}

function configureAgentsRuntime(
  runtimeConfig: RuntimeConfig,
  apiMode: OpenAiApiMode,
): OpenAIProvider {
  const modelProvider: OpenAIProvider = new OpenAIProvider({
    apiKey: runtimeConfig.apiKey,
    baseURL: runtimeConfig.baseUrl,
    useResponses: apiMode === "responses",
  });
  setDefaultOpenAIKey(runtimeConfig.apiKey);
  setOpenAIAPI(apiMode);
  return modelProvider;
}

function createBookingTool(): ReturnType<typeof tool> {
  const bookingTool: ReturnType<typeof tool> = tool({
    name: "booking_handler",
    description: "Handle flight and hotel booking requests.",
    parameters: ROUTING_TOOL_INPUT_SCHEMA,
    execute: (input: RoutingToolInput): string => {
      const requestText: string = input.request;
      const outputText: string = bookingHandler(requestText);
      return buildRoutingPayloadJson(
        requestText,
        "booker",
        "booking_agent",
        outputText,
      );
    },
  });
  return bookingTool;
}

function createInfoTool(): ReturnType<typeof tool> {
  const infoTool: ReturnType<typeof tool> = tool({
    name: "info_handler",
    description: "Handle general information requests.",
    parameters: ROUTING_TOOL_INPUT_SCHEMA,
    execute: (input: RoutingToolInput): string => {
      const requestText: string = input.request;
      const outputText: string = infoHandler(requestText);
      return buildRoutingPayloadJson(
        requestText,
        "info",
        "info_agent",
        outputText,
      );
    },
  });
  return infoTool;
}

function createUnclearTool(): ReturnType<typeof tool> {
  const unclearTool: ReturnType<typeof tool> = tool({
    name: "unclear_handler",
    description: "Handle requests that cannot be delegated confidently.",
    parameters: ROUTING_TOOL_INPUT_SCHEMA,
    execute: (input: RoutingToolInput): string => {
      const requestText: string = input.request;
      const outputText: string = unclearHandler(requestText);
      return buildRoutingPayloadJson(
        requestText,
        "unclear",
        "unclear_agent",
        outputText,
      );
    },
  });
  return unclearTool;
}

function createBookingAgent(modelName: string): Agent {
  const bookingTool: ReturnType<typeof tool> = createBookingTool();
  const bookingInstructions: string = [
    "You are Booker.",
    "Always call the `booking_handler` tool using the exact original user request.",
    "Do not answer directly.",
  ].join("\n");

  const bookingAgent: Agent = new Agent({
    name: "Booker",
    instructions: bookingInstructions,
    handoffDescription:
      "A specialized agent that handles all flight and hotel booking requests.",
    model: modelName,
    tools: [bookingTool],
    toolUseBehavior: "stop_on_first_tool",
  });
  return bookingAgent;
}

function createInfoAgent(modelName: string): Agent {
  const infoTool: ReturnType<typeof tool> = createInfoTool();
  const infoInstructions: string = [
    "You are Info.",
    "Always call the `info_handler` tool using the exact original user request.",
    "Do not answer directly.",
  ].join("\n");

  const infoAgent: Agent = new Agent({
    name: "Info",
    instructions: infoInstructions,
    handoffDescription:
      "A specialized agent that handles general information questions.",
    model: modelName,
    tools: [infoTool],
    toolUseBehavior: "stop_on_first_tool",
  });
  return infoAgent;
}

function createUnclearAgent(modelName: string): Agent {
  const unclearTool: ReturnType<typeof tool> = createUnclearTool();
  const unclearInstructions: string = [
    "You are Unclear.",
    "Always call the `unclear_handler` tool when routing is uncertain.",
    "Do not answer directly.",
  ].join("\n");

  const unclearAgent: Agent = new Agent({
    name: "Unclear",
    instructions: unclearInstructions,
    handoffDescription:
      "A specialist agent that handles ambiguous or unclear requests.",
    model: modelName,
    tools: [unclearTool],
    toolUseBehavior: "stop_on_first_tool",
  });
  return unclearAgent;
}

function createCoordinatorAgent(
  modelName: string,
  bookingAgent: Agent,
  infoAgent: Agent,
  unclearAgent: Agent,
): Agent {
  const coordinatorInstructions: string = [
    "You are the main coordinator.",
    "Your only task is to analyze incoming user requests and hand off to one specialist agent.",
    "Do not answer the user directly.",
    "- For booking flights/hotels, hand off to Booker.",
    "- For general information requests, hand off to Info.",
    "- For unclear requests, hand off to Unclear.",
  ].join("\n");

  const coordinatorAgent: Agent = Agent.create({
    name: "Coordinator",
    instructions: coordinatorInstructions,
    handoffDescription: "Routes user requests to the correct specialist agent.",
    model: modelName,
    handoffs: [bookingAgent, infoAgent, unclearAgent],
  });
  return coordinatorAgent;
}

async function executeAgentsRun(
  requestText: string,
  runtimeConfig: RuntimeConfig,
  apiMode: OpenAiApiMode,
  logger: Logger,
): Promise<AgentsRunnerOutput> {
  logger(`[routing-openai][engine] Running with API mode: ${apiMode}`);
  const modelProvider: OpenAIProvider = configureAgentsRuntime(
    runtimeConfig,
    apiMode,
  );

  const bookingAgent: Agent = createBookingAgent(runtimeConfig.modelName);
  const infoAgent: Agent = createInfoAgent(runtimeConfig.modelName);
  const unclearAgent: Agent = createUnclearAgent(runtimeConfig.modelName);
  const coordinatorAgent: Agent = createCoordinatorAgent(
    runtimeConfig.modelName,
    bookingAgent,
    infoAgent,
    unclearAgent,
  );

  const runner: Runner = new Runner({
    modelProvider,
    tracingDisabled: true,
  });
  const runResult: { finalOutput: unknown } = (await runner.run(
    coordinatorAgent,
    requestText,
    {
      maxTurns: 8,
    },
  )) as { finalOutput: unknown };

  logger(`[routing-openai][engine] Completed run with API mode: ${apiMode}`);
  return {
    finalOutput: runResult.finalOutput,
  };
}

function isResponsesRouteNotFoundError(error: unknown): boolean {
  const errorMessage: string =
    error instanceof Error ? error.message : String(error);
  const hasRouteNotFoundMessage: boolean = errorMessage.includes(
    "API route not found",
  );
  const targetsResponsesPath: boolean = errorMessage.includes("/responses");
  return hasRouteNotFoundMessage && targetsResponsesPath;
}

async function runWithAgentsSdk(
  requestText: string,
  runtimeConfig: RuntimeConfig,
  logger: Logger,
): Promise<AgentsRunnerOutput> {
  try {
    return await executeAgentsRun(requestText, runtimeConfig, "responses", logger);
  } catch (error: unknown) {
    if (!isResponsesRouteNotFoundError(error)) {
      throw error;
    }
    logger(
      "[routing-openai][engine] Responses endpoint unavailable. Falling back to chat_completions",
    );
    return executeAgentsRun(requestText, runtimeConfig, "chat_completions", logger);
  }
}

function toRoutingResult(
  requestText: string,
  modelName: string,
  payload: RoutingPayload,
): RoutingResult {
  const routingResult: RoutingResult = {
    request: requestText,
    decision: payload.decision,
    output: payload.output,
    agentName: payload.agentName,
    modelName,
  };
  return routingResult;
}

export async function runRout3Workflow(
  requestText: string,
  options: RunRout3WorkflowOptions = {},
): Promise<RoutingResult> {
  const logger: Logger =
    options.log ??
    ((_message: string): void => {
      return;
    });
  const runtimeConfig: RuntimeConfig = buildRuntimeConfigFromEnv(
    options.env ?? process.env,
  );
  logger("[routing-openai][1/5] Runtime config loaded");
  const agentsRunner: AgentsRunner =
    options.agentsRunner ??
    ((inputText: string): Promise<AgentsRunnerOutput> =>
      runWithAgentsSdk(inputText, runtimeConfig, logger));
  logger("[routing-openai][2/5] Running agent coordinator");
  const runnerOutput: AgentsRunnerOutput = await agentsRunner(requestText);
  logger("[routing-openai][3/5] Received agent final output");
  const payload: RoutingPayload = toRoutingPayload(
    requestText,
    runnerOutput.finalOutput,
  );
  logger("[routing-openai][4/5] Normalized routing payload");
  logger("[routing-openai][5/5] Built final routing result");
  return toRoutingResult(requestText, runtimeConfig.modelName, payload);
}

export async function runRout3FromCli(
  env: NodeJS.ProcessEnv = process.env,
  argv: readonly string[] = process.argv,
): Promise<void> {
  const logger: Logger = (message: string): void => {
    console.log(message);
  };
  const requestText: string = resolveRequestFromCliOrDefault(argv);
  const routingResult: RoutingResult = await runRout3Workflow(requestText, {
    env,
    log: logger,
  });
  console.log(JSON.stringify(routingResult, null, 2));
}

const isNodeTestContext: boolean = process.env.NODE_TEST_CONTEXT !== undefined;
if (!isNodeTestContext) {
  void runRout3FromCli(process.env, process.argv).catch(
    (error: unknown): void => {
      const errorMessage: string =
        error instanceof Error ? error.message : String(error);
      console.error(errorMessage);
      process.exitCode = 1;
    },
  );
}
