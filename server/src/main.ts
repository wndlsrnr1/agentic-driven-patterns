import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

/**
 * NestJS HTTP 서버를 부팅하고 공통 미들웨어/파이프를 설정한다.
 *
 * Context:
 * - 호출자: Node 런타임이 `main.ts`를 엔트리포인트로 실행할 때 최상위에서 호출된다.
 * - 사용 목적: API prefix, CORS, ValidationPipe 등 플랫폼 공통 정책을 한 곳에서 선언한다.
 * - 데이터 흐름: `ConfigService`에서 `PORT`, `CLIENT_ORIGIN`을 읽어 서버 listen/CORS 설정으로 전달한다.
 *
 * Side effects:
 * - TCP 포트를 열고 HTTP 서버를 시작한다.
 * - 전역 파이프/전역 prefix/CORS 정책을 런타임 전역 상태에 적용한다.
 *
 * @returns 서버가 listen 상태가 되면 resolve되는 Promise.
 */
async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3001);
  const clientOrigin = configService.get<string>('CLIENT_ORIGIN', 'http://localhost:5173');

  app.setGlobalPrefix('api');
  app.enableCors({
    origin: [clientOrigin],
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  await app.listen(port);
}

/**
 * 애플리케이션 부팅 진입점.
 *
 * Context:
 * - 호출자: Node ESM 엔트리 실행기.
 * - 사용 목적: 비동기 부팅 함수를 즉시 시작한다.
 * - 데이터 흐름: 없음(부트스트랩 트리거 역할).
 *
 * Side effects:
 * - 부트스트랩 실패 시 프로세스가 예외와 함께 종료될 수 있다.
 */
bootstrap();
