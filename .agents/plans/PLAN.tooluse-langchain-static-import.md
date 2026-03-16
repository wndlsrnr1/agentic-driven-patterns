# Tooluse LangChain Static Import Implementation Plan

## TL;DR

- Objective: `tooluse-langchain.ts`를 동적 `langchain/agents` 로더 없이 명시적 import 기반 학습용 코드로 단순화합니다.
- Deliverables: 의존성 추가, 정적 import 전환, 회귀 테스트, 검증 로그.
- Effort: small
- Parallelism: none

## 1. Intent and Success Criteria (DDD Anchor)

### Ultimate intent (Why)

동적 모듈 로더와 불필요한 런타임 검증을 제거해 코드 흐름을 바로 읽을 수 있게 만들고, 학습용 예제의 핵심 경로를 드러냅니다.

### Ubiquitous Language (terms)

- static import
- agent executor
- tool calling agent
- learning flow

### Acceptance Criteria (verifiable)

- AC1: `node --test 05-tool/typescript/tooluse-langchain.static-import.spec.ts` 가 PASS
- AC2: `npx tsc --noEmit --module NodeNext --moduleResolution NodeNext --target ES2022 --types node --skipLibCheck 05-tool/typescript/tooluse-langchain.ts 05-tool/typescript/tooluse-langchain.static-import.spec.ts` 가 PASS
- AC3: `API_KEY=dummy node --experimental-strip-types 05-tool/typescript/tooluse-langchain.ts` 실행 시 `Cannot find package 'langchain'` 오류가 사라짐

### Non-goals (Must NOT Have)

- 기본 프롬프트 변경 금지
- tool/search 동작 시나리오 변경 금지
- 메서드 라이브러리 대체 금지

## 2. Domain Model (DDD)

- Bounded context: `modules/05-tool` 학습용 LangChain 예제
- Entities / Value Objects: runtime config, tool definition, executor invocation
- Domain invariants:
  - 예제는 동일한 system prompt를 유지해야 합니다.
  - agent 생성은 명시적 import로 읽혀야 합니다.

## 3. Architecture (Clean Architecture)

- Layers: script example only
- Dependency rule: example script -> LangChain libs
- Module boundaries + file layout proposal:
  - `modules/package.json`
  - `modules/05-tool/typescript/tooluse-langchain.ts`
  - `modules/05-tool/typescript/tooluse-langchain.static-import.spec.ts`

## 4. Uncertainty Register (Risk-driven)

- U1: `langchain` 버전이 기존 `@langchain/*`와 충돌할 수 있음 -> 설치 후 타입체크
- U2: 학습용 파일이 현재 오염된 주석 때문에 리팩터 과정에서 동작이 흔들릴 수 있음 -> 회귀 테스트로 고정

## 5. Wave Plan

### Wave 0 (Spike / Contract Definition)

- Goal: 정적 import 대상 패키지와 테스트 계약 확정
- Steps:
  - `langchain` 설치 전 현재 실패 조건 확인
  - 소스 형태 회귀 테스트 추가
- Output artifacts:
  - spec file
- Stop condition:
  - 테스트가 현재 코드에서 FAIL

### Wave 1

- Goal: 의존성 추가 및 정적 import 전환
- Parallel Tasks list:
  - T1 package update
  - T2 script refactor

### Wave 2

- Goal: 타입체크 및 실행 검증
- Parallel Tasks list:
  - T3 verification

## 6. Task List (each task is executable)

T1: 정적 import 계약 테스트 추가

- Layer: Interface
- What to change: 소스 파일이 동적 import 대신 명시적 import를 사용한다는 회귀 테스트 작성
- Files:
  - `modules/05-tool/typescript/tooluse-langchain.static-import.spec.ts`
- Dependencies: none
- Must NOT:
  - 실제 네트워크 호출 의존 테스트 금지
- Verification:
  - `node --test 05-tool/typescript/tooluse-langchain.static-import.spec.ts`
- Contract tests (if applicable):
  - source contains explicit import
  - source does not contain dynamic loader
- Risks:
  - 구현 세부에 묶인 테스트가 될 수 있음

T2: 명시적 import 리팩터

- Layer: Interface
- What to change: `langchain` 설치 후 동적 로더 제거, import 정리, 학습 흐름 정리
- Files:
  - `modules/package.json`
  - `modules/package-lock.json`
  - `modules/05-tool/typescript/tooluse-langchain.ts`
- Dependencies:
  - T1
- Must NOT:
  - 기본 프롬프트 문자열 변경 금지
- Verification:
  - `npx tsc --noEmit --module NodeNext --moduleResolution NodeNext --target ES2022 --types node --skipLibCheck 05-tool/typescript/tooluse-langchain.ts 05-tool/typescript/tooluse-langchain.static-import.spec.ts`
- Risks:
  - import path mismatch

T3: 실행 검증

- Layer: Interface
- What to change: 런타임 import 실패 제거 확인
- Files:
  - none
- Dependencies:
  - T2
- Must NOT:
  - 성공처럼 과장 보고 금지
- Verification:
  - `API_KEY=dummy node --experimental-strip-types 05-tool/typescript/tooluse-langchain.ts`
- Risks:
  - 이후 오류는 API 인증 또는 네트워크 단계에서 발생할 수 있음

## 7. Plan Review Gate

- Reviewers: self
- Merge policy: verification failure 시 중단

## 8. Implementation & Verification Loop

- Per-task verification
- Per-wave verification
- Post-implementation audit: typecheck + runtime import gate
