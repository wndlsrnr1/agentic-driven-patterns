/**
 * Run:
 * cd modules && node --env-file=.env --experimental-strip-types ./prompts-chaining/multimodal-multistep-reasoning.workflow.ts
 */
import { StringOutputParser } from "@langchain/core/output_parsers";
import { HumanMessage } from "@langchain/core/messages";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatOpenAI } from "@langchain/openai";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const DEFAULT_SYNTHETIC_BASE_URL: string =
  "https://api.synthetic.new/openai/v1";
const DEFAULT_SYNTHETIC_MODEL: string = "hf:moonshotai/Kimi-K2.5";
const DEFAULT_IMAGE_URL: string =
  "https://raw.githubusercontent.com/github/explore/main/topics/typescript/typescript.png";
const DEFAULT_LABEL_TABLE: string = [
  "| label | metric | threshold |",
  "|---|---:|---:|",
  "| A | 72 | 80 |",
  "| B | 91 | 80 |",
].join("\n");

/**
 * 멀티모달 추론 워크플로우 런타임 설정 계약이다.
 *
 * Context:
 * - 호출자: `buildRuntimeConfigFromEnv`, `runMultimodalMultistepReasoningWorkflow`.
 * - 사용 목적: 모델 호출에 필요한 인증/엔드포인트/모델 설정 전달.
 */
export type RuntimeConfig = {
  apiKey: string;
  baseUrl: string;
  modelName: string;
};

/**
 * 멀티모달 다단계 추론 결과 계약이다.
 *
 * Context:
 * - 호출자: CLI 엔트리, 테스트 코드.
 * - 데이터 흐름: 이미지 텍스트 추출 -> 라벨 매핑 -> 표 해석 -> 결론 생성 단계를 모두 포함한다.
 */
export type RunMultimodalMultistepReasoningWorkflowResult = {
  imageUrl: string;
  extractedText: string;
  labelMapping: string;
  tableInterpretation: string;
  finalConclusion: string;
  modelName: string;
};

type Logger = (message: string) => void;

type MultimodalWorkflowRunner = (
  imageUrl: string,
  runtimeConfig: RuntimeConfig,
) => Promise<RunMultimodalMultistepReasoningWorkflowResult>;

/**
 * 멀티모달 워크플로우 공개 진입점 옵션 계약이다.
 *
 * Context:
 * - 호출자: `runFromCli`, 테스트 코드.
 * - 사용 목적: 입력 이미지 URL, 런타임 설정, 로거, 러너를 주입한다.
 */
export type RunMultimodalMultistepReasoningWorkflowInput = {
  imageUrl?: string;
  runtimeConfig?: RuntimeConfig;
  env?: NodeJS.ProcessEnv;
  log?: Logger;
  workflowRunner?: MultimodalWorkflowRunner;
};

type StringRunnable<TInput> = {
  invoke(input: TInput): Promise<string>;
};

/**
 * 모델 메시지 콘텐츠에서 텍스트를 추출해 단일 문자열로 합친다.
 *
 * Context:
 * - 호출자: 멀티모달 `model.invoke` 결과 파싱 단계.
 *
 * @param content 모델 메시지 content(raw) 값.
 * @returns 결합된 텍스트 문자열.
 */
function extractMessageText(content: unknown): string {
  if (typeof content === "string") {
    return content;
  }

  if (Array.isArray(content)) {
    const textFragments: Array<string> = [];
    for (const chunk of content) {
      if (typeof chunk === "object" && chunk !== null && "text" in chunk) {
        const chunkText: unknown = (chunk as { text?: unknown }).text;
        if (typeof chunkText === "string") {
          textFragments.push(chunkText);
        }
      }
    }
    return textFragments.join(" ").trim();
  }

  return String(content);
}

/**
 * 런타임 설정 기반으로 LangChain 모델 인스턴스를 생성한다.
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
 * 멀티모달 입력 기반 다단계 추론 워크플로우 기본 체인을 실행한다.
 *
 * Context:
 * - 호출자: `runMultimodalMultistepReasoningWorkflow` 기본 러너.
 * - 데이터 흐름: 이미지 텍스트 추출 -> 라벨 매핑 -> 표 해석 -> 최종 결론.
 *
 * Side effects:
 * - 모델 invoke 단계에서 외부 API 네트워크 호출이 발생한다.
 *
 * @param imageUrl 분석 대상 이미지 URL.
 * @param runtimeConfig 모델 실행 설정.
 * @returns 다단계 추론 산출물.
 * @throws URL 형식이 잘못됐거나 멀티모달 추출 결과가 비어 있으면 `Error`.
 */
async function runDefaultMultimodalMultistepReasoningWorkflow(
  imageUrl: string,
  runtimeConfig: RuntimeConfig,
): Promise<RunMultimodalMultistepReasoningWorkflowResult> {
  if (!/^https?:\/\//.test(imageUrl)) {
    throw new Error("imageUrl must be an absolute http(s) URL.");
  }

  const model: ChatOpenAI = buildModel(runtimeConfig);
  const parser: StringOutputParser = new StringOutputParser();

  let extractedText: string;
  try {
    const multimodalResponse: { content: unknown } = (await model.invoke([
      new HumanMessage({
        content: [
          {
            type: "text",
            text: "Extract and describe the meaningful text or labels visible in this image.",
          },
          {
            type: "image_url",
            image_url: {
              url: imageUrl,
            },
          },
        ],
      }),
    ])) as { content: unknown };

    extractedText = extractMessageText(multimodalResponse.content).trim();
  } catch (error: unknown) {
    const errorMessage: string =
      error instanceof Error ? error.message : String(error);
    throw new Error(
      `Multimodal extraction failed. The current model may not support image inputs. Model: ${runtimeConfig.modelName}. Root cause: ${errorMessage}`,
    );
  }

  if (extractedText.length === 0) {
    throw new Error("Multimodal extraction returned empty text.");
  }

  // 텍스트와 표를 먼저 정렬해 라벨 의미를 매핑한다.
  const mappingChain: StringRunnable<{
    extracted_text: string;
    label_table: string;
  }> = ChatPromptTemplate.fromTemplate(
    [
      "Link extracted image text with labels in the table context.",
      "Return a concise mapping explanation in plain text.",
      "",
      "Extracted text:\n{extracted_text}",
      "",
      "Table:\n{label_table}",
    ].join("\n"),
  )
    .pipe(model)
    .pipe(parser) as StringRunnable<{
    extracted_text: string;
    label_table: string;
  }>;

  const labelMapping: string = await mappingChain.invoke({
    extracted_text: extractedText,
    label_table: DEFAULT_LABEL_TABLE,
  });

  // 매핑 결과를 바탕으로 임계치 초과 라벨을 해석한다.
  const interpretationChain: StringRunnable<{
    label_mapping: string;
    label_table: string;
  }> = ChatPromptTemplate.fromTemplate(
    [
      "Interpret the label mapping with the table and identify the required output.",
      "Explain which labels exceed threshold and why.",
      "",
      "Label mapping:\n{label_mapping}",
      "",
      "Table:\n{label_table}",
    ].join("\n"),
  )
    .pipe(model)
    .pipe(parser) as StringRunnable<{
    label_mapping: string;
    label_table: string;
  }>;

  const tableInterpretation: string = await interpretationChain.invoke({
    label_mapping: labelMapping,
    label_table: DEFAULT_LABEL_TABLE,
  });

  // 최종 사용자 전달용 결론 문단을 생성한다.
  const conclusionChain: StringRunnable<{ interpretation: string }> =
    ChatPromptTemplate.fromTemplate(
      [
        "Produce a final one-paragraph conclusion from the interpretation.",
        "",
        "{interpretation}",
      ].join("\n"),
    )
      .pipe(model)
      .pipe(parser) as StringRunnable<{ interpretation: string }>;

  const finalConclusion: string = await conclusionChain.invoke({
    interpretation: tableInterpretation,
  });

  return {
    imageUrl,
    extractedText,
    labelMapping,
    tableInterpretation,
    finalConclusion,
    modelName: runtimeConfig.modelName,
  };
}

/**
 * 환경 변수에서 멀티모달 워크플로우 런타임 설정을 생성한다.
 *
 * @param env 프로세스 환경 변수.
 * @returns 정규화된 런타임 설정.
 * @throws `SYNTHETIC_API_KEY`가 없으면 `Error`.
 */
export function buildRuntimeConfigFromEnv(
  env: NodeJS.ProcessEnv,
): RuntimeConfig {
  const apiKey: string | undefined = env.SYNTHETIC_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("SYNTHETIC_API_KEY is missing.");
  }

  return {
    apiKey,
    baseUrl: env.SYNTHETIC_BASE_URL?.trim() ?? DEFAULT_SYNTHETIC_BASE_URL,
    modelName: env.SYNTHETIC_MODEL?.trim() ?? DEFAULT_SYNTHETIC_MODEL,
  };
}

/**
 * CLI 인자에서 이미지 URL을 추출한다.
 *
 * @param argv Node 프로세스 인자 배열.
 * @returns 이미지 URL 또는 `undefined`.
 */
export function resolveCliInput(argv: readonly string[]): string | undefined {
  const imageUrl: string = argv[2]?.trim() ?? "";
  return imageUrl.length > 0 ? imageUrl : undefined;
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
 * 멀티모달 다단계 추론 워크플로우 공개 진입점이다.
 *
 * Context:
 * - 호출자: CLI 엔트리, 테스트 코드.
 * - 데이터 흐름: 옵션 병합 -> 워크플로우 실행 -> 결론 로그 -> 결과 반환.
 *
 * @param options 실행 옵션.
 * @returns 워크플로우 결과 객체.
 */
export async function runMultimodalMultistepReasoningWorkflow(
  options: RunMultimodalMultistepReasoningWorkflowInput = {},
): Promise<RunMultimodalMultistepReasoningWorkflowResult> {
  const runtimeConfig: RuntimeConfig =
    options.runtimeConfig ??
    buildRuntimeConfigFromEnv(options.env ?? process.env);
  const imageUrl: string = options.imageUrl ?? DEFAULT_IMAGE_URL;
  const logger: Logger = options.log ?? console.log;
  const workflowRunner: MultimodalWorkflowRunner =
    options.workflowRunner ?? runDefaultMultimodalMultistepReasoningWorkflow;

  logger(`[multimodal] image URL: ${imageUrl}`);
  const result: RunMultimodalMultistepReasoningWorkflowResult =
    await workflowRunner(imageUrl, runtimeConfig);
  logger("[multimodal] final conclusion ready");
  logger(result.finalConclusion);

  return result;
}

/**
 * CLI 입력을 읽어 멀티모달 워크플로우를 실행한다.
 *
 * @returns 실행 완료 Promise.
 */
async function runFromCli(): Promise<void> {
  const imageUrl: string | undefined = resolveCliInput(process.argv);
  await runMultimodalMultistepReasoningWorkflow({
    imageUrl,
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
