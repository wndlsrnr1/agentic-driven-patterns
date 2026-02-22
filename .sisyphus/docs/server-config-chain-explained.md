# server-config-chain-explained (Index)

> [!NOTE] 30초 요약
> - 이 문서는 서버 설정 9개 심화 문서의 진입점이다.
> - 핵심 흐름은 `ADP_BUILD_MODE -> package.json -> tsconfig.build*.json -> Dockerfile`과 `jest.config.ts <-> tsconfig.json(NodeNext/ESM)` 두 축이다.
> - 상세 설명은 개별 문서에서 유지하고, 이 문서는 탐색/연결/검증 게이트를 담당한다.

## 0. 문서 목적
- 목적: 설정 문서 9개를 빠르게 찾고, 교차 의존성을 한 번에 이해하게 한다.
- 범위: 링크 허브, 상호작용 그래프, 라이프사이클 요약, 공통 체크리스트.
- 비범위: 개별 키의 장문 해설(개별 문서에서 관리).

## 1. 파일별 심화 문서 링크
1. `.dockerignore`: `server-dockerignore-config-explained.md`
2. `Dockerfile`: `server-dockerfile-config-explained.md`
3. `jest.config.ts`: `server-jest-config-ts-config-explained.md`
4. `nest-cli.json`: `server-nest-cli-json-config-explained.md`
5. `package-lock.json`: `server-package-lock-json-config-explained.md`
6. `package.json`: `server-package-json-config-explained.md`
7. `tsconfig.build.docker.json`: `server-tsconfig-build-docker-json-config-explained.md`
8. `tsconfig.build.json`: `server-tsconfig-build-json-config-explained.md`
9. `tsconfig.json`: `server-tsconfig-json-config-explained.md`

## 2. 핵심 상호작용 그래프
```text
[docker-compose.yml]
  -> build.context=./server, dockerfile=Dockerfile
  -> command=npm run dev

[server/Dockerfile]
  -> ENV ADP_BUILD_MODE=docker
  -> RUN npm ci (uses package-lock.json)
  -> CMD npm run dev (uses package.json)

[server/package.json]
  -> build: ADP_BUILD_MODE 분기
  -> build:local => tsconfig.build.json
  -> build:docker => tsconfig.build.docker.json
  -> test => jest.config.ts + ts-jest + tsconfig.json

[jest.config.ts] <-> [tsconfig.json]
  -> NodeNext/ESM 테스트 변환 정합성
```

- 핵심 흐름 문자열: `ADP_BUILD_MODE -> package.json -> tsconfig.build*.json -> Dockerfile`
- 핵심 연결 메모: `jest.config.ts <-> tsconfig.json(NodeNext/ESM)` 조합이 테스트 런타임 모듈 해석 기준이다.

## 3. 라이프사이클 타임라인
1. 빌드 입력 정제: `.dockerignore`가 Docker context를 필터링.
2. 의존성 고정 설치: `Dockerfile`의 `npm ci`가 `package-lock.json`을 기준으로 설치.
3. 빌드 분기: `package.json`의 `build`가 `ADP_BUILD_MODE`로 local/docker tsconfig를 선택.
4. 테스트 실행: `package.json:test`가 `jest.config.ts` + `tsconfig.json` 규칙으로 TS/ESM 테스트를 실행.
5. 실행 시작: `npm run dev`가 Nest watch 서버를 시작.

## 4. 권장 읽기 순서
1. `server-package-json-config-explained.md` (명령 오케스트레이션)
2. `server-tsconfig-json-config-explained.md` (컴파일 베이스)
3. `server-jest-config-ts-config-explained.md` (테스트 실행 계약)
4. `server-tsconfig-build-json-config-explained.md`
5. `server-tsconfig-build-docker-json-config-explained.md`
6. `server-dockerfile-config-explained.md`
7. `server-dockerignore-config-explained.md`
8. `server-nest-cli-json-config-explained.md`
9. `server-package-lock-json-config-explained.md`

## 5. 변경 전 공통 체크리스트
- [ ] 변경 키의 소비 주체(도구/패키지)를 확인했다.
- [ ] 영향 단계(빌드/실행/테스트/배포)를 명시했다.
- [ ] 연계 파일(`package.json`, `tsconfig*`, `Dockerfile`, `jest.config.ts`) 동시 점검했다.
- [ ] 아래 검증 명령을 실행했다.

```bash
cd server && npm run typecheck
cd server && npm run build
cd server && npm test -- --runInBand
```

## 6. 인덱스 운영 원칙
- 상세 설명은 개별 문서에서 유지하고, 인덱스는 링크/흐름/체크리스트를 유지한다.
- 새 설정 파일이 추가되면 링크 목록/그래프/읽기 순서를 함께 갱신한다.
- 인덱스에 장문 중복 설명을 다시 축적하지 않는다.
