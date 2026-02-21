import { Module } from '@nestjs/common';
import { HealthController } from './health.controller.js';

/**
 * 헬스체크 컨트롤러를 캡슐화하는 경량 모듈이다.
 *
 * Context:
 * - 호출자: `AppModule`이 import하여 `/api/health` 라우트를 활성화한다.
 * - 사용 목적: 도메인 기능과 분리된 운영용 헬스체크 경계를 제공한다.
 * - 데이터 흐름: 컨트롤러 등록 정보만 Nest DI 컨테이너에 전달한다.
 *
 * Side effects:
 * - 라우팅 테이블에 헬스체크 엔드포인트가 추가된다.
 */
@Module({
  controllers: [HealthController],
})
export class HealthModule {}
