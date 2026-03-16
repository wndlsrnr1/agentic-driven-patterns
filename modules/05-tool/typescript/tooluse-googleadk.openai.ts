import {
  Agent,
  MemorySession,
  OpenAIProvider,
  Runner,
  tool,
  type Session,
} from "@openai/agents";
import { randomUUID } from "node:crypto";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { z } from "zod";

export type OpenAISearchSessionRouting = {
  appName: string;
  userId: string;
  sessionId: string;
};

export type OpenAISearchRuntimeConfig = {
  apiKey: string;
  baseUrl: string;
  modelName: string;
  sessionRouting: OpenAISearchSessionRouting;
};

export function resolveOpenAISearchRuntimeConfig(
  env: NodeJS.ProcessEnv = process.env,
): OpenAISearchRuntimeConfig {
  const apiKey: string =
    env.API_KEY?.trim() || env.OPENAI_API_KEY?.trim() || "";
  if (apiKey.length === 0) {
    throw new Error("API_KEY or OPENAI_API_KEY is missing.");
  }

  const config: OpenAISearchRuntimeConfig = {
    apiKey,
    baseUrl: env.BASE_URL?.trim() || "https://api.synthetic.new/openai/v1",
    modelName: env.MODEL?.trim() || "hf:moonshotai/Kimi-K2.5",
    sessionRouting: {
      appName: "Google Search_agent",
      userId: env.OPENAI_SEARCH_USER_ID?.trim() || env.USER_ID?.trim() || randomUUID(),
      sessionId:
        env.OPENAI_SEARCH_SESSION_ID?.trim() ||
        env.SESSION_ID?.trim() ||
        randomUUID(),
    },
  };
  return config;
}

function toTextOutput(output: unknown): string {
  if (typeof output === "string") {
    return output;
  }

  const serializedOutput: string | undefined = JSON.stringify(output, null, 2);
  return serializedOutput ?? "";
}

export async function runOpenAISearchAgent(
  query: string,
  config: OpenAISearchRuntimeConfig = resolveOpenAISearchRuntimeConfig(process.env),
): Promise<string> {
  const provider: OpenAIProvider = new OpenAIProvider({
    apiKey: config.apiKey,
    baseURL: config.baseUrl,
    useResponses: false,
  });

  const runner: Runner = new Runner({
    modelProvider: provider,
    tracingDisabled: true,
  });

  const searchToolSchema: z.ZodObject<{
    query: z.ZodString;
  }> = z.object({
    query: z.string(),
  });

  const simulatedSearchTool: ReturnType<typeof tool> = tool({
    name: "simulated_search",
    description: "Return deterministic simulated internet search text for a query.",
    parameters: searchToolSchema,
    execute: (input: { query: string }): string => {
      const normalizedQuery: string = input.query.trim();
      return `Search results for '${normalizedQuery}': top headlines mention rapid model releases, enterprise AI deployment, and regulation updates.`;
    },
  });

  const searchAgent: Agent = new Agent({
    name: "basic_search_agent",
    model: config.modelName,
    instructions: [
      "You are a search agent.",
      "Always call simulated_search with the exact user query.",
      "Return only the tool output as plain text.",
    ].join("\n"),
    tools: [simulatedSearchTool],
    toolUseBehavior: "stop_on_first_tool",
  });

  const mappedSessionId: string = `${config.sessionRouting.appName}:${config.sessionRouting.userId}:${config.sessionRouting.sessionId}`;
  const session: Session = new MemorySession({
    sessionId: mappedSessionId,
  });

  const runResult: unknown = await runner.run(searchAgent, query, {
    maxTurns: 4,
    session,
  });
  const finalOutput: unknown =
    typeof runResult === "object" && runResult !== null
      ? Reflect.get(runResult, "finalOutput")
      : undefined;

  const finalText: string = toTextOutput(finalOutput).trim();
  if (finalText.length === 0) {
    throw new Error("OpenAI search agent completed without a text response.");
  }

  return finalText;
}

const isNodeTestContext: boolean = process.env.NODE_TEST_CONTEXT !== undefined;
const cliPath: string | undefined = process.argv[1];
if (!isNodeTestContext && cliPath) {
  const cliUrl: string = pathToFileURL(resolve(process.cwd(), cliPath)).href;
  if (cliUrl === import.meta.url) {
    void runOpenAISearchAgent("what's the latest ai news?")
      .then((responseText: string): void => {
        console.log("Agent Response:", responseText);
      })
      .catch((error: unknown): void => {
        const message: string = error instanceof Error ? error.message : String(error);
        console.error(message);
        process.exitCode = 1;
      });
  }
}
