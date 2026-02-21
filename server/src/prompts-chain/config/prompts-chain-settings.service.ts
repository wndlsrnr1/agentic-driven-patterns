import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { PromptsChainRuntimeConfigDto } from './dto/prompts-chain-runtime-config.dto.js';

const DEFAULT_SYNTHETIC_BASE_URL = 'https://api.synthetic.new/openai/v1';
const DEFAULT_SYNTHETIC_MODEL = 'hf:moonshotai/Kimi-K2.5';

@Injectable()
export class PromptsChainSettingsService {
  constructor(private readonly configService: ConfigService) {}

  getRuntimeConfig(): PromptsChainRuntimeConfigDto {
    const apiKey = this.configService.get<string>('SYNTHETIC_API_KEY')?.trim();
    if (!apiKey) {
      throw new InternalServerErrorException('SYNTHETIC_API_KEY is missing.');
    }

    const baseUrl =
      this.configService.get<string>('SYNTHETIC_BASE_URL')?.trim() ?? DEFAULT_SYNTHETIC_BASE_URL;
    const modelName = this.configService.get<string>('SYNTHETIC_MODEL')?.trim() ?? DEFAULT_SYNTHETIC_MODEL;

    return {
      apiKey,
      baseUrl,
      modelName,
    };
  }
}
