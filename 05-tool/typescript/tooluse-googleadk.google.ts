import {
  GOOGLE_SEARCH,
  Gemini,
  InMemoryRunner,
  LlmAgent,
  isFinalResponse,
  stringifyContent,
  type Event,
} from "@google/adk";
import { createUserContent, type Content } from "@google/genai";
import { randomUUID } from "node:crypto";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

export type GoogleSearchSessionRouting = {
  appName: string;
  userId: string;
  sessionId: string;
};

export type GoogleSearchRuntimeConfig = {
  apiKey: string;
  modelName: string;
  sessionRouting: GoogleSearchSessionRouting;
};

export function resolveGoogleSearchRuntimeConfig(
  env: NodeJS.ProcessEnv = process.env,
): GoogleSearchRuntimeConfig {
  const apiKey: string =
    env.GEMINI_API_KEY?.trim() || env.GOOGLE_API_KEY?.trim() || "";
  if (apiKey.length === 0) {
    throw new Error("GEMINI_API_KEY or GOOGLE_API_KEY is missing.");
  }

  const config: GoogleSearchRuntimeConfig = {
    apiKey,
    modelName: env.GOOGLE_MODEL?.trim() || "gemini-2.0-flash-exp",
    sessionRouting: {
      appName: "Google Search_agent",
      userId:
        env.GOOGLE_SEARCH_USER_ID?.trim() ||
        env.USER_ID?.trim() ||
        randomUUID(),
      sessionId:
        env.GOOGLE_SEARCH_SESSION_ID?.trim() ||
        env.SESSION_ID?.trim() ||
        randomUUID(),
    },
  };
  return config;
}

export async function runGoogleSearchAgent(
  query: string,
  config: GoogleSearchRuntimeConfig = resolveGoogleSearchRuntimeConfig(
    process.env,
  ),
): Promise<string> {
  const model: Gemini = new Gemini({
    model: config.modelName,
    apiKey: config.apiKey,
  });

  const searchAgent: LlmAgent = new LlmAgent({
    name: "basic_search_agent",
    model,
    description: "Agent to answer questions using Google Search.",
    instruction:
      "I can answer your questions by searching the internet. Just ask me anything!",
    tools: [GOOGLE_SEARCH],
  });

  const runner: InMemoryRunner = new InMemoryRunner({
    agent: searchAgent,
    appName: config.sessionRouting.appName,
  });

  await runner.sessionService.createSession({
    appName: config.sessionRouting.appName,
    userId: config.sessionRouting.userId,
    sessionId: config.sessionRouting.sessionId,
  });

  const userMessage: Content = createUserContent(query);
  const events: Array<Event> = [];

  for await (const event of runner.runAsync({
    userId: config.sessionRouting.userId,
    sessionId: config.sessionRouting.sessionId,
    newMessage: userMessage,
  })) {
    events.push(event);
  }

  const finalEvent: Event | undefined = [...events]
    .reverse()
    .find((event: Event): boolean => isFinalResponse(event));
  if (!finalEvent) {
    throw new Error("No final response found");
  }

  return stringifyContent(finalEvent).trim();
}

const isNodeTestContext: boolean = process.env.NODE_TEST_CONTEXT !== undefined;
const cliPath: string | undefined = process.argv[1];
if (!isNodeTestContext && cliPath) {
  const cliUrl: string = pathToFileURL(resolve(process.cwd(), cliPath)).href;
  if (cliUrl === import.meta.url) {
    void runGoogleSearchAgent("what's the latest ai news?")
      .then((responseText: string): void => {
        console.log("Agent Response:", responseText);
      })
      .catch((error: unknown): void => {
        const message: string =
          error instanceof Error ? error.message : String(error);
        console.error(message);
        process.exitCode = 1;
      });
  }
}
