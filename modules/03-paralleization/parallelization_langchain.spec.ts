import assert from "node:assert/strict";
import { test } from "node:test";

import {
  resolveLangchainConfig,
  runLangchainWorkflow,
  type LangchainConfig,
  type LangchainWorkflowResult,
} from "./parallelization_langchain.ts";

test("resolveLangchainConfig throws when SYNTHETIC_API_KEY is missing", (): void => {
  assert.throws(
    (): LangchainConfig => resolveLangchainConfig({}),
    /SYNTHETIC_API_KEY is missing\./,
  );
});

test("resolveLangchainConfig uses default baseUrl and modelName", (): void => {
  const config: LangchainConfig = resolveLangchainConfig({
    SYNTHETIC_API_KEY: "test-key",
  });

  assert.equal(config.apiKey, "test-key");
  assert.equal(config.baseUrl, "https://api.synthetic.new/openai/v1");
  assert.equal(config.modelName, "hf:moonshotai/Kimi-K2.5");
  assert.equal(config.topic, "The history of space exploration");
});

test("runLangchainWorkflow returns executor result shape", async (): Promise<void> => {
  const config: LangchainConfig = {
    apiKey: "test-key",
    baseUrl: "https://example.com/openai/v1",
    modelName: "test-model",
    topic: "test-topic",
  };

  const result: LangchainWorkflowResult = await runLangchainWorkflow(
    config,
    "custom-topic",
    async (
      executorConfig: LangchainConfig,
      topic: string,
    ): Promise<LangchainWorkflowResult> => {
      assert.equal(executorConfig.modelName, "test-model");
      assert.equal(topic, "custom-topic");
      const injectedResult: LangchainWorkflowResult = {
        topic,
        summary: "summary",
        questions: "questions",
        keyTerms: "key terms",
        finalResponse: "final response",
        modelName: executorConfig.modelName,
      };
      return injectedResult;
    },
  );

  assert.equal(result.topic, "custom-topic");
  assert.equal(result.summary, "summary");
  assert.equal(result.questions, "questions");
  assert.equal(result.keyTerms, "key terms");
  assert.equal(result.finalResponse, "final response");
  assert.equal(result.modelName, "test-model");
});

test("runLangchainWorkflow propagates executor failures", async (): Promise<void> => {
  const config: LangchainConfig = {
    apiKey: "test-key",
    baseUrl: "https://example.com/openai/v1",
    modelName: "test-model",
    topic: "test-topic",
  };

  await assert.rejects(
    async (): Promise<LangchainWorkflowResult> =>
      runLangchainWorkflow(
        config,
        "test-topic",
        async (): Promise<LangchainWorkflowResult> => {
          throw new Error("executor failure");
        },
      ),
    /executor failure/,
  );
});
