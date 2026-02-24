import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildRuntimeConfigFromEnv,
  runParallelResearchWorkflow,
  runParallelResearchWorkflowFromCli,
  type AgentExecutionPayload,
  type ParallelResearchResult,
  type RuntimeConfig,
} from "./parallelization_openai.ts";

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

test("runParallelResearchWorkflow executes 3 research agents and merges summaries", async (): Promise<void> => {
  const runtimeConfig: RuntimeConfig = {
    apiKey: "test-key",
    baseUrl: "https://example.com/openai/v1",
    modelName: "test-model",
  };

  const executionOrder: Array<string> = [];
  let mergerInputSnapshot: string = "";

  const result: ParallelResearchResult = await runParallelResearchWorkflow(
    runtimeConfig,
    {
      agentExecutor: async (
        payload: AgentExecutionPayload,
      ): Promise<string> => {
        executionOrder.push(payload.agent.name);

        if (payload.agent.name === "SynthesisAgent") {
          mergerInputSnapshot = payload.input;
          return "merged-report";
        }

        await new Promise<void>((resolve: () => void): void => {
          setTimeout(resolve, 15);
        });
        return `summary-from-${payload.agent.name}`;
      },
    },
  );

  assert.equal(result.summaries.length, 3);
  assert.equal(result.mergedReport, "merged-report");
  assert.equal(result.modelName, "test-model");
  assert.ok(
    result.summaries.every((summary): boolean =>
      summary.summary.startsWith("summary-from-"),
    ),
  );
  assert.equal(
    executionOrder.filter((name: string): boolean => name === "SynthesisAgent")
      .length,
    1,
  );
  assert.match(mergerInputSnapshot, /Renewable Energy:/);
  assert.match(mergerInputSnapshot, /Electric Vehicles:/);
  assert.match(mergerInputSnapshot, /Carbon Capture:/);
});

test("runParallelResearchWorkflowFromCli logs clear message and rethrows errors", async (): Promise<void> => {
  const logs: Array<string> = [];
  const errors: Array<string> = [];

  await assert.rejects(
    async (): Promise<void> =>
      runParallelResearchWorkflowFromCli(
        {},
        (message: string): void => {
          logs.push(message);
        },
        (message: string): void => {
          errors.push(message);
        },
      ),
    /SYNTHETIC_API_KEY is missing\./,
  );

  assert.equal(logs.length, 1);
  assert.match(logs[0], /Parallel Research Workflow/);
  assert.equal(errors.length, 1);
  assert.match(errors[0], /Parallel research workflow failed:/);
});
