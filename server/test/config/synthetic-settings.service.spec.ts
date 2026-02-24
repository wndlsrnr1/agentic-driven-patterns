import { ConfigService } from "@nestjs/config";
import { describe, expect, it, jest } from "@jest/globals";
import { SyntheticSettingsService } from "../../src/config/synthetic-settings.service.js";

/**
 * `SyntheticSettingsService`의 설정 해석 규칙을 검증한다.
 *
 * Context:
 * - 호출자: Jest 러너.
 * - 사용 목적: 필수 키/기본값/예외 동작이 변경되지 않도록 회귀를 방지한다.
 * - 데이터 흐름: mock `ConfigService` 입력 -> 서비스 반환/예외 assertion.
 *
 * Side effects:
 * - 없음.
 */
describe("SyntheticSettingsService", () => {
  it("returns configured values from env", () => {
    const configService = {
      get: jest.fn((key: string) => {
        if (key === "SYNTHETIC_API_KEY") {
          return "api-key";
        }
        if (key === "SYNTHETIC_BASE_URL") {
          return "https://example.com/openai/v1";
        }
        if (key === "SYNTHETIC_MODEL") {
          return "model-1";
        }
        return undefined;
      }),
    } as unknown as ConfigService;

    const service = new SyntheticSettingsService(configService);

    expect(service.getSettings()).toEqual({
      apiKey: "api-key",
      baseUrl: "https://example.com/openai/v1",
      model: "model-1",
    });
  });

  it("uses defaults for base url and model", () => {
    const configService = {
      get: jest.fn((key: string) =>
        key === "SYNTHETIC_API_KEY" ? "api-key" : undefined,
      ),
    } as unknown as ConfigService;

    const service = new SyntheticSettingsService(configService);

    expect(service.getSettings()).toEqual({
      apiKey: "api-key",
      baseUrl: "https://api.synthetic.new/openai/v1",
      model: "hf:moonshotai/Kimi-K2.5",
    });
  });

  it("throws when api key is missing", () => {
    const configService = {
      get: jest.fn(() => undefined),
    } as unknown as ConfigService;

    const service = new SyntheticSettingsService(configService);

    expect(() => service.getSettings()).toThrow(
      "SYNTHETIC_API_KEY is missing.",
    );
  });
});
