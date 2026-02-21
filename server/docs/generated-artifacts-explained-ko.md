# ADP Server 생성 아티팩트 해설

## 1) `package-lock.json`

### 호출자/사용 시점
- 호출자: npm CLI(`npm ci`, `npm install`).
- 사용 시점: 의존성 설치 시 항상 참조.

### 역할
- 트랜지티브(하위) 의존성까지 포함한 정확한 버전 잠금.
- 팀/CI/컨테이너에서 동일한 의존성 트리를 재현.

### 읽는 방법 (초심자 관점)
- 최상위 `packages[""]`: 현재 프로젝트 자체 메타데이터.
- `packages["node_modules/<name>"]`: 실제 설치될 각 패키지의 버전/무결성 해시.
- `integrity`: 다운로드 무결성 검증용 해시.

### 수정 원칙
- 수동 편집 금지.
- 의존성 변경은 `package.json`을 수정한 후 npm 명령으로 lockfile 재생성.

## 2) `node_modules/**`

### 호출자/사용 시점
- 호출자: Node 런타임 모듈 로더, TypeScript tooling, Jest/Nest CLI.
- 사용 시점: 실행/테스트/빌드 시 항상 사용.

### 역할
- 외부 라이브러리 실제 코드 저장소.
- 런타임 동작, 타입 정의(`.d.ts`), 빌드 도구 구현을 제공.

### 실제 추적 방법
1. 코드에서 import 경로를 확인한다.
2. `package.json`의 dependencies/devDependencies에서 패키지를 찾는다.
3. 필요 시 `node_modules/<package>/package.json`의 `exports`/`types`를 확인한다.

### 수정 원칙
- 직접 수정 금지(재설치 시 사라짐).
- 문제가 있으면 버전 업/다운, 패치 패키지, 또는 대체 라이브러리 검토.

## 3) 산출물 디렉토리 참고

### `dist-local` (호스트 로컬 빌드 결과)
- 생성 주체: `npm run build:local`.
- 목적: 로컬 개발자가 실행/검증할 JS 산출물.

### `/tmp/adp-server-dist` (컨테이너 내부 빌드 결과)
- 생성 주체: `npm run build:docker`.
- 목적: 호스트 볼륨 권한 충돌 없이 도커 환경에서 빌드 검증.

### 영향 범위
- 빌드 경로 정책을 바꾸면 README, Dockerfile, 검증 스크립트를 함께 맞춰야 한다.
