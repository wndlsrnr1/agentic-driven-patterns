import Joi from "joi";

/**
 * 서버 부팅 시 읽는 환경 변수 스키마를 정의한다.
 *
 * Context:
 * - 호출자: `AppModule`의 `ConfigModule.forRoot({ validationSchema })`.
 * - 사용 목적: `.env` 누락/오입력을 서버 시작 시점에 즉시 검출한다.
 * - 데이터 흐름: 원시 환경 변수 문자열 -> Joi 검증/기본값 적용 -> `ConfigService` 제공 값.
 *
 * Side effects:
 * - 필수 값 누락 시 Nest 부팅이 실패한다(fail-fast).
 */
export const envValidationSchema = Joi.object({
  PORT: Joi.number().default(3001),
  CLIENT_ORIGIN: Joi.string().uri().default("http://localhost:5173"),
  SYNTHETIC_API_KEY: Joi.string().required(),
  SYNTHETIC_BASE_URL: Joi.string()
    .uri()
    .default("https://api.synthetic.new/openai/v1"),
  SYNTHETIC_MODEL: Joi.string().default("hf:moonshotai/Kimi-K2.5"),
});
