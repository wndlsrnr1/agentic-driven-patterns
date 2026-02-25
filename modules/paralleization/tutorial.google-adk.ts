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

type GoogleAdkConfig = {
  apiKey: string;
  modelName: string;
  topic: string;
  appName: string;
  userId: string;
};

type GoogleAdkResult = {
  report: string;
};

type AdkRuntimeErrorEvent = Event & {
  errorCode?: string;
  errorMessage?: string;
};

function resolveGoogleAdkConfig(): GoogleAdkConfig {
  const apiKey: string | undefined =
    process.env.GEMINI_API_KEY?.trim() || process.env.GOOGLE_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY or GOOGLE_API_KEY is missing.");
  }

  const config: GoogleAdkConfig = {
    apiKey,
    modelName: "gemini-2.5-flash",
    topic: "Artificial Intelligence in Healthcare",
    appName: "parallelization-tutorial-adk",
    userId: "parallelization-tutorial-user",
  };
  return config;
}

export async function run(): Promise<GoogleAdkResult> {
  const config: GoogleAdkConfig = resolveGoogleAdkConfig();
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

  const report: string = extractWorkflowReport(events);
  const result: GoogleAdkResult = {
    report,
  };

  return result;
}

const result: GoogleAdkResult = await run();
console.log(result.report);
console.log(result);
