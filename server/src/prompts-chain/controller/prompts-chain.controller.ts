import { Body, Controller, Post } from '@nestjs/common';
import { PromptsChainService } from '../service/prompts-chain.service.js';
import { PromptsChainRunRequestDto } from '../service/dto/prompts-chain-run.request.dto.js';
import type { PromptsChainRunResponseDto } from '../service/dto/prompts-chain-run.response.dto.js';

@Controller('v1/prompts-chain')
export class PromptsChainController {
  constructor(private readonly promptsChainService: PromptsChainService) {}

  @Post('run')
  async runChain(@Body() request: PromptsChainRunRequestDto): Promise<PromptsChainRunResponseDto> {
    return this.promptsChainService.run(request);
  }
}
