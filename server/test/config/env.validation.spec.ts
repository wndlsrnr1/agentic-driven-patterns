import { describe, expect, it } from "@jest/globals";
import { envValidationSchema } from "../../src/config/env.validation.js";

/**
 * 환경 변수 스키마의 기본값/필수값 계약을 검증한다.
 *
 * Context:
 * - 호출자: `npm test` 실행 시 Jest 러너.
 * - 사용 목적: 설정 스키마 변경 시 기본값 회귀를 빠르게 탐지한다.
 * - 데이터 흐름: 테스트 입력 env 객체 -> Joi 검증 결과 -> assertion.
 *
 * Side effects:
 * - 없음.
 */
describe("envValidationSchema", () => {
  /**
   * 필수 키만 제공해도 나머지 옵션이 기본값으로 채워지는지 확인한다.
   *
   * Context:
   * - 호출자: Jest 테스트 케이스 실행기.
   * - 사용 목적: 운영/개발 환경에서 최소 입력으로도 부팅 가능한지 보장한다.
   * - 데이터 흐름: `{SYNTHETIC_API_KEY}` -> `validate` -> `value` 기본값 비교.
   *
   * Side effects:
   * - 없음.
   */
  it("Given minimal required env When validate Then applies defaults", () => {
    const { error, value } = envValidationSchema.validate({
      SYNTHETIC_API_KEY: "api-key",
    });

    expect(error).toBeUndefined();
    expect(value.PORT).toBe(3001);
    expect(value.CLIENT_ORIGIN).toBe("http://localhost:5173");
    expect(value.SYNTHETIC_BASE_URL).toBe(
      "https://api.synthetic.new/openai/v1",
    );
    expect(value.SYNTHETIC_MODEL).toBe("hf:moonshotai/Kimi-K2.5");
  });
});
