import { IsNotEmpty, IsString } from 'class-validator';

/**
 * prompts-chain 실행 요청 HTTP 계약 DTO다.
 *
 * Context:
 * - 호출자: `PromptsChainController.runChain`의 `@Body`.
 * - 사용 목적: 입력 텍스트의 존재/문자열 타입을 경계에서 검증한다.
 * - 데이터 흐름: HTTP body -> class-validator -> service input.
 *
 * Side effects:
 * - 검증 실패 시 NestJS validation pipe가 4xx 응답을 생성한다.
 */
export class PromptsChainRunRequestDto {
  /**
   * LLM 추출 체인에 전달할 원문 텍스트다.
   *
   * Context:
   * - 소비자: `PromptsChainService.run`.
   * - 제약: 빈 문자열은 허용하지 않는다.
   */
  @IsString()
  @IsNotEmpty()
  sourceText!: string;
}
