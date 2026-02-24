/**
 * Run:
 * cd modules && node --experimental-strip-types ./paralleization/tutorial.google-adk.ts
 *
 * 학습 목표:
 * 1) Google ADK에서 LlmAgent를 만드는 방법
 * 2) ParallelAgent로 독립 작업을 병렬 실행하는 방법
 * 3) SequentialAgent로 병렬 결과를 후속 에이전트가 이어받는 방법
 */
import {
  Gemini,
  InMemoryRunner,
  LlmAgent,
  ParallelAgent,
  SequentialAgent,
  stringifyContent,
  type Event,
} from "@google/adk";
import { createUserContent, type Content } from "@google/genai";

import { isDirectExecution } from "./tutorial.execution.ts";
import { type Logger, type TutorialStepResult } from "./tutorial.types.ts";

const STEP_ID: string = "step-1-google-adk";
const LIBRARY: "google-adk" = "google-adk";
const MODEL_NAME: string = "gemini-2.0-flash";
const TUTORIAL_TOPIC: string = "Artificial Intelligence in Healthcare";
const APP_NAME: string = "parallelization-tutorial-adk";
const USER_ID: string = "parallelization-tutorial-user";

function toStepResult(
  status: TutorialStepResult["status"],
  message: string,
  output?: string,
): TutorialStepResult {
  const result: TutorialStepResult = {
    stepId: STEP_ID,
    library: LIBRARY,
    status,
    message,
    output,
  };
  return result;
}

/**
 * 이 튜토리얼은 "실행 편의"보다 "학습 선명도"를 우선합니다.
 * 그래서 환경변수는 비밀키 주입 경로만 최소 사용합니다.
 */
function resolveApiKey(): string | undefined {
  const geminiApiKey: string | undefined = process.env.GEMINI_API_KEY?.trim();
  if (geminiApiKey) {
    return geminiApiKey;
  }

  const googleApiKey: string | undefined = process.env.GOOGLE_API_KEY?.trim();
  if (googleApiKey) {
    return googleApiKey;
  }

  return undefined;
}

/**
 * 모든 튜토리얼 파일이 같은 STEP 로그 형식을 쓰면
 * 라이브러리를 바꿔가며 비교 학습하기 쉬워집니다.
 */
function logStep(log: Logger, stepNo: number, title: string): void {
  log(`[google-adk] STEP ${stepNo}/3 ${title}`);
}

export async function runGoogleAdkStep(
  log: Logger = console.log,
): Promise<TutorialStepResult> {
  // Step 1) 실행 준비: 필수 키 확인
  logStep(log, 1, "setup");
  const apiKey: string | undefined = resolveApiKey();
  if (!apiKey) {
    return toStepResult(
      "skipped",
      "GEMINI_API_KEY or GOOGLE_API_KEY is missing.",
    );
  }

  // Step 2) 병렬 파이프라인 조립: "역할 분리된 에이전트"를 선언적으로 구성
  logStep(log, 2, "build parallel workflow");
  const model: Gemini = new Gemini({
    model: MODEL_NAME,
    apiKey,
  });

  // 기술 관점 요약 담당 에이전트
  const techResearcher: LlmAgent = new LlmAgent({
    name: "TechResearcher",
    model,
    instruction: [
      "Research the technology advances of the topic.",
      "Summarize in exactly one sentence.",
      `Topic: ${TUTORIAL_TOPIC}`,
    ].join("\n"),
  });

  // 시장 관점 요약 담당 에이전트
  const marketResearcher: LlmAgent = new LlmAgent({
    name: "MarketResearcher",
    model,
    instruction: [
      "Research the market impact of the topic.",
      "Summarize in exactly one sentence.",
      `Topic: ${TUTORIAL_TOPIC}`,
    ].join("\n"),
  });

  // 핵심 포인트: 두 리서처를 동시에 돌리는 병렬 블록
  const parallelResearcher: ParallelAgent = new ParallelAgent({
    name: "ParallelResearchers",
    subAgents: [techResearcher, marketResearcher],
  });

  // 병렬 결과를 사람이 읽기 좋은 단일 보고서로 합치는 후속 에이전트
  const synthesisAgent: LlmAgent = new LlmAgent({
    name: "SynthesisAgent",
    model,
    instruction: "Combine the two summaries into a concise markdown report.",
  });

  // 전체 흐름: [병렬 조사] -> [최종 합성]
  const workflow: SequentialAgent = new SequentialAgent({
    name: "AdkParallelTutorialWorkflow",
    subAgents: [parallelResearcher, synthesisAgent],
  });

  // Step 3) 실행 및 출력 수집
  logStep(log, 3, "execute and collect output");
  const runner: InMemoryRunner = new InMemoryRunner({
    agent: workflow,
    appName: APP_NAME,
  });
  const session: { id: string } = await runner.sessionService.createSession({
    appName: APP_NAME,
    userId: USER_ID,
  });

  const userMessage: Content = createUserContent(
    `Create a short report for: ${TUTORIAL_TOPIC}`,
  );
  const events: Array<Event> = [];

  for await (const event of runner.runAsync({
    userId: USER_ID,
    sessionId: session.id,
    newMessage: userMessage,
  })) {
    events.push(event);
  }

  // 마지막 이벤트부터 역순으로 확인해 "최종 텍스트 응답"을 우선 추출
  let output: string = "No ADK text output was produced.";
  for (let index: number = events.length - 1; index >= 0; index -= 1) {
    const text: string = stringifyContent(events[index]).trim();
    if (text.length > 0) {
      output = text;
      break;
    }
  }

  return toStepResult(
    "completed",
    "Google ADK tutorial completed.",
    output,
  );
}

const isNodeTestContext: boolean = process.env.NODE_TEST_CONTEXT !== undefined;
if (!isNodeTestContext && isDirectExecution(import.meta.url, process.argv)) {
  void runGoogleAdkStep().then((result: TutorialStepResult): void => {
    console.log(JSON.stringify(result, null, 2));
  }).catch((error: unknown): void => {
    const errorMessage: string =
      error instanceof Error ? error.message : String(error);
    console.error(errorMessage);
    process.exitCode = 1;
  });
}
