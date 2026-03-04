import assert from "node:assert/strict";
import { test } from "node:test";

type ReflectionOpenAIResult = {
  review: string;
};

type ReflectionRunResult = {
  finalOutput: unknown;
};

type ReflectionAgent = {
  name: string;
};

type ReflectionMemorySession = object;

type ReflectionRunner = {
  run: (
    agent: ReflectionAgent,
    input: string,
    options: { maxTurns: number; session: ReflectionMemorySession },
  ) => Promise<ReflectionRunResult>;
};

type ReflectionRunExecutor = (
  runner: ReflectionRunner,
  agent: ReflectionAgent,
  input: string,
  options: { maxTurns: number; session: ReflectionMemorySession },
) => Promise<ReflectionRunResult>;

type ReflectionOpenAIModule = {
  runReflectionOpenAI: (
    env?: NodeJS.ProcessEnv,
    runExecutor?: ReflectionRunExecutor,
  ) => Promise<ReflectionOpenAIResult>;
};

async function loadReflectionOpenAIModule(): Promise<ReflectionOpenAIModule> {
  const modulePath: string = "./reflextion-openai.ts";
  const loadedModule: unknown = await import(modulePath);
  const typedModule: ReflectionOpenAIModule = loadedModule as ReflectionOpenAIModule;
  return typedModule;
}

test("runReflectionOpenAI returns { review } from FactChecker output", async (): Promise<void> => {
  const env: NodeJS.ProcessEnv = {
    SYNTHETIC_API_KEY: "test-key",
    SYNTHETIC_BASE_URL: "https://example.com/openai/v1",
    SYNTHETIC_MODEL: "test-model",
  };
  const reflectionModule: ReflectionOpenAIModule =
    await loadReflectionOpenAIModule();

  const executor: ReflectionRunExecutor = async (
    _runner: ReflectionRunner,
    agent: ReflectionAgent,
    _input: string,
    _options: { maxTurns: number; session: ReflectionMemorySession },
  ): Promise<ReflectionRunResult> => {
    if (agent.name === "DraftWriter") {
      const draftResult: ReflectionRunResult = { finalOutput: "draft paragraph" };
      return draftResult;
    }

    const reviewResult: ReflectionRunResult = {
      finalOutput: "ACCURATE: facts look correct.",
    };
    return reviewResult;
  };

  const result: ReflectionOpenAIResult = await reflectionModule.runReflectionOpenAI(
    env,
    executor,
  );
  assert.deepEqual(result, { review: "ACCURATE: facts look correct." });
});

test("runReflectionOpenAI throws when final review text is empty", async (): Promise<void> => {
  const env: NodeJS.ProcessEnv = {
    SYNTHETIC_API_KEY: "test-key",
    SYNTHETIC_BASE_URL: "https://example.com/openai/v1",
    SYNTHETIC_MODEL: "test-model",
  };
  const reflectionModule: ReflectionOpenAIModule =
    await loadReflectionOpenAIModule();

  const executor: ReflectionRunExecutor = async (
    _runner: ReflectionRunner,
    agent: ReflectionAgent,
    _input: string,
    _options: { maxTurns: number; session: ReflectionMemorySession },
  ): Promise<ReflectionRunResult> => {
    if (agent.name === "DraftWriter") {
      return { finalOutput: "draft paragraph" };
    }

    return { finalOutput: "   " };
  };

  await assert.rejects(
    async (): Promise<ReflectionOpenAIResult> =>
      reflectionModule.runReflectionOpenAI(env, executor),
    /OpenAI reflection workflow completed without a text response\./,
  );
});

test("runReflectionOpenAI throws controlled error when reviewer finalOutput is undefined", async (): Promise<void> => {
  const env: NodeJS.ProcessEnv = {
    SYNTHETIC_API_KEY: "test-key",
    SYNTHETIC_BASE_URL: "https://example.com/openai/v1",
    SYNTHETIC_MODEL: "test-model",
  };
  const reflectionModule: ReflectionOpenAIModule =
    await loadReflectionOpenAIModule();

  const executor: ReflectionRunExecutor = async (
    _runner: ReflectionRunner,
    agent: ReflectionAgent,
    _input: string,
    _options: { maxTurns: number; session: ReflectionMemorySession },
  ): Promise<ReflectionRunResult> => {
    if (agent.name === "DraftWriter") {
      return { finalOutput: "draft paragraph" };
    }

    return { finalOutput: undefined };
  };

  await assert.rejects(
    async (): Promise<ReflectionOpenAIResult> =>
      reflectionModule.runReflectionOpenAI(env, executor),
    /OpenAI reflection workflow completed without a text response\./,
  );
});

test("runReflectionOpenAI keeps deterministic DraftWriter -> FactChecker sequence", async (): Promise<void> => {
  const env: NodeJS.ProcessEnv = {
    SYNTHETIC_API_KEY: "test-key",
    SYNTHETIC_BASE_URL: "https://example.com/openai/v1",
    SYNTHETIC_MODEL: "test-model",
  };
  const reflectionModule: ReflectionOpenAIModule =
    await loadReflectionOpenAIModule();
  const calledAgents: Array<string> = [];
  let capturedSession: unknown = undefined;

  const executor: ReflectionRunExecutor = async (
    _runner: ReflectionRunner,
    agent: ReflectionAgent,
    _input: string,
    options: { maxTurns: number; session: ReflectionMemorySession },
  ): Promise<ReflectionRunResult> => {
    calledAgents.push(agent.name);
    if (capturedSession === undefined) {
      capturedSession = options.session;
    } else {
      assert.equal(options.session, capturedSession);
    }

    if (agent.name === "DraftWriter") {
      return { finalOutput: "draft paragraph" };
    }
    return { finalOutput: "review paragraph" };
  };

  const result: ReflectionOpenAIResult = await reflectionModule.runReflectionOpenAI(
    env,
    executor,
  );
  assert.equal(result.review, "review paragraph");
  assert.deepEqual(calledAgents, ["DraftWriter", "FactChecker"]);
});
