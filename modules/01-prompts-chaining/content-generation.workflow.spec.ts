import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildRuntimeConfigFromEnv,
  resolveCliInput,
  runContentGenerationWorkflow,
  type RunContentGenerationWorkflowResult,
  type RuntimeConfig,
} from "./content-generation.workflow.ts";

test("buildRuntimeConfigFromEnv enforces API key", (): void => {
  assert.throws(
    (): RuntimeConfig => buildRuntimeConfigFromEnv({}),
    /API_KEY is missing\./,
  );
});

test("resolveCliInput parses user interest", (): void => {
  const cliInput: string | undefined = resolveCliInput([
    "node",
    "script.ts",
    "AI",
    "research",
  ]);
  assert.equal(cliInput, "AI research");
});

test("runContentGenerationWorkflow returns full draft outputs", async (): Promise<void> => {
  const result: RunContentGenerationWorkflowResult =
    await runContentGenerationWorkflow({
      userInterest: "AI research",
      runtimeConfig: {
        apiKey: "key",
        baseUrl: "https://example.com/v1",
        modelName: "model",
      },
      workflowRunner: async (): Promise<RunContentGenerationWorkflowResult> => {
        return {
          userInterest: "AI research",
          ideas: ["idea1", "idea2"],
          selectedIdea: "idea1",
          outline: ["intro", "body"],
          sections: ["intro section", "body section"],
          refinedDraft: "final draft",
          modelName: "model",
        };
      },
    });

  assert.equal(result.selectedIdea, "idea1");
  assert.equal(result.sections.length, 2);
});
