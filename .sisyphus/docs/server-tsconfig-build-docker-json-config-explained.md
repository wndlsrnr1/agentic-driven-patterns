# server-tsconfig-build-docker-json-config-explained

> [!NOTE] 30초 요약
> - 이 파일은 Docker 빌드 전용 `outDir` 오버라이드 정책을 정의한다.
> - 핵심은 `extends` 상속 위에 `outDir=/tmp/adp-server-dist`를 덮어써 로컬 산출물과 경로를 분리하는 것이다.
> - `ADP_BUILD_MODE=docker -> build:docker` 연계를 깨면 빌드 경로 정책이 즉시 무너진다.

## 0. 독자와 목표
- 대상 독자: `mixed` (Docker 빌드 파이프라인 초급 + 운영 자동화 담당자)
- 이 문서의 목표: `server/tsconfig.build.docker.json`이 컨테이너 빌드에서 outDir를 분리하는 이유와 영향 범위를 설명한다.
- 분석 대상 파일: `server/tsconfig.build.docker.json`
- 관련 근거 파일: `server/tsconfig.build.json`, `server/package.json`, `server/Dockerfile`, `README.md`
- 용어 브릿지:
  - `outDir`: TypeScript 빌드 산출물이 생성되는 디렉터리
  - `override`: 상속받은 설정 일부를 하위 파일에서 덮어쓰기

## 1. 한눈에 보는 오버뷰
- 이 파일의 존재 이유: Docker 빌드 산출물을 컨테이너 내부 경로(`/tmp/adp-server-dist`)로 분리해 로컬 `dist-local`과 충돌을 방지한다.
- 시스템에서 차지하는 위치: `npm run build:docker`가 `nest build -p tsconfig.build.docker.json`로 호출한다.
- 읽는 주체: TypeScript compiler (Nest build 경유)
- 영향 범위: Docker 빌드 산출물 위치, 권한 충돌 회피, CI/운영 아티팩트 경로

## 2. 파일 문법 설명
- 문서 형식: JSON
- 파서 규칙: `extends`로 상위 로드 후 `compilerOptions.outDir` override
- 자주 틀리는 문법 포인트:
  - 절대 경로 `/tmp/...`는 컨테이너 파일시스템 기준이다.
  - 로컬 빌드에 그대로 적용하면 기대 산출물 경로와 달라진다.

## 3. 프레임워크-모듈-라이브러리 연결
| 설정 키 | 직접 소비 주체 | 간접 영향 주체 | 근거 파일/패키지 |
| --- | --- | --- | --- |
| `extends` | TypeScript config loader | 빌드 공통 규칙 재사용 | `server/tsconfig.build.docker.json`, `server/tsconfig.build.json` |
| `compilerOptions.outDir` | TypeScript emitter | Docker 빌드 산출물 경로 | `server/tsconfig.build.docker.json`, `server/package.json`, `README.md` |
| `ADP_BUILD_MODE=docker`(연계) | shell + npm scripts | build 분기 진입 | `server/Dockerfile`, `server/package.json` |

## 4. 키별 시니어 해설

### 4.1 요약 표
| 키 | 한 줄 의미 | 어디서 읽는가 | 변경 영향 |
| --- | --- | --- | --- |
| `extends` | 공통 빌드 규칙 상속 | TypeScript config loader | 옵션 동기화 누락 가능 |
| `compilerOptions.outDir` | Docker 전용 산출물 경로 지정 | TypeScript emitter | 로컬/컨테이너 경로 혼선 가능 |

### 4.2 상세 근거 표
| 키 | 현재값 | 타입/문법 | 어디서 읽는가 | 라이프사이클 시점 | 라이프사이클 내 역할 | 설계/패러다임 관점 | 왜 존재하는가 | 자주 생기는 오해 | 변경 영향 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `extends` | `./tsconfig.build.json` | 상대 경로 문자열 | TypeScript config loader | 빌드 초기화 | 빌드 공통 규칙 상속 | DRY/SSOT | docker 전용 차이만 명시하기 위함 | "전체 복사본이 더 명확" | 상속 제거 시 옵션 동기화 누락 위험 |
| `compilerOptions.outDir` | `/tmp/adp-server-dist` | 절대 경로 문자열 | TypeScript emitter | emit 단계 | Docker용 산출물 저장 위치 결정 | 환경 경계 분리 | 호스트 `dist-local` 권한/소유권 충돌 회피 | "로컬에서도 동일하게 쓰면 좋다" | 로컬 산출물 탐색/배포 경로 혼란 |

## 5. 라이프사이클 타임라인
1. Docker 이미지 빌드 중 `ENV ADP_BUILD_MODE=docker` 설정.
2. `npm run build` 분기에서 `build:docker` 선택.
3. Nest build가 본 tsconfig를 로드.
4. emit 결과가 `/tmp/adp-server-dist`로 출력.

## 6. 패러다임 및 아키텍처 관점
- 계층 분리 관점: 로컬 빌드 정책과 Docker 빌드 정책을 설정 파일 수준에서 분리한다.
- DI/IoC 관점: 해당 없음(빌드 인프라 계층).
- 도메인 경계(DDD) 관점: 도메인과 무관한 배포 환경 경계 설정이다.
- 운영 안정성 관점: 볼륨 권한 충돌 회피로 빌드 실패 리스크를 줄인다.

## 7. 초보자가 헷갈리는 포인트
- 오해 1:
  - 왜 오해가 생기나: `/tmp`를 모든 환경에서 동일 경로로 인식한다.
  - 정확한 이해: 컨테이너 내부 경로이며 호스트 경로와 독립적이다.
- 오해 2:
  - 왜 오해가 생기나: docker/local 빌드 경로를 통합하면 단순해 보인다.
  - 정확한 이해: 경계 통합은 권한 충돌/산출물 오염을 재도입할 수 있다.

## 8. 변경 전 체크리스트
- [ ] `server/package.json`의 `build:docker` 스크립트와 경로 정합성을 확인했다.
- [ ] `server/Dockerfile`의 `ADP_BUILD_MODE` 분기와 함께 검토했다.
- [ ] README의 Docker 산출물 경로 설명을 함께 업데이트했다.
- [ ] 로컬 빌드 경로(`dist-local`)와 역할 분리가 유지되는지 확인했다.
- [ ] 변경 후 Docker 환경에서 `npm run build`를 실행해 결과 경로를 점검했다.

## 9. 3줄 요약
1. `tsconfig.build.docker.json`은 Docker 빌드 전용 outDir 오버라이드 파일이다.
2. 핵심 목적은 `/tmp/adp-server-dist`로 산출물을 분리해 권한 충돌을 피하는 것이다.
3. 이 파일 변경은 `ADP_BUILD_MODE` 분기, README, 빌드 스크립트와 함께 검토해야 한다.
