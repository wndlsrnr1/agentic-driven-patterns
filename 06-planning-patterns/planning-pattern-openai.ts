/**
 * Run:
 * node --env-file=.env --experimental-strip-types ./06-planning-patterns/planning-pattern-openai.ts
 */
import {
  Agent,
  OpenAIProvider,
  Runner,
  setDefaultOpenAIKey,
  setOpenAIAPI,
} from "@openai/agents";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const DEFAULT_BASE_URL: string = "https://api.z.ai/api/coding/paas/v4";
const DEFAULT_MODEL: string = "glm-5.1";
const DEFAULT_TOPIC: string = "The importance of Reinforcement Learning in AI";

export type RuntimeConfig = {
  apiKey: string;
  baseUrl: string;
  modelName: string;
};

export type PlanningPatternResult = {
  topic: string;
  plan: string;
  summary: string;
  modelName: string;
};

export type PlanningPatternExecutor = (
  config: RuntimeConfig,
  topic: string,
) => Promise<PlanningPatternResult>;

export type RunPlanningPatternOptions = {
  runtimeConfig?: RuntimeConfig;
  topic?: string;
  executor?: PlanningPatternExecutor;
};

export function buildRuntimeConfig(
  env: NodeJS.ProcessEnv = process.env,
): RuntimeConfig {
  const apiKey: string | undefined = env.API_KEY?.trim();
  if (!apiKey) {
    throw new Error("API_KEY is missing.");
  }

  const config: RuntimeConfig = {
    apiKey,
    baseUrl: env.BASE_URL?.trim() || DEFAULT_BASE_URL,
    modelName: env.MODEL?.trim() || DEFAULT_MODEL,
  };
  return config;
}

export function formatFinalReport(result: PlanningPatternResult): string {
  const report: string = [
    `Topic: ${result.topic}`,
    "",
    "### Plan",
    result.plan,
    "",
    "### Summary",
    result.summary,
  ].join("\n");

  return report;
}

export async function runPlanningPattern(
  options: RunPlanningPatternOptions = {},
): Promise<PlanningPatternResult> {
  const config: RuntimeConfig =
    options.runtimeConfig ?? buildRuntimeConfig(process.env);
  const topic: string = options.topic?.trim() || DEFAULT_TOPIC;

  if (options.executor) {
    const injectedResult: PlanningPatternResult = await options.executor(
      config,
      topic,
    );

    if (injectedResult.summary.trim().length === 0) {
      throw new Error("OpenAI planning pattern completed without a text summary.");
    }

    return injectedResult;
  }

  const provider: OpenAIProvider = new OpenAIProvider({
    apiKey: config.apiKey,
    baseURL: config.baseUrl,
    useResponses: false,
  });
  setDefaultOpenAIKey(config.apiKey);
  setOpenAIAPI("chat_completions");

  const runner: Runner = new Runner({
    modelProvider: provider,
    tracingDisabled: true,
  });

  const plannerAgent: Agent = new Agent({
    name: "PlannerAgent",
    model: config.modelName,
    instructions: [
      "You are a planning specialist.",
      "Create a bullet-point plan with 3 to 5 points.",
      "Focus on the most important ideas needed for a concise technical summary.",
      "Output only the plan.",
    ].join("\n"),
  });

  const writerAgent: Agent = new Agent({
    name: "WriterAgent",
    model: config.modelName,
    instructions: [
      "You are a concise technical writer.",
      "Write a summary of around 200 words.",
      "Use the provided plan as the structure.",
      "Do not introduce unrelated sections.",
      "Output only the final summary.",
    ].join("\n"),
  });

  const plannerRunResult: { finalOutput: unknown } = (await runner.run(
    plannerAgent,
    [
      `Topic: ${topic}`,
      "Create a bullet-point plan for a concise, engaging summary.",
      "Keep the plan short and practical.",
    ].join("\n"),
    { maxTurns: 6 },
  )) as { finalOutput: unknown };

  const plan: string =
    typeof plannerRunResult.finalOutput === "string"
      ? plannerRunResult.finalOutput.trim()
      : JSON.stringify(plannerRunResult.finalOutput, null, 2).trim();

  const writerRunResult: { finalOutput: unknown } = (await runner.run(
    writerAgent,
    [
      `Topic: ${topic}`,
      "Use the provided plan as the structure.",
      `Plan:\n${plan}`,
      "Write the final summary now.",
    ].join("\n\n"),
    { maxTurns: 6 },
  )) as { finalOutput: unknown };

  const summary: string =
    typeof writerRunResult.finalOutput === "string"
      ? writerRunResult.finalOutput.trim()
      : JSON.stringify(writerRunResult.finalOutput, null, 2).trim();

  if (summary.length === 0) {
    throw new Error("OpenAI planning pattern completed without a text summary.");
  }

  const result: PlanningPatternResult = {
    topic,
    plan,
    summary,
    modelName: config.modelName,
  };
  return result;
}

const isNodeTestContext: boolean = process.env.NODE_TEST_CONTEXT !== undefined;
const cliPath: string | undefined = process.argv[1];
if (!isNodeTestContext && cliPath) {
  const cliUrl: string = pathToFileURL(resolve(process.cwd(), cliPath)).href;
  if (cliUrl === import.meta.url) {
    void runPlanningPattern()
      .then((result: PlanningPatternResult): void => {
        console.log("## Running the planning and writing task ##");
        console.log("");
        console.log("---");
        console.log("## Task Result ##");
        console.log("---");
        console.log(formatFinalReport(result));
      })
      .catch((error: unknown): void => {
        const message: string = error instanceof Error ? error.message : String(error);
        console.error(message);
        process.exitCode = 1;
      });
  }
}
