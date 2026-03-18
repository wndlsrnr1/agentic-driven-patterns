/**
 * Run:
 * node --env-file=.env.modules --experimental-strip-types ./01-prompts-chaining/information-processing.workflow.ts
 */
import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatOpenAI } from "@langchain/openai";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const DEFAULT_BASE_URL: string = "https://api.synthetic.new/openai/v1";
const DEFAULT_MODEL: string = "hf:moonshotai/Kimi-K2.5";
const DEFAULT_SOURCE_URL: string =
  "https://en.wikipedia.org/wiki/Prompt_engineering";
const MAX_SOURCE_TEXT_LENGTH: number = 12000;

/**
 * 정보 처리 워크플로우 실행에 필요한 런타임 설정 계약이다.
 *
 * Context:
 * - 호출자: `buildRuntimeConfigFromEnv`, `runInformationProcessingWorkflow`.
 * - 사용 목적: 모델 호출에 필요한 인증/엔드포인트/모델명을 전달한다.
 */
export type RuntimeConfig = {
  apiKey: string;
  baseUrl: string;
  modelName: string;
};

/**
 * 요약에서 추출한 엔티티 계약이다.
 *
 * Context:
 * - 호출자: 엔티티 추출 단계, 지식베이스 조회 단계.
 */
export type ExtractedEntity = {
  name: string;
  type: string;
};

/**
 * 외부 지식베이스 조회 결과 계약이다.
 *
 * Context:
 * - 호출자: `fetchWikipediaSummary`, 최종 리포트 생성 단계.
 */
export type KnowledgeBaseFinding = {
  entity: string;
  snippet: string;
  sourceUrl: string;
};

/**
 * 정보 처리 워크플로우 최종 산출물 계약이다.
 *
 * Context:
 * - 호출자: CLI 엔트리, 테스트 코드.
 * - 데이터 흐름: source fetch -> summary -> entities -> knowledge findings -> final report.
 */
export type RunInformationProcessingWorkflowResult = {
  sourceUrl: string;
  extractedText: string;
  summary: string;
  entities: Array<ExtractedEntity>;
  knowledgeBaseFindings: Array<KnowledgeBaseFinding>;
  finalReport: string;
  modelName: string;
};

type Logger = (message: string) => void;

type InformationProcessingWorkflowRunner = (
  sourceUrl: string,
  runtimeConfig: RuntimeConfig,
) => Promise<RunInformationProcessingWorkflowResult>;

/**
 * 정보 처리 워크플로우 공개 진입점 옵션 계약이다.
 *
 * Context:
 * - 호출자: CLI(`runFromCli`), 테스트 코드.
 * - 사용 목적: source URL/런타임/로깅/러너를 주입해 실행 경로를 제어한다.
 */
export type RunInformationProcessingWorkflowInput = {
  sourceUrl?: string;
  runtimeConfig?: RuntimeConfig;
  env?: NodeJS.ProcessEnv;
  log?: Logger;
  workflowRunner?: InformationProcessingWorkflowRunner;
};

type StringRunnable<TInput> = {
  invoke(input: TInput): Promise<string>;
};

type ParsedEntitiesPayload = {
  entities: Array<ExtractedEntity>;
};

/**
 * 모델 응답에서 Markdown 코드 펜스를 제거한다.
 *
 * @param modelText 모델 응답 원문.
 * @returns 정규화 텍스트.
 */
function removeCodeFence(modelText: string): string {
  const text: string = modelText.trim();
  const fenceMatch: RegExpMatchArray | null = text.match(
    /^```(?:json)?\s*([\s\S]*?)\s*```$/i,
  );
  return fenceMatch ? fenceMatch[1].trim() : text;
}

/**
 * JSON 텍스트를 지정 타입 객체로 파싱한다.
 *
 * @param modelText JSON 혹은 JSON code fence 문자열.
 * @returns 파싱된 객체.
 */
function parseJsonObject<TValue>(modelText: string): TValue {
  const normalizedText: string = removeCodeFence(modelText);
  return JSON.parse(normalizedText) as TValue;
}

/**
 * HTML에서 사람이 읽을 수 있는 텍스트만 추출한다.
 *
 * Context:
 * - 호출자: `fetchTextFromUrl`.
 * - 데이터 흐름: script/style 제거 -> 태그 제거 -> 주요 HTML 엔티티 디코딩 -> 공백 정규화.
 *
 * @param htmlText 원본 HTML 문자열.
 * @returns 추출된 평문 텍스트.
 */
function extractTextFromHtml(htmlText: string): string {
  const withoutScripts: string = htmlText.replace(
    /<script[\s\S]*?<\/script>/gi,
    " ",
  );
  const withoutStyles: string = withoutScripts.replace(
    /<style[\s\S]*?<\/style>/gi,
    " ",
  );
  const withoutTags: string = withoutStyles.replace(/<[^>]+>/g, " ");
  const withoutEntities: string = withoutTags
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
  return withoutEntities.replace(/\s+/g, " ").trim();
}

/**
 * URL 문서를 가져와 분석용 텍스트로 정규화한다.
 *
 * Context:
 * - 호출자: `runDefaultInformationProcessingWorkflow`.
 * - Side effects: 외부 HTTP fetch를 수행한다.
 *
 * @param sourceUrl 원문 URL.
 * @returns 길이 제한이 적용된 평문 텍스트.
 * @throws 네트워크 실패/빈 텍스트일 경우 `Error`.
 */
async function fetchTextFromUrl(sourceUrl: string): Promise<string> {
  const response: Response = await fetch(sourceUrl);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch source URL (${response.status}): ${sourceUrl}`,
    );
  }

  const htmlText: string = await response.text();
  const extractedText: string = extractTextFromHtml(htmlText);
  if (extractedText.length === 0) {
    throw new Error(`No readable text found at source URL: ${sourceUrl}`);
  }

  return extractedText.slice(0, MAX_SOURCE_TEXT_LENGTH);
}

/**
 * 런타임 설정으로 LangChain 모델 인스턴스를 생성한다.
 *
 * @param runtimeConfig 모델 실행 설정.
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
 * 엔티티 이름을 기준으로 Wikipedia summary를 조회한다.
 *
 * Context:
 * - 호출자: 엔티티별 지식베이스 조회(`Promise.all`) 단계.
 * - Side effects: Wikipedia REST API 호출.
 *
 * @param entityName 조회할 엔티티 이름.
 * @returns 조회 성공/실패를 모두 표현한 finding 객체.
 */
async function fetchWikipediaSummary(
  entityName: string,
): Promise<KnowledgeBaseFinding> {
  const encodedTitle: string = encodeURIComponent(entityName);
  const summaryUrl: string = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodedTitle}`;

  try {
    const response: Response = await fetch(summaryUrl);
    if (!response.ok) {
      return {
        entity: entityName,
        snippet: `No knowledge-base summary found (HTTP ${response.status}).`,
        sourceUrl: summaryUrl,
      };
    }

    const payload: {
      extract?: string;
      content_urls?: {
        desktop?: {
          page?: string;
        };
      };
    } = (await response.json()) as {
      extract?: string;
      content_urls?: {
        desktop?: {
          page?: string;
        };
      };
    };

    return {
      entity: entityName,
      snippet: payload.extract?.trim() ?? "No summary text returned.",
      sourceUrl: payload.content_urls?.desktop?.page ?? summaryUrl,
    };
  } catch (error: unknown) {
    const errorMessage: string =
      error instanceof Error ? error.message : String(error);
    return {
      entity: entityName,
      snippet: `Knowledge-base lookup failed: ${errorMessage}`,
      sourceUrl: summaryUrl,
    };
  }
}

/**
 * 정보 처리 기본 워크플로우를 실행한다.
 *
 * Context:
 * - 호출자: `runInformationProcessingWorkflow` 기본 러너.
 * - 데이터 흐름: URL 텍스트 수집 -> 요약 -> 엔티티 추출 -> 지식조회 -> 최종 리포트 생성.
 *
 * @param sourceUrl 분석 대상 URL.
 * @param runtimeConfig 모델 실행 설정.
 * @returns 정보 처리 최종 결과 객체.
 */
async function runDefaultInformationProcessingWorkflow(
  sourceUrl: string,
  runtimeConfig: RuntimeConfig,
): Promise<RunInformationProcessingWorkflowResult> {
  const model: ChatOpenAI = buildModel(runtimeConfig);
  const parser: StringOutputParser = new StringOutputParser();

  const extractedText: string = await fetchTextFromUrl(sourceUrl);

  const summaryChain: StringRunnable<{ cleaned_text: string }> =
    ChatPromptTemplate.fromTemplate(
      "Summarize the following text in 6-8 bullet points for a research analyst:\n\n{cleaned_text}",
    )
      .pipe(model)
      .pipe(parser) as StringRunnable<{ cleaned_text: string }>;

  const summary: string = await summaryChain.invoke({
    cleaned_text: extractedText,
  });

  const entitiesChain: StringRunnable<{ summary_text: string }> =
    ChatPromptTemplate.fromTemplate(
      [
        "Extract named entities from the summary.",
        'Return strict JSON with shape: {{"entities":[{{"name":"...","type":"person|organization|location|date|concept"}}]}}.',
        "Do not include markdown fences.",
        "",
        "{summary_text}",
      ].join("\n"),
    )
      .pipe(model)
      .pipe(parser) as StringRunnable<{ summary_text: string }>;

  const rawEntitiesText: string = await entitiesChain.invoke({
    summary_text: summary,
  });

  const parsedPayload: ParsedEntitiesPayload =
    parseJsonObject<ParsedEntitiesPayload>(rawEntitiesText);
  const entities: Array<ExtractedEntity> = parsedPayload.entities.filter(
    (entity: ExtractedEntity): boolean => {
      return entity.name.trim().length > 0 && entity.type.trim().length > 0;
    },
  );

  // 엔티티별 지식 조회는 독립 I/O이므로 병렬 수행한다.
  const knowledgeBaseFindings: Array<KnowledgeBaseFinding> = await Promise.all(
    entities.map(
      async (entity: ExtractedEntity): Promise<KnowledgeBaseFinding> => {
        return fetchWikipediaSummary(entity.name);
      },
    ),
  );

  const reportChain: StringRunnable<{
    summary: string;
    entities: string;
    findings: string;
  }> = ChatPromptTemplate.fromTemplate(
    [
      "Create a concise final report for an analyst.",
      "Use these inputs:",
      "1) summary",
      "2) extracted entities",
      "3) knowledge-base findings",
      "Output as markdown with sections: Executive Summary, Key Entities, Evidence Notes.",
      "",
      "Summary:\n{summary}",
      "",
      "Entities JSON:\n{entities}",
      "",
      "Knowledge Findings JSON:\n{findings}",
    ].join("\n"),
  )
    .pipe(model)
    .pipe(parser) as StringRunnable<{
    summary: string;
    entities: string;
    findings: string;
  }>;

  const finalReport: string = await reportChain.invoke({
    summary,
    entities: JSON.stringify(entities),
    findings: JSON.stringify(knowledgeBaseFindings),
  });

  return {
    sourceUrl,
    extractedText,
    summary,
    entities,
    knowledgeBaseFindings,
    finalReport,
    modelName: runtimeConfig.modelName,
  };
}

/**
 * 환경 변수에서 정보 처리 워크플로우 런타임 설정을 생성한다.
 *
 * @param env 프로세스 환경 변수.
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
 * CLI 인자에서 source URL을 추출한다.
 *
 * @param argv Node 프로세스 인자 배열.
 * @returns source URL 또는 `undefined`.
 */
export function resolveCliInput(argv: readonly string[]): string | undefined {
  const cliSourceUrl: string = argv[2]?.trim() ?? "";
  return cliSourceUrl.length > 0 ? cliSourceUrl : undefined;
}

/**
 * 현재 파일이 직접 실행 엔트리인지 판별한다.
 *
 * @param moduleUrl 현재 모듈 URL.
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
 * 정보 처리 워크플로우 공개 진입점이다.
 *
 * Context:
 * - 호출자: CLI 엔트리, 테스트 코드.
 * - 데이터 흐름: 옵션 병합 -> 워크플로우 실행 -> 리포트 로그 -> 결과 반환.
 *
 * @param options 실행 옵션.
 * @returns 워크플로우 결과 객체.
 */
export async function runInformationProcessingWorkflow(
  options: RunInformationProcessingWorkflowInput = {},
): Promise<RunInformationProcessingWorkflowResult> {
  const runtimeConfig: RuntimeConfig =
    options.runtimeConfig ??
    buildRuntimeConfigFromEnv(options.env ?? process.env);
  const sourceUrl: string = options.sourceUrl ?? DEFAULT_SOURCE_URL;
  const logger: Logger = options.log ?? console.log;
  const workflowRunner: InformationProcessingWorkflowRunner =
    options.workflowRunner ?? runDefaultInformationProcessingWorkflow;

  logger(`[information] source URL: ${sourceUrl}`);
  const result: RunInformationProcessingWorkflowResult = await workflowRunner(
    sourceUrl,
    runtimeConfig,
  );
  logger("[information] final report generated");
  logger(result.finalReport);

  return result;
}

/**
 * CLI 인자를 읽어 정보 처리 워크플로우를 실행한다.
 *
 * @returns 실행 완료 Promise.
 */
async function runFromCli(): Promise<void> {
  const sourceUrl: string | undefined = resolveCliInput(process.argv);
  await runInformationProcessingWorkflow({
    sourceUrl,
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
