import { Inject, Injectable } from '@nestjs/common';
import { StructuredOutputParserUtil } from '../utils/structured-output-parser.util.js';
import {
  PROMPTS_CHAIN_REPOSITORY,
  type PromptsChainRepository,
} from '../repository/prompts-chain.repository.js';
import type { PromptsChainRunRequestDto } from './dto/prompts-chain-run.request.dto.js';
import type { PromptsChainRunResponseDto } from './dto/prompts-chain-run.response.dto.js';

@Injectable()
export class PromptsChainService {
  constructor(
    @Inject(PROMPTS_CHAIN_REPOSITORY)
    private readonly promptsChainRepository: PromptsChainRepository,
    private readonly structuredOutputParserUtil: StructuredOutputParserUtil,
  ) {}

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
