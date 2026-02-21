/**
 * prompts-chain client가 런타임에 사용하는 LLM 연결 설정 계약이다.
 *
 * Context:
 * - 생성자: `PromptsChainSettingsService.getRuntimeConfig`.
 * - 소비자: `LangchainPromptsChainClient.runChain`.
 * - 데이터 흐름: 환경 변수 -> 설정 DTO -> 모델 인스턴스 생성.
 */
export type PromptsChainRuntimeConfigDto = {
  apiKey: string;
  baseUrl: string;
  modelName: string;
};
