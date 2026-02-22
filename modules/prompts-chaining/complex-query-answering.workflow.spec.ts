import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildRuntimeConfigFromEnv,
  resolveCliInput,
  runComplexQueryAnsweringWorkflow,
  type RunComplexQueryAnsweringWorkflowResult,
  type RuntimeConfig,
} from "./complex-query-answering.workflow.ts";

test("buildRuntimeConfigFromEnv throws when API key is missing", (): void => {
  assert.throws(
    (): RuntimeConfig => buildRuntimeConfigFromEnv({}),
    /SYNTHETIC_API_KEY is missing\./,
  );
});

test("resolveCliInput joins trailing arguments into one question", (): void => {
  const cliInput: string | undefined = resolveCliInput([
    "node",
    "script.ts",
    "what",
    "is",
    "new",
    "deal",
  ]);
  assert.equal(cliInput, "what is new deal");
});

test("runComplexQueryAnsweringWorkflow returns synthesized answer from runner", async (): Promise<void> => {
  const result: RunComplexQueryAnsweringWorkflowResult =
    await runComplexQueryAnsweringWorkflow({
      question: "sample question",
      runtimeConfig: {
        apiKey: "test-key",
        baseUrl: "https://example.com/v1",
        modelName: "test-model",
      },
      workflowRunner:
        async (): Promise<RunComplexQueryAnsweringWorkflowResult> => {
          return {
            originalQuestion: "sample question",
            subQuestions: ["cause?", "policy?"],
            causeResearch: "cause data",
            policyResearch: "policy data",
            synthesizedAnswer: "final answer",
            modelName: "test-model",
          };
        },
    });

  assert.equal(result.subQuestions.length, 2);
  assert.equal(result.synthesizedAnswer, "final answer");
});
