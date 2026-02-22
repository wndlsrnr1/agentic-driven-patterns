import { StringOutputParser } from '@langchain/core/output_parsers';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { ChatOpenAI } from '@langchain/openai';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const DEFAULT_SYNTHETIC_BASE_URL: string = 'https://api.synthetic.new/openai/v1';
const DEFAULT_SYNTHETIC_MODEL: string = 'hf:moonshotai/Kimi-K2.5';
const DEFAULT_INVOICE_TEXT: string = [
  'Invoice #A-2026-021',
  'Vendor: ACME Robotics Ltd.',
  'Address: 10 Teheran-ro, Gangnam-gu, Seoul',
  'Amount Due: one thousand and fifty USD',
  'Due Date: 2026-03-01',
].join('\n');

const MAX_RETRY_COUNT: number = 2;
const TAX_RATE: number = 0.1;

/**
 * 데이터 추출/변환 워크플로우 실행에 필요한 런타임 설정 계약이다.
 *
 * Context:
 * - 호출자: `buildRuntimeConfigFromEnv`, `runDataExtractionTransformationWorkflow`.
 * - 사용 목적: LLM 호출에 필요한 인증/모델 설정을 공통 전달한다.
 */
export type RuntimeConfig = {
  apiKey: string;
  baseUrl: string;
  modelName: string;
};

/**
 * 원문 인보이스에서 추출한 비정규화 필드 계약이다.
 *
 * Context:
 * - 호출자: `extractInvoice`, `repairInvoice`, `validateExtractedInvoice`.
 */
export type ExtractedInvoice = {
  vendorName: string;
  address: string;
  amountText: string;
  currency: string;
  dueDate: string;
};

/**
 * 숫자형 금액으로 정규화한 인보이스 계약이다.
 *
 * Context:
 * - 호출자: `normalizeInvoice`, 최종 계산 단계.
 */
export type NormalizedInvoice = {
  vendorName: string;
  address: string;
  amountValue: number;
  currency: string;
  dueDate: string;
};

/**
 * 데이터 추출/변환 워크플로우 최종 산출물 계약이다.
 *
 * Context:
 * - 호출자: CLI 엔트리, 테스트 코드.
 * - 데이터 흐름: source -> extracted -> normalized -> calculation까지 중간 결과를 유지한다.
 */
export type RunDataExtractionTransformationWorkflowResult = {
  sourceDocument: string;
  extractedInvoice: ExtractedInvoice;
  normalizedInvoice: NormalizedInvoice;
  calculationResult: number;
  retries: number;
  modelName: string;
};

type Logger = (message: string) => void;

type DataExtractionWorkflowRunner = (
  sourceDocument: string,
  runtimeConfig: RuntimeConfig,
) => Promise<RunDataExtractionTransformationWorkflowResult>;

/**
 * 데이터 추출/변환 워크플로우 공개 진입점 옵션 계약이다.
 *
 * Context:
 * - 호출자: `runFromCli`, 테스트 코드.
 * - 사용 목적: 소스 문서/런타임/로거/러너를 주입해 실행 경로를 제어한다.
 */
export type RunDataExtractionTransformationWorkflowInput = {
  sourceDocument?: string;
  runtimeConfig?: RuntimeConfig;
  env?: NodeJS.ProcessEnv;
  log?: Logger;
  workflowRunner?: DataExtractionWorkflowRunner;
};

type StringRunnable<TInput> = {
  invoke(input: TInput): Promise<string>;
};

/**
 * 모델 응답의 코드 펜스를 제거한다.
 *
 * @param modelText 모델 응답 원문.
 * @returns 정규화된 텍스트.
 */
function removeCodeFence(modelText: string): string {
  const text: string = modelText.trim();
  const match: RegExpMatchArray | null = text.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return match ? match[1].trim() : text;
}

/**
 * JSON 텍스트를 지정 타입 객체로 파싱한다.
 *
 * @param modelText JSON 또는 JSON code fence 텍스트.
 * @returns 파싱된 객체.
 */
function parseJsonObject<TValue>(modelText: string): TValue {
  return JSON.parse(removeCodeFence(modelText)) as TValue;
}

/**
 * 런타임 설정으로 LangChain 모델 인스턴스를 생성한다.
 *
 * Context:
 * - 호출자: `runDefaultDataExtractionTransformationWorkflow`.
 *
 * @param runtimeConfig 모델 실행 설정.
 * @returns `ChatOpenAI` 인스턴스.
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
 * 추출된 인보이스 필드 유효성을 검증한다.
 *
 * Context:
 * - 호출자: 기본 워크플로우의 초기 검증 및 재시도 루프.
 *
 * @param invoice 추출 결과.
 * @returns 오류 메시지 목록. 비어 있으면 유효한 상태다.
 */
function validateExtractedInvoice(invoice: ExtractedInvoice): Array<string> {
  const errors: Array<string> = [];

  if (invoice.vendorName.trim().length === 0) {
    errors.push('vendorName is missing');
  }
  if (invoice.address.trim().length === 0) {
    errors.push('address is missing');
  }
  if (invoice.amountText.trim().length === 0) {
    errors.push('amountText is missing');
  }
  if (!/^[A-Z]{3}$/.test(invoice.currency.trim().toUpperCase())) {
    errors.push('currency must be 3-letter ISO code');
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(invoice.dueDate.trim())) {
    errors.push('dueDate must be YYYY-MM-DD');
  }

  return errors;
}

/**
 * 세율을 반영한 총액을 계산한다.
 *
 * @param amountValue 세전 금액.
 * @param taxRate 세율(예: 0.1).
 * @returns 소수 둘째 자리 반올림 총액.
 */
function calculateTotalWithTax(amountValue: number, taxRate: number): number {
  const totalAmount: number = amountValue * (1 + taxRate);
  return Math.round(totalAmount * 100) / 100;
}

/**
 * 원문 문서에서 인보이스 필드를 추출한다.
 *
 * Context:
 * - 호출자: `runDefaultDataExtractionTransformationWorkflow`.
 * - Side effects: 외부 LLM API 호출.
 *
 * @param model 모델 인스턴스.
 * @param sourceDocument 원문 인보이스 텍스트.
 * @returns 추출된 인보이스 객체.
 */
async function extractInvoice(model: ChatOpenAI, sourceDocument: string): Promise<ExtractedInvoice> {
  const parser: StringOutputParser = new StringOutputParser();
  const extractionChain: StringRunnable<{ source_document: string }> = ChatPromptTemplate.fromTemplate(
    [
      'Extract invoice fields from the document.',
      'Return strict JSON with keys: vendorName, address, amountText, currency, dueDate.',
      'currency must be uppercase 3-letter code.',
      'dueDate must be YYYY-MM-DD.',
      'Do not include markdown fences.',
      '',
      '{source_document}',
    ].join('\n'),
  )
    .pipe(model)
    .pipe(parser) as StringRunnable<{ source_document: string }>;

  const extractedText: string = await extractionChain.invoke({
    source_document: sourceDocument,
  });

  return parseJsonObject<ExtractedInvoice>(extractedText);
}

/**
 * 검증 실패한 인보이스 추출 결과를 보정한다.
 *
 * Context:
 * - 호출자: 기본 워크플로우 재시도 루프.
 * - Side effects: 외부 LLM API 호출.
 *
 * @param model 모델 인스턴스.
 * @param sourceDocument 원문 인보이스 텍스트.
 * @param currentInvoice 현재 추출 결과.
 * @param validationErrors 현재 검증 오류 목록.
 * @returns 보정된 인보이스 추출 결과.
 */
async function repairInvoice(
  model: ChatOpenAI,
  sourceDocument: string,
  currentInvoice: ExtractedInvoice,
  validationErrors: Array<string>,
): Promise<ExtractedInvoice> {
  const parser: StringOutputParser = new StringOutputParser();
  const repairChain: StringRunnable<{
    source_document: string;
    current_invoice_json: string;
    validation_errors: string;
  }> = ChatPromptTemplate.fromTemplate(
    [
      'The previous extraction has missing or malformed fields.',
      'Fix only the problematic fields and return strict JSON with same keys:',
      'vendorName, address, amountText, currency, dueDate.',
      'Do not include markdown fences.',
      '',
      'Source document:\n{source_document}',
      '',
      'Current extraction:\n{current_invoice_json}',
      '',
      'Validation errors:\n{validation_errors}',
    ].join('\n'),
  )
    .pipe(model)
    .pipe(parser) as StringRunnable<{
    source_document: string;
    current_invoice_json: string;
    validation_errors: string;
  }>;

  const repairedText: string = await repairChain.invoke({
    source_document: sourceDocument,
    current_invoice_json: JSON.stringify(currentInvoice),
    validation_errors: validationErrors.join('; '),
  });

  return parseJsonObject<ExtractedInvoice>(repairedText);
}

/**
 * 비정규화 인보이스를 숫자 금액 기반 정규화 구조로 변환한다.
 *
 * Context:
 * - 호출자: 기본 워크플로우 검증 통과 이후 단계.
 * - Side effects: 외부 LLM API 호출.
 *
 * @param model 모델 인스턴스.
 * @param extractedInvoice 검증된 추출 결과.
 * @returns 정규화된 인보이스 객체.
 */
async function normalizeInvoice(model: ChatOpenAI, extractedInvoice: ExtractedInvoice): Promise<NormalizedInvoice> {
  const parser: StringOutputParser = new StringOutputParser();
  const normalizationChain: StringRunnable<{ extracted_invoice_json: string }> = ChatPromptTemplate.fromTemplate(
    [
      'Normalize this invoice JSON to numeric amount.',
      'Return strict JSON with keys: vendorName, address, amountValue, currency, dueDate.',
      'amountValue must be a number.',
      'Do not include markdown fences.',
      '',
      '{extracted_invoice_json}',
    ].join('\n'),
  )
    .pipe(model)
    .pipe(parser) as StringRunnable<{ extracted_invoice_json: string }>;

  const normalizedText: string = await normalizationChain.invoke({
    extracted_invoice_json: JSON.stringify(extractedInvoice),
  });

  return parseJsonObject<NormalizedInvoice>(normalizedText);
}

/**
 * 데이터 추출/변환 기본 워크플로우를 실행한다.
 *
 * Context:
 * - 호출자: `runDataExtractionTransformationWorkflow` 기본 러너.
 * - 데이터 흐름: 추출 -> 검증/재시도 -> 정규화 -> 세금 계산.
 *
 * @param sourceDocument 인보이스 원문 텍스트.
 * @param runtimeConfig 모델 실행 설정.
 * @returns 구조화된 최종 결과.
 * @throws 재시도 한도 내 보정 실패 또는 정규화 금액이 유한수가 아닐 때 `Error`.
 */
async function runDefaultDataExtractionTransformationWorkflow(
  sourceDocument: string,
  runtimeConfig: RuntimeConfig,
): Promise<RunDataExtractionTransformationWorkflowResult> {
  const model: ChatOpenAI = buildModel(runtimeConfig);

  let extractedInvoice: ExtractedInvoice = await extractInvoice(model, sourceDocument);
  let retries: number = 0;
  let validationErrors: Array<string> = validateExtractedInvoice(extractedInvoice);

  // 검증 오류가 존재하면 제한 횟수 내에서 보정 체인을 재실행한다.
  while (validationErrors.length > 0 && retries < MAX_RETRY_COUNT) {
    retries += 1;
    extractedInvoice = await repairInvoice(model, sourceDocument, extractedInvoice, validationErrors);
    validationErrors = validateExtractedInvoice(extractedInvoice);
  }

  if (validationErrors.length > 0) {
    throw new Error(`Invoice extraction failed after retries: ${validationErrors.join(', ')}`);
  }

  const normalizedInvoice: NormalizedInvoice = await normalizeInvoice(model, extractedInvoice);
  if (!Number.isFinite(normalizedInvoice.amountValue)) {
    throw new Error('Normalized amountValue must be a finite number.');
  }

  const calculationResult: number = calculateTotalWithTax(normalizedInvoice.amountValue, TAX_RATE);

  return {
    sourceDocument,
    extractedInvoice,
    normalizedInvoice,
    calculationResult,
    retries,
    modelName: runtimeConfig.modelName,
  };
}

/**
 * 환경 변수에서 데이터 추출 워크플로우 런타임 설정을 생성한다.
 *
 * @param env 프로세스 환경 변수.
 * @returns 정규화된 런타임 설정.
 * @throws `SYNTHETIC_API_KEY`가 없으면 `Error`.
 */
export function buildRuntimeConfigFromEnv(env: NodeJS.ProcessEnv): RuntimeConfig {
  const apiKey: string | undefined = env.SYNTHETIC_API_KEY?.trim();
  if (!apiKey) {
    throw new Error('SYNTHETIC_API_KEY is missing.');
  }

  return {
    apiKey,
    baseUrl: env.SYNTHETIC_BASE_URL?.trim() ?? DEFAULT_SYNTHETIC_BASE_URL,
    modelName: env.SYNTHETIC_MODEL?.trim() ?? DEFAULT_SYNTHETIC_MODEL,
  };
}

/**
 * CLI 인자에서 소스 문서 문자열을 추출한다.
 *
 * @param argv Node 프로세스 인자 배열.
 * @returns 소스 문서 문자열 또는 `undefined`.
 */
export function resolveCliInput(argv: readonly string[]): string | undefined {
  const sourceDocument: string = argv.slice(2).join(' ').trim();
  return sourceDocument.length > 0 ? sourceDocument : undefined;
}

/**
 * 현재 모듈이 직접 실행 엔트리인지 판별한다.
 *
 * @param moduleUrl 현재 모듈 URL.
 * @param argv Node 프로세스 인자 배열.
 * @returns 직접 실행 여부.
 */
export function isDirectExecution(moduleUrl: string, argv: readonly string[]): boolean {
  const scriptPath: string | undefined = argv[1];
  if (!scriptPath) {
    return false;
  }

  const scriptUrl: string = pathToFileURL(resolve(scriptPath)).href;
  return scriptUrl === moduleUrl;
}

/**
 * 데이터 추출/변환 워크플로우 공개 진입점이다.
 *
 * Context:
 * - 호출자: CLI 엔트리, 테스트 코드.
 * - 데이터 흐름: 옵션 병합 -> 워크플로우 실행 -> 결과 로그 -> 반환.
 *
 * @param options 실행 옵션.
 * @returns 워크플로우 결과 객체.
 */
export async function runDataExtractionTransformationWorkflow(
  options: RunDataExtractionTransformationWorkflowInput = {},
): Promise<RunDataExtractionTransformationWorkflowResult> {
  const runtimeConfig: RuntimeConfig = options.runtimeConfig ?? buildRuntimeConfigFromEnv(options.env ?? process.env);
  const sourceDocument: string = options.sourceDocument ?? DEFAULT_INVOICE_TEXT;
  const logger: Logger = options.log ?? console.log;
  const workflowRunner: DataExtractionWorkflowRunner =
    options.workflowRunner ?? runDefaultDataExtractionTransformationWorkflow;

  logger('[data] extraction started');
  const result: RunDataExtractionTransformationWorkflowResult = await workflowRunner(sourceDocument, runtimeConfig);
  logger('[data] normalized invoice and calculation ready');
  logger(JSON.stringify(result.normalizedInvoice));

  return result;
}

/**
 * CLI 입력을 읽어 데이터 추출/변환 워크플로우를 실행한다.
 *
 * @returns 실행 완료 Promise.
 */
async function runFromCli(): Promise<void> {
  const sourceDocument: string | undefined = resolveCliInput(process.argv);
  await runDataExtractionTransformationWorkflow({
    sourceDocument,
  });
}

if (isDirectExecution(import.meta.url, process.argv)) {
  void runFromCli().catch((error: unknown): void => {
    const errorMessage: string = error instanceof Error ? error.message : String(error);
    console.error(errorMessage);
    process.exitCode = 1;
  });
}
