/**
 * coordinator-routing-openai.ts
 *
 * @openai/agents와 zod를 사용해
 * Step 1(기본 Agent) + Step 2(Coordinator Routing)를 학습하는 튜토리얼입니다.
 *
 * Run:
 * cd modules && node --env-file=.env --experimental-strip-types ./routing-patterns/coordinator-routing-openai.ts
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

const DEFAULT_BASE_URL: string = "https://api.synthetic.new/openai/v1";
const DEFAULT_MODEL: string = "hf:moonshotai/Kimi-K2.5";

const DEFAULT_COORDINATOR_REQUESTS: Array<string> = [
  "Book me a flight to London.",
  "What is the capital of Italy?",
  "Please handle this.",
];

type RuntimeConfig = {
  apiKey: string;
  baseUrl: string;
  modelName: string;
};

type RoutingToolInput = {
  request: string;
};

const ROUTING_TOOL_INPUT_SCHEMA: z.ZodObject<{ request: z.ZodString }> =
  z.object({
    request: z.string(),
  });

function buildRuntimeConfig(): RuntimeConfig {
  const apiKey: string | undefined = process.env.API_KEY?.trim();

  if (!apiKey) {
    throw new Error("API_KEY is missing. Please set it in your .env file.");
  }

  const runtimeConfig: RuntimeConfig = {
    apiKey,
    baseUrl: process.env.BASE_URL?.trim() ?? DEFAULT_BASE_URL,
    modelName: process.env.MODEL?.trim() ?? DEFAULT_MODEL,
  };

  return runtimeConfig;
}

function configureOpenAIProvider(runtimeConfig: RuntimeConfig): OpenAIProvider {
  const provider: OpenAIProvider = new OpenAIProvider({
    apiKey: runtimeConfig.apiKey,
    baseURL: runtimeConfig.baseUrl,
    useResponses: false,
  });

  setDefaultOpenAIKey(runtimeConfig.apiKey);
  setOpenAIAPI("chat_completions");

  return provider;
}

function createRunner(provider: OpenAIProvider): Runner {
  const runner: Runner = new Runner({
    modelProvider: provider,
    tracingDisabled: true,
  });

  return runner;
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

function createBookingTool(): ReturnType<typeof tool> {
  const bookingTool: ReturnType<typeof tool> = tool({
    name: "booking_handler",
    description: "Handle flight and hotel booking requests.",
    parameters: ROUTING_TOOL_INPUT_SCHEMA,
    execute: (input: RoutingToolInput): string => {
      return bookingHandler(input.request);
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
      return infoHandler(input.request);
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
      return unclearHandler(input.request);
    },
  });

  return unclearTool;
}

function createBookingAgent(modelName: string): Agent {
  const bookingTool: ReturnType<typeof tool> = createBookingTool();

  const bookingAgent: Agent = new Agent({
    name: "Booker",
    instructions: [
      "You are Booker.",
      "Always call the `booking_handler` tool using the exact original user request.",
      "Do not answer directly.",
    ].join("\n"),
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

  const infoAgent: Agent = new Agent({
    name: "Info",
    instructions: [
      "You are Info.",
      "Always call the `info_handler` tool using the exact original user request.",
      "Do not answer directly.",
    ].join("\n"),
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

  const unclearAgent: Agent = new Agent({
    name: "Unclear",
    instructions: [
      "You are Unclear.",
      "Always call the `unclear_handler` tool when routing is uncertain.",
      "Do not answer directly.",
    ].join("\n"),
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
  const coordinatorAgent: Agent = Agent.create({
    name: "Coordinator",
    instructions: [
      "You are the main coordinator.",
      "Analyze the incoming user request and hand off to one specialist agent.",
      "Do not answer the user directly.",
      "- For booking flights/hotels, hand off to Booker.",
      "- For general information requests, hand off to Info.",
      "- For unclear requests, hand off to Unclear.",
    ].join("\n"),
    handoffDescription: "Routes user requests to the correct specialist agent.",
    model: modelName,
    handoffs: [bookingAgent, infoAgent, unclearAgent],
  });

  return coordinatorAgent;
}

function toDisplayOutput(finalOutput: unknown): string {
  const outputText: string = JSON.stringify(finalOutput, null, 2);
  return outputText;
}

async function runBasicAgentTutorial(): Promise<void> {
  console.log("=== Step 1: Basic Agent ===\n");

  const runtimeConfig: RuntimeConfig = buildRuntimeConfig();
  const provider: OpenAIProvider = configureOpenAIProvider(runtimeConfig);
  const runner: Runner = createRunner(provider);

  const simpleAgent: Agent = new Agent({
    name: "SimpleBot",
    instructions:
      "You are a helpful assistant. Provide short, concise answers.",
    model: runtimeConfig.modelName,
  });

  const userMessage: string = "Hello! Introduce yourself briefly.";
  console.log(`User: ${userMessage}`);

  const result: { finalOutput: unknown } = (await runner.run(
    simpleAgent,
    userMessage,
    {
      maxTurns: 3,
    },
  )) as { finalOutput: unknown };

  const assistantOutput: string = toDisplayOutput(result.finalOutput);
  console.log(`Assistant Output: ${assistantOutput}\n`);
}

async function runCoordinatorRoutingTutorial(): Promise<void> {
  console.log("=== Step 2: Coordinator Routing Agent ===\n");

  const runtimeConfig: RuntimeConfig = buildRuntimeConfig();
  const provider: OpenAIProvider = configureOpenAIProvider(runtimeConfig);
  const runner: Runner = createRunner(provider);

  const bookingAgent: Agent = createBookingAgent(runtimeConfig.modelName);
  const infoAgent: Agent = createInfoAgent(runtimeConfig.modelName);
  const unclearAgent: Agent = createUnclearAgent(runtimeConfig.modelName);
  const coordinatorAgent: Agent = createCoordinatorAgent(
    runtimeConfig.modelName,
    bookingAgent,
    infoAgent,
    unclearAgent,
  );

  for (const requestText of DEFAULT_COORDINATOR_REQUESTS) {
    console.log(`User: ${requestText}`);

    const result: { finalOutput: unknown } = (await runner.run(
      coordinatorAgent,
      requestText,
      {
        maxTurns: 8,
      },
    )) as { finalOutput: unknown };

    const assistantOutput: string = toDisplayOutput(result.finalOutput);
    console.log(`Assistant Output: ${assistantOutput}\n`);
  }
}

async function runCoordinatorRoutingOpenAiTutorial(): Promise<void> {
  try {
    await runBasicAgentTutorial();
    console.log("--------------------------------------------------\n");
    await runCoordinatorRoutingTutorial();
  } catch (error: unknown) {
    const errorMessage: string =
      error instanceof Error ? error.message : String(error);
    console.error("Tutorial execution failed:", errorMessage);
  }
}

const isNodeTestContext: boolean = process.env.NODE_TEST_CONTEXT !== undefined;
if (!isNodeTestContext) {
  void runCoordinatorRoutingOpenAiTutorial();
}
