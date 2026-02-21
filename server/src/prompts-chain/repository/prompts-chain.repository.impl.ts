import { Injectable } from '@nestjs/common';
import { LangchainPromptsChainClient } from '../client/langchain-prompts-chain.client.js';
import { PromptsChainSettingsService } from '../config/prompts-chain-settings.service.js';
import type {
  PromptsChainRepository,
  PromptsChainRepositoryInput,
  PromptsChainRepositoryResult,
} from './prompts-chain.repository.js';

/**
 * prompts-chain repository 구현의 조합 규칙을 문서화한다.
 *
 * Context:
 * - 적용 대상: `PromptsChainRepositoryImpl`.
 * - 사용 목적: 설정 조회(`config`)와 외부 I/O(`client`)를 결합하되 비즈니스 분기는 포함하지 않음을 명시한다.
 */
/**
 * prompts-chain repository 포트의 인프라 구현체다.
 *
 * Context:
 * - 호출자: `PromptsChainService`.
 * - 사용 목적: 런타임 설정 조회와 LangChain client 호출을 조합한다.
 * - 데이터 흐름: service input -> settings service -> client.runChain -> service result.
 *
 * Side effects:
 * - 하위 client를 통해 외부 LLM 네트워크 I/O가 발생한다.
 */
@Injectable()
export class PromptsChainRepositoryImpl implements PromptsChainRepository {
  constructor(
    private readonly promptsChainSettingsService: PromptsChainSettingsService,
    private readonly langchainPromptsChainClient: LangchainPromptsChainClient,
  ) {}

  /**
   * prompts-chain 런타임 설정을 결합해 client 체인을 실행한다.
   *
   * Context:
   * - 호출자: `PromptsChainService.run`.
   * - 사용 목적: 설정 해석 책임과 LLM 호출 책임을 repository 경계에서 조합한다.
   * - 데이터 흐름: `input.sourceText` + `getRuntimeConfig()` -> `LangchainPromptsChainClient.runChain`.
   *
   * Side effects:
   * - 외부 LLM API 호출이 발생할 수 있다.
   *
   * @param input service 계층이 전달한 실행 입력.
   * @returns 추출/변환 원문 및 모델명.
   * @throws `InternalServerErrorException` 필수 API 키 누락 시 설정 서비스 예외가 전파된다.
   */
  async runChain(input: PromptsChainRepositoryInput): Promise<PromptsChainRepositoryResult> {
    const runtimeConfig = this.promptsChainSettingsService.getRuntimeConfig();
    return this.langchainPromptsChainClient.runChain(input.sourceText, runtimeConfig);
  }
}
