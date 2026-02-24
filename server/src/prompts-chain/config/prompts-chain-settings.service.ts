import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { PromptsChainRuntimeConfigDto } from "./dto/prompts-chain-runtime-config.dto.js";

/**
 * prompts-chain 런타임 기본값 상수를 정의하는 영역이다.
 *
 * Context:
 * - 호출자: `PromptsChainSettingsService.getRuntimeConfig`.
 * - 사용 목적: 환경 변수 미지정 시 재현 가능한 기본 URL/모델 값을 제공한다.
 */
const DEFAULT_SYNTHETIC_BASE_URL = "https://api.synthetic.new/openai/v1";
const DEFAULT_SYNTHETIC_MODEL = "hf:moonshotai/Kimi-K2.5";

/**
 * prompts-chain 실행에 필요한 런타임 설정을 제공한다.
 *
 * Context:
 * - 호출자: `PromptsChainRepositoryImpl.runChain`.
 * - 사용 목적: 환경 변수 조회/기본값 적용 책임을 repository/client에서 분리한다.
 * - 데이터 흐름: `ConfigService` -> trim/default 적용 -> `PromptsChainRuntimeConfigDto`.
 *
 * Side effects:
 * - 필수 키 누락 시 예외를 발생시켜 요청 처리를 중단한다.
 */
@Injectable()
export class PromptsChainSettingsService {
  constructor(private readonly configService: ConfigService) {}

  /**
   * 현재 요청에서 사용할 LLM 런타임 설정을 반환한다.
   *
   * Context:
   * - 호출자: `PromptsChainRepositoryImpl.runChain`.
   * - 사용 목적: client 모델 생성 직전에 API 키/URL/모델명을 일관된 계약으로 전달한다.
   * - 데이터 흐름: env key -> normalize -> runtime config DTO.
   *
   * Side effects:
   * - 없음(설정 조회 전용).
   *
   * @returns prompts-chain client가 요구하는 런타임 설정 DTO.
   * @throws `InternalServerErrorException` `SYNTHETIC_API_KEY`가 없거나 공백일 때.
   */
  getRuntimeConfig(): PromptsChainRuntimeConfigDto {
    const apiKey = this.configService.get<string>("SYNTHETIC_API_KEY")?.trim();
    if (!apiKey) {
      throw new InternalServerErrorException("SYNTHETIC_API_KEY is missing.");
    }

    const baseUrl =
      this.configService.get<string>("SYNTHETIC_BASE_URL")?.trim() ??
      DEFAULT_SYNTHETIC_BASE_URL;
    const modelName =
      this.configService.get<string>("SYNTHETIC_MODEL")?.trim() ??
      DEFAULT_SYNTHETIC_MODEL;

    return {
      apiKey,
      baseUrl,
      modelName,
    };
  }
}
