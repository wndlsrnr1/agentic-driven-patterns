import {
  Agent,
  run,
  MemorySession,
  OpenAIProvider,
  setDefaultModelProvider,
  setDefaultOpenAIKey,
  setOpenAIAPI,
} from "@openai/agents";
import { z } from "zod";

const DEFAULT_SYNTHETIC_BASE_URL: string =
  "https://api.synthetic.new/openai/v1";
const DEFAULT_SYNTHETIC_MODEL: string = "hf:moonshotai/Kimi-K2.5";
const DEFAULT_SYNTHETIC_SUBJECT: string = "Python factorial function";
const DEFAULT_APP_NAME: string = "reflection-openai-workflow";
const DEFAULT_USER_ID: string = "reflection-openai-user";

export type ReflectionOpenAIConfig = {
  apiKey: string;
  baseUrl: string;
  modelName: string;
  appName: string;
  userId: string;
  subject: string;
};

export type ReviewStatus = "ACCURATE" | "INACCURATE";

export type ReviewOutput = {
  status: ReviewStatus;
  reasoning: string;
};

export type ReflectionOpenAIResult = {
  draft_text: string;
  review_output: ReviewOutput;
};

const ReviewSchema = z.object({
  status: z.enum(["ACCURATE", "INACCURATE"]),
  reasoning: z.string(),
});
type ReviewSchemaType = typeof ReviewSchema;

export async function runReflectionOpenAI(
  env: NodeJS.ProcessEnv = process.env,
): Promise<ReflectionOpenAIResult> {
  const config: ReflectionOpenAIConfig = {
    apiKey: env.SYNTHETIC_API_KEY?.trim() ?? "",
    baseUrl: env.SYNTHETIC_BASE_URL?.trim() || DEFAULT_SYNTHETIC_BASE_URL,
    modelName: env.SYNTHETIC_MODEL?.trim() || DEFAULT_SYNTHETIC_MODEL,
    appName: env.SYNTHETIC_APP_NAME?.trim() || DEFAULT_APP_NAME,
    userId: env.SYNTHETIC_USER_ID?.trim() || DEFAULT_USER_ID,
    subject: env.SYNTHETIC_SUBJECT?.trim() || DEFAULT_SYNTHETIC_SUBJECT,
  };

  if (config.apiKey.length === 0) {
    throw new Error("SYNTHETIC_API_KEY is missing.");
  }

  const provider: OpenAIProvider = new OpenAIProvider({
    apiKey: config.apiKey,
    baseURL: config.baseUrl,
    useResponses: false,
  });
  setDefaultModelProvider(provider);
  setDefaultOpenAIKey(config.apiKey);
  setOpenAIAPI("chat_completions");

  const session: MemorySession = new MemorySession();

  const generator: Agent = new Agent({
    name: "DraftWriter",
    model: config.modelName,
    instructions:
      "Write a short, informative paragraph about the user's subject.",
  });

  const reviewer: Agent<unknown, ReviewSchemaType> = new Agent({
    name: "FactChecker",
    model: config.modelName,
    instructions: [
      "You are a meticulous fact-checker.",
      "Carefully verify the factual accuracy of all claims in the provided draft.",
      "Return ONLY a JSON object with keys:",
      "- status: either ACCURATE or INACCURATE",
      "- reasoning: a clear explanation for your status",
    ].join("\n"),
    outputType: ReviewSchema,
  });

  const userMessage: string = [
    `App: ${config.appName}`,
    `User: ${config.userId}`,
    `Subject: ${config.subject}`,
    "Generate the draft and then review it.",
  ].join("\n");

  const draftResponse: { finalOutput: unknown } = (await run(
    generator,
    `${userMessage}\nWrite the draft only.`,
    { session },
  )) as { finalOutput: unknown };

  const draft_text: string = String(draftResponse.finalOutput ?? "").trim();
  if (draft_text.length === 0) {
    throw new Error("Draft generation produced no output.");
  }

  const reviewResponse: { finalOutput: unknown } = (await run(
    reviewer,
    [
      `Subject: ${config.subject}`,
      `App: ${config.appName}`,
      `User: ${config.userId}`,
      "Original user request:",
      userMessage,
      "",
      "Draft:",
      draft_text,
      "",
      "Now review the draft and return the JSON object.",
    ].join("\n"),
    { session },
  )) as { finalOutput: unknown };

  const review_output: ReviewOutput | undefined = reviewResponse.finalOutput as
    | ReviewOutput
    | undefined;
  if (review_output === undefined) {
    throw new Error("Review step produced no output.");
  }

  const result: ReflectionOpenAIResult = {
    draft_text,
    review_output,
  };
  return result;
}

const result: ReflectionOpenAIResult = await runReflectionOpenAI();

console.log(result);
