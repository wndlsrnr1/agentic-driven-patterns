import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

/**
 * OpenAI-compatible LLM 호출에 필요한 설정 묶음이다.
 *
 * Context:
 * - 호출자: `LangchainPromptsChainAdapter`.
 * - 사용 목적: LLM API 키/베이스 URL/모델명을 하나의 객체로 전달한다.
 * - 데이터 흐름: `ConfigService` 값 -> 정규화(trim) -> Adapter 전달.
 */
export type SyntheticSettings = {
  apiKey: string;
  baseUrl: string;
  model: string;
};

const DEFAULT_SYNTHETIC_BASE_URL = "https://api.synthetic.new/openai/v1";
const DEFAULT_SYNTHETIC_MODEL = "hf:moonshotai/Kimi-K2.5";

/**
 * LLM 연동에 필요한 환경 설정을 애플리케이션 계층에 제공한다.
 *
 * Context:
 * - 호출자: `PromptsChainModule`이 Provider로 등록하고, `LangchainPromptsChainAdapter`가 사용한다.
 * - 사용 목적: 환경 변수 해석 책임을 인프라 어댑터에서 분리해 단일 책임을 유지한다.
 * - 데이터 흐름: `ConfigService` -> `SyntheticSettings`.
 *
 * Side effects:
 * - 필수 키(`SYNTHETIC_API_KEY`) 누락 시 예외를 던져 요청 처리 또는 부팅 경로를 중단시킨다.
 */
@Injectable()
export class SyntheticSettingsService {
  constructor(private readonly configService: ConfigService) {}

  /**
   * 현재 런타임에서 사용할 LLM 설정을 반환한다.
   *
   * Context:
   * - 호출자: `LangchainPromptsChainAdapter.runChain`.
   * - 사용 목적: API 호출 직전에 최신 설정을 읽어 모델 생성에 사용한다.
   * - 데이터 흐름: env key -> trim/default 적용 -> `SyntheticSettings`.
   *
   * Side effects:
   * - 없음(읽기 전용).
   *
   * @returns LLM 호출에 필요한 키/URL/모델 정보.
   * @throws `InternalServerErrorException` 필수 API 키가 없을 때.
   */
  getSettings(): SyntheticSettings {
    const apiKey = this.configService.get<string>("SYNTHETIC_API_KEY")?.trim();
    if (!apiKey) {
      throw new InternalServerErrorException("SYNTHETIC_API_KEY is missing.");
    }

    const baseUrl =
      this.configService.get<string>("SYNTHETIC_BASE_URL")?.trim() ??
      DEFAULT_SYNTHETIC_BASE_URL;
    const model =
      this.configService.get<string>("SYNTHETIC_MODEL")?.trim() ??
      DEFAULT_SYNTHETIC_MODEL;

    return {
      apiKey,
      baseUrl,
      model,
    };
  }
}
