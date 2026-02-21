import type { StructuredSpecsProps } from '../../entity/structured-specs.entity.js';

/**
 * prompts-chain 실행 결과를 API 경계로 반환하는 응답 계약 DTO다.
 *
 * Context:
 * - 생성자: `PromptsChainService.run`.
 * - 소비자: `PromptsChainController.runChain` 응답 및 API 소비 클라이언트.
 * - 데이터 흐름: repository/client 원문 결과 + parser 구조화 결과 -> HTTP JSON 응답.
 */
export type PromptsChainRunResponseDto = {
  extractedSpecsText: string;
  structuredSpecs: StructuredSpecsProps;
  transformedSpecsText: string;
  modelName: string;
};
