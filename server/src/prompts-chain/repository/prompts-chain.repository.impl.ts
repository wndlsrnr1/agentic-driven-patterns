import { Injectable } from '@nestjs/common';
import { LangchainPromptsChainClient } from '../client/langchain-prompts-chain.client.js';
import { PromptsChainSettingsService } from '../config/prompts-chain-settings.service.js';
import type {
  PromptsChainRepository,
  PromptsChainRepositoryInput,
  PromptsChainRepositoryResult,
} from './prompts-chain.repository.js';

@Injectable()
export class PromptsChainRepositoryImpl implements PromptsChainRepository {
  constructor(
    private readonly promptsChainSettingsService: PromptsChainSettingsService,
    private readonly langchainPromptsChainClient: LangchainPromptsChainClient,
  ) {}

  async runChain(input: PromptsChainRepositoryInput): Promise<PromptsChainRepositoryResult> {
    const runtimeConfig = this.promptsChainSettingsService.getRuntimeConfig();
    return this.langchainPromptsChainClient.runChain(input.sourceText, runtimeConfig);
  }
}
