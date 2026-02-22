import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildRuntimeConfigFromEnv,
  resolveCliInput,
  runCodeGenerationRefinementWorkflow,
  type RuntimeConfig,
  type RunCodeGenerationRefinementWorkflowResult,
} from "./code-generation-refinement.workflow.ts";

test("buildRuntimeConfigFromEnv throws without API key", (): void => {
  assert.throws(
    (): RuntimeConfig => buildRuntimeConfigFromEnv({}),
    /SYNTHETIC_API_KEY is missing\./,
  );
});

test("resolveCliInput parses coding request", (): void => {
  const cliInput: string | undefined = resolveCliInput([
    "node",
    "script.ts",
    "build",
    "pagination",
  ]);
  assert.equal(cliInput, "build pagination");
});

test("runCodeGenerationRefinementWorkflow returns refinement outputs", async (): Promise<void> => {
  const result: RunCodeGenerationRefinementWorkflowResult =
    await runCodeGenerationRefinementWorkflow({
      codingRequest: "build pagination",
      runtimeConfig: {
        apiKey: "key",
        baseUrl: "https://example.com/v1",
        modelName: "model",
      },
      workflowRunner:
        async (): Promise<RunCodeGenerationRefinementWorkflowResult> => {
          return {
            codingRequest: "build pagination",
            pseudocode: "steps",
            draftCode: "const x = 1;",
            reviewNotes: ["missing types"],
            refinedCode: "const x: number = 1;",
            testOutline: "1. should paginate",
            documentation: "API docs",
            modelName: "model",
          };
        },
    });

  assert.equal(result.reviewNotes.length, 1);
  assert.match(result.refinedCode, /number/);
});
