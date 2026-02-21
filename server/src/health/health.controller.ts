import { Controller, Get } from '@nestjs/common';

/**
 * 서버 생존 여부를 확인하는 HTTP 엔드포인트를 제공한다.
 *
 * Context:
 * - 호출자: 로드밸런서, 운영 스크립트, 개발자 수동 확인(`curl /api/health`).
 * - 사용 목적: 애플리케이션 프로세스가 요청을 수신 가능한지 빠르게 검증한다.
 * - 데이터 흐름: HTTP GET 요청 -> 상태 객체 `{status:"ok"}` 응답.
 *
 * Side effects:
 * - 외부 시스템(모니터링/헬스체크)이 이 응답을 기준으로 서버 상태를 판단한다.
 */
@Controller('health')
export class HealthController {
  /**
   * 헬스체크 상태를 반환한다.
   *
   * Context:
   * - 호출자: `HealthController` 라우팅 시스템(Nest Router).
   * - 사용 목적: DB/외부 API 의존 없이 최소 생존 신호를 제공한다.
   * - 데이터 흐름: 없음(정적 상태 반환).
   *
   * Side effects:
   * - 없음.
   *
   * @returns 서버 상태를 나타내는 단순 객체.
   */
  @Get()
  getHealth(): { status: string } {
    return { status: 'ok' };
  }
}
