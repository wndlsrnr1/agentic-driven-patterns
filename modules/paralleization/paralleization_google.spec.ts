import assert from "node:assert/strict";
import { test } from "node:test";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import {
  buildResearchAndSynthesisAgent,
  buildRuntimeConfigFromEnv,
  isDirectExecution,
  runParalleizationGoogleWorkflow,
  type ParallelResearchWorkflowResult,
  type RuntimeConfig,
  type RunParalleizationGoogleWorkflowOptions,
} from "./paralleization_google.ts";

test("buildRuntimeConfigFromEnv throws when GEMINI_API_KEY, GOOGLE_API_KEY, and SYNTHETIC_API_KEY are missing", (): void => {
  assert.throws(
    (): RuntimeConfig => buildRuntimeConfigFromEnv({}),
    /GEMINI_API_KEY or GOOGLE_API_KEY or SYNTHETIC_API_KEY is missing\./,
  );
});

test("buildRuntimeConfigFromEnv prefers GEMINI_API_KEY and keeps default model", (): void => {
  const runtimeConfig: RuntimeConfig = buildRuntimeConfigFromEnv({
    GEMINI_API_KEY: "gemini-key",
    GOOGLE_API_KEY: "google-key",
  });

  assert.equal(runtimeConfig.apiKey, "gemini-key");
  assert.equal(runtimeConfig.modelName, "gemini-2.0-flash");
});

test("buildRuntimeConfigFromEnv falls back to GOOGLE_API_KEY", (): void => {
  const runtimeConfig: RuntimeConfig = buildRuntimeConfigFromEnv({
    GOOGLE_API_KEY: "google-key",
    GEMINI_MODEL: "gemini-2.5-flash",
  });

  assert.equal(runtimeConfig.apiKey, "google-key");
  assert.equal(runtimeConfig.modelName, "gemini-2.5-flash");
});

test("buildRuntimeConfigFromEnv falls back to SYNTHETIC_API_KEY", (): void => {
  const runtimeConfig: RuntimeConfig = buildRuntimeConfigFromEnv({
    SYNTHETIC_API_KEY: "synthetic-key",
  });

  assert.equal(runtimeConfig.apiKey, "synthetic-key");
  assert.equal(runtimeConfig.modelName, "gemini-2.0-flash");
});

test("buildResearchAndSynthesisAgent composes parallel and sequential graph", (): void => {
  process.env.GEMINI_API_KEY = "test-key";

  const rootAgent: ReturnType<typeof buildResearchAndSynthesisAgent> =
    buildResearchAndSynthesisAgent();

  assert.equal(rootAgent.name, "ResearchAndSynthesisPipeline");
  assert.equal(rootAgent.subAgents.length, 2);

  const parallelAgent: (typeof rootAgent.subAgents)[number] =
    rootAgent.subAgents[0];
  assert.equal(parallelAgent.name, "ParallelWebResearchAgent");
  assert.equal(parallelAgent.subAgents.length, 3);

  const outputKeys: Array<string | undefined> = parallelAgent.subAgents.map(
    (agent): string | undefined => {
      const outputKey: string | undefined = (agent as { outputKey?: string })
        .outputKey;
      return outputKey;
    },
  );

  assert.deepEqual(outputKeys, [
    "renewable_energy_result",
    "ev_technology_result",
    "carbon_capture_result",
  ]);
});

test("runParalleizationGoogleWorkflow supports workflowRunner injection", async (): Promise<void> => {
  const options: RunParalleizationGoogleWorkflowOptions = {
    runtimeConfig: {
      apiKey: "test-key",
      modelName: "gemini-2.0-flash",
    },
    workflowRunner: async (
      payload,
    ): Promise<ParallelResearchWorkflowResult> => {
      const outputKeys: Array<string> = payload.researchAgentSpecs.map(
        (spec): string => spec.outputKey,
      );

      assert.equal(outputKeys.length, 3);
      assert.deepEqual(outputKeys, [
        "renewable_energy_result",
        "ev_technology_result",
        "carbon_capture_result",
      ]);
      assert.equal(payload.rootAgent.name, "ResearchAndSynthesisPipeline");

      return {
        mergedReport:
          "## Summary of Recent Sustainable Technology Advancements",
        modelName: payload.runtimeConfig.modelName,
        researchAgentSpecs: payload.researchAgentSpecs,
      };
    },
  };

  const result: ParallelResearchWorkflowResult =
    await runParalleizationGoogleWorkflow(options);

  assert.match(
    result.mergedReport,
    /Summary of Recent Sustainable Technology Advancements/,
  );
  assert.equal(result.researchAgentSpecs.length, 3);
});

test("isDirectExecution returns true only for current script", (): void => {
  const scriptPath: string = resolve("/tmp/paralleization_google.ts");
  const moduleUrl: string = pathToFileURL(scriptPath).href;

  assert.equal(isDirectExecution(moduleUrl, ["node", scriptPath]), true);
  assert.equal(
    isDirectExecution(moduleUrl, ["node", "/tmp/another.ts"]),
    false,
  );
  assert.equal(isDirectExecution(moduleUrl, ["node"]), false);
});
