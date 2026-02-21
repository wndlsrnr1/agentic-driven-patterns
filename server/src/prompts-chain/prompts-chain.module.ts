import { Module } from '@nestjs/common';
import {
  defaultLangchainPromptsChainRuntime,
  LangchainPromptsChainClient,
} from './client/langchain-prompts-chain.client.js';
import { PROMPTS_CHAIN_RUNTIME } from './config/prompts-chain.tokens.js';
import { PromptsChainSettingsService } from './config/prompts-chain-settings.service.js';
import { PromptsChainController } from './controller/prompts-chain.controller.js';
import { PROMPTS_CHAIN_REPOSITORY } from './repository/prompts-chain.repository.js';
import { PromptsChainRepositoryImpl } from './repository/prompts-chain.repository.impl.js';
import { PromptsChainService } from './service/prompts-chain.service.js';
import { StructuredOutputParserUtil } from './utils/structured-output-parser.util.js';

/**
 * prompts-chain 기능의 계층 조립 지점이다.
 *
 * Context:
 * - 호출자: `AppModule`.
 * - 사용 목적: controller/service/repository/client/config/utils 의존성을 DI로 결합한다.
 * - 데이터 흐름: Controller -> Service -> Repository -> Client -> 외부 LLM.
 *
 * Side effects:
 * - 런타임에 LangChain adapter 및 runtime provider를 등록한다.
 */
@Module({
  controllers: [PromptsChainController],
  providers: [
    PromptsChainSettingsService,
    StructuredOutputParserUtil,
    PromptsChainService,
    LangchainPromptsChainClient,
    {
      provide: PROMPTS_CHAIN_RUNTIME,
      useValue: defaultLangchainPromptsChainRuntime,
    },
    {
      provide: PROMPTS_CHAIN_REPOSITORY,
      useClass: PromptsChainRepositoryImpl,
    },
  ],
})
export class PromptsChainModule {}
