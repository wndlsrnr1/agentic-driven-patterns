# ADP Server 설정 JSON 해설

## 1) `package.json`

### 호출자/사용 시점
- 호출자: 개발자 CLI(`npm run ...`), Dockerfile, Docker Compose.
- 사용 시점: 개발 실행(`dev`), 테스트(`test`), 타입검사(`typecheck`), 빌드(`build`) 시.

### 핵심 역할
- 스크립트 진입점 정의:
  - `build`: `ADP_BUILD_MODE` 값에 따라 `build:local` 또는 `build:docker` 분기.
  - `build:local`: `tsconfig.build.json`을 사용해 호스트 경로(`dist-local`)로 출력.
  - `build:docker`: `tsconfig.build.docker.json`을 사용해 컨테이너 내부 `/tmp/adp-server-dist`로 출력.
- 의존성 목록 정의:
  - 런타임: `@nestjs/*`, `@langchain/*`, `joi` 등.
  - 개발: `typescript`, `jest`, `ts-jest` 등.

### 영향 범위
- 스크립트 이름 변경/삭제 시 CI, Docker, 개발 가이드가 동시에 영향을 받는다.

## 2) `tsconfig.json`

### 호출자/사용 시점
- 호출자: `tsc --noEmit`, `nest build`, `ts-jest`.
- 사용 시점: 타입 검사/빌드/테스트 모두.

### 핵심 옵션 의미
- `module`/`moduleResolution: "NodeNext"`: ESM 기반 모듈 해석.
- `emitDecoratorMetadata`/`experimentalDecorators`: Nest DI 메타데이터 활성화.
- `outDir: "./dist-local"`: 로컬 빌드 산출 경로.
- `strict: true`: 엄격 타입 검사.

### 영향 범위
- 모듈 해석 옵션 변경 시 import 확장자(`.js`) 규칙과 런타임 동작이 깨질 수 있다.

## 3) `tsconfig.build.json`

### 호출자/사용 시점
- 호출자: `npm run build:local`.
- 사용 시점: 로컬 빌드 시.

### 핵심 역할
- 테스트 파일(`**/*spec.ts`)을 제외하고 배포 대상 코드만 빌드.
- `tsconfig.json`을 상속하여 공통 옵션을 재사용.

### 영향 범위
- exclude 변경 시 테스트 코드가 배포 산출물에 섞일 수 있다.

## 4) `tsconfig.build.docker.json`

### 호출자/사용 시점
- 호출자: `npm run build:docker` (`ADP_BUILD_MODE=docker` 분기).
- 사용 시점: 컨테이너 빌드/검증 시.

### 핵심 역할
- `outDir`를 `/tmp/adp-server-dist`로 강제하여 호스트 볼륨 권한 충돌을 회피.

### 영향 범위
- 경로 변경 시 도커 빌드 검증 스크립트/문서가 함께 수정되어야 한다.

## 5) `nest-cli.json`

### 호출자/사용 시점
- 호출자: Nest CLI (`nest build`, `nest start --watch`).
- 사용 시점: 빌드/개발 서버 실행 시.

### 핵심 역할
- `sourceRoot: "src"`: 엔트리 소스 루트 지정.
- `deleteOutDir: true`: 빌드 전 출력 폴더 정리.

### 영향 범위
- 소스 루트가 바뀌면 엔트리 탐색 실패로 부팅/빌드가 깨진다.
