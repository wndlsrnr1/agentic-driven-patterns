import assert from "node:assert/strict";
import { resolve } from "node:path";
import { test } from "node:test";
import { pathToFileURL } from "node:url";

import {
  buildRuntimeConfigFromEnv,
  isDirectExecution,
  resolveCliInput,
  runParallelizationLangchainWorkflow,
  type RunParallelizationLangchainWorkflowResult,
  type RuntimeConfig,
} from "./parallelization_langchain.ts";

test("buildRuntimeConfigFromEnv throws when SYNTHETIC_API_KEY is missing", (): void => {
  assert.throws(
    (): RuntimeConfig => buildRuntimeConfigFromEnv({}),
    /SYNTHETIC_API_KEY is missing\./,
  );
});

test("buildRuntimeConfigFromEnv uses default baseUrl and modelName", (): void => {
  const runtimeConfig: RuntimeConfig = buildRuntimeConfigFromEnv({
    SYNTHETIC_API_KEY: "test-key",
  });

  assert.equal(runtimeConfig.apiKey, "test-key");
  assert.equal(runtimeConfig.baseUrl, "https://api.synthetic.new/openai/v1");
  assert.equal(runtimeConfig.modelName, "hf:moonshotai/Kimi-K2.5");
});

test("resolveCliInput joins trailing arguments into a topic", (): void => {
  const cliInput: string | undefined = resolveCliInput([
    "node",
    "script.ts",
    "history",
    "of",
    "space",
  ]);
  assert.equal(cliInput, "history of space");
});

test("runParallelizationLangchainWorkflow preserves runner output and logs steps", async (): Promise<void> => {
  const logs: Array<string> = [];
  const expectedResult: RunParallelizationLangchainWorkflowResult = {
    topic: "The history of space exploration",
    summary: "summary",
    questions: "questions",
    keyTerms: "terms",
    finalResponse: "final response",
    processLogs: [
      "start",
      "parallel-start",
      "parallel-done",
      "synthesis-start",
      "synthesis-done",
      "completed",
    ],
    modelName: "test-model",
  };

  const result: RunParallelizationLangchainWorkflowResult =
    await runParallelizationLangchainWorkflow({
      topic: "The history of space exploration",
      runtimeConfig: {
        apiKey: "test-key",
        baseUrl: "https://example.com/openai/v1",
        modelName: "test-model",
      },
      log: (message: string): void => {
        logs.push(message);
      },
      workflowRunner:
        async (): Promise<RunParallelizationLangchainWorkflowResult> => {
          return expectedResult;
        },
    });

  assert.deepEqual(result, expectedResult);
  assert.equal(logs.length, 3);
  assert.match(logs[0], /topic:/);
  assert.match(logs[1], /final response ready/);
  assert.equal(logs[2], "final response");
});

test("isDirectExecution returns true only for current script", (): void => {
  const scriptPath: string = resolve("/tmp/parallelization_langchain.ts");
  const moduleUrl: string = pathToFileURL(scriptPath).href;

  assert.equal(isDirectExecution(moduleUrl, ["node", scriptPath]), true);
  assert.equal(
    isDirectExecution(moduleUrl, ["node", "/tmp/another.ts"]),
    false,
  );
  assert.equal(isDirectExecution(moduleUrl, ["node"]), false);
});
