import { Inject, Injectable } from '@nestjs/common';
import { StructuredOutputParserUtil } from '../utils/structured-output-parser.util.js';
import {
  PROMPTS_CHAIN_REPOSITORY,
  type PromptsChainRepository,
} from '../repository/prompts-chain.repository.js';
import type { PromptsChainRunRequestDto } from './dto/prompts-chain-run.request.dto.js';
import type { PromptsChainRunResponseDto } from './dto/prompts-chain-run.response.dto.js';

/**
 * prompts-chain 서비스 계층의 책임 경계를 설명한다.
 *
 * Context:
 * - 적용 대상: `PromptsChainService`.
 * - 사용 목적: repository 호출과 parser 조합만 담당하고 HTTP/인프라 세부사항은 다루지 않음을 고정한다.
 */
/**
 * prompts-chain 유스케이스 오케스트레이션을 담당한다.
 *
 * Context:
 * - 호출자: `PromptsChainController.runChain`, service 단위 테스트.
 * - 사용 목적: repository 결과를 파싱 유틸과 결합해 API 응답 계약으로 조립한다.
 * - 데이터 흐름: request DTO -> repository port -> structured parser -> response DTO.
 *
 * Side effects:
 * - repository 호출을 통해 간접적으로 외부 LLM I/O가 발생할 수 있다.
 */
@Injectable()
export class PromptsChainService {
  constructor(
    @Inject(PROMPTS_CHAIN_REPOSITORY)
    private readonly promptsChainRepository: PromptsChainRepository,
    private readonly structuredOutputParserUtil: StructuredOutputParserUtil,
  ) {}

  /**
   * prompts-chain 실행 결과를 응답 계약 형태로 반환한다.
   *
   * Context:
   * - 호출자: `PromptsChainController.runChain`.
   * - 사용 목적: 도메인 파싱 규칙을 적용해 `structuredSpecs`를 구성하고 API 응답을 완성한다.
   * - 데이터 흐름: `input.sourceText` -> `PromptsChainRepository.runChain` -> `StructuredOutputParserUtil.parse` -> `PromptsChainRunResponseDto`.
   *
   * Side effects:
   * - repository 계층을 통해 LLM 호출이 수행될 수 있다.
   *
   * @param input 컨트롤러에서 전달된 실행 요청 DTO.
   * @returns 추출 결과/구조화 결과/모델명을 포함한 응답 DTO.
   * @throws `Error` 구조화 파싱에 실패하면 `StructuredOutputParserUtil` 예외가 전파된다.
   * @throws `InternalServerErrorException` 런타임 설정 키 누락 시 repository 경유 예외가 전파될 수 있다.
   */
  async run(input: PromptsChainRunRequestDto): Promise<PromptsChainRunResponseDto> {
    const result = await this.promptsChainRepository.runChain({
      sourceText: input.sourceText,
    });

    const structuredSpecs = this.structuredOutputParserUtil.parse(
      result.transformedSpecsText,
      result.extractedSpecsText,
    );

    return {
      extractedSpecsText: result.extractedSpecsText,
      structuredSpecs: structuredSpecs.toObject(),
      transformedSpecsText: result.transformedSpecsText,
      modelName: result.modelName,
    };
  }
}
