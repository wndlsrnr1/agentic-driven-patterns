import assert from "node:assert/strict";
import { test } from "node:test";

import {
  buildRuntimeConfig,
  formatFinalReport,
  runPlanningPattern,
  type PlanningPatternExecutor,
  type PlanningPatternResult,
  type RuntimeConfig,
} from "./planning-pattern-openai.ts";

test("buildRuntimeConfig throws when API_KEY is missing", (): void => {
  assert.throws(
    (): RuntimeConfig => buildRuntimeConfig({}),
    /API_KEY is missing\./,
  );
});

test("buildRuntimeConfig uses default baseUrl and modelName", (): void => {
  const config: RuntimeConfig = buildRuntimeConfig({
    API_KEY: "test-key",
  });

  assert.equal(config.apiKey, "test-key");
  assert.equal(config.baseUrl, "https://api.z.ai/api/coding/paas/v4");
  assert.equal(config.modelName, "glm-5.1");
});

test("runPlanningPattern returns injected executor result shape", async (): Promise<void> => {
  const config: RuntimeConfig = {
    apiKey: "test-key",
    baseUrl: "https://example.com/openai/v1",
    modelName: "test-model",
  };
  const executor: PlanningPatternExecutor = async (
    executorConfig: RuntimeConfig,
    topic: string,
  ): Promise<PlanningPatternResult> => {
    assert.equal(executorConfig.modelName, "test-model");
    assert.equal(topic, "The importance of Reinforcement Learning in AI");

    return {
      topic,
      plan: "- point 1\n- point 2",
      summary: "A concise summary.",
      modelName: executorConfig.modelName,
    };
  };

  const result: PlanningPatternResult = await runPlanningPattern({
    runtimeConfig: config,
    executor,
  });

  assert.equal(result.topic, "The importance of Reinforcement Learning in AI");
  assert.match(result.plan, /point 1/);
  assert.equal(result.summary, "A concise summary.");
  assert.equal(result.modelName, "test-model");
});

test("runPlanningPattern stringifies non-string planner output before writer step", async (): Promise<void> => {
  const config: RuntimeConfig = {
    apiKey: "test-key",
    baseUrl: "https://example.com/openai/v1",
    modelName: "test-model",
  };
  let capturedWriterInput: string = "";

  const result: PlanningPatternResult = await runPlanningPattern({
    runtimeConfig: config,
    executor: async (
      executorConfig: RuntimeConfig,
      topic: string,
    ): Promise<PlanningPatternResult> => {
      const plannerOutput: unknown = {
        steps: ["history", "applications", "future impact"],
      };
      const planText: string = JSON.stringify(plannerOutput, null, 2);
      capturedWriterInput = [
        `Topic: ${topic}`,
        "Use the provided plan as the structure.",
        `Plan:\n${planText}`,
      ].join("\n\n");

      return {
        topic,
        plan: planText,
        summary: "Writer produced a summary from the stringified plan.",
        modelName: executorConfig.modelName,
      };
    },
  });

  assert.equal(
    result.summary,
    "Writer produced a summary from the stringified plan.",
  );
  assert.match(capturedWriterInput, /"steps"/);
});

test("runPlanningPattern throws when writer output is empty", async (): Promise<void> => {
  await assert.rejects(
    async (): Promise<PlanningPatternResult> =>
      runPlanningPattern({
        runtimeConfig: {
          apiKey: "test-key",
          baseUrl: "https://example.com/openai/v1",
          modelName: "test-model",
        },
        executor: async (
          executorConfig: RuntimeConfig,
          topic: string,
        ): Promise<PlanningPatternResult> => {
          return {
            topic,
            plan: "- point 1",
            summary: "   ",
            modelName: executorConfig.modelName,
          };
        },
      }),
    /OpenAI planning pattern completed without a text summary\./,
  );
});

test("formatFinalReport includes plan and summary sections", (): void => {
  const result: PlanningPatternResult = {
    topic: "The importance of Reinforcement Learning in AI",
    plan: "- point 1\n- point 2",
    summary: "A concise summary.",
    modelName: "test-model",
  };

  const report: string = formatFinalReport(result);

  assert.match(report, /^Topic: The importance of Reinforcement Learning in AI/m);
  assert.match(report, /^### Plan$/m);
  assert.match(report, /^### Summary$/m);
  assert.match(report, /A concise summary\./);
});
