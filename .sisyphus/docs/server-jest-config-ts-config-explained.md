# server-jest-config-ts-config-explained

> [!NOTE] 30초 요약
> - 이 문서는 TypeScript 테스트를 Node ESM 환경에서 안정 실행하기 위한 Jest 계약을 설명한다.
> - 핵심은 `extensionsToTreatAsEsm`, `transform(ts-jest + useESM)`, `moduleNameMapper`의 결합이다.
> - 세 항목 중 하나라도 누락되면 import 해석/변환 단계에서 회귀가 발생할 수 있다.

## 0. 독자와 목표
- 대상 독자: `mixed` (Jest 초급 + TypeScript/ESM 유지보수 담당자)
- 이 문서의 목표: `server/jest.config.ts`의 각 설정이 NodeNext + ESM + ts-jest 조합에서 왜 필요한지 설명한다.
- 분석 대상 파일: `server/jest.config.ts`
- 관련 근거 파일: `server/package.json`, `server/tsconfig.json`
- 용어 브릿지:
  - `Transformer`: 테스트 파일을 실행 전 변환하는 단계
  - `ESM`: `import/export` 기반 모듈 시스템

## 1. 한눈에 보는 오버뷰
- 이 파일의 존재 이유: TypeScript spec 파일을 Node ESM 환경에서 안정적으로 실행하기 위한 테스트 런타임 계약이다.
- 시스템에서 차지하는 위치: `npm test`, `npm test -- <pattern>` 실행 시 Jest가 가장 먼저 로드한다.
- 읽는 주체: Jest core, ts-jest transformer
- 영향 범위: 테스트 탐색 경로, 모듈 해석, TS 변환, ESM 호환성

## 2. 파일 문법 설명
- 문서 형식: TypeScript 모듈 (`const config: Config`, `export default config`)
- 파서 규칙: Jest가 TS config를 읽고 내부 옵션 객체로 해석한다.
- 자주 틀리는 문법 포인트:
  - `testMatch`는 파일 탐색 규칙이며 TypeScript `include`와 별개다.
  - `moduleNameMapper` 정규식은 NodeNext 상대경로 확장자 보정에 사용된다.

## 3. 프레임워크-모듈-라이브러리 연결
| 설정 키 | 직접 소비 주체 | 간접 영향 주체 | 근거 파일/패키지 |
| --- | --- | --- | --- |
| `testMatch` | Jest test discovery | AGENTS 테스트 디렉터리 규칙 | `server/jest.config.ts`, `AGENTS.md` |
| `transform` + `ts-jest` | ts-jest | `server/tsconfig.json` | `server/jest.config.ts`, `server/tsconfig.json` |
| `extensionsToTreatAsEsm` | Jest ESM loader | Node ESM 런타임 정합성 | `server/jest.config.ts`, `server/package.json` |
| `moduleNameMapper` | Jest resolver | `.js` suffix import 호환 | `server/jest.config.ts` |

## 4. 키별 시니어 해설

### 4.1 요약 표
| 키 | 한 줄 의미 | 어디서 읽는가 | 변경 영향 |
| --- | --- | --- | --- |
| `testMatch` | 테스트 파일 탐색 범위 고정 | Jest discovery | 의도치 않은 테스트 유입/누락 |
| `extensionsToTreatAsEsm` | `.ts`를 ESM으로 해석 | Jest ESM loader | import/export 오류 가능 |
| `transform` | TS 파일을 ts-jest로 변환 | ts-jest | 변환 실패/옵션 불일치 |
| `moduleNameMapper` | 상대경로 `.js` suffix 보정 | Jest resolver | 상대 import 해석 실패 가능 |

### 4.2 상세 근거 표
| 키 | 현재값 | 타입/문법 | 어디서 읽는가 | 라이프사이클 시점 | 라이프사이클 내 역할 | 설계/패러다임 관점 | 왜 존재하는가 | 자주 생기는 오해 | 변경 영향 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `moduleFileExtensions` | `['js','json','ts']` | 문자열 배열 | Jest resolver | 테스트 시작 | 허용 확장자 제한 | 명시적 계약 | 해석 대상 명확화 | "ts만 있으면 충분" | fixture json/js import 실패 가능 |
| `rootDir` | `'.'` | 경로 문자열 | Jest core | 초기화 | 상대 경로 기준점 설정 | 단일 기준점 | 팀 전체 동일 경로 해석 | "기본값이라 무의미" | testMatch/tsconfig 상대 경로 틀어짐 가능 |
| `testEnvironment` | `'node'` | 문자열 | Jest runtime | 테스트 실행 | Node API 환경 사용 | 환경 분리 | 서버 코드 테스트를 DOM 환경과 분리 | "jsdom이 더 범용" | 타이머/글로벌 API 차이로 테스트 왜곡 |
| `testMatch` | `<rootDir>/test/**/*.spec.ts` | glob 배열 | Jest discovery | 테스트 수집 | 테스트 위치 계약 강제 | 계층 정책 준수 | `server/test/**` 규칙 반영 | "src/**/*.spec.ts도 자동 수집" | 범위 확대 시 의도치 않은 테스트 실행 |
| `extensionsToTreatAsEsm` | `['.ts']` | 문자열 배열 | Jest ESM loader | 변환 직전 | `.ts`를 ESM으로 취급 | 런타임 정합성 | `type: module` 환경과 테스트 규칙 일치 | "type:module이면 자동" | 제거 시 ESM import 오류 가능 |
| `transform` | `^.+\\.ts$ -> ts-jest` | 정규식 매핑 | ts-jest | 파일 로드 | TS 파일 변환 수행 | 변환 책임 분리 | 테스트 시 TypeScript 직접 실행 불가 문제 해결 | "Babel로 대체해도 완전 동일" | 데코레이터/TS 옵션 불일치 가능 |
| `transform.useESM` | `true` | boolean | ts-jest | 변환 시 | ESM 출력 강제 | 모듈 일관성 | Jest 내부 변환 결과를 ESM에 맞춤 | "false여도 동작" | CJS/ESM 혼합 오류 증가 |
| `transform.tsconfig` | `<rootDir>/tsconfig.json` | 경로 문자열 | ts-jest | 변환 시 | TypeScript 옵션 참조 | SSOT 재사용 | 앱 컴파일 규칙과 테스트 변환 규칙 정렬 | "기본 tsconfig 자동 사용" | 예상치 못한 옵션 불일치 가능 |
| `moduleNameMapper` | `^(\.{1,2}/.*)\\.js$ -> $1` | regex 치환 | Jest resolver | import 해석 시 | 상대 import `.js` 접미사 제거 | ESM 경계 완충 | NodeNext 경로 관습과 테스트 경로 보정 | "임시 해킹" | 제거 시 상대 import 해석 실패 가능 |

## 5. 라이프사이클 타임라인
1. 테스트 시작: `npm test`가 Jest를 실행.
2. 설정 로드: Jest가 `jest.config.ts`를 읽어 discovery/resolver/transform 규칙을 구성.
3. 수집 단계: `testMatch`로 `server/test/**/*.spec.ts` 파일을 선택.
4. 변환/실행 단계: `ts-jest`가 TS를 ESM으로 변환 후 Node 환경에서 실행.

## 6. 패러다임 및 아키텍처 관점
- 계층 분리 관점: 테스트 런타임 계약을 앱 컴파일 설정과 분리하되 `tsconfig`를 재사용해 중복을 줄인다.
- DI/IoC 관점: 직접 적용은 없지만 Nest 테스트 부트스트랩의 실행 환경을 안정화한다.
- 도메인 경계(DDD) 관점: 도메인 정책이 아닌 품질 게이트 레이어다.
- 운영 안정성 관점: ESM/CJS 경계 문제를 테스트 단계에서 조기 탐지한다.

## 7. 초보자가 헷갈리는 포인트
- 오해 1:
  - 왜 오해가 생기나: Jest 기본값으로도 TS가 자동 실행된다고 오해.
  - 정확한 이해: 현재 프로젝트는 `ts-jest` + ESM 옵션 조합이 필수다.
- 오해 2:
  - 왜 오해가 생기나: `moduleNameMapper`를 불필요 정규식으로 인식.
  - 정확한 이해: NodeNext 상대경로 `.js` 관습과 Jest 해석 차이를 메우는 안전장치다.

## 8. 변경 전 체크리스트
- [ ] `server/package.json`의 test scripts와 함께 변경했다.
- [ ] `server/tsconfig.json` 모듈 옵션(NodeNext)과 정합성을 확인했다.
- [ ] `testMatch`가 `server/test/**` 규칙을 유지하는지 점검했다.
- [ ] 변경 후 `npm test -- --runInBand`로 회귀를 확인했다.
- [ ] ESM import 관련 실패 로그를 비교해 영향 범위를 기록했다.

## 9. 3줄 요약
1. `jest.config.ts`는 TS/ESM 테스트 실행의 핵심 런타임 계약이다.
2. `extensionsToTreatAsEsm`, `transform`, `moduleNameMapper`는 세트로 동작한다.
3. 한 항목만 임의 변경해도 import 해석/변환 단계에서 회귀가 생길 수 있다.
