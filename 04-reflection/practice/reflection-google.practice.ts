import {
  Gemini,
  InMemoryRunner,
  LlmAgent,
  SequentialAgent,
  isFinalResponse,
  stringifyContent,
  type Event,
} from "@google/adk";
import { createUserContent, type Content } from "@google/genai";

export type ReflectionGoogleConfig = {
  apiKey: string;
  modelName: string;
  appName: string;
  userId: string;
  subject: string;
};

export type ReflectionGoogleResult = {
  review: string;
};

export async function runReflectionGoogle(
  env: NodeJS.ProcessEnv = process.env,
): Promise<ReflectionGoogleResult> {
  const apiKey: string =
    env.GEMINI_API_KEY?.trim() || env.GOOGLE_API_KEY?.trim() || "";
  if (apiKey.length === 0) {
    throw new Error("GEMINI_API_KEY or GOOGLE_API_KEY is missing.");
  }

  const config: ReflectionGoogleConfig = {
    apiKey,
    modelName: env.GOOGLE_MODEL?.trim() || "gemini-2.5-flash",
    appName: "reflection-google-workflow",
    userId: "reflection-google-user",
    subject: "Python factorial function",
  };

  const model: Gemini = new Gemini({
    model: config.modelName,
    apiKey: config.apiKey,
  });

  const generator: LlmAgent = new LlmAgent({
    name: "DraftWriter",
    model,
    instruction:
      "Write a short, informative paragraph about the user's subject.",
    outputKey: "draft_text",
  });

  const reviewer: LlmAgent = new LlmAgent({
    name: "FactChecker",
    model,
    instruction: [
      "You are a meticulous fact-checker.",
      "Read the text provided in the state key 'draft_text'.",
      "Carefully verify the factual accuracy of all claims.",
      "Your final output must be a dictionary containing two keys:",
      "- status: either ACCURATE or INACCURATE",
      "- reasoning: a clear explanation for your status",
    ].join("\n"),
    outputKey: "review_output",
  });

  const reviewPipeline: SequentialAgent = new SequentialAgent({
    name: "WriteAndReviewPipeline",
    subAgents: [generator, reviewer],
  });

  const runner: InMemoryRunner = new InMemoryRunner({
    agent: reviewPipeline,
    appName: config.appName,
  });

  const session: { id: string } = await runner.sessionService.createSession({
    appName: config.appName,
    userId: config.userId,
  });

  const userMessage: Content = createUserContent(
    `Subject: ${config.subject}\nGenerate the draft and then review it.`,
  );

  const events: Array<Event> = [];
  for await (const event of runner.runAsync({
    userId: config.userId,
    sessionId: session.id,
    newMessage: userMessage,
  })) {
    events.push(event);
  }

  let review: string = "";
  for (let index: number = events.length - 1; index >= 0; index -= 1) {
    const event: Event = events[index]!;
    if (!isFinalResponse(event)) {
      continue;
    }

    const text: string = stringifyContent(event).trim();
    if (text.length > 0) {
      review = text;
      break;
    }
  }

  if (review.length === 0) {
    for (let index: number = events.length - 1; index >= 0; index -= 1) {
      const event: Event = events[index]!;
      const text: string = stringifyContent(event).trim();
      if (text.length > 0) {
        review = text;
        break;
      }
    }
  }

  if (review.length === 0) {
    throw new Error(
      "Google reflection workflow completed without a text response.",
    );
  }

  const result: ReflectionGoogleResult = {
    review,
  };
  return result;
}

const result: ReflectionGoogleResult = await runReflectionGoogle(process.env);
console.log(result);
