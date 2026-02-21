import { Inject, Injectable, Optional } from '@nestjs/common';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { ChatOpenAI } from '@langchain/openai';
import type { PromptsChainRuntimeConfigDto } from '../config/dto/prompts-chain-runtime-config.dto.js';
import { PROMPTS_CHAIN_RUNTIME } from '../config/prompts-chain.tokens.js';

/**
 * 추출 체인 실행 입력 계약이다.
 *
 * Context:
 * - 호출자: `LangchainPromptsChainClient.runChain`.
 * - 사용 목적: 추출 프롬프트 템플릿 변수명(`text_input`)을 고정한다.
 */
type ExtractionInput = {
  text_input: string;
};

/**
 * 변환 체인 실행 입력 계약이다.
 *
 * Context:
 * - 호출자: `LangchainPromptsChainClient.runChain`.
 * - 사용 목적: 변환 프롬프트 템플릿 변수명(`specifications`)을 고정한다.
 */
type TransformInput = {
  specifications: string;
};

/**
 * 문자열 결과를 반환하는 LangChain runnable 최소 계약이다.
 *
 * Context:
 * - 생성자: runtime의 `createExtractionChain`, `createTransformChain`.
 * - 사용 목적: 실제 런타임/테스트 mock 모두 동일한 invoke 시그니처를 유지한다.
 */
type StringRunnable<TInput> = {
  invoke(input: TInput): Promise<string>;
};

/**
 * client 계층이 repository에 반환하는 원시 실행 결과 계약이다.
 *
 * Context:
 * - 생성자: `LangchainPromptsChainClient.runChain`.
 * - 소비자: `PromptsChainRepositoryImpl` -> `PromptsChainService`.
 */
export type PromptsChainClientResult = {
  extractedSpecsText: string;
  transformedSpecsText: string;
  modelName: string;
};

/**
 * LangChain 런타임 조립 책임을 분리한 추상 계약이다.
 *
 * Context:
 * - 기본 구현: `defaultLangchainPromptsChainRuntime`.
 * - 대체 구현: client 단위 테스트 runtime mock.
 * - 사용 목적: DI를 통한 테스트 가능성과 런타임 교체 용이성을 확보한다.
 */
export type LangchainPromptsChainRuntime = {
  createModel(config: PromptsChainRuntimeConfigDto): ChatOpenAI;
  createExtractionChain(model: ChatOpenAI): StringRunnable<ExtractionInput>;
  createTransformChain(model: ChatOpenAI): StringRunnable<TransformInput>;
};

/**
 * 프로덕션 기본 LangChain 런타임 구현체다.
 *
 * Context:
 * - 등록자: `PromptsChainModule`의 `PROMPTS_CHAIN_RUNTIME` provider.
 * - 사용 목적: 모델 생성 및 체인 조립 규칙을 한 곳에 모은다.
 * - 데이터 흐름: runtime config -> model -> extraction/transform chain.
 */
export const defaultLangchainPromptsChainRuntime: LangchainPromptsChainRuntime = {
  /**
   * OpenAI 호환 Chat 모델 인스턴스를 생성한다.
   *
   * @param config API 키/베이스 URL/모델명을 포함한 런타임 설정.
   * @returns LangChain `ChatOpenAI` 인스턴스.
   */
  createModel(config: PromptsChainRuntimeConfigDto): ChatOpenAI {
    return new ChatOpenAI({
      apiKey: config.apiKey,
      model: config.modelName,
      temperature: 0,
      configuration: {
        baseURL: config.baseUrl,
      },
    });
  },
  /**
   * 원문 텍스트에서 기술 스펙을 추출하는 체인을 생성한다.
   *
   * @param model 추론에 사용할 Chat 모델 인스턴스.
   * @returns 입력(`text_input`)을 문자열 추출 결과로 변환하는 runnable.
   */
  createExtractionChain(model: ChatOpenAI): StringRunnable<ExtractionInput> {
    const extractPrompt = ChatPromptTemplate.fromTemplate(
      'Extract the technical specifications from the following text:\n\n{text_input}',
    );
    return extractPrompt.pipe(model).pipe(new StringOutputParser()) as StringRunnable<ExtractionInput>;
  },
  /**
   * 추출된 스펙 텍스트를 JSON 형태로 변환하는 체인을 생성한다.
   *
   * @param model 추론에 사용할 Chat 모델 인스턴스.
   * @returns 입력(`specifications`)을 문자열(JSON 기대)로 변환하는 runnable.
   */
  createTransformChain(model: ChatOpenAI): StringRunnable<TransformInput> {
    const transformPrompt = ChatPromptTemplate.fromTemplate(
      "Transform the following specifications into a JSON object with 'cpu', 'memory', and 'storage' as keys:\n\n{specifications}",
    );
    return transformPrompt.pipe(model).pipe(new StringOutputParser()) as StringRunnable<TransformInput>;
  },
};

/**
 * LangChain 기반 prompts-chain 외부 LLM 연동 클라이언트다.
 *
 * Context:
 * - 호출자: `PromptsChainRepositoryImpl.runChain`.
 * - 사용 목적: 추출 체인과 변환 체인을 순차 실행해 원시 결과를 반환한다.
 * - 데이터 흐름: source text -> extraction chain -> transform chain -> repository result.
 *
 * Side effects:
 * - 외부 LLM API 네트워크 호출이 발생한다.
 */
@Injectable()
export class LangchainPromptsChainClient {
  constructor(
    @Optional()
    @Inject(PROMPTS_CHAIN_RUNTIME)
    private readonly runtime: LangchainPromptsChainRuntime = defaultLangchainPromptsChainRuntime,
  ) {}

  /**
   * prompts-chain 2단계 체인(추출 -> 변환)을 실행한다.
   *
   * Context:
   * - 호출자: `PromptsChainRepositoryImpl.runChain`.
   * - 사용 목적: repository가 바로 사용할 수 있는 원시 문자열 결과를 생성한다.
   * - 데이터 흐름: `sourceText` -> extraction result -> transform result -> `PromptsChainClientResult`.
   *
   * Side effects:
   * - 외부 LLM 호출 및 네트워크 지연/오류가 발생할 수 있다.
   *
   * @param sourceText 기술 스펙을 포함한 입력 원문.
   * @param runtimeConfig 모델/엔드포인트/API 키 설정.
   * @returns 추출 텍스트, 변환 텍스트, 모델명을 포함한 실행 결과.
   * @throws 런타임/네트워크/모델 호출 예외가 그대로 전파될 수 있다.
   */
  async runChain(
    sourceText: string,
    runtimeConfig: PromptsChainRuntimeConfigDto,
  ): Promise<PromptsChainClientResult> {
    const model = this.runtime.createModel(runtimeConfig);
    const extractionChain = this.runtime.createExtractionChain(model);
    const transformChain = this.runtime.createTransformChain(model);

    const extractedSpecsText = await extractionChain.invoke({
      text_input: sourceText,
    });
    const transformedSpecsText = await transformChain.invoke({
      specifications: extractedSpecsText,
    });

    return {
      extractedSpecsText,
      transformedSpecsText,
      modelName: runtimeConfig.modelName,
    };
  }
}
