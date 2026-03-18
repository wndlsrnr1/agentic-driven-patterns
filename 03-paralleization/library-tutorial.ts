/**
 * Run:
 * node --env-file=.env.modules --experimental-strip-types ./03-paralleization/library-tutorial.ts
 */
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import {
  resolveGoogleConfig,
  runGoogleWorkflow,
  type GoogleWorkflowResult,
} from "./paralleization_google.ts";
import {
  resolveLangchainConfig,
  runLangchainWorkflow,
  type LangchainConfig,
  type LangchainWorkflowResult,
} from "./parallelization_langchain.ts";
import {
  resolveOpenAIConfig,
  runOpenAIWorkflow,
  type OpenAIWorkflowResult,
} from "./parallelization_openai.ts";

export type TutorialStepResult = {
  library: "google-adk" | "langchain" | "openai-agents";
  status: "completed" | "failed";
  message: string;
  output?: string;
};

export type LibraryTutorialResult = {
  steps: Array<TutorialStepResult>;
};

export async function runLibraryTutorial(): Promise<LibraryTutorialResult> {
  const steps: Array<TutorialStepResult> = [];

  try {
    const googleResult: GoogleWorkflowResult = await runGoogleWorkflow(
      resolveGoogleConfig(process.env),
    );
    const googleStep: TutorialStepResult = {
      library: "google-adk",
      status: "completed",
      message: "Google ADK workflow completed.",
      output: googleResult.report,
    };
    steps.push(googleStep);
  } catch (error: unknown) {
    const googleErrorMessage: string =
      error instanceof Error ? error.message : String(error);
    const googleStep: TutorialStepResult = {
      library: "google-adk",
      status: "failed",
      message: googleErrorMessage,
    };
    steps.push(googleStep);
  }

  try {
    const langchainConfig: LangchainConfig = resolveLangchainConfig(process.env);
    const langchainResult: LangchainWorkflowResult = await runLangchainWorkflow(
      langchainConfig,
      langchainConfig.topic,
    );
    const langchainStep: TutorialStepResult = {
      library: "langchain",
      status: "completed",
      message: "LangChain workflow completed.",
      output: langchainResult.finalResponse,
    };
    steps.push(langchainStep);
  } catch (error: unknown) {
    const langchainErrorMessage: string =
      error instanceof Error ? error.message : String(error);
    const langchainStep: TutorialStepResult = {
      library: "langchain",
      status: "failed",
      message: langchainErrorMessage,
    };
    steps.push(langchainStep);
  }

  try {
    const openAiResult: OpenAIWorkflowResult = await runOpenAIWorkflow(
      resolveOpenAIConfig(process.env),
    );
    const openAiStep: TutorialStepResult = {
      library: "openai-agents",
      status: "completed",
      message: "OpenAI workflow completed.",
      output: openAiResult.mergedReport,
    };
    steps.push(openAiStep);
  } catch (error: unknown) {
    const openAiErrorMessage: string =
      error instanceof Error ? error.message : String(error);
    const openAiStep: TutorialStepResult = {
      library: "openai-agents",
      status: "failed",
      message: openAiErrorMessage,
    };
    steps.push(openAiStep);
  }

  const result: LibraryTutorialResult = {
    steps,
  };
  return result;
}

const isNodeTestContext: boolean = process.env.NODE_TEST_CONTEXT !== undefined;
const cliPath: string | undefined = process.argv[1];
if (!isNodeTestContext && cliPath) {
  const cliUrl: string = pathToFileURL(resolve(process.cwd(), cliPath)).href;
  if (cliUrl === import.meta.url) {
    void runLibraryTutorial()
      .then((result: LibraryTutorialResult): void => {
        console.log(JSON.stringify(result, null, 2));
      })
      .catch((error: unknown): void => {
        const errorMessage: string =
          error instanceof Error ? error.message : String(error);
        console.error(errorMessage);
        process.exitCode = 1;
      });
  }
}
