# server-package-lock-json-config-explained

> [!NOTE] 30초 요약
> - `package-lock.json`은 설치 결과를 고정하는 실행 계약 파일이다.
> - 핵심은 `lockfileVersion`, `packages` 맵, `resolved/integrity` 무결성 정보다.
> - 수동 편집 대신 npm 명령 기반 갱신 + `npm ci` 검증이 drift와 공급망 리스크를 줄인다.

## 0. 독자와 목표
- 대상 독자: `mixed` (npm 초급 + 공급망/CI 안정성 담당자)
- 이 문서의 목표: `server/package-lock.json`을 전수 나열 없이도 운영 의사결정 가능한 수준으로 해설한다.
- 분석 대상 파일: `server/package-lock.json`
- 관련 근거 파일: `server/package.json`, `server/Dockerfile`, `README.md`
- 용어 브릿지:
  - `lockfile`: 설치될 의존성 트리를 버전/무결성 포함해 고정한 스냅샷
  - `integrity`: 다운로드 tarball의 해시 검증 값
  - `drift`: 환경마다 설치 결과가 달라지는 현상

## 1. 한눈에 보는 오버뷰
- 이 파일의 존재 이유: `npm ci` 실행 시 정확히 동일한 의존성 트리를 재현하기 위한 계약 파일이다.
- 시스템에서 차지하는 위치: Docker 이미지 빌드(`RUN npm ci`)와 로컬 설치에서 공통 진실 원본이다.
- 읽는 주체: npm CLI installer/resolver
- 영향 범위: 설치 재현성, 공급망 무결성 검증, CI 안정성, 보안 감사 추적

## 2. 파일 문법 설명
- 문서 형식: JSON
- 파서 규칙: `lockfileVersion`에 맞춰 npm이 스키마를 해석한다.
- 자주 틀리는 문법 포인트:
  - 사람이 직접 편집하는 파일이 아니라 npm 명령으로 재생성해야 한다.
  - `package.json`만 맞으면 충분하다고 오해하기 쉽지만 실제 설치 결과는 lockfile이 결정한다.

## 3. 프레임워크-모듈-라이브러리 연결
| 설정 키 | 직접 소비 주체 | 간접 영향 주체 | 근거 파일/패키지 |
| --- | --- | --- | --- |
| `lockfileVersion` | npm parser | npm 버전 호환성 | `server/package-lock.json` |
| `packages` | npm installer | Docker/CI 설치 결과 | `server/package-lock.json`, `server/Dockerfile` |
| `resolved`, `integrity` | npm fetch/verify | 공급망 무결성/감사 추적 | `server/package-lock.json` |
| 루트 dependencies snapshot | npm resolver | `server/package.json` 정합성 | `server/package-lock.json`, `server/package.json` |

## 4. 키별 시니어 해설

### 4.1 Top-level 요약 표
| 키 | 한 줄 의미 | 어디서 읽는가 | 변경 영향 |
| --- | --- | --- | --- |
| `name` | lockfile 루트 패키지 식별 | npm CLI | 감사/진단 추적성 저하 가능 |
| `version` | lock snapshot 버전 맥락 제공 | npm CLI | 문서/릴리스 정합성 혼선 가능 |
| `lockfileVersion` | parser 스키마 버전 고정 | npm parser | 수동 변경 시 설치 실패 가능 |
| `requires` | 의존성 해석 메타 사용 여부 | npm resolver | 호환성 진단 정보 손실 |
| `packages` | 경로별 패키지 트리 고정 | npm installer | drift/공급망 리스크 탐지 실패 |

### 4.2 Top-level 상세 근거 표
| 키 | 현재값 | 타입/문법 | 어디서 읽는가 | 라이프사이클 시점 | 라이프사이클 내 역할 | 설계/패러다임 관점 | 왜 존재하는가 | 자주 생기는 오해 | 변경 영향 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `name` | `adp-server` | 문자열 | npm CLI | 설치 초기화 | lockfile 루트 패키지 식별 | 식별 일관성 | 어떤 프로젝트 lock인지 명확화 | "package.json에만 있으면 충분" | 진단/감사 추적성 저하 |
| `version` | `0.0.1` | 문자열 | npm CLI | 설치 초기화 | lockfile 생성 시점 메타 | 변경 이력 추적 | snapshot 버전 맥락 제공 | "배포 버전과 1:1" | 수동 수정 시 혼선 |
| `lockfileVersion` | `3` | 숫자 | npm parser | 파일 파싱 시 | 스키마 버전 선택 | 도구 호환 계약 | parser가 구조를 올바르게 해석하도록 보장 | "값만 바꾸면 업그레이드" | 수동 변경 시 설치 실패 가능 |
| `requires` | `true` | boolean | npm resolver | 설치 시 | requires 메타 사용 여부 표시 | 그래프 완결성 | 의존성 해석 메타 규약 유지 | "항상 true니 무시" | 호환성 진단 정보 손실 |
| `packages` | 객체(현재 657 entries) | path->entry 맵 | npm installer | 설치 전체 | 경로별 메타/무결성/의존성 고정 | 재현성 핵심 | transitive 포함 전체 트리 고정 | "루트 deps만 보면 충분" | drift/공급망 리스크 탐지 실패 |

### 4.3 `packages` 구조 규칙
- entry key 규칙:
  - `""`: 루트 패키지 메타
  - `node_modules/<pkg>`: 설치 경로별 패키지 메타
- entry 대표 필드:
  - `version`, `resolved`, `integrity`, `dependencies`, `dev`, `peerDependencies`, `engines`, `bin`, `license`
- 라이프사이클 역할:
  - npm이 "어떤 패키지를 어떤 버전/무결성으로 어떤 경로에 설치할지"를 결정한다.

### 4.4 대표 샘플 5개 해설
| 샘플 키 | 주요 필드(실측) | 어디서 읽는가 | 왜 존재하는가 | 변경 영향 |
| --- | --- | --- | --- | --- |
| `""` | `name`, `version`, `dependencies`, `devDependencies` | npm resolver | 루트 선언을 lock 내부에 고정 | 루트 deps 불일치 시 `npm ci` 실패 가능 |
| `node_modules/@nestjs/common` | `version=11.1.14`, `resolved`, `integrity`, `peerDependencies` | npm installer/verifier | Nest 핵심 런타임 패키지 버전/무결성 고정 | integrity mismatch 시 설치 중단 |
| `node_modules/ts-jest` | `version=29.4.6`, `dev=true`, `peerDependencies` | npm + Jest toolchain | 테스트 변환기 버전 고정 | peer 충돌 시 테스트 파이프라인 실패 가능 |
| `node_modules/typescript` | `version=5.9.3`, `dev=true`, `bin`, `engines` | npm + tsc 실행 | 컴파일러 버전/실행 진입점 고정 | 버전 drift 시 진단/emit 결과 변화 |
| `node_modules/@langchain/openai` | `version=1.2.9`, `resolved`, `integrity`, `peerDependencies` | npm installer | LLM 클라이언트 런타임 패키지 고정 | 버전/peer 변동 시 런타임 호환성 영향 |

## 5. 라이프사이클 타임라인
1. 의존성 변경: 개발자가 `package.json` 수정 후 npm 명령 실행.
2. lock 갱신: npm이 `package-lock.json`의 `packages` 맵을 재생성.
3. 설치 단계: `npm ci`가 lockfile을 엄격 해석해 동일 트리 설치.
4. CI/Docker 단계: `server/Dockerfile`의 `RUN npm ci`가 동일 로직으로 재현.

## 6. 패러다임 및 아키텍처 관점
- 계층 분리 관점: 선언(`package.json`)과 해석 결과(`package-lock.json`)를 분리한다.
- DI/IoC 관점: 직접 적용은 없지만 런타임 컨테이너 라이브러리 그래프를 고정한다.
- 도메인 경계(DDD) 관점: 도메인 로직이 아닌 플랫폼/공급망 bounded context다.
- 운영 안정성 관점: 재현성·무결성·감사 추적성을 동시에 보장한다.

## 7. 초보자가 헷갈리는 포인트
- 오해 1:
  - 왜 오해가 생기나: 자동 생성 파일이라 중요도가 낮다고 느낀다.
  - 정확한 이해: 실제 설치 결과를 결정하는 가장 중요한 실행 계약이다.
- 오해 2:
  - 왜 오해가 생기나: 충돌 시 lockfile 수동 편집으로 빠르게 해결하려 한다.
  - 정확한 이해: 수동 편집은 호환성 오류를 숨긴다. npm 명령으로 재해결해야 한다.

## 8. 변경 전 체크리스트
- [ ] `package.json` 변경과 lockfile 변경이 함께 커밋되는지 확인했다.
- [ ] lockfile을 수동 수정하지 않고 npm 명령으로 갱신했다.
- [ ] `npm ci`를 로컬/CI(또는 Docker)에서 실행해 재현성을 확인했다.
- [ ] `integrity`/`resolved` 변경이 의도된 업그레이드인지 검토했다.
- [ ] `npm ci` 실패 대응 절차를 문서화했다.

### `npm ci` 실패 대응 절차
1. `package.json`과 `package-lock.json` diff를 함께 확인한다.
2. 의존성 의도 변경이 맞으면 `npm install`로 lock을 재생성한다.
3. `npm ci`를 다시 실행해 재현성 복구 여부를 확인한다.
4. Docker 빌드(`docker compose build server`)에서도 동일 결과를 검증한다.

## 9. 3줄 요약
1. `package-lock.json`은 의존성 설치 결과를 고정하는 실행 계약 파일이다.
2. 핵심은 `lockfileVersion`, `packages`, `resolved/integrity` 무결성 정보다.
3. 수동 편집 대신 npm 명령 기반 갱신 + `npm ci` 검증이 drift와 공급망 리스크를 막는다.
