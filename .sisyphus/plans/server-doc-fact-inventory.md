# Server Config Docs Fact Inventory (No-Loss Baseline)

## 목적
- 문서 가독성 리라이트 전, 핵심 사실을 ID로 고정해 내용 누락을 방지한다.
- 검증 기준: 각 FACT-ID가 리라이트 후 문서에서 의미상 유지되어야 한다.

## 문서 매핑
- D01: `.sisyphus/docs/server-config-chain-explained.md`
- D02: `.sisyphus/docs/server-dockerfile-config-explained.md`
- D03: `.sisyphus/docs/server-dockerignore-config-explained.md`
- D04: `.sisyphus/docs/server-jest-config-ts-config-explained.md`
- D05: `.sisyphus/docs/server-nest-cli-json-config-explained.md`
- D06: `.sisyphus/docs/server-package-json-config-explained.md`
- D07: `.sisyphus/docs/server-package-lock-json-config-explained.md`
- D08: `.sisyphus/docs/server-tsconfig-build-docker-json-config-explained.md`
- D09: `.sisyphus/docs/server-tsconfig-build-json-config-explained.md`
- D10: `.sisyphus/docs/server-tsconfig-json-config-explained.md`

## 사실 인벤토리

### D01 (Index)
- D01-F01: 인덱스는 9개 심화 문서의 허브다.
- D01-F02: 핵심 흐름 문자열 `ADP_BUILD_MODE -> package.json -> tsconfig.build*.json -> Dockerfile` 유지.
- D01-F03: 핵심 연결 문자열 `jest.config.ts <-> tsconfig.json(NodeNext/ESM)` 유지.
- D01-F04: 공통 체크리스트에 `typecheck/build/test` 3개 명령 포함.
- D01-F05: 읽기 순서(오케스트레이션 -> 컴파일 베이스 -> 테스트 -> 빌드 변형 -> Docker/Nest/lock) 유지.

### D02 (Dockerfile)
- D02-F01: `FROM node:20-alpine`의 베이스 고정 의미 유지.
- D02-F02: `WORKDIR /app` 경로 기준점 의미 유지.
- D02-F03: `ENV ADP_BUILD_MODE=docker`가 build 분기 트리거라는 사실 유지.
- D02-F04: `COPY package*.json` 선복사가 캐시 최적화 목적이라는 사실 유지.
- D02-F05: `RUN npm ci`가 lock 기반 재현성 설치라는 사실 유지.
- D02-F06: `COPY . .`의 이미지 단독 실행 보장 역할 유지.
- D02-F07: `EXPOSE 3001`은 메타데이터이며 publish는 compose가 담당한다는 사실 유지.
- D02-F08: `CMD ["npm","run","dev"]`는 런타임 시작 명령이라는 사실 유지.

### D03 (.dockerignore)
- D03-F01: `.dockerignore`는 컨테이너 내부 삭제가 아니라 build context 필터라는 사실 유지.
- D03-F02: `node_modules` 제외 이유(호스트/컨테이너 의존성 분리) 유지.
- D03-F03: `dist`, `dist-local` 제외 이유(stale artifact, 캐시 오염 방지) 유지.
- D03-F04: `npm-debug.log*` 제외 이유(노이즈/정보 노출 축소) 유지.
- D03-F05: `.env` 제외 이유(secret bake-in 방지) 유지.

### D04 (jest.config.ts)
- D04-F01: `testMatch=<rootDir>/test/**/*.spec.ts`로 테스트 범위 고정 사실 유지.
- D04-F02: `extensionsToTreatAsEsm=['.ts']` 필요성 유지.
- D04-F03: `transform`에서 `ts-jest` + `useESM:true` + `tsconfig` 참조 유지.
- D04-F04: `moduleNameMapper`가 상대 경로 `.js` suffix 문제를 보정한다는 사실 유지.
- D04-F05: `testEnvironment=node`가 서버 코드 기준이라는 사실 유지.

### D05 (nest-cli.json)
- D05-F01: `$schema`는 편집 검증 힌트라는 사실 유지.
- D05-F02: `collection=@nestjs/schematics`가 generate 규칙을 고정한다는 사실 유지.
- D05-F03: `sourceRoot=src`는 Nest CLI 탐색 기준이라는 사실 유지.
- D05-F04: `compilerOptions.deleteOutDir=true`는 stale 산출물 제거 목적이라는 사실 유지.

### D06 (package.json)
- D06-F01: `type=module`이 Node 런타임 ESM 해석 기준이라는 사실 유지.
- D06-F02: `scripts.build`가 `ADP_BUILD_MODE`로 local/docker 분기한다는 사실 유지.
- D06-F03: `build:local`은 `tsconfig.build.json`, `build:docker`는 `tsconfig.build.docker.json` 사용 사실 유지.
- D06-F04: `test` script의 `NODE_OPTIONS=--experimental-vm-modules` 유지 이유(ESM 테스트 호환) 유지.
- D06-F05: `typecheck=tsc --noEmit`의 사전 품질 게이트 역할 유지.
- D06-F06: dependencies/devDependencies 분리 원칙 유지.

### D07 (package-lock.json)
- D07-F01: top-level 5키(`name`, `version`, `lockfileVersion`, `requires`, `packages`) 해설 유지.
- D07-F02: `lockfileVersion=3` parser 계약 의미 유지.
- D07-F03: `packages`가 전체 transitive 트리 고정 핵심이라는 사실 유지.
- D07-F04: 샘플 5개(`""`, `@nestjs/common`, `ts-jest`, `typescript`, `@langchain/openai`) 유지.
- D07-F05: `resolved`/`integrity` 무결성 검증 의미 유지.
- D07-F06: `npm ci` 실패 대응 절차 4단계 유지.

### D08 (tsconfig.build.docker.json)
- D08-F01: `extends=./tsconfig.build.json` 상속 구조 유지.
- D08-F02: `compilerOptions.outDir=/tmp/adp-server-dist` docker 전용 분리 목적 유지.
- D08-F03: `ADP_BUILD_MODE=docker -> build:docker` 연계 사실 유지.
- D08-F04: 절대경로는 컨테이너 파일시스템 기준이라는 사실 유지.

### D09 (tsconfig.build.json)
- D09-F01: `extends=./tsconfig.json` 공통 규칙 재사용 의미 유지.
- D09-F02: `exclude`가 빌드 입력 정제(특히 `**/*spec.ts`)라는 사실 유지.
- D09-F03: exclude는 테스트 실행 차단이 아니라 빌드 입력 제한이라는 사실 유지.

### D10 (tsconfig.json)
- D10-F01: `module/moduleResolution=NodeNext` 결합 의미 유지.
- D10-F02: `emitDecoratorMetadata` + `experimentalDecorators`가 Nest reflection/DI 지원이라는 사실 유지.
- D10-F03: `strict=true` 품질 게이트 의미 유지.
- D10-F04: `outDir=dist-local`과 `start:prod` 경로 연계 유지.
- D10-F05: `skipLibCheck=true`는 외부 d.ts 검사 생략(속도-안정성 균형) 의미 유지.
- D10-F06: include/exclude가 입력 범위 관리라는 사실 유지.

## 검증 메모
- 리라이트 후 각 FACT-ID가 의미 보존되었는지 수동/자동 점검한다.
- 표 현식이 바뀌어도 사실(주장+근거)은 유지되어야 한다.
