import { Body, Controller, Post } from '@nestjs/common';
import { PromptsChainService } from '../service/prompts-chain.service.js';
import { PromptsChainRunRequestDto } from '../service/dto/prompts-chain-run.request.dto.js';
import type { PromptsChainRunResponseDto } from '../service/dto/prompts-chain-run.response.dto.js';

/**
 * prompts-chain의 HTTP 경계 원칙을 문서화한다.
 *
 * Context:
 * - 적용 대상: `PromptsChainController`.
 * - 사용 목적: 입력 검증/서비스 위임 외 비즈니스 분기를 컨트롤러에 두지 않는 규칙을 명시한다.
 */
/**
 * prompts-chain HTTP 진입점을 제공하는 컨트롤러다.
 *
 * Context:
 * - 호출자: NestJS 라우터(`POST /v1/prompts-chain/run`)와 controller 단위 테스트.
 * - 사용 목적: 요청 DTO를 검증 파이프라인에 통과시킨 뒤 서비스 계층으로 위임한다.
 * - 데이터 흐름: HTTP Body -> `PromptsChainRunRequestDto` -> `PromptsChainService.run` -> API 응답 DTO.
 *
 * Side effects:
 * - 없음(비즈니스 처리/외부 I/O는 서비스 이하 계층에 위임).
 */
@Controller('v1/prompts-chain')
export class PromptsChainController {
  constructor(private readonly promptsChainService: PromptsChainService) {}

  /**
   * 원문 텍스트에서 스펙 추출/정규화 체인을 실행한다.
   *
   * Context:
   * - 호출자: `POST /v1/prompts-chain/run` 엔드포인트.
   * - 사용 목적: 컨트롤러 계층에서 입력 계약을 서비스 유스케이스로 전달한다.
   * - 데이터 흐름: `request.sourceText` -> `PromptsChainService.run` -> `PromptsChainRunResponseDto`.
   *
   * Side effects:
   * - 없음(실제 외부 LLM 호출은 repository/client 계층에서 수행).
   *
   * @param request class-validator 검증이 적용된 실행 요청 DTO.
   * @returns 모델 원문/정규화 결과와 모델명을 포함한 응답 DTO.
   * @throws 하위 계층 예외(설정 누락, 파싱 실패 등)가 전파될 수 있다.
   */
  @Post('run')
  async runChain(@Body() request: PromptsChainRunRequestDto): Promise<PromptsChainRunResponseDto> {
    return this.promptsChainService.run(request);
  }
}
