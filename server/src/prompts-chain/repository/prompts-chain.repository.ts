/**
 * repository 계층이 입력으로 받는 prompts-chain 실행 페이로드다.
 *
 * Context:
 * - 호출자: `PromptsChainService.run`.
 * - 사용 목적: service 계층에서 필요한 최소 입력만 repository port로 전달한다.
 * - 데이터 흐름: API 요청 텍스트 -> repository 구현체 -> 외부 LLM client.
 */
export type PromptsChainRepositoryInput = {
  sourceText: string;
};

/**
 * repository 계층이 service에 반환하는 원시 실행 결과다.
 *
 * Context:
 * - 호출자: `PromptsChainService.run`.
 * - 사용 목적: 후속 파싱 전에 LLM 원문 출력과 모델 메타데이터를 전달한다.
 * - 데이터 흐름: client 결과 -> repository result -> service parser.
 */
export type PromptsChainRepositoryResult = {
  extractedSpecsText: string;
  transformedSpecsText: string;
  modelName: string;
};

/**
 * prompts-chain 외부 연동 포트 계약이다.
 *
 * Context:
 * - 호출자: `PromptsChainService`.
 * - 구현체: `PromptsChainRepositoryImpl`.
 * - 사용 목적: 서비스 계층이 인프라 구현체에 직접 의존하지 않도록 추상화한다.
 */
export interface PromptsChainRepository {
  /**
   * 입력 텍스트에 대한 추출/변환 체인을 실행한다.
   *
   * Context:
   * - 호출자: `PromptsChainService.run`.
   * - 데이터 흐름: `PromptsChainRepositoryInput` -> repository 구현 -> `PromptsChainRepositoryResult`.
   *
   * @param input 실행할 원문 텍스트를 포함한 입력.
   * @returns 추출/변환 원문과 모델명을 담은 결과.
   */
  runChain(input: PromptsChainRepositoryInput): Promise<PromptsChainRepositoryResult>;
}

/**
 * repository 구현체를 DI 컨테이너에 바인딩하기 위한 토큰이다.
 *
 * Context:
 * - 등록 위치: `PromptsChainModule` providers.
 * - 사용 위치: `PromptsChainService` 생성자 `@Inject`.
 */
export const PROMPTS_CHAIN_REPOSITORY = Symbol('PROMPTS_CHAIN_REPOSITORY');
