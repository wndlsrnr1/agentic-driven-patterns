# server-package-json-config-explained

> [!NOTE] 30초 요약
> - `server/package.json`은 build/dev/test/typecheck 명령을 묶는 중앙 오케스트레이터다.
> - 핵심은 `ADP_BUILD_MODE` 분기, `type: module`, `test`의 ESM 호환 플래그다.
> - scripts/의존성 분류 변경은 빌드·테스트·런타임 전체로 파급된다.

## 0. 독자와 목표
- 대상 독자: `mixed` (Node/npm 초급 + 서버/CI 운영자)
- 이 문서의 목표: `server/package.json`의 키와 scripts가 런타임/테스트/빌드 체인을 어떻게 오케스트레이션하는지 설명한다.
- 분석 대상 파일: `server/package.json`
- 관련 근거 파일: `server/Dockerfile`, `server/tsconfig*.json`, `server/jest.config.ts`, `docker-compose.yml`
- 용어 브릿지:
  - `script`: npm이 실행하는 명령 별칭
  - `devDependencies`: 개발/테스트/빌드 도구 의존성

## 1. 한눈에 보는 오버뷰
- 이 파일의 존재 이유: 서버의 표준 명령 진입점(`build`, `dev`, `test`, `typecheck`)을 단일 계약으로 제공한다.
- 시스템에서 차지하는 위치: Docker/로컬/CI 모두 동일한 npm scripts를 호출한다.
- 읽는 주체: npm CLI, Node ESM loader, Nest CLI, Jest/ts-jest
- 영향 범위: 개발 루프, 배포 산출물 경로, 테스트 실행 방식, 의존성 설치 정책

## 2. 파일 문법 설명
- 문서 형식: JSON
- 파서 규칙: 주석 불가, scripts 값은 셸 문자열로 실행
- 자주 틀리는 문법 포인트:
  - scripts 조건 분기(`sh -c`)는 셸 문법/환경변수 의존성이 있다.
  - `type: module`은 TypeScript 옵션이 아니라 Node 런타임 모듈 해석 규칙이다.

## 3. 프레임워크-모듈-라이브러리 연결
| 설정 키 | 직접 소비 주체 | 간접 영향 주체 | 근거 파일/패키지 |
| --- | --- | --- | --- |
| `type: module` | Node ESM loader | Jest ESM 설정, tsconfig NodeNext | `server/package.json`, `server/jest.config.ts`, `server/tsconfig.json` |
| `scripts.build` | npm + shell | `build:local/build:docker` 분기 | `server/package.json`, `server/Dockerfile` |
| `scripts.build:*` | Nest CLI | `tsconfig.build*.json` 선택 | `server/package.json`, `server/tsconfig.build.json`, `server/tsconfig.build.docker.json` |
| `scripts.test` | Node + Jest | `jest.config.ts` 적용 | `server/package.json`, `server/jest.config.ts` |
| `dependencies/devDependencies` | npm installer | runtime/toolchain 결정 | `server/package-lock.json` |

## 4. 키별 시니어 해설

### 4.1 요약 표
| 키 | 한 줄 의미 | 어디서 읽는가 | 변경 영향 |
| --- | --- | --- | --- |
| `type` | Node 모듈 시스템을 ESM으로 고정 | Node runtime | import/테스트 해석 오류 가능 |
| `scripts.build` | local/docker 빌드 분기 진입점 | npm scripts | 빌드 프로파일 분기 실패 |
| `scripts.test` | ESM 테스트 실행 명령 | Node + Jest | 테스트 런타임 실패 가능 |
| `scripts.typecheck` | no-emit 타입 품질 게이트 | TypeScript | 회귀 탐지 시점 지연 |
| `dependencies`/`devDependencies` | 런타임/도구체인 분리 선언 | npm installer | 이미지 크기/런타임 안정성 영향 |

### 4.2 상세 근거 표
| 키 | 현재값 | 타입/문법 | 어디서 읽는가 | 라이프사이클 시점 | 라이프사이클 내 역할 | 설계/패러다임 관점 | 왜 존재하는가 | 자주 생기는 오해 | 변경 영향 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `name` | `adp-server` | 문자열 | npm CLI | 설치/실행 로그 | 패키지 식별 | 명시적 식별자 | CI 로그/툴링 추적성 확보 | "private면 이름 무의미" | 추적성 저하 |
| `version` | `0.0.1` | semver 문자열 | npm CLI | 패키지 메타 | 릴리스 버전 식별 | 변경 관리 | 변경 추적 기준점 | "코드 동작과 무관" | 릴리스/문서 정합성 저하 |
| `private` | `true` | boolean | npm publish guard | 배포 시도 시 | 퍼블리시 차단 | 안전 우선 | 내부 서비스 실수 공개 방지 | "설치에 영향 없으니 불필요" | false 전환 시 외부 배포 리스크 |
| `type` | `module` | 문자열 | Node 런타임 | 실행/테스트 | ESM 기본 모듈 해석 | 런타임 일관성 | import/export 규칙 통일 | "tsconfig만 맞추면 충분" | Jest/Node import 호환성 문제 가능 |
| `scripts.build` | `if ADP_BUILD_MODE ...` | shell command | npm scripts | 빌드 시 | local/docker 빌드 분기 | 환경별 정책 분리 | 단일 진입점으로 분기 관리 | "build:docker 직접 실행하면 build 불필요" | 팀 표준 명령 일관성 깨짐 |
| `scripts.build:local` | `nest build -p tsconfig.build.json` | command | Nest CLI | 로컬 빌드 | 로컬 산출물 생성 | 역할 분리 | 로컬 검증 경로 고정 | "tsc와 동일" | Nest 빌드 플로우 차이 누락 가능 |
| `scripts.build:docker` | `nest build -p tsconfig.build.docker.json` | command | Nest CLI | Docker 빌드 | 컨테이너 outDir 강제 | 환경 경계 분리 | `/tmp/adp-server-dist` 정책 적용 | "로컬에서 써도 동일" | 로컬 산출물 위치 혼선 |
| `scripts.dev` | `nest start --watch` | command | Nest CLI | 개발 실행 | 변경 감지 재시작 | 빠른 피드백 | 개발 생산성 확보 | "start와 완전 동일" | watch 유무 차이 큼 |
| `scripts.start:prod` | `node dist-local/main.js` | command | Node runtime | 프로덕션 실행 | 빌드 결과 실행 | build/run 분리 | 명시적 엔트리 보장 | "dist가 기본 경로" | outDir 변경 시 즉시 깨짐 |
| `scripts.test` | `NODE_OPTIONS=--experimental-vm-modules jest --runInBand` | env+command | Node + Jest | 테스트 시 | ESM 테스트 호환 설정 | 테스트 신뢰성 | Node ESM 환경 안정 실행 | "옵션 제거해도 안전" | import 오류/실행 실패 가능 |
| `scripts.typecheck` | `tsc --noEmit` | command | TypeScript | 정적 검사 | 산출물 없이 타입 게이트 | 빠른 품질 게이트 | 빌드 전 계약 위반 조기 탐지 | "build가 있으니 중복" | 피드백 지연 |
| `dependencies` | runtime libs | 객체 | npm installer | 설치/실행 | 런타임 의존성 선언 | 명시적 계약 | 실행 코드 요구 패키지 명시 | "transitive면 생략 가능" | 런타임 실패/재현성 저하 |
| `devDependencies` | tooling libs | 객체 | npm installer | 설치/테스트/빌드 | 도구체인 선언 | 관심사 분리 | 런타임과 도구체인 분리 | "모두 dependencies가 안전" | 이미지 비대화/공격면 증가 |

## 5. 라이프사이클 타임라인
1. 빌드 단계: `build`가 `ADP_BUILD_MODE`를 보고 `build:local`/`build:docker`를 선택한다.
2. 실행 단계: Docker/로컬에서 `dev` 또는 `start` scripts로 서버를 시작한다.
3. 테스트 단계: `test` script가 `jest.config.ts` 기반으로 ESM 테스트를 실행한다.
4. 검증 단계: `typecheck`로 TypeScript 계약 위반을 조기 탐지한다.

## 6. 패러다임 및 아키텍처 관점
- 계층 분리 관점: 앱 코드와 실행 명령 정책을 분리해 운영 경계를 명확히 한다.
- DI/IoC 관점: Nest DI 자체 설정은 아니지만 DI 런타임 진입을 통제하는 상위 오케스트레이터다.
- 도메인 경계(DDD) 관점: 도메인 모델이 아닌 플랫폼/운영 계약 문서다.
- 운영 안정성 관점: 동일 scripts를 모든 환경에서 재사용해 환경차 회귀를 줄인다.

## 7. 초보자가 헷갈리는 포인트
- 오해 1:
  - 왜 오해가 생기나: script를 단순 alias로만 이해한다.
  - 정확한 이해: 이 파일은 환경 분기와 도구 연결의 중앙 제어판이다.
- 오해 2:
  - 왜 오해가 생기나: dependencies/devDependencies를 성능 관점으로만 구분한다.
  - 정확한 이해: 핵심은 런타임 요구사항과 도구체인 책임 분리다.

## 8. 변경 전 체크리스트
- [ ] script 변경 시 호출자(`docker-compose.yml`, CI, README 명령) 영향 범위를 확인했다.
- [ ] `type: module` 변경 시 `jest.config.ts`, `tsconfig.json` 연쇄 영향을 검토했다.
- [ ] `build:*` 변경 시 `tsconfig.build*.json` 경로와 outDir를 확인했다.
- [ ] dependencies 재분류 시 런타임 실제 필요 여부를 검증했다.
- [ ] 변경 후 `npm run typecheck`, `npm run build`, `npm test -- --runInBand`를 실행했다.

## 9. 3줄 요약
1. `package.json`은 서버 운영 명령과 도구체인을 묶는 단일 오케스트레이션 계약이다.
2. 핵심은 `ADP_BUILD_MODE` 분기, ESM 테스트 실행 옵션, build/run 분리다.
3. scripts나 `type` 변경은 빌드·테스트·런타임 전체로 파급된다.
