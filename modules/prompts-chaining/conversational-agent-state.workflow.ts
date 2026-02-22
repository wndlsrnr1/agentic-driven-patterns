import { StringOutputParser } from '@langchain/core/output_parsers';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { ChatOpenAI } from '@langchain/openai';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const DEFAULT_SYNTHETIC_BASE_URL: string = 'https://api.synthetic.new/openai/v1';
const DEFAULT_SYNTHETIC_MODEL: string = 'hf:moonshotai/Kimi-K2.5';
const DEFAULT_TURNS: Array<string> = [
  'Hi, I need help scheduling a project kickoff meeting.',
  'The attendees are Mina and David.',
  'Please schedule it next Tuesday at 10 AM in Seoul.',
];

/**
 * 대화 상태 워크플로우 실행에 필요한 런타임 설정 계약이다.
 *
 * Context:
 * - 호출자: `buildRuntimeConfigFromEnv`, `runConversationalAgentStateWorkflow`.
 * - 사용 목적: 모델 호출에 필요한 공통 설정을 전달한다.
 */
export type RuntimeConfig = {
  apiKey: string;
  baseUrl: string;
  modelName: string;
};

/**
 * 멀티턴 대화 누적 상태 계약이다.
 *
 * Context:
 * - 호출자: `runDefaultConversationalAgentStateWorkflow` 내부 루프.
 * - 데이터 흐름: 매 턴 분석 결과를 병합해 다음 턴 분석/응답 입력으로 재사용한다.
 */
export type ConversationState = {
  lastIntent: string | null;
  collectedEntities: Record<string, string>;
  pendingInfo: string | null;
};

/**
 * 단일 사용자 턴의 분석/응답 결과 계약이다.
 *
 * Context:
 * - 호출자: `runDefaultConversationalAgentStateWorkflow`가 turns 배열에 누적한다.
 */
export type ConversationTurnResult = {
  userUtterance: string;
  intent: string;
  entities: Record<string, string>;
  response: string;
  nextRequiredInfo: string | null;
};

/**
 * 대화 상태 워크플로우 최종 결과 계약이다.
 *
 * Context:
 * - 호출자: CLI 엔트리와 테스트 코드.
 * - 데이터 흐름: 턴 목록, 최종 상태, 모델명을 함께 반환한다.
 */
export type RunConversationalAgentStateWorkflowResult = {
  turns: Array<ConversationTurnResult>;
  finalState: ConversationState;
  modelName: string;
};

type Logger = (message: string) => void;

type ConversationWorkflowRunner = (
  userTurns: Array<string>,
  runtimeConfig: RuntimeConfig,
) => Promise<RunConversationalAgentStateWorkflowResult>;

/**
 * 대화 상태 워크플로우 공개 진입점 옵션 계약이다.
 *
 * Context:
 * - 호출자: CLI(`runFromCli`)와 테스트 코드.
 * - 사용 목적: 사용자 턴/환경/로거/러너를 주입해 실행 경로를 제어한다.
 */
export type RunConversationalAgentStateWorkflowInput = {
  userTurns?: Array<string>;
  runtimeConfig?: RuntimeConfig;
  env?: NodeJS.ProcessEnv;
  log?: Logger;
  workflowRunner?: ConversationWorkflowRunner;
};

type StringRunnable<TInput> = {
  invoke(input: TInput): Promise<string>;
};

type TurnAnalysisPayload = {
  intent: string;
  entities: Record<string, unknown>;
  next_required_info: unknown;
};

/**
 * 모델 응답 코드 펜스를 제거한다.
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
 * JSON 문자열을 지정 타입 객체로 파싱한다.
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
 * - 호출자: `runDefaultConversationalAgentStateWorkflow`.
 * - Side effects: 후속 invoke 호출 시 외부 API 네트워크 I/O가 발생한다.
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
 * 파이프(`|`) 구분 입력을 사용자 턴 목록으로 분해한다.
 *
 * @param rawText CLI 입력 원문.
 * @returns 비어 있지 않은 턴 문자열 목록.
 */
function parseTurnsFromInput(rawText: string): Array<string> {
  return rawText
    .split('|')
    .map((turn: string): string => turn.trim())
    .filter((turn: string): boolean => turn.length > 0);
}

/**
 * 분석 payload의 엔티티 값을 문자열 딕셔너리로 정규화한다.
 *
 * Context:
 * - 호출자: `runDefaultConversationalAgentStateWorkflow`.
 * - 사용 목적: 객체/숫자 등 문자열이 아닌 값을 로그/상태 저장 가능한 문자열로 통일한다.
 *
 * @param entities 모델 분석 결과의 엔티티 객체.
 * @returns 문자열 값으로 정규화된 엔티티 맵.
 */
function normalizeEntityValues(
  entities: Record<string, unknown>,
): Record<string, string> {
  const normalizedEntries: Array<[string, string]> = Object.entries(entities).map(
    ([key, value]: [string, unknown]): [string, string] => {
      if (typeof value === "string") {
        return [key, value];
      }
      return [key, JSON.stringify(value)];
    },
  );
  return Object.fromEntries(normalizedEntries) as Record<string, string>;
}

/**
 * 모델이 반환한 선택적 필드를 `string | null`로 정규화한다.
 *
 * Context:
 * - 호출자: `runDefaultConversationalAgentStateWorkflow`.
 * - 사용 목적: 빈 배열/빈 객체/빈 문자열을 모두 `null`로 처리해 상태 계약을 단순화한다.
 *
 * @param value 모델 분석 payload의 선택 필드 값.
 * @returns 의미 있는 문자열 또는 `null`.
 */
function normalizeOptionalText(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (Array.isArray(value) && value.length === 0) {
    return null;
  }
  if (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    Object.keys(value).length === 0
  ) {
    return null;
  }
  if (typeof value === "string") {
    const trimmedValue: string = value.trim();
    return trimmedValue.length > 0 ? trimmedValue : null;
  }
  const normalizedValue: string = JSON.stringify(value).trim();
  return normalizedValue.length > 0 ? normalizedValue : null;
}

/**
 * 멀티턴 대화 상태 추적 워크플로우 기본 체인을 실행한다.
 *
 * Context:
 * - 호출자: `runConversationalAgentStateWorkflow` 기본 러너.
 * - 데이터 흐름: 사용자 턴 순회 -> intent/entities 분석 -> 상태 병합 -> 응답 생성.
 *
 * @param userTurns 사용자 발화 목록.
 * @param runtimeConfig 모델 실행 설정.
 * @returns 턴별 결과와 최종 상태.
 * @throws 사용자 턴 목록이 비어 있으면 `Error`.
 */
async function runDefaultConversationalAgentStateWorkflow(
  userTurns: Array<string>,
  runtimeConfig: RuntimeConfig,
): Promise<RunConversationalAgentStateWorkflowResult> {
  if (userTurns.length === 0) {
    throw new Error('At least one user turn is required.');
  }

  const model: ChatOpenAI = buildModel(runtimeConfig);
  const parser: StringOutputParser = new StringOutputParser();

  const analysisChain: StringRunnable<{
    user_utterance: string;
    state_json: string;
  }> = ChatPromptTemplate.fromTemplate(
    [
      'Analyze the user utterance with the current conversation state.',
      'Return strict JSON with keys: intent, entities, next_required_info.',
      'entities must be an object of key-value pairs.',
      'Do not include markdown fences.',
      '',
      'Current state JSON:\n{state_json}',
      '',
      'User utterance:\n{user_utterance}',
    ].join('\n'),
  )
    .pipe(model)
    .pipe(parser) as StringRunnable<{
    user_utterance: string;
    state_json: string;
  }>;

  const responseChain: StringRunnable<{
    state_json: string;
    user_utterance: string;
  }> = ChatPromptTemplate.fromTemplate(
    [
      'Generate a helpful assistant response based on user utterance and state.',
      'Keep response concise and task-oriented.',
      '',
      'State JSON:\n{state_json}',
      '',
      'User utterance:\n{user_utterance}',
    ].join('\n'),
  )
    .pipe(model)
    .pipe(parser) as StringRunnable<{
    state_json: string;
    user_utterance: string;
  }>;

  const turns: Array<ConversationTurnResult> = [];
  let conversationState: ConversationState = {
    lastIntent: null,
    collectedEntities: {},
    pendingInfo: null,
  };

  for (const userUtterance of userTurns) {
    const analysisRaw: string = await analysisChain.invoke({
      user_utterance: userUtterance,
      state_json: JSON.stringify(conversationState),
    });

    const analysis: TurnAnalysisPayload = parseJsonObject<TurnAnalysisPayload>(analysisRaw);
    const normalizedEntities: Record<string, string> = normalizeEntityValues(
      analysis.entities ?? {},
    );
    const normalizedNextRequiredInfo: string | null = normalizeOptionalText(
      analysis.next_required_info,
    );

    const mergedEntities: Record<string, string> = {
      ...conversationState.collectedEntities,
      ...normalizedEntities,
    };

    conversationState = {
      lastIntent: analysis.intent,
      collectedEntities: mergedEntities,
      pendingInfo: normalizedNextRequiredInfo,
    };

    const response: string = await responseChain.invoke({
      state_json: JSON.stringify(conversationState),
      user_utterance: userUtterance,
    });

    turns.push({
      userUtterance,
      intent: analysis.intent,
      entities: normalizedEntities,
      response,
      nextRequiredInfo: normalizedNextRequiredInfo,
    });
  }

  return {
    turns,
    finalState: conversationState,
    modelName: runtimeConfig.modelName,
  };
}

/**
 * 환경 변수에서 대화 워크플로우 런타임 설정을 생성한다.
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
 * CLI 인자에서 사용자 턴 목록을 추출한다.
 *
 * @param argv Node 프로세스 인자 배열.
 * @returns 턴 목록 또는 `undefined`.
 */
export function resolveCliInput(argv: readonly string[]): Array<string> | undefined {
  const rawTurnsText: string = argv.slice(2).join(' ').trim();
  if (rawTurnsText.length === 0) {
    return undefined;
  }

  const turns: Array<string> = parseTurnsFromInput(rawTurnsText);
  return turns.length > 0 ? turns : undefined;
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
 * 대화 상태 워크플로우의 공개 진입점이다.
 *
 * Context:
 * - 호출자: CLI 엔트리, 테스트 코드.
 * - 데이터 흐름: 옵션 병합 -> 워크플로우 실행 -> 최종 상태 로깅 -> 결과 반환.
 *
 * @param options 실행 옵션.
 * @returns 대화 상태 결과.
 */
export async function runConversationalAgentStateWorkflow(
  options: RunConversationalAgentStateWorkflowInput = {},
): Promise<RunConversationalAgentStateWorkflowResult> {
  const runtimeConfig: RuntimeConfig = options.runtimeConfig ?? buildRuntimeConfigFromEnv(options.env ?? process.env);
  const userTurns: Array<string> = options.userTurns ?? DEFAULT_TURNS;
  const logger: Logger = options.log ?? console.log;
  const workflowRunner: ConversationWorkflowRunner =
    options.workflowRunner ?? runDefaultConversationalAgentStateWorkflow;

  logger(`[conversation] turns: ${userTurns.length}`);
  const result: RunConversationalAgentStateWorkflowResult = await workflowRunner(userTurns, runtimeConfig);
  logger('[conversation] final state');
  logger(JSON.stringify(result.finalState));

  return result;
}

/**
 * CLI 입력을 읽어 대화 상태 워크플로우를 실행한다.
 *
 * @returns 실행 완료 Promise.
 */
async function runFromCli(): Promise<void> {
  const userTurns: Array<string> | undefined = resolveCliInput(process.argv);
  await runConversationalAgentStateWorkflow({
    userTurns,
  });
}

if (isDirectExecution(import.meta.url, process.argv)) {
  void runFromCli().catch((error: unknown): void => {
    const errorMessage: string = error instanceof Error ? error.message : String(error);
    console.error(errorMessage);
    process.exitCode = 1;
  });
}
