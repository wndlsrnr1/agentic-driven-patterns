/**
 * 튜토리얼 전 파일에서 공유하는 로깅 함수 타입입니다.
 */
export type Logger = (message: string) => void;

/**
 * 학습 대상 라이브러리 식별자.
 */
export type TutorialLibrary = "google-adk" | "langchain" | "openai-agents";
export type TutorialStepStatus = "completed" | "skipped" | "failed";

/**
 * 개별 step 실행 결과 계약.
 */
export type TutorialStepResult = {
  stepId: string;
  library: TutorialLibrary;
  status: TutorialStepStatus;
  message: string;
  output?: string;
};

/**
 * 전체 튜토리얼 실행 결과 계약.
 */
export type RunTutorialResult = {
  steps: Array<TutorialStepResult>;
  startedAtIso: string;
  completedAtIso: string;
};

/**
 * 하나의 step를 실행하는 함수 시그니처.
 */
export type TutorialStepRunner = (
  log: Logger,
) => Promise<TutorialStepResult>;

/**
 * step runner 집합. 테스트에서는 이 지점을 통해 동작을 대체합니다.
 */
export type TutorialStepRunners = {
  runGoogleAdkStep: TutorialStepRunner;
  runLangChainStep: TutorialStepRunner;
  runOpenAIAgentsStep: TutorialStepRunner;
};

/**
 * 인덱스 튜토리얼 실행 입력.
 */
export type RunTutorialInput = {
  log?: Logger;
  targetLibraries?: ReadonlyArray<TutorialLibrary>;
  stepRunners?: Partial<TutorialStepRunners>;
};

/**
 * 인덱스 튜토리얼 내부 실행 계획 타입.
 */
export type StepPlan = {
  stepId: string;
  library: TutorialLibrary;
  runner: TutorialStepRunner;
};
