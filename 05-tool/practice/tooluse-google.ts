import {
  GOOGLE_SEARCH,
  Gemini,
  InMemoryRunner,
  LlmAgent,
  isFinalResponse,
  stringifyContent,
  type Event,
} from "@google/adk";
import { type Content, createUserContent } from "@google/genai";
import { config } from "node:process";

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

export function getConfig(
  env: NodeJS.ProcessEnv = process.env,
): GoogleSearchRuntimeConfig {
  const apiKey = env.GOOGLE_API_KEY?.trim() || "";

  const config: GoogleSearchRuntimeConfig = {
    apiKey,
    modelName: "gemini-3-flash-preview",
    sessionRouting: {
      appName: "Google Search Agent",
      userId: "local-user-1",
      sessionId: "local-session-1",
    },
  };

  return config;
}

export async function main(): Promise<void> {
  const modelConfig = getConfig();
  const model: Gemini = new Gemini({
    model: modelConfig.modelName,
    apiKey: modelConfig.apiKey,
  });

  const searchAgent: LlmAgent = new LlmAgent({
    name: "basic_search_agent",
    model,
    description: "Agent to answer questions using Google Search",
    instruction:
      "I can answer your questions by searching the internet. Just ask me anything!",
    tools: [GOOGLE_SEARCH],
  });

  const runner: InMemoryRunner = new InMemoryRunner({
    agent: searchAgent,
    appName: modelConfig.sessionRouting.appName,
  });

  await runner.sessionService.createSession({
    appName: modelConfig.sessionRouting.appName,
    userId: modelConfig.sessionRouting.userId,
    sessionId: modelConfig.sessionRouting.sessionId,
  });

  const userMessage: Content = createUserContent(
    "What is the square root of 16?",
  );
  const events: Array<Event> = [];

  for await (const event of runner.runAsync({
    userId: modelConfig.sessionRouting.userId,
    newMessage: userMessage,
    sessionId: modelConfig.sessionRouting.sessionId,
  })) {
    events.push(event);
  }

  // get final response
  const finalEvent: Event | undefined = [...events].reverse().find(
    (event: Event): boolean => isFinalResponse(event),
  );
  if (!finalEvent) {
    throw new Error("No final response found");
  }
  const finalResponse: string = stringifyContent(finalEvent).trim();

  console.log(finalResponse);
}

await main();
