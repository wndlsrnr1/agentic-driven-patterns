import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

export type ReflectionOpenAIConfig = {
  apiKey: string;
  baseUrl: string;
  modelName: string;
  subject: string;
};

export type ReflectionOpenAIResult = {
  review: string;
};

export type ReflectionRunResult = {
  finalOutput: unknown;
};

export type ReflectionAgent = {
  name: string;
};

export type ReflectionMemorySession = object;

export type ReflectionRunner = {
  run: (
    agent: ReflectionAgent,
    input: string,
    options: { maxTurns: number; session: ReflectionMemorySession },
  ) => Promise<ReflectionRunResult>;
};

export type ReflectionRunExecutor = (
  runner: ReflectionRunner,
  agent: ReflectionAgent,
  input: string,
  options: { maxTurns: number; session: ReflectionMemorySession },
) => Promise<ReflectionRunResult>;

type OpenAIAgentsModule = {
  Agent: new (config: {
    name: string;
    model: string;
    instructions: string;
  }) => ReflectionAgent;
  MemorySession: new () => ReflectionMemorySession;
  OpenAIProvider: new (config: {
    apiKey: string;
    baseURL: string;
    useResponses: boolean;
  }) => object;
  Runner: new (config: {
    modelProvider: object;
    tracingDisabled: boolean;
  }) => ReflectionRunner;
  setDefaultOpenAIKey: (apiKey: string) => void;
  setOpenAIAPI: (apiType: "chat_completions" | "responses") => void;
};

async function loadOpenAIAgentsModule(): Promise<OpenAIAgentsModule> {
  const moduleName: string = "@openai/agents";
  const loadedModule: unknown = await import(moduleName);
  const typedModule: OpenAIAgentsModule = loadedModule as OpenAIAgentsModule;
  return typedModule;
}

export function resolveReflectionOpenAIConfig(
  env: NodeJS.ProcessEnv = process.env,
): ReflectionOpenAIConfig {
  const apiKey: string =
    env.SYNTHETIC_API_KEY?.trim() || env.OPENAI_API_KEY?.trim() || "";
  if (apiKey.length === 0) {
    throw new Error("SYNTHETIC_API_KEY or OPENAI_API_KEY is missing.");
  }

  const config: ReflectionOpenAIConfig = {
    apiKey,
    baseUrl: env.SYNTHETIC_BASE_URL?.trim() || "https://api.synthetic.new/openai/v1",
    modelName: env.SYNTHETIC_MODEL?.trim() || "hf:moonshotai/Kimi-K2.5",
    subject: "Python factorial function",
  };
  return config;
}

export async function runReflectionOpenAI(
  env: NodeJS.ProcessEnv = process.env,
  runExecutor?: ReflectionRunExecutor,
): Promise<ReflectionOpenAIResult> {
  const openAIAgents: OpenAIAgentsModule = await loadOpenAIAgentsModule();
  const config: ReflectionOpenAIConfig = resolveReflectionOpenAIConfig(env);
  const provider: object = new openAIAgents.OpenAIProvider({
    apiKey: config.apiKey,
    baseURL: config.baseUrl,
    useResponses: false,
  });
  openAIAgents.setDefaultOpenAIKey(config.apiKey);
  openAIAgents.setOpenAIAPI("chat_completions");

  const runner: ReflectionRunner = new openAIAgents.Runner({
    modelProvider: provider,
    tracingDisabled: true,
  });
  const session: ReflectionMemorySession = new openAIAgents.MemorySession();

  const draftWriter: ReflectionAgent = new openAIAgents.Agent({
    name: "DraftWriter",
    model: config.modelName,
    instructions:
      "Write a short, informative paragraph about the user's subject.",
  });
  const factChecker: ReflectionAgent = new openAIAgents.Agent({
    name: "FactChecker",
    model: config.modelName,
    instructions: [
      "You are a meticulous fact-checker.",
      "Read the draft content provided by the user.",
      "Carefully verify the factual accuracy of all claims.",
      "Respond with a concise final review text.",
    ].join("\n"),
  });

  const executeRun: ReflectionRunExecutor =
    runExecutor ||
    (async (
      currentRunner: ReflectionRunner,
      currentAgent: ReflectionAgent,
      input: string,
      options: { maxTurns: number; session: ReflectionMemorySession },
    ): Promise<ReflectionRunResult> => {
      const result: ReflectionRunResult = (await currentRunner.run(
        currentAgent,
        input,
        options,
      )) as ReflectionRunResult;
      return result;
    });

  const draftInput: string = [
    `Subject: ${config.subject}`,
    "Generate the draft paragraph.",
  ].join("\n");
  const draftResult: ReflectionRunResult = await executeRun(
    runner,
    draftWriter,
    draftInput,
    { maxTurns: 6, session },
  );
  const draftText: string =
    typeof draftResult.finalOutput === "string"
      ? draftResult.finalOutput
      : JSON.stringify(draftResult.finalOutput, null, 2);

  const reviewInput: string = [
    `Subject: ${config.subject}`,
    "Review this draft for factual accuracy:",
    draftText,
  ].join("\n");
  const reviewResult: ReflectionRunResult = await executeRun(
    runner,
    factChecker,
    reviewInput,
    { maxTurns: 6, session },
  );
  const reviewRawOutput: string =
    typeof reviewResult.finalOutput === "string"
      ? reviewResult.finalOutput
      : reviewResult.finalOutput === undefined
        ? ""
        : JSON.stringify(reviewResult.finalOutput, null, 2) ?? "";
  const review: string = reviewRawOutput.trim();

  if (review.length === 0) {
    throw new Error(
      "OpenAI reflection workflow completed without a text response.",
    );
  }

  const result: ReflectionOpenAIResult = { review };
  return result;
}

const isNodeTestContext: boolean = process.env.NODE_TEST_CONTEXT !== undefined;
const cliPath: string | undefined = process.argv[1];
if (!isNodeTestContext && cliPath) {
  const cliUrl: string = pathToFileURL(resolve(process.cwd(), cliPath)).href;
  if (cliUrl === import.meta.url) {
    void runReflectionOpenAI(process.env)
      .then((result: ReflectionOpenAIResult): void => {
        console.log(result);
      })
      .catch((error: unknown): void => {
        const errorMessage: string =
          error instanceof Error ? error.message : String(error);
        console.error(errorMessage);
        process.exitCode = 1;
      });
  }
}
