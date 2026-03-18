import { ChatPromptTemplate } from "@langchain/core/prompts";
import {
  tool,
  type DynamicTool,
  type StructuredToolInterface,
} from "@langchain/core/tools";
import { ChatOpenAI } from "@langchain/openai";
import { AgentExecutor, createToolCallingAgent } from "langchain/agents";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { z } from "zod";

type RuntimeConfig = {
  apiKey: string;
  baseUrl: string;
  model: string;
};

type AgentResponse = {
  output?: unknown;
};

type AgentExecutorLike = {
  invoke(input: { input: string }): Promise<AgentResponse>;
};

function resolveRuntimeConfig(
  env: NodeJS.ProcessEnv = process.env,
): RuntimeConfig {
  const apiKey: string = env.API_KEY?.trim() ?? "";
  if (apiKey.length === 0) {
    throw new Error("API_KEY is missing.");
  }

  return {
    apiKey,
    baseUrl: env.BASE_URL?.trim() || "https://api.openai.com/v1",
    model: env.MODEL?.trim() || "gpt-4o-mini",
  };
}

const searchInformationTool: DynamicTool<string> = tool(
  (query: string): string => {
    console.log(
      `\n--- Tool Called: search_information with query: '${query}' ---`,
    );

    const simulatedResults: Record<string, string> = {
      "weather in london":
        "The weather in London is currently cloudy with a temperature of 15C.",
      "capital of france": "The capital of France is Paris.",
      "population of earth":
        "The estimated population of Earth is around 8 billion people.",
      "tallest mountain":
        "Mount Everest is the tallest mountain above sea level.",
    };
    const normalizedQuery: string = query.toLowerCase();
    const defaultResult: string = `Simulated search result for '${query}': No specific information found, but the topic seems interesting.`;
    const result: string = simulatedResults[normalizedQuery] ?? defaultResult;

    console.log(`--- TOOL RESULT: ${result} ---`);
    return result;
  },
  {
    name: "search_information",
    description:
      "Return simulated factual information for a few preset queries.",
    schema: z.string().describe("The search query text."),
  },
);

const tools: Array<StructuredToolInterface> = [searchInformationTool];

async function runAgentWithTool(
  executor: AgentExecutorLike,
  query: string,
): Promise<void> {
  console.log(`\n--- Running Agent with Query: '${query}' ---`);

  try {
    const response: AgentResponse = await executor.invoke({
      input: query,
    });
    const outputText: string = String(response.output ?? "");

    console.log("\n--- Final Agent Response ---");
    console.log(outputText);
  } catch (error: unknown) {
    const errorMessage: string =
      error instanceof Error ? error.message : String(error);
    console.log(`\nAn error occurred during agent execution: ${errorMessage}`);
  }
}

async function main(): Promise<void> {
  const config: RuntimeConfig = resolveRuntimeConfig(process.env);
  const llm: ChatOpenAI = new ChatOpenAI({
    apiKey: config.apiKey,
    model: config.model,
    temperature: 0,
    configuration: {
      baseURL: config.baseUrl,
    },
  });
  const prompt: ReturnType<typeof ChatPromptTemplate.fromMessages> =
    ChatPromptTemplate.fromMessages([
      ["system", "You are a helpful assistant."],
      ["human", "{input}"],
      ["placeholder", "{agent_scratchpad}"],
    ]);
  const agent = await createToolCallingAgent({
    llm,
    tools,
    prompt,
  });
  const executor: AgentExecutorLike = new AgentExecutor({
    agent,
    tools,
    verbose: true,
  });

  console.log(`Language model initialized: ${config.model}`);

  await runAgentWithTool(executor, "What is the capital of France?");
  await runAgentWithTool(executor, "What's the weather like in London?");
  await runAgentWithTool(executor, "Tell me something about dogs.");
}

const cliPath: string | undefined = process.argv[1];
if (cliPath) {
  const cliUrl: string = pathToFileURL(resolve(process.cwd(), cliPath)).href;
  if (cliUrl === import.meta.url) {
    void main().catch((error: unknown): void => {
      const errorMessage: string =
        error instanceof Error ? error.message : String(error);
      const message: string = `Error initializing language model: ${errorMessage}`;
      console.error(message);
      process.exitCode = 1;
    });
  }
}
