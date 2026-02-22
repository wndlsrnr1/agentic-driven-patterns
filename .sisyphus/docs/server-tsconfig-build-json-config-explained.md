# server-tsconfig-build-json-config-explained

> [!NOTE] 30초 요약
> - `tsconfig.build.json`은 빌드 입력을 정제하는 로컬 빌드 전용 tsconfig 계층이다.
> - 핵심은 `extends`로 공통 규칙을 재사용하고, `exclude`로 테스트/산출물 유입을 차단하는 것이다.
> - 이 파일이 흔들리면 배포 산출물 순도와 빌드 안정성이 동시에 떨어질 수 있다.

## 0. 독자와 목표
- 대상 독자: `mixed` (TypeScript 빌드 초급 + 배포 파이프라인 담당자)
- 이 문서의 목표: `server/tsconfig.build.json`이 베이스 tsconfig를 어떻게 빌드 전용으로 조정하는지 설명한다.
- 분석 대상 파일: `server/tsconfig.build.json`
- 관련 근거 파일: `server/tsconfig.json`, `server/package.json`
- 용어 브릿지:
  - `extends`: 다른 tsconfig를 상속해 일부 값만 덮어쓰는 메커니즘
  - `exclude`: TypeScript 프로그램 입력에서 제외할 경로 패턴

## 1. 한눈에 보는 오버뷰
- 이 파일의 존재 이유: 개발/테스트 공통 tsconfig 위에 "빌드 산출물용 입력 범위"를 별도로 정의한다.
- 시스템에서 차지하는 위치: `npm run build:local`에서 `nest build -p tsconfig.build.json`으로 사용된다.
- 읽는 주체: TypeScript compiler (Nest build 경유)
- 영향 범위: 빌드 입력 파일 집합, 빌드 시간, 배포 산출물 순도

## 2. 파일 문법 설명
- 문서 형식: JSON
- 파서 규칙: `extends`를 먼저 로드하고 현재 파일 키로 override
- 자주 틀리는 문법 포인트:
  - `exclude`는 테스트 실행 차단이 아니라 빌드 입력 제외다.
  - `extends` 상속 경로는 현재 파일 위치 기준 상대경로다.

## 3. 프레임워크-모듈-라이브러리 연결
| 설정 키 | 직접 소비 주체 | 간접 영향 주체 | 근거 파일/패키지 |
| --- | --- | --- | --- |
| `extends` | TypeScript config loader | 공통 옵션 재사용 | `server/tsconfig.build.json`, `server/tsconfig.json` |
| `exclude` | TypeScript program builder | Nest build 산출물 구성 | `server/tsconfig.build.json`, `server/package.json` |

## 4. 키별 시니어 해설

### 4.1 요약 표
| 키 | 한 줄 의미 | 어디서 읽는가 | 변경 영향 |
| --- | --- | --- | --- |
| `extends` | 베이스 tsconfig 공통 규칙 상속 | TypeScript config loader | 규칙 드리프트 가능 |
| `exclude` | 빌드 입력에서 테스트/산출물 제외 | TypeScript program builder | 산출물 오염/빌드 시간 증가 |

### 4.2 상세 근거 표
| 키 | 현재값 | 타입/문법 | 어디서 읽는가 | 라이프사이클 시점 | 라이프사이클 내 역할 | 설계/패러다임 관점 | 왜 존재하는가 | 자주 생기는 오해 | 변경 영향 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `extends` | `./tsconfig.json` | 상대 경로 문자열 | TypeScript config loader | 빌드 초기화 | 공통 컴파일 옵션 상속 | DRY/SSOT | 베이스 규칙을 중복 없이 재사용 | "빌드용이면 독립 파일이 맞다" | 상속 제거 시 옵션 드리프트 증가 |
| `exclude` | `node_modules`, `dist`, `dist-local`, `**/*spec.ts` | glob 배열 | TypeScript program builder | 입력 수집 단계 | 테스트/산출물 폴더를 빌드 입력에서 제거 | 관심사 분리 | 배포 번들에 테스트 코드 유입 방지 | "spec 제외하면 jest 테스트도 안 돈다" | 빌드 대상 오염, 빌드 시간 증가 가능 |

## 5. 라이프사이클 타임라인
1. `npm run build:local` 실행.
2. Nest CLI가 `-p tsconfig.build.json` 전달값으로 TypeScript 설정을 로드.
3. `extends`로 베이스 규칙을 병합.
4. `exclude`로 빌드 입력을 정제 후 emit 진행.

## 6. 패러다임 및 아키텍처 관점
- 계층 분리 관점: 공통 규칙(`tsconfig.json`)과 빌드 입력 정책(`tsconfig.build.json`)을 분리한다.
- DI/IoC 관점: 직접 적용 없음(컴파일 계층).
- 도메인 경계(DDD) 관점: 도메인 로직과 독립된 배포 파이프라인 정책이다.
- 운영 안정성 관점: 테스트 코드/산출물 재유입 회귀를 예방한다.

## 7. 초보자가 헷갈리는 포인트
- 오해 1:
  - 왜 오해가 생기나: `exclude`를 실행 차단으로 이해한다.
  - 정확한 이해: 컴파일 입력 제어이며 테스트 실행 규칙은 Jest가 담당한다.
- 오해 2:
  - 왜 오해가 생기나: 상속 구조를 복잡도로 인식한다.
  - 정확한 이해: 상속이 없으면 공통 옵션 중복으로 변경 누락 위험이 커진다.

## 8. 변경 전 체크리스트
- [ ] `extends` 경로가 유효한지 확인했다.
- [ ] `exclude` 변경 시 빌드 산출물 오염 가능성을 검토했다.
- [ ] `server/package.json`의 `build:local` 스크립트와 경로 정합성을 확인했다.
- [ ] 변경 후 `npm run build`와 `npm run typecheck`를 실행했다.
- [ ] Docker 빌드 설정(`tsconfig.build.docker.json`)과 역할 경계를 유지했다.

## 9. 3줄 요약
1. `tsconfig.build.json`은 로컬 빌드 입력을 정제하는 빌드 전용 설정이다.
2. 핵심은 베이스 상속(`extends`)과 테스트/산출물 제외(`exclude`)다.
3. 이 파일이 흔들리면 배포 산출물 순도와 빌드 안정성이 무너질 수 있다.
