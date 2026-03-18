import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { ChatOpenAI } from "@langchain/openai";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const DEFAULT_BASE_URL: string = "https://api.synthetic.new/openai/v1";
const DEFAULT_MODEL: string = "hf:moonshotai/Kimi-K2.5";

export const DEFAULT_EXAMPLE_INPUT_TEXT: string =
  "The new laptop model features a 3.5 GHz octa-core processor, 16GB of RAM, and a 1TB NVMe SSD.";

export const PROMPTS_CHAIN_EXAMPLE_NPM_SCRIPT: string = "prompts-chain:example";
export const PROMPTS_CHAIN_EXAMPLE_COMMAND: string =
  "node --env-file=src/config/.env --loader ts-node/esm src/prompts-chain/example/example.ts";

/**
 * 예제 실행 로그 출력을 위한 로거 함수 계약이다.
 */
type Logger = (message: string) => void;

/**
 * 문자열 결과를 반환하는 Runnable 최소 계약이다.
 *
 * Context:
 * - 호출자: extraction/full chain 타입 캐스팅.
 */
type StringRunnable<TInput> = {
  invoke(input: TInput): Promise<string>;
};

/**
 * 예제 실행에 필요한 런타임 설정 계약이다.
 *
 * Context:
 * - 호출자: `buildRuntimeConfigFromEnv`, `runPromptsChainExample`.
 * - 사용 목적: LLM 생성 시 API 키/베이스 URL/모델명을 전달한다.
 */
export type PromptsChainRuntimeConfig = {
  apiKey: string;
  baseUrl: string;
  modelName: string;
};

/**
 * 예제 실행 결과 계약이다.
 *
 * Context:
 * - 호출자: CLI 출력 확인 및 테스트 코드.
 * - 데이터 흐름: `full_chain.invoke` 결과 문자열과 모델명을 반환한다.
 */
export type PromptsChainExampleResult = {
  finalResult: string;
  modelName: string;
};

/**
 * 전체 체인 실행 함수 계약이다.
 *
 * Context:
 * - 호출자: `runPromptsChainExample`.
 * - 사용 목적: 기본 체인과 테스트 대체 체인을 같은 인터페이스로 주입한다.
 */
type FullChainRunner = (
  inputText: string,
  runtimeConfig: PromptsChainRuntimeConfig,
) => Promise<string>;

/**
 * Python 예제와 1:1에 가깝게 LCEL 체인을 구성해 실행한다.
 *
 * Context:
 * - 호출자: `runPromptsChainExample` 기본 실행 경로.
 * - 사용 목적: 외부 계층 export 의존 없이 example 모듈 내부에서 체인을 자기완결적으로 구성한다.
 * - 데이터 흐름: `text_input` -> extraction_chain -> transform prompt -> parser(string).
 *
 * Side effects:
 * - 외부 LLM API 네트워크 호출이 발생할 수 있다.
 *
 * @param inputText 원문 스펙 문장.
 * @param runtimeConfig API 키/URL/모델 설정.
 * @returns 최종 JSON 문자열.
 */
async function runDefaultFullChain(
  inputText: string,
  runtimeConfig: PromptsChainRuntimeConfig,
): Promise<string> {
  const llm: ChatOpenAI = new ChatOpenAI({
    apiKey: runtimeConfig.apiKey,
    model: runtimeConfig.modelName,
    temperature: 0,
    configuration: {
      baseURL: runtimeConfig.baseUrl,
    },
  });

  const promptExtract: ReturnType<typeof ChatPromptTemplate.fromTemplate> =
    ChatPromptTemplate.fromTemplate(
      "Extract the technical specifications from the following text:\n\n{text_input}",
    );

  const promptTransform: ReturnType<typeof ChatPromptTemplate.fromTemplate> =
    ChatPromptTemplate.fromTemplate(
      "Transform the following specifications into a JSON object with 'cpu', 'memory', and 'storage' as keys:\n\n{specifications}",
    );

  const extractionChain: StringRunnable<{ text_input: string }> = promptExtract
    .pipe(llm)
    .pipe(new StringOutputParser()) as StringRunnable<{ text_input: string }>;

  const fullChain: StringRunnable<{ text_input: string }> =
    RunnableSequence.from([
      {
        specifications: extractionChain,
      },
      promptTransform,
      llm,
      new StringOutputParser(),
    ]) as StringRunnable<{ text_input: string }>;

  const finalResult: string = await fullChain.invoke({ text_input: inputText });
  return finalResult;
}

/**
 * prompts-chain TypeScript 예제 공개 진입점 입력 옵션 계약이다.
 *
 * Context:
 * - 호출자: CLI(`runFromCli`), 테스트 코드.
 * - 사용 목적: 입력 텍스트/런타임/로거/체인 러너를 주입해 실행 경로를 제어한다.
 */
export type RunPromptsChainExampleInput = {
  inputText?: string;
  runtimeConfig?: PromptsChainRuntimeConfig;
  env?: NodeJS.ProcessEnv;
  log?: Logger;
  chainRunner?: FullChainRunner;
};

/**
 * 환경 변수에서 예제 실행 runtime 설정을 생성한다.
 *
 * Context:
 * - 호출자: `runPromptsChainExample`.
 * - 사용 목적: .env 값을 예제 전용 런타임 계약으로 변환한다.
 * - 데이터 흐름: env 문자열 -> trim/default 적용 -> `PromptsChainRuntimeConfig`.
 *
 * @param env 실행 시점 환경 변수.
 * @returns 예제 런타임 설정.
 * @throws `API_KEY`가 없을 때 `Error`.
 */
export function buildRuntimeConfigFromEnv(
  env: NodeJS.ProcessEnv,
): PromptsChainRuntimeConfig {
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
 * CLI 인자에서 사용자 입력 텍스트를 추출한다.
 *
 * @param argv Node 프로세스 인자 배열.
 * @returns 사용자 입력 문자열 또는 `undefined`.
 */
export function resolveCliInputText(
  argv: readonly string[],
): string | undefined {
  const inputText: string = argv.slice(2).join(" ").trim();
  return inputText.length > 0 ? inputText : undefined;
}

/**
 * 현재 파일이 엔트리포인트로 직접 실행되었는지 판별한다.
 *
 * @param moduleUrl 현재 모듈의 `import.meta.url`.
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
 * prompts-chain 예제를 실행하고 최종 JSON 결과를 출력한다.
 *
 * Context:
 * - 호출자: `runFromCli`, 테스트 코드.
 * - 사용 목적: Python 예제와 동일한 목적(텍스트 추출 후 JSON 변환)을 TypeScript로 실행한다.
 * - 데이터 흐름: input/env -> `runDefaultFullChain` -> 콘솔 출력 + 결과 반환.
 *
 * @param options 실행 옵션.
 * @returns 최종 결과 문자열과 모델명.
 */
export async function runPromptsChainExample(
  options: RunPromptsChainExampleInput = {},
): Promise<PromptsChainExampleResult> {
  const runtimeConfig: PromptsChainRuntimeConfig =
    options.runtimeConfig ??
    buildRuntimeConfigFromEnv(options.env ?? process.env);
  const inputText: string = options.inputText ?? DEFAULT_EXAMPLE_INPUT_TEXT;
  const logger: Logger = options.log ?? console.log;
  const chainRunner: FullChainRunner =
    options.chainRunner ?? runDefaultFullChain;

  const finalResult: string = await chainRunner(inputText, runtimeConfig);

  logger("--- Final JSON Output ---");
  logger(finalResult);

  return {
    finalResult,
    modelName: runtimeConfig.modelName,
  };
}

/**
 * CLI 인자를 읽어 TypeScript prompts-chain 예제를 실행한다.
 *
 * @returns 실행 완료 Promise.
 */
async function runFromCli(): Promise<void> {
  const inputText: string | undefined = resolveCliInputText(process.argv);
  await runPromptsChainExample({
    inputText,
  });
}

if (isDirectExecution(import.meta.url, process.argv)) {
  void runFromCli().catch((error: unknown) => {
    const errorMessage: string =
      error instanceof Error ? error.message : String(error);
    console.error(errorMessage);
    process.exitCode = 1;
  });
}
