# Reflection OpenAI Migration Implementation Plan

> **For Claude:** Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** `modules/04-reflection/example-code/typescript/relfection-google.ts`의 reflection 워크플로우를 runtime semantics를 유지한 OpenAI Agents SDK 버전으로 `reflextion-openai.ts`에 구현한다.

**Architecture:** 단일 엔트리 함수(`runReflectionOpenAI`)에서 설정 해석, OpenAI Provider/Runner 구성, `DraftWriter` -> `FactChecker` 순차 실행을 수행한다. 단계 간 전달은 공유 `MemorySession` + 명시적 텍스트 입력으로 최소 구성한다. 최종 출력은 빈 문자열 방지 규칙으로 검증한다.

**Tech Stack:** TypeScript, `@openai/agents`, Node.js

---

## 현재 프로젝트 컨텍스트

### 시스템 개요

- 프로젝트명: `adp/modules`
- 핵심 도메인: 에이전트 패턴 학습용 예제(TypeScript)
- 기술 스택: Node.js + TypeScript + OpenAI/Google/LangChain SDK
- 이 계획에 필요한 skills: `[using-superpowers, loading-project-context, google-sdk-to-openai-agents-js, writing-plans, executing-plans, subagent-driven-development, verification-before-completion]`

### 현재 상황

- 문제/요구사항: Google ADK reflection 예제를 OpenAI Agents SDK로 이주
- 관련 코드/모듈:
  - `modules/04-reflection/example-code/typescript/relfection-google.ts`
  - `modules/04-reflection/example-code/typescript/reflextion-openai.ts`
  - `modules/03-paralleization/tutorial.openai-agents.ts`
- 제약 조건:
  - 모든 타입 명시
  - workflow 결정론 유지(순차 실행)
  - 최소 상태 전달 전략(공유 session 1개) 명시
- 기존 시도 및 결과: 대상 파일은 빈 파일 상태(0 lines)

## 1. 프로젝트/문제 요약

Google reflection 코드는 `SequentialAgent`로 초안 생성 후 검토를 수행하고 마지막 텍스트를 추출한다.
OpenAI 변환 시에도 동일한 2단계 순서를 유지해야 하며, 세션 공유와 출력 검증 규칙을 유지해야 한다.
현재 대상 OpenAI 파일은 비어 있으므로 신규 구현이 필요하다.

## 2. 궁극적인 목표 + 측정 기준

| 목표 | 측정 기준 |
| ---- | --------- |
| Reflection workflow 이주 완료 | `reflextion-openai.ts`가 2단계 순차 실행과 결과 반환을 구현 |
| 의미 동치 유지 | DraftWriter/FactChecker 역할명, 프롬프트 의도, 결과 키(`review`) 유지 |
| 품질 검증 | 계약 테스트 + 대상 파일 타입체크 통과 |

## 3. 작업 목록

## [P0] OpenAI SDK 호환성 스파이크 - 상태: 🔴 대기

**목적**: 구현 전 `MemorySession`/`Runner.run(..., { session })` 공개 API 사용 가능성과 무네트워크 계약 테스트 전략을 확정  
**목표 연결**: 구현 리스크/검증 리스크 선제 제거  
**의존성**: `depends_on: ["P0"]`  
**병렬 가능 여부**: `parallelizable: false`  
**필요 스킬**: `[google-sdk-to-openai-agents-js, technical-research-and-comparison]`

**주요 변경 지점 (정확한 경로):**

- Modify: `.agents/plans/PLAN.reflection-openai-migration.md` (Review log only)

**완료 기준:**

- [ ] 공개 export 기준으로 `MemorySession` + `session` 옵션 사용 가능성 확인
- [ ] 계약 테스트는 executor 주입 기반 무네트워크 경로를 기본으로 확정
- [ ] 세션 API 미지원 시 explicit input 전달 백업 경로를 구현 지침에 추가

## [P1] Reflection OpenAI 워크플로우 구현 - 상태: 🔴 대기

**목적**: Google reflection 예제를 OpenAI Agents SDK로 의미 동치 이주  
**목표 연결**: 사용자 요청 직접 충족  
**의존성**: `depends_on: []`  
**병렬 가능 여부**: `parallelizable: false`  
**필요 스킬**: `[google-sdk-to-openai-agents-js, test-driven-development, verification-before-completion]`

**주요 변경 지점 (정확한 경로):**

- Modify: `modules/04-reflection/example-code/typescript/reflextion-openai.ts`
- Create: `modules/04-reflection/example-code/typescript/reflextion-openai.spec.ts`

**예상 난이도**: 🟡 중간  
**리스크**:
- OpenAI SDK 버전별 API 차이로 타입 오류 가능
- 실제 실행은 외부 API 키 필요

**롤백 계획**:
- 파일 단일 변경이므로 해당 파일만 이전 상태로 복원 가능

**완료 기준:**

- [ ] `runReflectionOpenAI` 구현 완료
- [ ] `ReflectionOpenAIConfig`, `ReflectionOpenAIResult` 타입 정의
- [ ] 공유 `MemorySession` 1개 기반 순차 실행 보존
- [ ] 계약 테스트 3건(정상 review 반환, 빈 출력 예외, 순차 호출)이 통과
- [ ] 대상 파일 단위 타입체크 성공

**Step 1:** failing test 작성 (`reflextion-openai.spec.ts`)  
**Step 2:** 테스트 실행 및 실패 확인
- Command: `cd modules && node --test --experimental-strip-types ./04-reflection/example-code/typescript/reflextion-openai.spec.ts`
- Expected: FAIL (요구 동작 미구현)

**Step 3:** 최소 구현  
**Step 4:** 테스트 실행 및 통과 확인
- Command: `cd modules && node --test --experimental-strip-types ./04-reflection/example-code/typescript/reflextion-openai.spec.ts`
- Expected: PASS
- Command: `cd modules && npx tsc --noEmit --module nodenext --moduleResolution nodenext --target es2022 --types node ./04-reflection/example-code/typescript/reflextion-openai.ts ./04-reflection/example-code/typescript/reflextion-openai.spec.ts`
- Expected: PASS

## 4. 의존성 다이어그램

```text
P0 -> P1
```

## 5. 조사 필요 항목

| 항목 | 조사 이유 | 조사 방법 | 결정 기준 |
| ---- | --------- | --------- | --------- |
| OpenAI Agents 공개 API session 옵션 | `Runner.run(..., { session })` + `MemorySession`의 공개 사용 가능성 확인 | `@openai/agents` 공개 export 및 공식 문서 확인 | 공개 API만으로 구현 가능 |

## 6. 검증/완료 기준

## 전체 완료 조건

- [ ] 모든 P* 작업 🟢 완료
- [ ] 계약 테스트 통과
- [ ] 대상 파일 단위 타입체크 통과
- [ ] 사용자 요청 파일 생성/구현 완료

## 7. 📌 컨텍스트 요약 (다른 세션 전달용)

### 현재 진행 상황

- 완료: 소스/타깃 파일 및 SDK API 확인
- 진행중: P1 구현 위임 준비
- 블로킹: 없음

### 핵심 결정 사항

- 결정론 유지: handoff 대신 앱 제어 순차 실행
- 세션 전달: 공유 `MemorySession` 사용
- 런타임 구성: repository convention(`SYNTHETIC_*`) + fallback

### 주의 사항

- 파일명 오탈자(`relfection`, `reflextion`)는 기존 경로를 그대로 사용

### 다음 작업자에게

- P1 구현 후 계약 테스트 + 대상 파일 타입체크 증거를 함께 보고할 것
