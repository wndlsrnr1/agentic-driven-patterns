import assert from "node:assert/strict";
import { test } from "node:test";

import {
  resolveOpenAIConfig,
  runOpenAIWorkflow,
  type OpenAIConfig,
  type OpenAIWorkflowResult,
  type ResearchSummary,
} from "./parallelization_openai.ts";

test("resolveOpenAIConfig throws when SYNTHETIC_API_KEY is missing", (): void => {
  assert.throws(
    (): OpenAIConfig => resolveOpenAIConfig({}),
    /SYNTHETIC_API_KEY is missing\./,
  );
});

test("resolveOpenAIConfig uses default baseUrl and modelName", (): void => {
  const config: OpenAIConfig = resolveOpenAIConfig({
    SYNTHETIC_API_KEY: "test-key",
  });

  assert.equal(config.apiKey, "test-key");
  assert.equal(config.baseUrl, "https://api.synthetic.new/openai/v1");
  assert.equal(config.modelName, "hf:moonshotai/Kimi-K2.5");
});

test("runOpenAIWorkflow returns executor result shape", async (): Promise<void> => {
  const config: OpenAIConfig = {
    apiKey: "test-key",
    baseUrl: "https://example.com/openai/v1",
    modelName: "test-model",
  };

  const result: OpenAIWorkflowResult = await runOpenAIWorkflow(
    config,
    async (executorConfig: OpenAIConfig): Promise<OpenAIWorkflowResult> => {
      assert.equal(executorConfig.modelName, "test-model");

      const summaries: Array<ResearchSummary> = [
        {
          topic: "renewable energy sources",
          summary: "summary-a",
          outputKey: "renewable_energy_result",
        },
        {
          topic: "electric vehicle technology",
          summary: "summary-b",
          outputKey: "ev_technology_result",
        },
        {
          topic: "carbon capture methods",
          summary: "summary-c",
          outputKey: "carbon_capture_result",
        },
      ];

      const injectedResult: OpenAIWorkflowResult = {
        summaries,
        mergedReport: "merged-report",
        modelName: executorConfig.modelName,
      };
      return injectedResult;
    },
  );

  assert.equal(result.summaries.length, 3);
  assert.equal(result.mergedReport, "merged-report");
  assert.equal(result.modelName, "test-model");
});

test("runOpenAIWorkflow propagates executor failures", async (): Promise<void> => {
  const config: OpenAIConfig = {
    apiKey: "test-key",
    baseUrl: "https://example.com/openai/v1",
    modelName: "test-model",
  };

  await assert.rejects(
    async (): Promise<OpenAIWorkflowResult> =>
      runOpenAIWorkflow(
        config,
        async (): Promise<OpenAIWorkflowResult> => {
          throw new Error("executor failure");
        },
      ),
    /executor failure/,
  );
});
