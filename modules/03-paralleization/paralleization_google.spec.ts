import assert from "node:assert/strict";
import { test } from "node:test";

import {
  resolveGoogleConfig,
  runGoogleWorkflow,
  type GoogleConfig,
  type GoogleWorkflowExecutor,
  type GoogleWorkflowResult,
} from "./paralleization_google.ts";

test("resolveGoogleConfig throws when required keys are missing", (): void => {
  assert.throws(
    (): GoogleConfig => resolveGoogleConfig({}),
    /GEMINI_API_KEY or GOOGLE_API_KEY or SYNTHETIC_API_KEY is missing\./,
  );
});

test("resolveGoogleConfig prefers GEMINI_API_KEY", (): void => {
  const config: GoogleConfig = resolveGoogleConfig({
    GEMINI_API_KEY: "gemini-key",
    GOOGLE_API_KEY: "google-key",
  });

  assert.equal(config.apiKey, "gemini-key");
  assert.equal(config.modelName, "gemini-2.0-flash");
});

test("runGoogleWorkflow returns report shape from executor", async (): Promise<void> => {
  const config: GoogleConfig = {
    apiKey: "test-key",
    modelName: "gemini-2.0-flash",
    appName: "test-app",
    userId: "test-user",
    topic: "test-topic",
  };

  const result: GoogleWorkflowResult = await runGoogleWorkflow(
    config,
    async (
      payload: Parameters<GoogleWorkflowExecutor>[0],
    ): Promise<string> => {
      assert.equal(payload.workflow.name, "ResearchAndSynthesisPipeline");
      assert.equal(payload.workflow.subAgents.length, 2);

      const parallelAgent: { name: string; subAgents: Array<unknown> } =
        payload.workflow.subAgents[0] as {
          name: string;
          subAgents: Array<unknown>;
        };
      assert.equal(parallelAgent.name, "ParallelWebResearchAgent");
      assert.equal(parallelAgent.subAgents.length, 3);

      const userMessageText: string = JSON.stringify(payload.userMessage);
      assert.match(userMessageText, /Create the final report now\./);
      return "structured-report";
    },
  );

  assert.equal(result.report, "structured-report");
  assert.equal(result.modelName, "gemini-2.0-flash");
  assert.equal(result.topic, "test-topic");
});

test("runGoogleWorkflow throws when executor returns empty output", async (): Promise<void> => {
  const config: GoogleConfig = {
    apiKey: "test-key",
    modelName: "gemini-2.0-flash",
    appName: "test-app",
    userId: "test-user",
    topic: "test-topic",
  };

  await assert.rejects(
    async (): Promise<GoogleWorkflowResult> =>
      runGoogleWorkflow(config, async (): Promise<string> => ""),
    /Google workflow completed without a text response\./,
  );
});
