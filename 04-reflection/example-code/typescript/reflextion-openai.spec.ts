import assert from "node:assert/strict";
import { test } from "node:test";
import { Runner, type Agent, type Session } from "@openai/agents";

type ReflectionOpenAIResult = {
  review: string;
};

type ReflectionRunResult = {
  finalOutput: unknown;
};

type ReflectionOpenAIModule = {
  runReflectionOpenAI: (
    env?: NodeJS.ProcessEnv,
  ) => Promise<ReflectionOpenAIResult>;
};

type RunnerRunMock = (
  agent: Agent,
  input: unknown,
  options?: { maxTurns?: number; session?: Session },
) => Promise<ReflectionRunResult>;

async function loadReflectionOpenAIModule(): Promise<ReflectionOpenAIModule> {
  const modulePath: string = "./reflextion-openai.ts";
  const loadedModule: unknown = await import(modulePath);
  const typedModule: ReflectionOpenAIModule =
    loadedModule as ReflectionOpenAIModule;
  return typedModule;
}

function createTestEnv(): NodeJS.ProcessEnv {
  return {
    API_KEY: "test-key",
    BASE_URL: "https://example.com/openai/v1",
    MODEL: "test-model",
  };
}

function installRunnerRunMock(mockRun: RunnerRunMock): () => void {
  const originalRun: Runner["run"] = Runner.prototype.run;
  const patchedRun: Runner["run"] = (async (
    agent: Agent,
    input: unknown,
    options?: { maxTurns?: number; session?: Session },
  ): Promise<ReflectionRunResult> =>
    mockRun(agent, input, options)) as unknown as Runner["run"];
  Runner.prototype.run = patchedRun;
  return (): void => {
    Runner.prototype.run = originalRun;
  };
}

test("runReflectionOpenAI returns { review } from FactChecker output", async (): Promise<void> => {
  const reflectionModule: ReflectionOpenAIModule =
    await loadReflectionOpenAIModule();
  const calledAgents: Array<string> = [];
  const sessions: Array<Session | undefined> = [];
  const restoreRun: () => void = installRunnerRunMock(
    async (
      agent: Agent,
      _input: unknown,
      options?: { maxTurns?: number; session?: Session },
    ): Promise<ReflectionRunResult> => {
      calledAgents.push(agent.name);
      sessions.push(options?.session);
      if (agent.name === "DraftWriter") {
        return { finalOutput: "draft paragraph" };
      }
      return { finalOutput: "ACCURATE: facts look correct." };
    },
  );

  try {
    const result: ReflectionOpenAIResult =
      await reflectionModule.runReflectionOpenAI(createTestEnv());
    assert.deepEqual(result, { review: "ACCURATE: facts look correct." });
    assert.deepEqual(calledAgents, ["DraftWriter", "FactChecker"]);
    assert.equal(sessions.length, 2);
    assert.equal(sessions[0], sessions[1]);
  } finally {
    restoreRun();
  }
});

test("runReflectionOpenAI throws when final review text is empty", async (): Promise<void> => {
  const reflectionModule: ReflectionOpenAIModule =
    await loadReflectionOpenAIModule();
  const restoreRun: () => void = installRunnerRunMock(
    async (agent: Agent): Promise<ReflectionRunResult> => {
      if (agent.name === "DraftWriter") {
        return { finalOutput: "draft paragraph" };
      }
      return { finalOutput: "   " };
    },
  );

  try {
    await assert.rejects(
      async (): Promise<ReflectionOpenAIResult> =>
        reflectionModule.runReflectionOpenAI(createTestEnv()),
      /OpenAI reflection workflow completed without a text response\./,
    );
  } finally {
    restoreRun();
  }
});

test("runReflectionOpenAI throws controlled error when reviewer finalOutput is undefined", async (): Promise<void> => {
  const reflectionModule: ReflectionOpenAIModule =
    await loadReflectionOpenAIModule();
  const restoreRun: () => void = installRunnerRunMock(
    async (agent: Agent): Promise<ReflectionRunResult> => {
      if (agent.name === "DraftWriter") {
        return { finalOutput: "draft paragraph" };
      }
      return { finalOutput: undefined };
    },
  );

  try {
    await assert.rejects(
      async (): Promise<ReflectionOpenAIResult> =>
        reflectionModule.runReflectionOpenAI(createTestEnv()),
      /OpenAI reflection workflow completed without a text response\./,
    );
  } finally {
    restoreRun();
  }
});

test("runReflectionOpenAI stringifies non-string draft output before review", async (): Promise<void> => {
  const reflectionModule: ReflectionOpenAIModule =
    await loadReflectionOpenAIModule();
  let capturedReviewInput: string = "";
  const restoreRun: () => void = installRunnerRunMock(
    async (agent: Agent, input: unknown): Promise<ReflectionRunResult> => {
      if (agent.name === "DraftWriter") {
        return { finalOutput: { value: "draft paragraph" } };
      }
      capturedReviewInput = typeof input === "string" ? input : String(input);
      return { finalOutput: "review paragraph" };
    },
  );

  try {
    const result: ReflectionOpenAIResult =
      await reflectionModule.runReflectionOpenAI(createTestEnv());
    assert.equal(result.review, "review paragraph");
    assert.match(capturedReviewInput, /"value": "draft paragraph"/);
  } finally {
    restoreRun();
  }
});
