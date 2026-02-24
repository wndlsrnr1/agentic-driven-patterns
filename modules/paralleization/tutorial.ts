/**
 * Run:
 * cd modules && node --experimental-strip-types ./paralleization/tutorial.ts
 *
 * 튜토리얼 개요:
 * - 이 파일은 각 라이브러리 튜토리얼(ADK/LangChain/OpenAI Agents)을
 *   순서대로 실행하는 "인덱스 오케스트레이터"입니다.
 * - 실제 학습 코드는 각 step 파일에 있고, 여기서는 실행 순서/실패 격리/결과 집계만 담당합니다.
 */
import { isDirectExecution } from "./tutorial.execution.ts";
import { runGoogleAdkStep } from "./tutorial.google-adk.ts";
import { runLangChainStep } from "./tutorial.langchain.ts";
import { runOpenAIAgentsStep } from "./tutorial.openai-agents.ts";
import {
  type Logger,
  type RunTutorialInput,
  type RunTutorialResult,
  type StepPlan,
  type TutorialLibrary,
  type TutorialStepResult,
  type TutorialStepRunners,
} from "./tutorial.types.ts";

export {
  isDirectExecution,
  runGoogleAdkStep,
  runLangChainStep,
  runOpenAIAgentsStep,
};
export type {
  Logger,
  RunTutorialInput,
  RunTutorialResult,
  TutorialLibrary,
  TutorialStepResult,
  TutorialStepRunners,
};

const ADK_STEP_ID: string = "step-1-google-adk";
const LANGCHAIN_STEP_ID: string = "step-2-langchain";
const OPENAI_AGENTS_STEP_ID: string = "step-3-openai-agents";

/**
 * 개별 step 실행이 실패해도 전체 튜토리얼은 이어서 학습할 수 있도록
 * 예외를 구조화된 failed 결과로 변환합니다.
 */
function toFailedStepResult(
  stepPlan: StepPlan,
  error: unknown,
): TutorialStepResult {
  const errorMessage: string =
    error instanceof Error ? error.message : String(error);

  const failedStepResult: TutorialStepResult = {
    stepId: stepPlan.stepId,
    library: stepPlan.library,
    status: "failed",
    message: errorMessage,
  };
  return failedStepResult;
}

/**
 * 학습 순서(ADK -> LangChain -> OpenAI Agents)를 SSOT로 유지합니다.
 */
function buildStepPlans(runners: TutorialStepRunners): Array<StepPlan> {
  const stepPlans: Array<StepPlan> = [
    {
      stepId: ADK_STEP_ID,
      library: "google-adk",
      runner: runners.runGoogleAdkStep,
    },
    {
      stepId: LANGCHAIN_STEP_ID,
      library: "langchain",
      runner: runners.runLangChainStep,
    },
    {
      stepId: OPENAI_AGENTS_STEP_ID,
      library: "openai-agents",
      runner: runners.runOpenAIAgentsStep,
    },
  ];
  return stepPlans;
}

/**
 * 테스트/실행 상황에 따라 step runner를 교체할 수 있도록 주입 지점을 제공합니다.
 */
function buildRuntimeRunners(input: RunTutorialInput): TutorialStepRunners {
  const defaultRunners: TutorialStepRunners = {
    runGoogleAdkStep,
    runLangChainStep,
    runOpenAIAgentsStep,
  };

  const runtimeRunners: TutorialStepRunners = {
    runGoogleAdkStep:
      input.stepRunners?.runGoogleAdkStep ?? defaultRunners.runGoogleAdkStep,
    runLangChainStep:
      input.stepRunners?.runLangChainStep ?? defaultRunners.runLangChainStep,
    runOpenAIAgentsStep:
      input.stepRunners?.runOpenAIAgentsStep ??
      defaultRunners.runOpenAIAgentsStep,
  };
  return runtimeRunners;
}

/**
 * 특정 라이브러리만 선택 학습하고 싶을 때 대상 step만 필터링합니다.
 */
function selectStepPlans(
  stepPlans: Array<StepPlan>,
  targetLibraries: ReadonlyArray<TutorialLibrary> | undefined,
): Array<StepPlan> {
  if (!targetLibraries || targetLibraries.length === 0) {
    return stepPlans;
  }

  const targetLibrarySet: ReadonlySet<TutorialLibrary> = new Set(targetLibraries);
  const selectedStepPlans: Array<StepPlan> = stepPlans.filter(
    (stepPlan: StepPlan): boolean => targetLibrarySet.has(stepPlan.library),
  );
  return selectedStepPlans;
}

export async function runTutorial(
  input: RunTutorialInput = {},
): Promise<RunTutorialResult> {
  // 시작 시각과 결과 버퍼를 먼저 고정해 실행 리포트를 일관되게 만듭니다.
  const logger: Logger = input.log ?? console.log;
  const startedAtIso: string = new Date().toISOString();
  const steps: Array<TutorialStepResult> = [];

  logger("[tutorial] start");
  if (input.targetLibraries && input.targetLibraries.length > 0) {
    logger(`[tutorial] targetLibraries: ${input.targetLibraries.join(", ")}`);
  }

  const runtimeRunners: TutorialStepRunners = buildRuntimeRunners(input);
  const stepPlans: Array<StepPlan> = selectStepPlans(
    buildStepPlans(runtimeRunners),
    input.targetLibraries,
  );

  // 각 step는 독립적으로 실행되며, 실패는 개별 결과로만 기록됩니다.
  for (const stepPlan of stepPlans) {
    logger(`[tutorial] step-start ${stepPlan.stepId}`);
    try {
      const stepResult: TutorialStepResult = await stepPlan.runner(logger);
      steps.push(stepResult);
      logger(
        `[tutorial] step-${stepResult.status} ${stepResult.stepId}: ${stepResult.message}`,
      );
    } catch (error: unknown) {
      const failedStepResult: TutorialStepResult = toFailedStepResult(
        stepPlan,
        error,
      );
      steps.push(failedStepResult);
      logger(
        `[tutorial] step-failed ${failedStepResult.stepId}: ${failedStepResult.message}`,
      );
    }
  }

  logger("[tutorial] completed");
  const completedAtIso: string = new Date().toISOString();

  const result: RunTutorialResult = {
    steps,
    startedAtIso,
    completedAtIso,
  };
  return result;
}

/**
 * CLI는 "실행 진입점" 역할만 수행합니다.
 * (옵션 파싱 없이 전체 튜토리얼을 그대로 실행)
 */
async function runFromCli(): Promise<void> {
  const result: RunTutorialResult = await runTutorial();
  console.log(JSON.stringify(result, null, 2));
}

const isNodeTestContext: boolean = process.env.NODE_TEST_CONTEXT !== undefined;
if (!isNodeTestContext && isDirectExecution(import.meta.url, process.argv)) {
  void runFromCli().catch((error: unknown): void => {
    const errorMessage: string =
      error instanceof Error ? error.message : String(error);
    console.error(errorMessage);
    process.exitCode = 1;
  });
}
