/**
 * Run:
 * cd modules && node --env-file=.env --experimental-strip-types ./paralleization/tutorial.google-adk.ts
 */
import {
  Gemini,
  InMemoryRunner,
  LlmAgent,
  ParallelAgent,
  SequentialAgent,
  isFinalResponse,
  stringifyContent,
  type Event,
} from "@google/adk";
import { createUserContent, type Content } from "@google/genai";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

export type GoogleAdkConfig = {
  apiKey: string;
  modelName: string;
  topic: string;
  appName: string;
  userId: string;
};

export type GoogleAdkResult = {
  report: string;
};

export function resolveGoogleAdkConfig(
  env: NodeJS.ProcessEnv = process.env,
): GoogleAdkConfig {
  const apiKey: string | undefined = env.GEMINI_API_KEY?.trim() || env.GOOGLE_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY or GOOGLE_API_KEY is missing.");
  }

  const config: GoogleAdkConfig = {
    apiKey,
    modelName: env.GOOGLE_MODEL?.trim() || "gemini-2.5-flash",
    topic: "Artificial Intelligence in Healthcare",
    appName: "parallelization-tutorial-adk",
    userId: "parallelization-tutorial-user",
  };
  return config;
}

export async function run(
  config: GoogleAdkConfig = resolveGoogleAdkConfig(process.env),
): Promise<GoogleAdkResult> {
  const model: Gemini = new Gemini({
    model: config.modelName,
    apiKey: config.apiKey,
  });

  const technologyAgent: LlmAgent = new LlmAgent({
    name: "TechResearcher",
    model,
    instruction: `Research the technology advances of ${config.topic}. Summarize in exactly one sentence.`,
  });

  const marketAgent: LlmAgent = new LlmAgent({
    name: "MarketResearcher",
    model,
    instruction: `Research the market impact of ${config.topic}. Summarize in exactly one sentence.`,
  });

  const parallelAgent: ParallelAgent = new ParallelAgent({
    name: "ParallelResearchers",
    subAgents: [technologyAgent, marketAgent],
  });

  const synthesisAgent: LlmAgent = new LlmAgent({
    name: "SynthesisAgent",
    model,
    instruction: "Combine both summaries into a concise markdown report.",
  });

  const workflow: SequentialAgent = new SequentialAgent({
    name: "GoogleAdkTutorialWorkflow",
    subAgents: [parallelAgent, synthesisAgent],
  });

  const runner: InMemoryRunner = new InMemoryRunner({
    agent: workflow,
    appName: config.appName,
  });

  const session: { id: string } = await runner.sessionService.createSession({
    appName: config.appName,
    userId: config.userId,
  });

  const prompt: string = `Create a short report for: ${config.topic}`;
  const userMessage: Content = createUserContent(prompt);
  const events: Array<Event> = [];

  for await (const event of runner.runAsync({
    userId: config.userId,
    sessionId: session.id,
    newMessage: userMessage,
  })) {
    events.push(event);
  }

  let report: string = "";
  for (let index: number = events.length - 1; index >= 0; index -= 1) {
    const event: Event = events[index]!;
    if (!isFinalResponse(event)) {
      continue;
    }

    const text: string = stringifyContent(event).trim();
    if (text.length > 0) {
      report = text;
      break;
    }
  }

  if (report.length === 0) {
    for (let index: number = events.length - 1; index >= 0; index -= 1) {
      const event: Event = events[index]!;
      const text: string = stringifyContent(event).trim();
      if (text.length > 0) {
        report = text;
        break;
      }
    }
  }

  if (report.length === 0) {
    throw new Error("Google ADK workflow completed without a text response.");
  }

  const result: GoogleAdkResult = { report };
  return result;
}

const isNodeTestContext: boolean = process.env.NODE_TEST_CONTEXT !== undefined;
const cliPath: string | undefined = process.argv[1];
if (!isNodeTestContext && cliPath) {
  const cliUrl: string = pathToFileURL(resolve(process.cwd(), cliPath)).href;
  if (cliUrl === import.meta.url) {
    void run()
      .then((result: GoogleAdkResult): void => {
        console.log(result.report);
        console.log(result);
      })
      .catch((error: unknown): void => {
        const message: string = error instanceof Error ? error.message : String(error);
        console.error(message);
        process.exitCode = 1;
      });
  }
}
