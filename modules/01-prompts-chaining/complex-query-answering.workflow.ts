/**
 * Run:
 * cd modules && node --env-file=.env --experimental-strip-types ./prompts-chaining/complex-query-answering.workflow.ts
 */
import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatOpenAI } from "@langchain/openai";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const DEFAULT_BASE_URL: string = "https://api.synthetic.new/openai/v1";
const DEFAULT_MODEL: string = "hf:moonshotai/Kimi-K2.5";
const DEFAULT_QUESTION: string =
  "What were the main causes of the stock market crash in 1929, and how did government policy respond?";

/**
 * 복합 질의 응답 워크플로우 실행에 필요한 런타임 설정 계약이다.
 *
 * Context:
 * - 호출자: `buildRuntimeConfigFromEnv`, `runComplexQueryAnsweringWorkflow`.
 * - 사용 목적: 모델 호출 공통 설정을 일관되게 전달한다.
 */
export type RuntimeConfig = {
  apiKey: string;
  baseUrl: string;
  modelName: string;
};

/**
 * 복합 질의 응답 체인의 최종 산출물 계약이다.
 *
 * Context:
 * - 호출자: CLI 엔트리, 테스트 코드.
 * - 데이터 흐름: 원질문 -> 하위질문 -> 위키 조사 -> 합성 답변 결과를 단계별로 보존한다.
 */
export type RunComplexQueryAnsweringWorkflowResult = {
  originalQuestion: string;
  subQuestions: Array<string>;
  causeResearch: string;
  policyResearch: string;
  synthesizedAnswer: string;
  modelName: string;
};

type Logger = (message: string) => void;

type ComplexQueryWorkflowRunner = (
  question: string,
  runtimeConfig: RuntimeConfig,
) => Promise<RunComplexQueryAnsweringWorkflowResult>;

/**
 * 복합 질의 응답 워크플로우 공개 진입점 옵션 계약이다.
 *
 * Context:
 * - 호출자: CLI(`runFromCli`), 테스트(spec).
 * - 사용 목적: 질문/환경/로깅/러너를 주입해 실행 경로를 제어한다.
 */
export type RunComplexQueryAnsweringWorkflowInput = {
  question?: string;
  runtimeConfig?: RuntimeConfig;
  env?: NodeJS.ProcessEnv;
  log?: Logger;
  workflowRunner?: ComplexQueryWorkflowRunner;
};

type StringRunnable<TInput> = {
  invoke(input: TInput): Promise<string>;
};

type SubQuestionPayload = {
  sub_questions: Array<string>;
};

/**
 * 모델 응답의 Markdown 코드 펜스를 제거한다.
 *
 * @param modelText 모델 응답 원문.
 * @returns 코드 펜스가 제거된 텍스트.
 */
function removeCodeFence(modelText: string): string {
  const text: string = modelText.trim();
  const fenceMatch: RegExpMatchArray | null = text.match(
    /^```(?:json)?\s*([\s\S]*?)\s*```$/i,
  );
  return fenceMatch ? fenceMatch[1].trim() : text;
}

/**
 * 텍스트를 JSON 객체로 역직렬화한다.
 *
 * Context:
 * - 호출자: `runDefaultComplexQueryAnsweringWorkflow`.
 *
 * @param modelText JSON 또는 JSON code fence 텍스트.
 * @returns 지정 타입으로 파싱된 객체.
 */
function parseJsonObject<TValue>(modelText: string): TValue {
  return JSON.parse(removeCodeFence(modelText)) as TValue;
}

/**
 * LangChain OpenAI 클라이언트를 생성한다.
 *
 * Context:
 * - 호출자: `runDefaultComplexQueryAnsweringWorkflow`.
 * - Side effects: 이후 모델 호출 시 외부 네트워크 I/O가 발생한다.
 *
 * @param runtimeConfig API 인증 및 모델 설정.
 * @returns 구성된 `ChatOpenAI` 인스턴스.
 */
function buildModel(runtimeConfig: RuntimeConfig): ChatOpenAI {
  return new ChatOpenAI({
    apiKey: runtimeConfig.apiKey,
    model: runtimeConfig.modelName,
    temperature: 0,
    timeout: 180000,
    maxRetries: 1,
    configuration: {
      baseURL: runtimeConfig.baseUrl,
    },
  });
}

/**
 * 검색어를 기준으로 Wikipedia 요약을 조회한다.
 *
 * Context:
 * - 호출자: `runDefaultComplexQueryAnsweringWorkflow`.
 * - 데이터 흐름: 검색 API -> 첫 타이틀 결정 -> summary API 조회.
 *
 * Side effects:
 * - Wikipedia HTTP API를 호출한다.
 *
 * @param query 조사할 검색어.
 * @returns 페이지 요약 문자열.
 * @throws 검색/요약 API 실패 또는 빈 결과일 때 `Error`.
 */
async function fetchWikipediaSummaryByQuery(query: string): Promise<string> {
  const searchUrl: string = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&srlimit=1&format=json&origin=*`;

  const searchResponse: Response = await fetch(searchUrl);
  if (!searchResponse.ok) {
    throw new Error(
      `Wikipedia search failed (${searchResponse.status}) for query: ${query}`,
    );
  }

  const searchPayload: {
    query?: {
      search?: Array<{
        title?: string;
      }>;
    };
  } = (await searchResponse.json()) as {
    query?: {
      search?: Array<{
        title?: string;
      }>;
    };
  };

  const firstResultTitle: string | undefined =
    searchPayload.query?.search?.[0]?.title?.trim();
  if (!firstResultTitle) {
    throw new Error(`No Wikipedia page found for query: ${query}`);
  }

  const title: string = firstResultTitle;
  const summaryUrl: string = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
  const summaryResponse: Response = await fetch(summaryUrl);
  if (!summaryResponse.ok) {
    throw new Error(
      `Wikipedia summary failed (${summaryResponse.status}) for title: ${title}`,
    );
  }

  const summaryPayload: {
    extract?: string;
  } = (await summaryResponse.json()) as {
    extract?: string;
  };

  const extract: string = summaryPayload.extract?.trim() ?? "";
  if (extract.length === 0) {
    throw new Error(`Wikipedia returned empty summary for title: ${title}`);
  }

  return extract;
}

/**
 * 복합 질의를 하위 질문 분해, 외부 조사, 답변 합성 순서로 실행한다.
 *
 * Context:
 * - 호출자: `runComplexQueryAnsweringWorkflow` 기본 경로.
 * - 데이터 흐름: question -> subQuestionChain -> wikipedia research -> synthesisChain.
 *
 * @param question 사용자 원질문.
 * @param runtimeConfig 모델 실행 설정.
 * @returns 단계별 산출물을 포함한 최종 결과.
 * @throws 하위 질문이 2개 미만일 때 `Error`.
 */
async function runDefaultComplexQueryAnsweringWorkflow(
  question: string,
  runtimeConfig: RuntimeConfig,
): Promise<RunComplexQueryAnsweringWorkflowResult> {
  const model: ChatOpenAI = buildModel(runtimeConfig);
  const parser: StringOutputParser = new StringOutputParser();

  const subQuestionChain: StringRunnable<{ question: string }> =
    ChatPromptTemplate.fromTemplate(
      [
        "Break the user query into exactly two core sub-questions.",
        'Return strict JSON with shape: {{"sub_questions":["..."]}}.',
        "The first question must focus on causes. The second must focus on policy response.",
        "Do not include markdown fences.",
        "",
        "User query: {question}",
      ].join("\n"),
    )
      .pipe(model)
      .pipe(parser) as StringRunnable<{ question: string }>;

  const subQuestionRaw: string = await subQuestionChain.invoke({
    question,
  });

  const subQuestionPayload: SubQuestionPayload =
    parseJsonObject<SubQuestionPayload>(subQuestionRaw);
  const subQuestions: Array<string> = subQuestionPayload.sub_questions
    .map((subQuestion: string): string => subQuestion.trim())
    .filter((subQuestion: string): boolean => subQuestion.length > 0);

  if (subQuestions.length < 2) {
    throw new Error("Failed to generate at least two sub-questions.");
  }

  const causeQuestion: string = subQuestions[0];
  const policyQuestion: string = subQuestions[1];

  const [causeResearch, policyResearch]: [string, string] = await Promise.all([
    fetchWikipediaSummaryByQuery(causeQuestion),
    fetchWikipediaSummaryByQuery(policyQuestion),
  ]);

  const synthesisChain: StringRunnable<{
    original_question: string;
    cause_question: string;
    policy_question: string;
    cause_research: string;
    policy_research: string;
  }> = ChatPromptTemplate.fromTemplate(
    [
      "You are a historical research assistant.",
      "Synthesize a coherent answer to the original query using the provided research.",
      'Answer must have two sections: "Main Causes" and "Government Policy Response".',
      "",
      "Original Question: {original_question}",
      "Cause Question: {cause_question}",
      "Policy Question: {policy_question}",
      "",
      "Cause Research:\n{cause_research}",
      "",
      "Policy Research:\n{policy_research}",
    ].join("\n"),
  )
    .pipe(model)
    .pipe(parser) as StringRunnable<{
    original_question: string;
    cause_question: string;
    policy_question: string;
    cause_research: string;
    policy_research: string;
  }>;

  const synthesizedAnswer: string = await synthesisChain.invoke({
    original_question: question,
    cause_question: causeQuestion,
    policy_question: policyQuestion,
    cause_research: causeResearch,
    policy_research: policyResearch,
  });

  return {
    originalQuestion: question,
    subQuestions,
    causeResearch,
    policyResearch,
    synthesizedAnswer,
    modelName: runtimeConfig.modelName,
  };
}

/**
 * 환경 변수에서 런타임 설정을 생성한다.
 *
 * @param env 프로세스 환경 변수.
 * @returns 정규화된 런타임 설정.
 * @throws `API_KEY`가 없으면 `Error`.
 */
export function buildRuntimeConfigFromEnv(
  env: NodeJS.ProcessEnv,
): RuntimeConfig {
  const apiKey: string | undefined = env.API_KEY?.trim();
  if (!apiKey) {
    throw new Error("API_KEY is missing.");
  }

  return {
    apiKey,
    baseUrl: env.BASE_URL?.trim() ?? DEFAULT_BASE_URL,
    modelName: env.MODEL?.trim() ?? DEFAULT_MODEL,
  };
}

/**
 * CLI 인자에서 사용자 질문 문자열을 추출한다.
 *
 * @param argv Node 프로세스 인자 배열.
 * @returns 질문 문자열 또는 `undefined`.
 */
export function resolveCliInput(argv: readonly string[]): string | undefined {
  const question: string = argv.slice(2).join(" ").trim();
  return question.length > 0 ? question : undefined;
}

/**
 * 현재 모듈이 직접 실행 엔트리인지 판별한다.
 *
 * @param moduleUrl 현재 모듈 URL.
 * @param argv Node 인자 배열.
 * @returns 직접 실행 여부.
 */
export function isDirectExecution(
  moduleUrl: string,
  argv: readonly string[],
): boolean {
  const scriptPath: string | undefined = argv[1];
  if (!scriptPath) {
    return false;
  }

  const scriptUrl: string = pathToFileURL(resolve(scriptPath)).href;
  return scriptUrl === moduleUrl;
}

/**
 * 복합 질의 응답 워크플로우 공개 진입점이다.
 *
 * Context:
 * - 호출자: CLI 엔트리, 테스트 코드.
 * - 데이터 흐름: 옵션 병합 -> 워크플로우 러너 실행 -> 로그 출력 -> 결과 반환.
 *
 * @param options 실행 옵션.
 * @returns 복합 질의 응답 결과.
 */
export async function runComplexQueryAnsweringWorkflow(
  options: RunComplexQueryAnsweringWorkflowInput = {},
): Promise<RunComplexQueryAnsweringWorkflowResult> {
  const runtimeConfig: RuntimeConfig =
    options.runtimeConfig ??
    buildRuntimeConfigFromEnv(options.env ?? process.env);
  const question: string = options.question ?? DEFAULT_QUESTION;
  const logger: Logger = options.log ?? console.log;
  const workflowRunner: ComplexQueryWorkflowRunner =
    options.workflowRunner ?? runDefaultComplexQueryAnsweringWorkflow;

  logger(`[complex] question: ${question}`);
  const result: RunComplexQueryAnsweringWorkflowResult = await workflowRunner(
    question,
    runtimeConfig,
  );
  logger("[complex] synthesized answer ready");
  logger(result.synthesizedAnswer);

  return result;
}

/**
 * CLI 입력으로 워크플로우를 실행한다.
 *
 * @returns 실행 완료 Promise.
 */
async function runFromCli(): Promise<void> {
  const question: string | undefined = resolveCliInput(process.argv);
  await runComplexQueryAnsweringWorkflow({
    question,
  });
}

if (isDirectExecution(import.meta.url, process.argv)) {
  void runFromCli().catch((error: unknown): void => {
    const errorMessage: string =
      error instanceof Error ? error.message : String(error);
    console.error(errorMessage);
    process.exitCode = 1;
  });
}
