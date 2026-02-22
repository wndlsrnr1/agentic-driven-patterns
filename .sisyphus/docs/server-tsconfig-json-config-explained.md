# server-tsconfig-json-config-explained

> [!NOTE] 30초 요약
> - `tsconfig.json`은 서버 컴파일/타입검사/테스트 변환에서 공유되는 SSOT이다.
> - 핵심은 `NodeNext`, `strict`, `decorator metadata`, `outDir` 경계다.
> - 이 파일 변경은 `package.json`, `jest.config.ts`, `tsconfig.build*.json`까지 연쇄 영향한다.

## 0. 독자와 목표
- 대상 독자: `mixed` (TypeScript 초급 + 빌드/테스트 파이프라인 담당자)
- 문서 목표: `server/tsconfig.json`의 컴파일 계약을 키별로 설명하고 Nest/Jest와의 연결을 명확히 한다.
- 분석 대상 파일: `server/tsconfig.json`
- 관련 근거 파일: `server/package.json`, `server/jest.config.ts`, `server/tsconfig.build.json`, `server/tsconfig.build.docker.json`
- 용어 브릿지:
  - `NodeNext`: Node의 ESM/CJS 해석 규칙을 TypeScript가 따르도록 맞추는 모드
  - `emit`: TypeScript를 JavaScript/타입 선언 파일로 출력하는 과정

## 1. 한눈에 보는 오버뷰
- 이 파일의 존재 이유: 서버 코드의 타입 계약과 출력 기본 정책을 단일 기준으로 정의한다.
- 시스템에서 차지하는 위치: `tsc --noEmit`, `ts-jest`, `nest build`가 공통 기반으로 참조한다.
- 읽는 주체: TypeScript compiler, ts-jest(간접), Nest build pipeline(간접)
- 영향 범위: 모듈 해석, 타입 엄격성, 출력 위치/형식, 디버깅 경험

## 2. 파일 문법 설명
- 문서 형식: JSON
- 파서 규칙: `compilerOptions`/`include`/`exclude`를 TypeScript가 로드한다.
- 자주 틀리는 문법 포인트:
  - `module`과 `moduleResolution`은 함께 정렬해야 한다.
  - `include`가 있어도 `exclude`는 안전장치로 의미가 있다.

## 3. 프레임워크-모듈-라이브러리 연결
| 설정 키 | 직접 소비 주체 | 간접 영향 주체 | 근거 파일/패키지 |
| --- | --- | --- | --- |
| `module`, `moduleResolution` | TypeScript resolver/emitter | Jest ESM, Node runtime | `server/tsconfig.json`, `server/jest.config.ts`, `server/package.json` |
| `emitDecoratorMetadata`, `experimentalDecorators` | TypeScript compiler | Nest DI/reflection | `server/tsconfig.json`, `@nestjs/core` |
| `outDir` | TypeScript emitter | `start:prod` 경로 | `server/tsconfig.json`, `server/package.json` |
| `strict`, `isolatedModules`, `skipLibCheck` | TypeScript checker | 개발 생산성/안정성 균형 | `server/tsconfig.json` |

## 4. 키별 시니어 해설

### 4.1 요약 표
| 키 | 한 줄 의미 | 어디서 읽는가 | 변경 영향 |
| --- | --- | --- | --- |
| `module/moduleResolution=NodeNext` | Node ESM 규칙과 컴파일 해석을 정렬 | TypeScript | import 해석/출력 포맷 회귀 가능 |
| `emitDecoratorMetadata + experimentalDecorators` | Nest 데코레이터 리플렉션 지원 | TypeScript + Nest | DI/validation 동작 저하 가능 |
| `strict=true` | 엄격 타입 게이트 활성화 | TypeScript checker | 회귀 탐지력 급감 가능 |
| `outDir=dist-local` | 로컬 산출물 위치 고정 | TypeScript emitter | `start:prod` 경로 깨짐 가능 |
| `skipLibCheck=true` | 외부 d.ts 검사 생략 | TypeScript checker | 검사속도/노이즈 균형 변화 |

### 4.2 상세 근거 표
| 키 | 현재값 | 타입/문법 | 어디서 읽는가 | 라이프사이클 시점 | 라이프사이클 내 역할 | 설계/패러다임 관점 | 왜 존재하는가 | 자주 생기는 오해 | 변경 영향 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `compilerOptions.module` | `NodeNext` | enum 문자열 | TypeScript emitter | 컴파일 | 모듈 출력 방식 결정 | 런타임 정합성 | Node ESM 환경과 컴파일 규칙 일치 | "ESNext와 동일" | import 해석/출력 회귀 가능 |
| `compilerOptions.moduleResolution` | `NodeNext` | enum 문자열 | TypeScript resolver | 타입검사/컴파일 | 패키지/파일 탐색 규칙 결정 | 경계 명시 | Node exports 해석 일치 | "module만 맞추면 충분" | 타입 통과/런타임 실패 케이스 증가 |
| `compilerOptions.emitDecoratorMetadata` | `true` | boolean | TypeScript + reflect-metadata | 컴파일/런타임 | 데코레이터 메타데이터 제공 | Nest 생태계 적합성 | DI/validation 리플렉션 정보 제공 | "experimentalDecorators만 있으면 충분" | 일부 Nest 런타임 동작 저하 가능 |
| `compilerOptions.experimentalDecorators` | `true` | boolean | TypeScript parser | 컴파일 | 데코레이터 문법 허용 | 프레임워크 지원 | Nest 코드 패턴 지원 | "표준 아니니 꺼야 함" | 데코레이터 코드 컴파일 실패 |
| `compilerOptions.strict` | `true` | boolean | TypeScript checker | 타입검사 | 엄격 타입 규칙 활성화 | 계약 기반 개발 | 런타임 버그를 컴파일 단계로 이동 | "개발 속도만 느려짐" | false 전환 시 회귀 탐지력 급감 |
| `compilerOptions.outDir` | `./dist-local` | 경로 문자열 | TypeScript emitter | local build | 로컬 산출물 위치 지정 | 환경 경계 분리 | docker outDir와 분리해 권한 충돌 회피 | "docker도 이 경로 사용" | `start:prod` 경로 깨짐 가능 |
| `compilerOptions.skipLibCheck` | `true` | boolean | TypeScript checker | 타입검사 | 외부 d.ts 검사 생략 | 속도-안정성 균형 | 외부 타입 노이즈 완화 | "타입 안정성 포기" | false 시 검사시간 증가 |
| `compilerOptions.allowSyntheticDefaultImports` | `true` | boolean | TypeScript checker | 타입검사 | CJS interop 허용 | 상호운용성 | 패키지 포맷 혼재 대응 | "런타임 동작을 바꾼다" | 주로 타입체커 에러 변화 |
| `compilerOptions.sourceMap` | `true` | boolean | TypeScript emitter/debugger | 실행/디버깅 | TS↔JS 매핑 제공 | 관측성 강화 | 오류 추적 정확도 향상 | "운영에서는 항상 false" | 디버깅 품질 저하/크기 변화 |
| `compilerOptions.isolatedModules` | `true` | boolean | TypeScript/transpiler checker | 변환 전 | 파일 단위 변환 호환성 확보 | 도구체인 호환성 | ts-jest 등과 변환 결과 차이 최소화 | "tsc만 쓰면 불필요" | 보조 변환기와 불일치 가능 |
| `compilerOptions.types` | `["node"]` | 문자열 배열 | TypeScript global loader | 타입검사 | Node 글로벌 타입 범위 지정 | 실행환경 명시 | DOM 전역 오염 방지 | "자동 인식되니 필요 없음" | 누락 시 Node 타입 인식 오류 가능 |
| `include` | `src/**/*.ts` | glob 배열 | TypeScript program builder | 입력 수집 | 컴파일 대상 범위 지정 | 경계 관리 | 소스 외 파일 유입 방지 | "test도 자동 포함" | 범위 확대 시 빌드 노이즈 증가 |
| `exclude` | `node_modules`, `dist`, `dist-local` | glob 배열 | TypeScript program builder | 입력 수집 | 외부/산출물 폴더 제외 | 입력 정제 | 순환 입력/중복 컴파일 방지 | "include가 있으니 필요 없음" | 예기치 않은 입력 유입 가능 |

## 5. 라이프사이클 타임라인
1. 타입검사 단계: `npm run typecheck`가 `tsc --noEmit`로 이 파일을 사용한다.
2. 테스트 변환 단계: `ts-jest`가 `transform.tsconfig`로 이 파일을 참조한다.
3. 빌드 단계: `tsconfig.build.json`이 이 파일을 상속해 빌드 전용 옵션을 덮어쓴다.
4. 실행 단계: `start:prod`가 `outDir` 산출물을 엔트리포인트로 실행한다.

## 6. 패러다임 및 아키텍처 관점
- 계층 분리 관점: 베이스 컴파일 규칙을 공통 계층으로 두고 build-specific 설정은 하위 tsconfig로 분리한다.
- DI/IoC 관점: 데코레이터 메타데이터 옵션으로 Nest IoC 런타임을 지원한다.
- 도메인 경계(DDD) 관점: 도메인 모델이 아닌 기술 경계(컴파일/런타임) 규칙이다.
- 운영 안정성 관점: 엄격 타입과 NodeNext 정합으로 환경차 회귀를 줄인다.

## 7. 초보자가 헷갈리는 포인트
- 오해 1:
  - 왜 오해가 생기나: TypeScript 설정을 빌드 전용으로만 본다.
  - 정확한 이해: 테스트(ts-jest), 타입검사(tsc), 빌드(Nest)가 모두 공유한다.
- 오해 2:
  - 왜 오해가 생기나: `skipLibCheck=true`를 위험 설정으로만 본다.
  - 정확한 이해: 외부 타입 소음 억제를 통한 생산성 선택이며 앱 코드 검사는 유지된다.

## 8. 변경 전 체크리스트
- [ ] `module`/`moduleResolution` 변경 시 `jest.config.ts`와 `package.json:type`을 함께 점검했다.
- [ ] `outDir` 변경 시 `start:prod` 경로를 동기화했다.
- [ ] `strict` 변경 리스크를 팀 합의로 기록했다.
- [ ] decorator 옵션 변경 시 Nest 런타임 검증 계획을 세웠다.
- [ ] 변경 후 `npm run typecheck`, `npm run build`, `npm test -- --runInBand`를 실행했다.

## 9. 3줄 요약
1. `tsconfig.json`은 서버 컴파일/테스트 타입 계약의 SSOT다.
2. NodeNext, strict, decorator 옵션이 Nest+ESM 동작 안정성의 핵심 축이다.
3. 값 하나 변경해도 빌드·테스트·실행 경로가 함께 영향을 받는다.
