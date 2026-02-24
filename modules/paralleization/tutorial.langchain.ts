/**
 * Run:
 * cd modules && node --experimental-strip-types ./paralleization/tutorial.langchain.ts
 *
 * 학습 목표:
 * 1) LangChain LCEL에서 프롬프트/모델/파서를 조합하는 방법
 * 2) RunnableMap으로 여러 체인을 병렬로 실행하는 방법
 * 3) 병렬 결과를 한 번에 수집해 구조화된 출력으로 다루는 방법
 */
import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { RunnableMap } from "@langchain/core/runnables";
import { ChatOpenAI } from "@langchain/openai";

import { isDirectExecution } from "./tutorial.execution.ts";
import { type Logger, type TutorialStepResult } from "./tutorial.types.ts";

const STEP_ID: string = "step-2-langchain";
const LIBRARY: "langchain" = "langchain";
const OPENAI_MODEL: string = "gpt-4o-mini";
const SYNTHETIC_MODEL: string = "hf:moonshotai/Kimi-K2.5";
const SYNTHETIC_BASE_URL: string = "https://api.synthetic.new/openai/v1";
const TUTORIAL_TOPIC: string = "Artificial Intelligence in Healthcare";

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
 * STEP 로그를 고정 형식으로 통일하면
 * ADK/OpenAI 튜토리얼과 같은 시선으로 비교 학습할 수 있습니다.
 */
function logStep(log: Logger, stepNo: number, title: string): void {
  log(`[langchain] STEP ${stepNo}/3 ${title}`);
}

type ModelConfig = {
  apiKey: string;
  modelName: string;
  baseUrl?: string;
};

function resolveModelConfig(): ModelConfig | undefined {
  // 우선순위 1: OPENAI_API_KEY (OpenAI 기본 경로)
  const openAiApiKey: string | undefined = process.env.OPENAI_API_KEY?.trim();
  if (openAiApiKey) {
    return {
      apiKey: openAiApiKey,
      modelName: OPENAI_MODEL,
    };
  }

  // 우선순위 2: SYNTHETIC_API_KEY (OpenAI 호환 엔드포인트 경로)
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

export async function runLangChainStep(
  log: Logger = console.log,
): Promise<TutorialStepResult> {
  // Step 1) 실행 준비: 모델/키 구성
  logStep(log, 1, "setup");
  const modelConfig: ModelConfig | undefined = resolveModelConfig();
  if (!modelConfig) {
    return toStepResult(
      "skipped",
      "OPENAI_API_KEY or SYNTHETIC_API_KEY is missing.",
    );
  }

  const model: ChatOpenAI = new ChatOpenAI({
    apiKey: modelConfig.apiKey,
    model: modelConfig.modelName,
    temperature: 0.2,
    configuration: modelConfig.baseUrl
      ? {
          baseURL: modelConfig.baseUrl,
        }
      : undefined,
  });

  // Step 2) 병렬 체인 구성
  // LCEL의 핵심: "프롬프트 -> 모델 -> 파서"를 파이프로 연결해 단일 runnable로 만든다.
  logStep(log, 2, "build parallel chains");
  const parser: StringOutputParser = new StringOutputParser();
  const summaryPrompt: ReturnType<typeof ChatPromptTemplate.fromMessages> =
    ChatPromptTemplate.fromMessages([
      ["system", "Summarize the following topic in one sentence."],
      ["user", "{topic}"],
    ]);
  const questionsPrompt: ReturnType<typeof ChatPromptTemplate.fromMessages> =
    ChatPromptTemplate.fromMessages([
      ["system", "Generate two interesting questions for this topic."],
      ["user", "{topic}"],
    ]);
  const keywordsPrompt: ReturnType<typeof ChatPromptTemplate.fromMessages> =
    ChatPromptTemplate.fromMessages([
      ["system", "Extract three key terms as comma-separated text."],
      ["user", "{topic}"],
    ]);

  const parallelMap: RunnableMap<
    {
      topic: string;
    },
    {
      summary: string;
      questions: string;
      keywords: string;
    }
  > = RunnableMap.from({
    // 세 체인이 같은 입력(topic)을 받아 동시에 실행된다.
    summary: summaryPrompt.pipe(model).pipe(parser),
    questions: questionsPrompt.pipe(model).pipe(parser),
    keywords: keywordsPrompt.pipe(model).pipe(parser),
  });

  // Step 3) 병렬 실행 결과 수집
  logStep(log, 3, "execute parallel map");
  const result: {
    summary: string;
    questions: string;
    keywords: string;
  } = await parallelMap.invoke({
    topic: TUTORIAL_TOPIC,
  });

  const output: string = JSON.stringify(result, null, 2);
  return toStepResult("completed", "LangChain tutorial completed.", output);
}

const isNodeTestContext: boolean = process.env.NODE_TEST_CONTEXT !== undefined;
if (!isNodeTestContext && isDirectExecution(import.meta.url, process.argv)) {
  void runLangChainStep().then((result: TutorialStepResult): void => {
    console.log(JSON.stringify(result, null, 2));
  }).catch((error: unknown): void => {
    const errorMessage: string =
      error instanceof Error ? error.message : String(error);
    console.error(errorMessage);
    process.exitCode = 1;
  });
}
