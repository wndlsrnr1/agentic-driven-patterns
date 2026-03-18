/**
 * Run:
 * node --env-file=.env.modules --experimental-strip-types ./01-prompts-chaining/content-generation.workflow.ts
 */
import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatOpenAI } from "@langchain/openai";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const DEFAULT_BASE_URL: string = "https://api.synthetic.new/openai/v1";
const DEFAULT_MODEL: string = "hf:moonshotai/Kimi-K2.5";
const DEFAULT_USER_INTEREST: string = "AI agents for enterprise research";
const MAX_SECTION_COUNT: number = 3;

/**
 * 콘텐츠 생성 워크플로우 실행에 필요한 런타임 설정 계약이다.
 *
 * Context:
 * - 호출자: `buildRuntimeConfigFromEnv`, `runContentGenerationWorkflow`.
 * - 사용 목적: 인증/엔드포인트/모델 정보를 체인 단계 전체에 전달한다.
 */
export type RuntimeConfig = {
  apiKey: string;
  baseUrl: string;
  modelName: string;
};

/**
 * 콘텐츠 생성 워크플로우 산출물 계약이다.
 *
 * Context:
 * - 호출자: CLI 엔트리 및 테스트 코드.
 * - 데이터 흐름: 관심사 -> 아이디어 -> 아웃라인 -> 섹션/초안 결과를 유지한다.
 */
export type RunContentGenerationWorkflowResult = {
  userInterest: string;
  ideas: Array<string>;
  selectedIdea: string;
  outline: Array<string>;
  sections: Array<string>;
  refinedDraft: string;
  modelName: string;
};

type Logger = (message: string) => void;

type ContentGenerationWorkflowRunner = (
  userInterest: string,
  runtimeConfig: RuntimeConfig,
) => Promise<RunContentGenerationWorkflowResult>;

/**
 * 콘텐츠 생성 워크플로우 공개 진입점 옵션 계약이다.
 *
 * Context:
 * - 호출자: CLI(`runFromCli`), spec 테스트.
 * - 사용 목적: 관심사 입력/러너/로그/환경을 주입해 실행 경로를 제어한다.
 */
export type RunContentGenerationWorkflowInput = {
  userInterest?: string;
  runtimeConfig?: RuntimeConfig;
  env?: NodeJS.ProcessEnv;
  log?: Logger;
  workflowRunner?: ContentGenerationWorkflowRunner;
};

type StringRunnable<TInput> = {
  invoke(input: TInput): Promise<string>;
};

type StringArrayPayload = {
  items: Array<string>;
};

type DraftPayload = {
  sections: Array<string>;
  refined_draft: string;
};

/**
 * 모델 응답 코드 펜스를 제거해 순수 텍스트를 반환한다.
 *
 * @param modelText 모델 응답 원문.
 * @returns 정규화된 텍스트.
 */
function removeCodeFence(modelText: string): string {
  const text: string = modelText.trim();
  const match: RegExpMatchArray | null = text.match(
    /^```(?:json)?\s*([\s\S]*?)\s*```$/i,
  );
  return match ? match[1].trim() : text;
}

/**
 * JSON 문자열을 지정 타입 객체로 변환한다.
 *
 * @param modelText JSON 혹은 JSON code fence 텍스트.
 * @returns 파싱된 객체.
 */
function parseJsonObject<TValue>(modelText: string): TValue {
  return JSON.parse(removeCodeFence(modelText)) as TValue;
}

/**
 * LangChain 모델 클라이언트를 생성한다.
 *
 * Context:
 * - 호출자: `runDefaultContentGenerationWorkflow`.
 * - Side effects: 후속 단계에서 외부 LLM API 호출이 발생한다.
 *
 * @param runtimeConfig 런타임 모델 설정.
 * @returns 구성된 `ChatOpenAI`.
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
 * JSON payload의 `items`를 공백 제거 후 문자열 배열로 정규화한다.
 *
 * Context:
 * - 호출자: 아이디어/아웃라인 파싱 단계.
 *
 * @param modelText JSON 텍스트.
 * @returns 비어 있지 않은 문자열 배열.
 */
function parseStringItems(modelText: string): Array<string> {
  const payload: StringArrayPayload =
    parseJsonObject<StringArrayPayload>(modelText);
  return payload.items
    .map((item: string): string => item.trim())
    .filter((item: string): boolean => item.length > 0);
}

/**
 * 콘텐츠 생성 워크플로우 기본 체인을 실행한다.
 *
 * Context:
 * - 호출자: `runContentGenerationWorkflow` 기본 경로.
 * - 데이터 흐름: 관심사 입력 -> 아이디어 생성 -> 아이디어 선택 -> 아웃라인 -> 본문 초안 생성.
 *
 * @param userInterest 사용자 관심 주제.
 * @param runtimeConfig 모델 실행 설정.
 * @returns 콘텐츠 생성 결과.
 * @throws 아이디어/아웃라인이 비어 있으면 `Error`.
 */
async function runDefaultContentGenerationWorkflow(
  userInterest: string,
  runtimeConfig: RuntimeConfig,
): Promise<RunContentGenerationWorkflowResult> {
  const model: ChatOpenAI = buildModel(runtimeConfig);
  const parser: StringOutputParser = new StringOutputParser();

  const ideasChain: StringRunnable<{ user_interest: string }> =
    ChatPromptTemplate.fromTemplate(
      [
        "Generate exactly 5 content topic ideas based on this user interest.",
        'Return strict JSON with shape: {{"items":["..."]}}.',
        "Do not include markdown fences.",
        "",
        "{user_interest}",
      ].join("\n"),
    )
      .pipe(model)
      .pipe(parser) as StringRunnable<{ user_interest: string }>;

  const ideasRaw: string = await ideasChain.invoke({
    user_interest: userInterest,
  });
  const ideas: Array<string> = parseStringItems(ideasRaw);
  if (ideas.length === 0) {
    throw new Error("No topic ideas generated.");
  }

  const selectedIdea: string = ideas[0];

  const outlineChain: StringRunnable<{ selected_idea: string }> =
    ChatPromptTemplate.fromTemplate(
      [
        "Create a detailed outline for the selected topic.",
        'Return strict JSON: {{"items":["section heading", ...]}}.',
        "Do not include markdown fences.",
        "",
        "{selected_idea}",
      ].join("\n"),
    )
      .pipe(model)
      .pipe(parser) as StringRunnable<{ selected_idea: string }>;

  const outlineRaw: string = await outlineChain.invoke({
    selected_idea: selectedIdea,
  });

  const outline: Array<string> = parseStringItems(outlineRaw);
  if (outline.length === 0) {
    throw new Error("No outline sections generated.");
  }
  const limitedOutline: Array<string> = outline.slice(0, MAX_SECTION_COUNT);

  const draftChain: StringRunnable<{
    selected_idea: string;
    outline_json: string;
  }> = ChatPromptTemplate.fromTemplate(
    [
      "Write one coherent article draft from the selected topic and outline.",
      `Generate at most ${MAX_SECTION_COUNT} sections.`,
      "Return strict JSON with keys: sections (string array), refined_draft (string).",
      "Do not include markdown fences.",
      "",
      "Topic: {selected_idea}",
      "Outline JSON: {outline_json}",
    ].join("\n"),
  )
    .pipe(model)
    .pipe(parser) as StringRunnable<{
    selected_idea: string;
    outline_json: string;
  }>;

  const draftRaw: string = await draftChain.invoke({
    selected_idea: selectedIdea,
    outline_json: JSON.stringify(limitedOutline),
  });
  const draftPayload: DraftPayload = parseJsonObject<DraftPayload>(draftRaw);
  const sections: Array<string> = draftPayload.sections.slice(
    0,
    MAX_SECTION_COUNT,
  );
  const refinedDraft: string = draftPayload.refined_draft;

  return {
    userInterest,
    ideas,
    selectedIdea,
    outline: limitedOutline,
    sections,
    refinedDraft,
    modelName: runtimeConfig.modelName,
  };
}

/**
 * 환경 변수에서 콘텐츠 생성 워크플로우 설정을 생성한다.
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
 * CLI 인자에서 사용자 관심사 텍스트를 추출한다.
 *
 * @param argv Node 프로세스 인자 배열.
 * @returns 사용자 관심사 문자열 또는 `undefined`.
 */
export function resolveCliInput(argv: readonly string[]): string | undefined {
  const userInterest: string = argv.slice(2).join(" ").trim();
  return userInterest.length > 0 ? userInterest : undefined;
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
 * 콘텐츠 생성 워크플로우의 공개 진입점이다.
 *
 * Context:
 * - 호출자: CLI 엔트리, 테스트 코드.
 * - 데이터 흐름: 옵션 병합 -> 워크플로우 실행 -> 로그 출력 -> 결과 반환.
 *
 * @param options 실행 옵션.
 * @returns 콘텐츠 생성 결과.
 */
export async function runContentGenerationWorkflow(
  options: RunContentGenerationWorkflowInput = {},
): Promise<RunContentGenerationWorkflowResult> {
  const runtimeConfig: RuntimeConfig =
    options.runtimeConfig ??
    buildRuntimeConfigFromEnv(options.env ?? process.env);
  const userInterest: string = options.userInterest ?? DEFAULT_USER_INTEREST;
  const logger: Logger = options.log ?? console.log;
  const workflowRunner: ContentGenerationWorkflowRunner =
    options.workflowRunner ?? runDefaultContentGenerationWorkflow;

  logger(`[content] user interest: ${userInterest}`);
  const result: RunContentGenerationWorkflowResult = await workflowRunner(
    userInterest,
    runtimeConfig,
  );
  logger("[content] final draft generated");
  logger(result.refinedDraft);

  return result;
}

/**
 * CLI 인자를 읽어 콘텐츠 생성 워크플로우를 실행한다.
 *
 * @returns 실행 완료 Promise.
 */
async function runFromCli(): Promise<void> {
  const userInterest: string | undefined = resolveCliInput(process.argv);
  await runContentGenerationWorkflow({
    userInterest,
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
