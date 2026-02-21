import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { envValidationSchema } from './config/env.validation.js';
import { HealthModule } from './health/health.module.js';
import { PromptsChainModule } from './prompts-chain/prompts-chain.module.js';

/**
 * 애플리케이션 전역 모듈 구성을 정의한다.
 *
 * Context:
 * - 호출자: `main.ts`의 `NestFactory.create(AppModule)`가 부팅 시 로드한다.
 * - 사용 목적: 환경 변수 로딩(`ConfigModule`), 헬스체크, prompts-chain 기능을 하나의 루트 모듈에서 연결한다.
 * - 데이터 흐름: `src/config/.env` -> `ConfigModule` -> 각 서비스(`ConfigService` 의존 서비스)로 전달된다.
 *
 * Side effects:
 * - 프로세스 시작 시 `.env`를 읽고 스키마 검증을 수행한다.
 * - 하위 모듈의 Provider/Controller 등록 순서를 확정한다.
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: 'src/config/.env',
      validationSchema: envValidationSchema,
    }),
    HealthModule,
    PromptsChainModule,
  ],
})
export class AppModule {}
