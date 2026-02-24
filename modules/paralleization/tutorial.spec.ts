import assert from "node:assert/strict";
import { resolve } from "node:path";
import { test } from "node:test";
import { pathToFileURL } from "node:url";

import {
  isDirectExecution,
  runGoogleAdkStep,
  runLangChainStep,
  runOpenAIAgentsStep,
  runTutorial,
  type RunTutorialResult,
  type TutorialStepResult,
} from "./tutorial.ts";

test("runTutorial returns structured step results", async (): Promise<void> => {
  const result: RunTutorialResult = await runTutorial({
    stepRunners: {
      runGoogleAdkStep: async (): Promise<TutorialStepResult> => {
        return {
          stepId: "step-1",
          library: "google-adk",
          status: "completed",
          message: "google step ok",
          output: "google output",
        };
      },
      runLangChainStep: async (): Promise<TutorialStepResult> => {
        return {
          stepId: "step-2",
          library: "langchain",
          status: "completed",
          message: "langchain step ok",
          output: "langchain output",
        };
      },
      runOpenAIAgentsStep: async (): Promise<TutorialStepResult> => {
        return {
          stepId: "step-3",
          library: "openai-agents",
          status: "completed",
          message: "openai step ok",
          output: "openai output",
        };
      },
    },
  });

  assert.equal(result.steps.length, 3);
  assert.equal(result.steps[0].output, "google output");
  assert.equal(result.steps[1].output, "langchain output");
  assert.equal(result.steps[2].output, "openai output");
});

test("runTutorial continues when a step is skipped", async (): Promise<void> => {
  const executionOrder: Array<string> = [];
  const result: RunTutorialResult = await runTutorial({
    stepRunners: {
      runGoogleAdkStep: async (): Promise<TutorialStepResult> => {
        executionOrder.push("google");
        return {
          stepId: "step-1",
          library: "google-adk",
          status: "skipped",
          message: "google key missing",
        };
      },
      runLangChainStep: async (): Promise<TutorialStepResult> => {
        executionOrder.push("langchain");
        return {
          stepId: "step-2",
          library: "langchain",
          status: "completed",
          message: "langchain ok",
        };
      },
      runOpenAIAgentsStep: async (): Promise<TutorialStepResult> => {
        executionOrder.push("openai");
        return {
          stepId: "step-3",
          library: "openai-agents",
          status: "completed",
          message: "openai ok",
        };
      },
    },
  });

  assert.deepEqual(executionOrder, ["google", "langchain", "openai"]);
  assert.equal(result.steps[0].status, "skipped");
  assert.equal(result.steps[1].status, "completed");
  assert.equal(result.steps[2].status, "completed");
});

test("runTutorial marks a failing step and continues", async (): Promise<void> => {
  const executionOrder: Array<string> = [];
  const result: RunTutorialResult = await runTutorial({
    stepRunners: {
      runGoogleAdkStep: async (): Promise<TutorialStepResult> => {
        executionOrder.push("google");
        return {
          stepId: "step-1",
          library: "google-adk",
          status: "completed",
          message: "google ok",
        };
      },
      runLangChainStep: async (): Promise<TutorialStepResult> => {
        executionOrder.push("langchain");
        throw new Error("langchain broken");
      },
      runOpenAIAgentsStep: async (): Promise<TutorialStepResult> => {
        executionOrder.push("openai");
        return {
          stepId: "step-3",
          library: "openai-agents",
          status: "completed",
          message: "openai ok",
        };
      },
    },
  });

  assert.deepEqual(executionOrder, ["google", "langchain", "openai"]);
  assert.equal(result.steps[1].status, "failed");
  assert.match(result.steps[1].message, /langchain broken/);
  assert.equal(result.steps[2].status, "completed");
});

test("runTutorial executes only selected steps when targetLibraries is provided", async (): Promise<void> => {
  const executionOrder: Array<string> = [];
  const result: RunTutorialResult = await runTutorial({
    targetLibraries: ["langchain"],
    stepRunners: {
      runGoogleAdkStep: async (): Promise<TutorialStepResult> => {
        executionOrder.push("google");
        return {
          stepId: "step-1",
          library: "google-adk",
          status: "completed",
          message: "google ok",
        };
      },
      runLangChainStep: async (): Promise<TutorialStepResult> => {
        executionOrder.push("langchain");
        return {
          stepId: "step-2",
          library: "langchain",
          status: "completed",
          message: "langchain ok",
        };
      },
      runOpenAIAgentsStep: async (): Promise<TutorialStepResult> => {
        executionOrder.push("openai");
        return {
          stepId: "step-3",
          library: "openai-agents",
          status: "completed",
          message: "openai ok",
        };
      },
    },
  });

  assert.deepEqual(executionOrder, ["langchain"]);
  assert.equal(result.steps.length, 1);
  assert.equal(result.steps[0].library, "langchain");
});

test("step tutorials skip when api keys are unavailable", async (): Promise<void> => {
  const originalGeminiApiKey: string | undefined = process.env.GEMINI_API_KEY;
  const originalGoogleApiKey: string | undefined = process.env.GOOGLE_API_KEY;
  const originalOpenAiApiKey: string | undefined = process.env.OPENAI_API_KEY;
  const originalSyntheticApiKey: string | undefined = process.env.SYNTHETIC_API_KEY;

  delete process.env.GEMINI_API_KEY;
  delete process.env.GOOGLE_API_KEY;
  delete process.env.OPENAI_API_KEY;
  delete process.env.SYNTHETIC_API_KEY;

  try {
    const googleStepResult: TutorialStepResult = await runGoogleAdkStep((): void => {
      return;
    });
    const langchainStepResult: TutorialStepResult = await runLangChainStep((): void => {
      return;
    });
    const openAiStepResult: TutorialStepResult = await runOpenAIAgentsStep((): void => {
      return;
    });

    assert.equal(googleStepResult.status, "skipped");
    assert.equal(langchainStepResult.status, "skipped");
    assert.equal(openAiStepResult.status, "skipped");
  } finally {
    if (originalGeminiApiKey === undefined) {
      delete process.env.GEMINI_API_KEY;
    } else {
      process.env.GEMINI_API_KEY = originalGeminiApiKey;
    }

    if (originalGoogleApiKey === undefined) {
      delete process.env.GOOGLE_API_KEY;
    } else {
      process.env.GOOGLE_API_KEY = originalGoogleApiKey;
    }

    if (originalOpenAiApiKey === undefined) {
      delete process.env.OPENAI_API_KEY;
    } else {
      process.env.OPENAI_API_KEY = originalOpenAiApiKey;
    }

    if (originalSyntheticApiKey === undefined) {
      delete process.env.SYNTHETIC_API_KEY;
    } else {
      process.env.SYNTHETIC_API_KEY = originalSyntheticApiKey;
    }
  }
});

test("isDirectExecution returns true only for current script", (): void => {
  const scriptPath: string = resolve("/tmp/tutorial.ts");
  const moduleUrl: string = pathToFileURL(scriptPath).href;

  assert.equal(isDirectExecution(moduleUrl, ["node", scriptPath]), true);
  assert.equal(isDirectExecution(moduleUrl, ["node", "/tmp/another.ts"]), false);
  assert.equal(isDirectExecution(moduleUrl, ["node"]), false);
});
