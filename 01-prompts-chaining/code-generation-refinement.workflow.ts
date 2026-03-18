/**
 * Run:
 * node --env-file=.env.modules --experimental-strip-types ./01-prompts-chaining/code-generation-refinement.workflow.ts
 */
import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatOpenAI } from "@langchain/openai";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const DEFAULT_BASE_URL: string = "https://api.synthetic.new/openai/v1";
const DEFAULT_MODEL: string = "hf:moonshotai/Kimi-K2.5";
const DEFAULT_CODING_REQUEST: string =
  "Implement a TypeScript function that paginates an array safely with explicit return types.";

/**
 * 코드 생성 워크플로우 실행에 필요한 런타임 설정 계약이다.
 *
 * Context:
 * - 호출자: `buildRuntimeConfigFromEnv`, `runCodeGenerationRefinementWorkflow`.
 * - 사용 목적: LLM 호출에 필요한 인증/엔드포인트/모델 정보를 일관되게 전달한다.
 */
export type RuntimeConfig = {
  apiKey: string;
  baseUrl: string;
  modelName: string;
};

/**
 * 코드 생성 및 개선 체인의 최종 산출물 계약이다.
 *
 * Context:
 * - 호출자: `runCodeGenerationRefinementWorkflow`를 호출하는 CLI 엔트리/테스트 코드.
 * - 데이터 흐름: `codingRequest` -> pseudocode -> draft -> review -> refined -> docs 결과를 반환한다.
 */
export type RunCodeGenerationRefinementWorkflowResult = {
  codingRequest: string;
  pseudocode: string;
  draftCode: string;
  reviewNotes: Array<string>;
  refinedCode: string;
  testOutline: string;
  documentation: string;
  modelName: string;
};

type Logger = (message: string) => void;

type CodeGenerationWorkflowRunner = (
  codingRequest: string,
  runtimeConfig: RuntimeConfig,
) => Promise<RunCodeGenerationRefinementWorkflowResult>;

/**
 * 코드 생성 워크플로우 진입점의 입력 옵션 계약이다.
 *
 * Context:
 * - 호출자: CLI(`runFromCli`)와 테스트(spec) 코드.
 * - 사용 목적: 기본 러너 대체, 런타임 설정 주입, 로거 주입을 통해 테스트 가능성을 유지한다.
 */
export type RunCodeGenerationRefinementWorkflowInput = {
  codingRequest?: string;
  runtimeConfig?: RuntimeConfig;
  env?: NodeJS.ProcessEnv;
  log?: Logger;
  workflowRunner?: CodeGenerationWorkflowRunner;
};

type StringRunnable<TInput> = {
  invoke(input: TInput): Promise<string>;
};

/**
 * 모델 응답의 Markdown 코드 펜스를 제거한다.
 *
 * Context:
 * - 호출자: `parseLineItems`, `parseDocsPayload`.
 * - 데이터 흐름: 모델 원문 문자열 -> 정규화된 순수 텍스트.
 *
 * @param modelText 모델 응답 원문.
 * @returns 코드 펜스가 제거된 텍스트.
 */
function removeCodeFence(modelText: string): string {
  const text: string = modelText.trim();
  const match: RegExpMatchArray | null = text.match(
    /^```(?:json)?\s*([\s\S]*?)\s*```$/i,
  );
  return match ? match[1].trim() : text;
}

/**
 * 불릿 형태의 리뷰 텍스트를 문자열 목록으로 정규화한다.
 *
 * Context:
 * - 호출자: `runDefaultCodeGenerationRefinementWorkflow`.
 * - 사용 목적: 모델의 리뷰 응답을 후속 refine 단계에서 JSON 직렬화 가능한 배열로 변환한다.
 *
 * @param modelText 모델이 반환한 리뷰 텍스트.
 * @returns 공백/불릿 기호가 제거된 라인 목록.
 */
function parseLineItems(modelText: string): Array<string> {
  const normalizedText: string = removeCodeFence(modelText);
  const rawLines: Array<string> = normalizedText
    .split("\n")
    .map((line: string): string => line.trim())
    .filter((line: string): boolean => line.length > 0);

  const cleanedItems: Array<string> = rawLines
    .map((line: string): string => line.replace(/^[-*]\s*/, "").trim())
    .filter((line: string): boolean => line.length > 0);

  return cleanedItems.length > 0 ? cleanedItems : [normalizedText];
}

/**
 * 테스트 개요와 문서 텍스트를 단일 응답에서 분리한다.
 *
 * Context:
 * - 호출자: `runDefaultCodeGenerationRefinementWorkflow`.
 * - 사용 목적: 문서 생성 체인의 엄격한 출력 포맷(`TEST_OUTLINE`, `DOCUMENTATION`)을 검증한다.
 *
 * @param modelText 문서 체인 원문 응답.
 * @returns 분리된 테스트 개요와 문서 문자열.
 * @throws 포맷이 깨져 둘 중 하나라도 비어 있으면 `Error`.
 */
function parseDocsPayload(modelText: string): {
  testOutline: string;
  documentation: string;
} {
  const normalizedText: string = removeCodeFence(modelText);
  const splitToken: string = "DOCUMENTATION:";
  const splitSections: Array<string> = normalizedText.split(splitToken);
  const testOutlineSection: string = splitSections[0] ?? "";
  const documentationSection: string = splitSections[1] ?? "";

  const testOutline: string = testOutlineSection
    .replace(/^TEST_OUTLINE:/i, "")
    .trim();
  const documentation: string = documentationSection.trim();

  if (testOutline.length === 0 || documentation.length === 0) {
    throw new Error(
      "Failed to parse test outline/documentation from model response.",
    );
  }

  return {
    testOutline,
    documentation,
  };
}

/**
 * LangChain OpenAI 클라이언트를 런타임 설정으로 생성한다.
 *
 * Context:
 * - 호출자: 기본 실행 러너(`runDefaultCodeGenerationRefinementWorkflow`).
 * - Side effects: 외부 LLM API 네트워크 호출을 유발하는 모델 인스턴스를 구성한다.
 *
 * @param runtimeConfig API 인증/엔드포인트/모델명 설정.
 * @returns 구성 완료된 `ChatOpenAI` 인스턴스.
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
 * 코드 생성 요청을 의사코드 -> 초안 -> 리뷰 -> 개선 -> 문서 단계로 실행한다.
 *
 * Context:
 * - 호출자: `runCodeGenerationRefinementWorkflow` 기본 경로.
 * - 데이터 흐름: 요청 텍스트를 단계별 프롬프트 체인으로 전달하고 각 단계 결과를 집계해 반환한다.
 *
 * @param codingRequest 사용자 코드 생성 요청.
 * @param runtimeConfig 모델 실행 설정.
 * @returns 전체 체인 산출물.
 */
async function runDefaultCodeGenerationRefinementWorkflow(
  codingRequest: string,
  runtimeConfig: RuntimeConfig,
): Promise<RunCodeGenerationRefinementWorkflowResult> {
  const model: ChatOpenAI = buildModel(runtimeConfig);
  const parser: StringOutputParser = new StringOutputParser();

  const pseudocodeChain: StringRunnable<{ coding_request: string }> =
    ChatPromptTemplate.fromTemplate(
      [
        "Understand the coding request and produce concise pseudocode.",
        "",
        "{coding_request}",
      ].join("\n"),
    )
      .pipe(model)
      .pipe(parser) as StringRunnable<{ coding_request: string }>;

  const pseudocode: string = await pseudocodeChain.invoke({
    coding_request: codingRequest,
  });

  const draftCodeChain: StringRunnable<{ pseudocode: string }> =
    ChatPromptTemplate.fromTemplate(
      [
        "Write initial TypeScript code based on the pseudocode.",
        "Use explicit types for parameters, variables, and return values.",
        "",
        "{pseudocode}",
      ].join("\n"),
    )
      .pipe(model)
      .pipe(parser) as StringRunnable<{ pseudocode: string }>;

  const draftCode: string = await draftCodeChain.invoke({
    pseudocode,
  });

  const reviewChain: StringRunnable<{ draft_code: string }> =
    ChatPromptTemplate.fromTemplate(
      [
        "Review the draft code and list potential errors or improvements.",
        "Return only plain bullet lines (one issue per line) without extra prose.",
        "",
        "{draft_code}",
      ].join("\n"),
    )
      .pipe(model)
      .pipe(parser) as StringRunnable<{ draft_code: string }>;

  const reviewRaw: string = await reviewChain.invoke({
    draft_code: draftCode,
  });

  const reviewNotes: Array<string> = parseLineItems(reviewRaw);

  const refineChain: StringRunnable<{
    draft_code: string;
    review_notes_json: string;
  }> = ChatPromptTemplate.fromTemplate(
    [
      "Rewrite the code to address the review notes.",
      "Keep explicit type annotations.",
      "",
      "Draft code:\n{draft_code}",
      "",
      "Review notes JSON:\n{review_notes_json}",
    ].join("\n"),
  )
    .pipe(model)
    .pipe(parser) as StringRunnable<{
    draft_code: string;
    review_notes_json: string;
  }>;

  const refinedCode: string = await refineChain.invoke({
    draft_code: draftCode,
    review_notes_json: JSON.stringify(reviewNotes),
  });

  const docsChain: StringRunnable<{ refined_code: string }> =
    ChatPromptTemplate.fromTemplate(
      [
        "Create lightweight test outline and documentation for the refined code.",
        "Return plain text using exactly this format:",
        "TEST_OUTLINE: <content>",
        "DOCUMENTATION: <content>",
        "",
        "{refined_code}",
      ].join("\n"),
    )
      .pipe(model)
      .pipe(parser) as StringRunnable<{ refined_code: string }>;

  const docsRaw: string = await docsChain.invoke({
    refined_code: refinedCode,
  });

  const docsPayload: {
    testOutline: string;
    documentation: string;
  } = parseDocsPayload(docsRaw);

  return {
    codingRequest,
    pseudocode,
    draftCode,
    reviewNotes,
    refinedCode,
    testOutline: docsPayload.testOutline,
    documentation: docsPayload.documentation,
    modelName: runtimeConfig.modelName,
  };
}

/**
 * 환경 변수에서 코드 생성 워크플로우 런타임 설정을 생성한다.
 *
 * Context:
 * - 호출자: `runCodeGenerationRefinementWorkflow`.
 * - 사용 목적: `.env` 기반 실행 시 필수/기본값 규칙을 중앙에서 강제한다.
 *
 * @param env 프로세스 환경 변수 맵.
 * @returns 정규화된 런타임 설정.
 * @throws `API_KEY`가 비어 있으면 `Error`.
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
 * CLI 인자에서 코드 생성 요청 문자열을 추출한다.
 *
 * Context:
 * - 호출자: `runFromCli`.
 *
 * @param argv Node 프로세스 인자 배열.
 * @returns 요청 문자열 또는 비어 있을 경우 `undefined`.
 */
export function resolveCliInput(argv: readonly string[]): string | undefined {
  const codingRequest: string = argv.slice(2).join(" ").trim();
  return codingRequest.length > 0 ? codingRequest : undefined;
}

/**
 * 현재 모듈이 직접 실행 엔트리인지 판별한다.
 *
 * Context:
 * - 호출자: 파일 하단 CLI bootstrap 조건문.
 *
 * @param moduleUrl 현재 모듈 URL(`import.meta.url`).
 * @param argv Node 프로세스 인자 배열.
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
 * 코드 생성 개선 워크플로우의 공개 진입점이다.
 *
 * Context:
 * - 호출자: CLI 엔트리, 테스트 코드.
 * - 데이터 흐름: 옵션 병합 -> 러너 실행 -> 요약 로그 출력 -> 결과 반환.
 *
 * @param options 실행 시 입력/환경/러너 주입 옵션.
 * @returns 코드 개선 결과 객체.
 */
export async function runCodeGenerationRefinementWorkflow(
  options: RunCodeGenerationRefinementWorkflowInput = {},
): Promise<RunCodeGenerationRefinementWorkflowResult> {
  const runtimeConfig: RuntimeConfig =
    options.runtimeConfig ??
    buildRuntimeConfigFromEnv(options.env ?? process.env);
  const codingRequest: string = options.codingRequest ?? DEFAULT_CODING_REQUEST;
  const logger: Logger = options.log ?? console.log;
  const workflowRunner: CodeGenerationWorkflowRunner =
    options.workflowRunner ?? runDefaultCodeGenerationRefinementWorkflow;

  logger(`[codegen] request: ${codingRequest}`);
  const result: RunCodeGenerationRefinementWorkflowResult =
    await workflowRunner(codingRequest, runtimeConfig);
  logger("[codegen] refined code ready");
  logger(result.refinedCode);

  return result;
}

/**
 * CLI 입력을 읽어 기본 워크플로우를 실행한다.
 *
 * Context:
 * - 호출자: direct execution bootstrap.
 *
 * @returns 실행 완료 Promise.
 */
async function runFromCli(): Promise<void> {
  const codingRequest: string | undefined = resolveCliInput(process.argv);
  await runCodeGenerationRefinementWorkflow({
    codingRequest,
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
