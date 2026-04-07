/**
 * Run:
 * node --env-file=.env --experimental-strip-types ./06-planning-patterns/planning-pattern-openai.ts
 */

// 이 lesson은 "먼저 계획을 만들고, 그 계획을 기준으로 결과를 쓴다"는 흐름을 보여줍니다.
// 핵심은 agent 수가 아니라, 중간 산출물인 `plan`이 다음 단계 입력 계약이 된다는 점입니다.
import {
  Agent,
  OpenAIProvider,
  Runner,
  setDefaultOpenAIKey,
  setOpenAIAPI,
} from "@openai/agents";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const DEFAULT_BASE_URL: string = "https://api.z.ai/api/coding/paas/v4";
const DEFAULT_MODEL: string = "glm-5.1";
const DEFAULT_TOPIC: string = "The importance of Reinforcement Learning in AI";

export type RuntimeConfig = {
  apiKey: string;
  baseUrl: string;
  modelName: string;
};

export type PlanningPatternResult = {
  topic: string;
  plan: string;
  summary: string;
  modelName: string;
};

export type PlanningPatternExecutor = (
  config: RuntimeConfig,
  topic: string,
) => Promise<PlanningPatternResult>;

export type RunPlanningPatternOptions = {
  runtimeConfig?: RuntimeConfig;
  topic?: string;
  executor?: PlanningPatternExecutor;
};

export function buildRuntimeConfig(
  env: NodeJS.ProcessEnv = process.env,
): RuntimeConfig {
  // 실행 설정을 먼저 분리해 두면, agent 로직이 환경 변수 파싱 책임까지 떠안지 않습니다.
  // 이 단계는 Runtime Layer에 해당하며, 이후 흐름은 이 설정만 믿고 내려갑니다.
  const apiKey: string | undefined = env.API_KEY?.trim();
  if (!apiKey) {
    throw new Error("API_KEY is missing.");
  }

  const config: RuntimeConfig = {
    apiKey,
    baseUrl: env.BASE_URL?.trim() || DEFAULT_BASE_URL,
    modelName: env.MODEL?.trim() || DEFAULT_MODEL,
  };
  return config;
}

export function formatFinalReport(result: PlanningPatternResult): string {
  // lesson의 마지막 단계는 사람이 읽기 쉬운 형태로 바꾸는 일입니다.
  // 여기서는 JSON 대신 Plan / Summary 두 덩어리로 보여 줘 계획과 결과를 분리합니다.
  const report: string = [
    `Topic: ${result.topic}`,
    "",
    "### Plan",
    result.plan,
    "",
    "### Summary",
    result.summary,
  ].join("\n");

  return report;
}

export async function runPlanningPattern(
  options: RunPlanningPatternOptions = {},
): Promise<PlanningPatternResult> {
  // 이 함수가 lesson의 본체입니다.
  // top-down으로 보면 "설정 읽기 -> planner 실행 -> writer 실행 -> 결과 반환" 순서입니다.
  const config: RuntimeConfig =
    options.runtimeConfig ?? buildRuntimeConfig(process.env);
  const topic: string = options.topic?.trim() || DEFAULT_TOPIC;

  if (options.executor) {
    const injectedResult: PlanningPatternResult = await options.executor(
      config,
      topic,
    );

    if (injectedResult.summary.trim().length === 0) {
      throw new Error("OpenAI planning pattern completed without a text summary.");
    }

    return injectedResult;
  }

  const provider: OpenAIProvider = new OpenAIProvider({
    apiKey: config.apiKey,
    baseURL: config.baseUrl,
    useResponses: false,
  });
  setDefaultOpenAIKey(config.apiKey);
  setOpenAIAPI("chat_completions");

  const runner: Runner = new Runner({
    modelProvider: provider,
    tracingDisabled: true,
  });

  // Planner는 주제를 어떤 순서로 다룰지 정리하는 역할만 맡습니다.
  // summary까지 쓰지 않게 제한해야 planning pattern의 초점이 흐려지지 않습니다.
  const plannerAgent: Agent = new Agent({
    name: "PlannerAgent",
    model: config.modelName,
    instructions: [
      "You are a planning specialist.",
      "Create a bullet-point plan with 3 to 5 points.",
      "Focus on the most important ideas needed for a concise technical summary.",
      "Output only the plan.",
    ].join("\n"),
  });

  // Writer는 planner가 만든 구조를 받아 최종 문장으로 풀어쓰는 역할입니다.
  // 즉, 이 lesson은 "두 agent가 협업한다"보다 "plan을 소비하는 단계가 분리된다"가 핵심입니다.
  const writerAgent: Agent = new Agent({
    name: "WriterAgent",
    model: config.modelName,
    instructions: [
      "You are a concise technical writer.",
      "Write a summary of around 200 words.",
      "Use the provided plan as the structure.",
      "Do not introduce unrelated sections.",
      "Output only the final summary.",
    ].join("\n"),
  });

  // 첫 번째 실행은 plan을 만드는 단계입니다.
  // 결과 타입을 단정하지 않고 문자열로 정규화해 두면, 다음 단계 입력 계약이 안정적입니다.
  const plannerRunResult: { finalOutput: unknown } = (await runner.run(
    plannerAgent,
    [
      `Topic: ${topic}`,
      "Create a bullet-point plan for a concise, engaging summary.",
      "Keep the plan short and practical.",
    ].join("\n"),
    { maxTurns: 6 },
  )) as { finalOutput: unknown };

  const plan: string =
    typeof plannerRunResult.finalOutput === "string"
      ? plannerRunResult.finalOutput.trim()
      : JSON.stringify(plannerRunResult.finalOutput, null, 2).trim();

  // 두 번째 실행은 writer가 실제 결과를 쓰는 단계입니다.
  // writer는 독립적으로 쓰는 것이 아니라, 방금 만든 `plan`을 구조로 받아 사용합니다.
  const writerRunResult: { finalOutput: unknown } = (await runner.run(
    writerAgent,
    [
      `Topic: ${topic}`,
      "Use the provided plan as the structure.",
      `Plan:\n${plan}`,
      "Write the final summary now.",
    ].join("\n\n"),
    { maxTurns: 6 },
  )) as { finalOutput: unknown };

  const summary: string =
    typeof writerRunResult.finalOutput === "string"
      ? writerRunResult.finalOutput.trim()
      : JSON.stringify(writerRunResult.finalOutput, null, 2).trim();

  if (summary.length === 0) {
    throw new Error("OpenAI planning pattern completed without a text summary.");
  }

  const result: PlanningPatternResult = {
    topic,
    plan,
    summary,
    modelName: config.modelName,
  };
  return result;
}

const isNodeTestContext: boolean = process.env.NODE_TEST_CONTEXT !== undefined;
const cliPath: string | undefined = process.argv[1];
if (!isNodeTestContext && cliPath) {
  // 파일 하나가 학습용 예제이면서 테스트 가능한 모듈 역할도 같이 하도록
  // 직접 실행된 경우에만 CLI 출력을 만들고, import 시에는 조용히 남겨 둡니다.
  const cliUrl: string = pathToFileURL(resolve(process.cwd(), cliPath)).href;
  if (cliUrl === import.meta.url) {
    void runPlanningPattern()
      .then((result: PlanningPatternResult): void => {
        console.log("## Running the planning and writing task ##");
        console.log("");
        console.log("---");
        console.log("## Task Result ##");
        console.log("---");
        console.log(formatFinalReport(result));
      })
      .catch((error: unknown): void => {
        const message: string = error instanceof Error ? error.message : String(error);
        console.error(message);
        process.exitCode = 1;
      });
  }
}
