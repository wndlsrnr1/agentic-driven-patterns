/**
 * Run:
 * cd modules && node --experimental-strip-types ./paralleization/tutorial.openai-agents.ts
 *
 * 학습 목표:
 * 1) OpenAIProvider/Runner 기본 연결 구조 이해
 * 2) 역할이 다른 Agent를 분리해 구성하는 방법 학습
 * 3) Promise.all로 병렬 실행 후 결과를 구조화하는 방법 학습
 */
import {
  Agent,
  OpenAIProvider,
  Runner,
  setDefaultOpenAIKey,
  setOpenAIAPI,
} from "@openai/agents";

import { isDirectExecution } from "./tutorial.execution.ts";
import { type Logger, type TutorialStepResult } from "./tutorial.types.ts";

const STEP_ID: string = "step-3-openai-agents";
const LIBRARY: "openai-agents" = "openai-agents";
const OPENAI_MODEL: string = "gpt-4o-mini";
const SYNTHETIC_MODEL: string = "hf:moonshotai/Kimi-K2.5";
const SYNTHETIC_BASE_URL: string = "https://api.synthetic.new/openai/v1";

type ProviderConfig = {
  apiKey: string;
  modelName: string;
  baseUrl?: string;
};

/**
 * step 실행 결과를 동일 스키마로 맞춰 인덱스 튜토리얼에서 재사용합니다.
 */
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
 * SDK 반환 타입이 문자열/객체로 달라도
 * 튜토리얼 출력은 사람이 읽기 쉬운 문자열 형태로 통일합니다.
 */
function toText(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  return JSON.stringify(value, null, 2);
}

/**
 * OpenAI Agents SDK 결과에서 핵심 출력(finalOutput)을 안전하게 추출합니다.
 */
function extractOutput(agentResult: unknown): string {
  if (typeof agentResult !== "object" || agentResult === null) {
    return toText(agentResult);
  }

  if (!("finalOutput" in agentResult)) {
    return toText(agentResult);
  }

  const finalOutput: unknown = (agentResult as { finalOutput: unknown })
    .finalOutput;
  return toText(finalOutput);
}

/**
 * 키 입력은 최소화합니다.
 * - OPENAI_API_KEY가 있으면 OpenAI 기본 경로
 * - 없으면 SYNTHETIC_API_KEY + 고정 base URL 경로
 */
function resolveProviderConfig(): ProviderConfig | undefined {
  const openAiApiKey: string | undefined = process.env.OPENAI_API_KEY?.trim();
  if (openAiApiKey) {
    return {
      apiKey: openAiApiKey,
      modelName: OPENAI_MODEL,
    };
  }

  const syntheticApiKey: string | undefined = process.env.SYNTHETIC_API_KEY?.trim();
  if (syntheticApiKey) {
    return {
      apiKey: syntheticApiKey,
      modelName: SYNTHETIC_MODEL,
      baseUrl: SYNTHETIC_BASE_URL,
    };
  }

  return undefined;
}

/**
 * 모든 튜토리얼이 같은 STEP 로그 형태를 유지하면
 * 라이브러리별 학습 비교가 쉬워집니다.
 */
function logStep(log: Logger, stepNo: number, title: string): void {
  log(`[openai-agents] STEP ${stepNo}/3 ${title}`);
}

export async function runOpenAIAgentsStep(
  log: Logger = console.log,
): Promise<TutorialStepResult> {
  // Step 1) 실행 준비
  logStep(log, 1, "setup");
  const providerConfig: ProviderConfig | undefined = resolveProviderConfig();
  if (!providerConfig) {
    return toStepResult(
      "skipped",
      "OPENAI_API_KEY or SYNTHETIC_API_KEY is missing.",
    );
  }

  // Step 2) Provider/Runner/Agent 구성
  logStep(log, 2, "build two specialist agents");
  const provider: OpenAIProvider = new OpenAIProvider({
    apiKey: providerConfig.apiKey,
    baseURL: providerConfig.baseUrl,
    useResponses: false,
  });

  setDefaultOpenAIKey(providerConfig.apiKey);
  setOpenAIAPI("chat_completions");

  const runner: Runner = new Runner({
    modelProvider: provider,
    tracingDisabled: true,
  });

  const biologyAgent: Agent = new Agent({
    name: "BiologyExpert",
    model: providerConfig.modelName,
    instructions:
      "You are a biology expert. Summarize CRISPR technology in one sentence.",
  });
  const chemistryAgent: Agent = new Agent({
    name: "ChemistryExpert",
    model: providerConfig.modelName,
    instructions:
      "You are a chemistry expert. Summarize solid-state batteries in one sentence.",
  });

  // Step 3) 병렬 실행 + 출력 병합
  logStep(log, 3, "execute in parallel with Promise.all");
  const [biologyResult, chemistryResult]: [unknown, unknown] =
    await Promise.all([
      runner.run(biologyAgent, "Provide your summary.", { maxTurns: 3 }),
      runner.run(chemistryAgent, "Provide your summary.", { maxTurns: 3 }),
    ]);

  const output: string = JSON.stringify(
    {
      biology: extractOutput(biologyResult),
      chemistry: extractOutput(chemistryResult),
    },
    null,
    2,
  );

  return toStepResult(
    "completed",
    "OpenAI Agents tutorial completed.",
    output,
  );
}

const isNodeTestContext: boolean = process.env.NODE_TEST_CONTEXT !== undefined;
if (!isNodeTestContext && isDirectExecution(import.meta.url, process.argv)) {
  void runOpenAIAgentsStep().then((result: TutorialStepResult): void => {
    console.log(JSON.stringify(result, null, 2));
  }).catch((error: unknown): void => {
    const errorMessage: string =
      error instanceof Error ? error.message : String(error);
    console.error(errorMessage);
    process.exitCode = 1;
  });
}
