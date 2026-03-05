import { getModelNameForTiktoken } from "@langchain/core/language_models/base";
import {
  Agent,
  OpenAIProvider,
  Runner,
  setOpenAIAPI,
  setDefaultOpenAIKey,
  tool,
} from "@openai/agents";
import { request } from "node:http";
import { run } from "node:test";
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

const ROUTING_TOOL_INPUT_SCHEMA: z.ZodObject<{
  request: z.ZodString;
}> = z.object({
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
  return new Runner({
    modelProvider: provider,
    tracingDisabled: true,
  });
}

function bookingHandler(requestText: string): string {
  return `Booking Handler processed request: '${requestText}'. Result: Simulated booking action.`;
}

function infoHandler(requestText: string): string {
  return `Info Handler processed request: '${requestText}'. Result: Simulated booking action.`;
}

function unclearHandler(requestText: string): string {
  return `Coordinator could not delegate request. '${requestText}'. Please clarify.`;
}

function creataeBookingTool(): ReturnType<typeof tool> {
  return tool({
    name: "booking_handler",
    description: "Handle flight and hotel booking requests.",
    parameters: ROUTING_TOOL_INPUT_SCHEMA,
    execute: (input: RoutingToolInput): string => {
      return bookingHandler(input.request);
    },
  });
}

function createInfoTool(): ReturnType<typeof tool> {
  return tool({
    name: "info_handler",
    description: "Handle general information requests.",
    parameters: ROUTING_TOOL_INPUT_SCHEMA,
    execute: (input: RoutingToolInput): string => {
      return infoHandler(input.request);
    },
  });
}

function createUnclearTool(): ReturnType<typeof tool> {
  return tool({
    name: "unclear_handler",
    description: "Handle requests that cannot be delegated confidently.",
    parameters: ROUTING_TOOL_INPUT_SCHEMA,
    execute: (input: RoutingToolInput): string => {
      return unclearHandler(input.request);
    },
  });
}

function createBookingAgent(modelName: string): Agent {
  return Agent.create({
    name: "Booker",
    instructions: `You are Booker. Always call the 'booking_handler' tool using the exact original user request. Do not answer directly`,
    handoffDescription:
      "A specialized agent that handles flight and hotel booking requets.",
    model: modelName,
    tools: [creataeBookingTool()],
    toolUseBehavior: "stop_on_first_tool",
  });
}

function createInfoAgent(modelName: string): Agent {
  return Agent.create({
    name: "Info",
    instructions: `You are info. Always call the 'info_handler' tool using extract orignal user request. Do not answer directly.`,
    handoffDescription:
      "A specialized agent that handles general information questions.",
    model: modelName,
    tools: [createInfoTool()],
    toolUseBehavior: "stop_on_first_tool",
  });
}

function createUnclearAgent(modelName: string): Agent {
  return Agent.create({
    name: "Unclear",
    instructions: `You are unclear. Always call the 'unclear_handler' tool when routing is uncertain. Do not answer directly.`,
    handoffDescription:
      "A specialist agent that handles ambiguous or unclear requests.",
    model: modelName,
    tools: [createUnclearTool()],
    toolUseBehavior: "stop_on_first_tool",
  });
}

function createCoordinatorAgent(
  modelName: string,
  bookingAgent: Agent,
  infoAgent: Agent,
  unclearAgent: Agent,
): Agent {
  return Agent.create({
    name: "Coordinator",
    instructions: `
    You are the main coordinator. 
    Analyze the incoming user request and hand off to one specialist agent. 
    Do not answer the user directly.
    - For booking flight/hotels, hand off to Info.
    - For general information requests, hand off to Info.
    - For unclear requests, hand off to Unclear.`,
    handoffDescription: "Routes user requests to the correct specialist agent.",
    model: modelName,
    handoffs: [bookingAgent, infoAgent, unclearAgent],
  });
}

function toDisplayOutput(finalOutput: unknown): string {
  const outputText: string = JSON.stringify(finalOutput, null, 2);
  return outputText;
}

async function runBasicAgentTutorial(): Promise<void> {
  const runtimeConfig: RuntimeConfig = buildRuntimeConfig();
  const provider: OpenAIProvider = configureOpenAIProvider(runtimeConfig);
  const runner: Runner = createRunner(provider);

  const simpleAgent: Agent = new Agent({
    name: "SimpleBot",
    instructions:
      "Role: You are a helpful assistant. Provide short, concise answers. If someone ask what you are you should answer 'I am a helpful assistant.'",
    model: runtimeConfig.modelName,
  });

  const userMessage: string = " Hello! Introduce yourself briefly";
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

await runBasicAgentTutorial();

async function runCoordinatorRoutingOpenAiTutorial(): Promise<void> {
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

await runCoordinatorRoutingOpenAiTutorial();
