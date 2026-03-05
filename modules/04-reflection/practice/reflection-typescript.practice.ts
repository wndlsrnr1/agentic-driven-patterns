import {
  Agent,
  MemorySession,
  OpenAIProvider,
  Runner,
  setDefaultOpenAIKey,
  setOpenAIAPI,
  type Session,
} from "@openai/agents";
import { json } from "node:stream/consumers";

export type ReflectionOpenAIConfig = {
  apiKey: string;
  baseUrl: string;
  modelName: string;
  subject: string;
};

export type ReflectionOpenAIResult = {
  review: string;
};

function toTextOutput(output: unknown): string {
  if (typeof output === "string") {
    return output;
  }

  const serializedOutput: string | undefined = JSON.stringify(output, null, 2);
  return serializedOutput ?? "";
}

export async function runReflectionOpenAI(
  env: NodeJS.ProcessEnv = process.env,
): Promise<ReflectionOpenAIResult> {
  const config: ReflectionOpenAIConfig = {
    apiKey: env.API_KEY?.trim() || "",
    baseUrl: env.BASE_URL?.trim() || "",
    modelName: env.MODEL?.trim() || "",
    subject: "Python factorial function",
  };

  console.log(config.apiKey);
  console.log(config.baseUrl);
  console.log(config.modelName);
  console.log("---------------------------------------");

  const provider: OpenAIProvider = new OpenAIProvider({
    apiKey: config.apiKey,
    baseURL: config.baseUrl,
    useResponses: false,
  });

  const runner: Runner = new Runner({
    modelProvider: provider,
    tracingDisabled: true,
  });

  const session: Session = new MemorySession();
  const runOptions: { maxTurns: number; session: Session } = {
    maxTurns: 6,
    session,
  };

  const draftWriter: Agent = new Agent({
    name: "DraftWriter",
    model: config.modelName,
    instructions:
      "Write a short, informative paragraph about the user's subject.",
  });

  const factChecker: Agent = new Agent({
    name: "FactCecker",
    model: config.modelName,
    instructions: `You are a meticulous fact-checker. Read the draft content provided by the user. Carefully verify the factual accuracy of all claims. Respond with a concise final review text.`,
  });

  const draftInput: string = `Subject: ${config.subject}\nGenerate the draft paragraph.`;

  const draftOutput: unknown = (
    await runner.run(draftWriter, draftInput, runOptions)
  ).finalOutput;

  console.log(`draftoutput: ${JSON.stringify(draftOutput)}`);

  const draftText: string = toTextOutput(draftOutput);

  const reviewInput: string = `Subject: ${config.subject}\nReview this draft for factual accuracy:\n${draftText}`;

  const reviewOutput: unknown = (
    await runner.run(factChecker, reviewInput, runOptions)
  ).finalOutput;

  console.log(`reviewOutput: ${JSON.stringify(reviewOutput)}`);

  console.log(`reviewOutput: ${reviewOutput}`);
  const review: string = toTextOutput(reviewOutput).trim();
  console.log(`review: ${review}`);
  return { review };
}

const result: ReflectionOpenAIResult = await runReflectionOpenAI();
