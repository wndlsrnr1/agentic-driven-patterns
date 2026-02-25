# library-tutorial.ts Implementation Plan

> **For Claude:** Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** `@langchain`, `@google/adk`, `@openai/agents` 세 가지 라이브러리의 핵심 병렬/체인 처리 구성요소들의 사용법을 하나의 튜토리얼 파일(`library-tutorial.ts`)에 명확하게 구현하여 각 라이브러리의 특징을 비교 학습할 수 있게 한다.

**Architecture:** 라이브러리별로 독립적인 실행 함수(`runLangChainDemo`, `runGoogleAdkDemo`, `runOpenAIAgentsDemo`)를 구성하고, 각각이 개별적인 컨텍스트에서 실행되도록 격리한다.

**Tech Stack:** TypeScript, `@langchain/core`, `@langchain/openai`, `@google/adk`, `@openai/agents`

---

## 현재 프로젝트 컨텍스트

### 시스템 개요

- 프로젝트명: ADP (Agentic Driven Patterns)
- 핵심 도메인: 다양한 LLM 프레임워크와 에이전트 라이브러리의 사용법 및 병렬 처리 비교 학습
- 기술 스택: TypeScript, Node.js, LangChain, Google ADK, OpenAI Agents
- 이 계획에 필요한 skills: `typescript-foundation-rules`, `subagent-driven-development`

### 현재 상황

- 문제/요구사항: 빈 파일인 `library-tutorial.ts`에 사용자가 제시한 세 가지 프레임워크의 개별 사용법(특히 병렬화 및 체인 구성)을 일관된 구조로 구현해야 함.
- 관련 코드/모듈: `tutorial.ts` (이들을 오케스트레이션), `tutorial.google-adk.ts` (기존 ADK 단독 구현 참고용)
- 제약 조건: 각 데모는 API 키가 없을 때 스킵되거나 적절한 에러를 반환해야 하며, 명확한 로깅(`logStep`)이 필요함.
- 기존 시도 및 결과: `tutorial.ts` 등에서 통합 실행과 예외 처리를 담당하고 있으므로, 본 파일은 개별 라이브러리의 모듈 단위 기능 시연(튜토리얼)에 집중.

---

## 출력 형식

### 1. 프로젝트/문제 요약

세 가지 주요 AI 에이전트 구축 프레임워크(LangChain, Google ADK, OpenAI Agents)의 구성요소(Agent, Runner, RunnableMap 등)를 사용해 동일/유사한 병렬 처리 작업을 수행하는 데모 코드를 단일 파일에 작성한다.

### 2. 궁극적인 목표 + 측정 기준

| 목표                                  | 측정 기준                                                                                                                                         |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| 세 프레임워크 기반 튜토리얼 통합 작성 | `node --experimental-strip-types modules/paralleization/library-tutorial.ts` 실행 시 각 라이브러리 데모가 순차/병렬로 동작하고 로그가 정상 출력됨 |
| 일관된 모듈화 및 로깅                 | 공통된 `logStep` 또는 유사한 로깅 방식을 사용하여 결과 출력 규격 통일                                                                             |

### 3. 작업 목록

## [P1] 공통 유틸리티 및 기본 구조 작성 - 상태: 🔴 대기

**목적**: 필수 로깅/유틸리티 함수 준비 및 전체 파일의 뼈대 구성
**목표 연결**: 각 튜토리얼 실행 시 일관된 형태의 결과 출력을 보장
**의존성**: `depends_on: []`
**병렬 가능 여부**: `parallelizable: false`
**필요 스킬**: `[typescript-foundation-rules]`

**주요 변경 지점 (정확한 경로):**

- Modify: `/home/jik/projects/adp/modules/paralleization/library-tutorial.ts` (기본 import 및 유틸리티 함수 추가)

**예상 난이도**: 🟢 낮음
**리스크**: 없음
**롤백 계획**: 빈 파일 복원

**완료 기준:**

- [ ] 파일 최상단에 주어진 import 문 모두 선언
- [ ] 콘솔/로그 유틸리티 함수 작성 (`logStep`, `resolveApiKey` 등)

**Step 1:** failing test 작성 (코드 전체)
**Step 2:** 테스트 실행 및 실패 확인

- Command: `npm run typecheck`
- Expected: FAIL (미구현)
  **Step 3:** 최소 구현
  **Step 4:** 테스트 실행 및 통과 확인
- Command: `node --experimental-strip-types modules/paralleization/library-tutorial.ts`
- Expected: PASS
  **Step 5:** `git add` / `git commit -m "feat: setup library-tutorial base structure"`

## [P2] LangChain 튜토리얼 구현 - 상태: 🔴 대기

**목적**: `RunnableMap`, `ChatPromptTemplate`, `StringOutputParser`, `ChatOpenAI`를 활용한 병렬 체인 시연
**목표 연결**: LangChain 프레임워크의 선언적 병렬 처리(`RunnableMap`) 사용법 제시
**의존성**: `depends_on: [P1]`
**병렬 가능 여부**: `parallelizable: true`
**필요 스킬**: `[typescript-foundation-rules]`

**주요 변경 지점 (정확한 경로):**

- Modify: `/home/jik/projects/adp/modules/paralleization/library-tutorial.ts` (`runLangChainDemo` 함수 추가)

**예상 난이도**: 🟡 중간
**리스크**: `OPENAI_API_KEY` 부재 시 오류 처리 확인
**롤백 계획**: P2 추가 코드 롤백

**완료 기준:**

- [ ] LLM 체인 생성 로직 작성
- [ ] 두 개 이상의 프롬프트를 병렬 처리하도록 `RunnableMap` 구성

**Step 1:** failing test 작성 (코드 전체)
**Step 2:** 테스트 실행 및 실패 확인

- Command: `npm run typecheck`
- Expected: FAIL
  **Step 3:** 최소 구현
  **Step 4:** 테스트 실행 및 통과 확인
- Command: `node --experimental-strip-types modules/paralleization/library-tutorial.ts`
- Expected: PASS
  **Step 5:** `git add` / `git commit -m "feat: implement langchain tutorial"`

## [P3] Google ADK 튜토리얼 구현 - 상태: 🔴 대기

**목적**: `Gemini`, `InMemoryRunner`, `LlmAgent`, `ParallelAgent`, `SequentialAgent`를 활용한 에이전트 구성
**목표 연결**: ADK의 명시적 병렬 에이전트 및 하위 에이전트 파이프라인 시연
**의존성**: `depends_on: [P1]`
**병렬 가능 여부**: `parallelizable: true`
**필요 스킬**: `[typescript-foundation-rules]`

**주요 변경 지점 (정확한 경로):**

- Modify: `/home/jik/projects/adp/modules/paralleization/library-tutorial.ts` (`runGoogleAdkDemo` 추가)

**예상 난이도**: 🟡 중간
**리스크**: `GOOGLE_API_KEY` 확인
**롤백 계획**: P3 코드 롤백

**완료 기준:**

- [ ] LlmAgent 2개를 ParellelAgent로 묶고 SynthesisAgent와 SequentialAgent로 연결하는 파이프라인 구현

**Step 1:** failing test 작성 (코드 전체)
**Step 2:** 테스트 실행 및 실패 확인

- Command: `npm run typecheck`
- Expected: FAIL
  **Step 3:** 최소 구현
  **Step 4:** 테스트 실행 및 통과 확인
- Command: `node --experimental-strip-types modules/paralleization/library-tutorial.ts`
- Expected: PASS
  **Step 5:** `git add` / `git commit -m "feat: implement adk tutorial"`

## [P4] OpenAI Agents 튜토리얼 구현 - 상태: 🔴 대기

**목적**: `Agent`, `OpenAIProvider`, `Runner` 등을 사용한 튜토리얼 작성
**목표 연결**: OpenAI 공식 SDK 에이전트 인터페이스 사용법 시연
**의존성**: `depends_on: [P1]`
**병렬 가능 여부**: `parallelizable: true`
**필요 스킬**: `[typescript-foundation-rules]`

**주요 변경 지점 (정확한 경로):**

- Modify: `/home/jik/projects/adp/modules/paralleization/library-tutorial.ts` (`runOpenAIAgentsDemo` 추가)

**예상 난이도**: 🟡 중간
**리스크**: `@openai/agents` 의 API 호환성
**롤백 계획**: P4 부분 롤백

**완료 기준:**

- [ ] Agent 선언 및 Runner를 통한 실행 흐름 구성

**Step 1:** failing test 작성 (코드 전체)
**Step 2:** 테스트 실행 및 실패 확인

- Command: `npm run typecheck`
- Expected: FAIL
  **Step 3:** 최소 구현
  **Step 4:** 테스트 실행 및 통과 확인
- Command: `node --experimental-strip-types modules/paralleization/library-tutorial.ts`
- Expected: PASS
  **Step 5:** `git add` / `git commit -m "feat: implement openai agents tutorial"`

## [P5] 진입점(CLI 실행 로직) 구성 - 상태: 🔴 대기

**목적**: CLI를 통해 세 가지 튜토리얼을 일괄/선택 실행
**목표 연결**: 튜토리얼을 직접 구동할 수 있는 메인 실행 파트
**의존성**: `depends_on: [P2, P3, P4]`
**병렬 가능 여부**: `parallelizable: false`

**주요 변경 지점 (정확한 경로):**

- Modify: `/home/jik/projects/adp/modules/paralleization/library-tutorial.ts` (하단 실행부 추가)

**예상 난이도**: 🟢 낮음

**완료 기준:**

- [ ] 모듈 직접 실행 시(`isDirectExecution` 확인) 세 튜토리얼이 순차 실행되어 결과 출력

**Step 1:** failing test 작성
**Step 2:** 테스트 실행 및 실패 확인

- Command: `npm run typecheck`
- Expected: FAIL
  **Step 3:** 최소 구현
  **Step 4:** 테스트 실행 및 통과 확인
- Command: `node --experimental-strip-types modules/paralleization/library-tutorial.ts`
- Expected: PASS
  **Step 5:** `git add` / `git commit -m "feat: implement CLI runner for tutorial"`

### 4. 의존성 다이어그램

```text
P1 → P2, P3, P4
P2, P3, P4 → P5
```

### 5. 조사 필요 항목

| 항목                                         | 조사 이유                                                          | 조사 방법                              | 결정 기준                                                               |
| -------------------------------------------- | ------------------------------------------------------------------ | -------------------------------------- | ----------------------------------------------------------------------- |
| OpenAI Agents 모듈의 병렬 처리 특화 API 유무 | 단순 Runner 연속 실행이 아닌, 체인화/병렬화 API가 있는지 확인 필요 | SDK 타입 선언/문서 검색 가능 여부 확인 | 전용 병렬 API가 없으면 독립된 Agent들을 Runner로 개별/동시 실행 후 종합 |

### 6. 검증/완료 기준

## 전체 완료 조건

- [ ] 모든 P\* 작업 🟢 완료
- [ ] `node --experimental-strip-types modules/paralleization/library-tutorial.ts` 정상 구동 및 전체 로그 출력

### 7. 다른 모델/세션 전달용 컨텍스트

## 📌 컨텍스트 요약 (다른 세션 전달용)

### 현재 진행 상황

- 대기중

### 핵심 결정 사항

- 단일 튜토리얼 파일 내에 3개의 데모를 독립적인 함수(`run...Demo`)로 구성하여 각각 분리

### 주의 사항

- 각 라이브러리 간의 병렬화 방식(예: 선언적 Map, 전용 Agent, Promise.all)에 집중하여 구현할 것

### 다음 작업자에게

- `.sisyphus/plans/library-tutorial.ts-plan.md` 문서를 기준으로 `P1` ~ `P5` 태스크를 작성해주세요.
