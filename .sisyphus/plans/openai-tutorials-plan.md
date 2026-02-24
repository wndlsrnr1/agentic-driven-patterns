# OpenAI Agents & Zod Tutorial Implementation Plan

> **For Claude:** Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** `@openai/agents`와 `zod` 라이브러리의 핵심 개념(Tool 사용 및 Agent 라우팅)을 단계별로 익히는 튜토리얼 코드를 작성한다.

**Architecture:** 단일 파일(`openai-tutorials.ts`) 내에 단계별(Step-by-step) 주석과 기초 봇(Basic Agent)부터 도우미 도구(Tool), 그리고 심화(Coordinator) 모델까지 점진적으로 개념을 설명하는 구조.

**Tech Stack:** TypeScript, `@openai/agents`, `zod`

---

## 현재 프로젝트 컨텍스트

### 시스템 개요

- 프로젝트명: ADP (Agentic Driven Patterns)
- 핵심 도메인: TypeScript 기반 다중에이전트(Multi-agent) 라우팅 실습 및 패턴 라이브러리 개발
- 기술 스택: Node.js, TypeScript, Open AI Agents SDK, Zod
- 이 계획에 필요한 skills: `typescript-foundation-rules`, `test-driven-development`

### 현재 상황

- 문제/요구사항: `@openai/agents` SDK와 `zod` 기반 도구 검증을 쉽게 배울 수 있는 튜토리얼(한글 주석 포함) 필요
- 관련 코드/모듈: `modules/routing-patterns/coordinator-routing-openai.ts` (심화 라우팅 예제가 이미 존재하여 이를 위한 디딤돌로 작용)
- 제약 조건: 하나의 빈 파일 `openai-tutorials.ts` 내에 주석과 코드로 튜토리얼을 완성해야 함
- 기존 시도 및 결과: `openai-tutorials.ts`가 빈 상태로 생성되어 있으며, 튜토리얼 계획 작성을 요청받음

---

## 궁극적인 목표 + 측정 기준

| 목표               | 측정 기준                                                                                    |
| ------------------ | -------------------------------------------------------------------------------------------- |
| 튜토리얼 파일 완성 | `openai-tutorials.ts`에서 타입 에러가 없고(`tsc`), `node` 환경에서 기대 결과가 나오는지 확인 |

---

## 작업 목록

## [P1] 튜토리얼 환경 구성 및 단일 에이전트 생성 실습 - 상태: 🔴 대기

**목적**: 파일 상단에 라이브러리의 역할을 설명하는 주석을 추가하고, 환경 변수 로드 및 가장 기본적인 Agent 생성 코드를 구현한다.
**목표 연결**: 튜토리얼의 도입부 및 가장 쉬운 예제를 제공하여 진입 장벽을 극복
**의존성**: `depends_on: []`
**병렬 가능 여부**: `parallelizable: false`
**필요 스킬**: `[typescript-foundation-rules]`

**주요 변경 지점 (정확한 경로):**

- Modify: `modules/routing-patterns/openai-tutorials.ts`

**예상 난이도**: 🟢 낮음
**리스크**: 없음
**롤백 계획**: 빈 파일 상태로 원상복구

**완료 기준:**

- [ ] 파일 상단에 `@openai/agents`와 `zod` 기능 설명 주석(Korean) 작성
- [ ] 단순 응답 처리(Runner, OpenAIProvider 활용) 객체 생성 및 실행 코드 포함
- [ ] CLI에서 호출 가능하도록 `runTutorial` 함수 인터페이스 정의 유지

**Step 1:** failing test 작성 (튜토리얼 파일이므로 Node 실행이 실패/성공을 결정)
**Step 2:** 테스트 실행 및 실패 확인

- Command: `npx tsc --noEmit modules/routing-patterns/openai-tutorials.ts`
- Expected: FAIL (빈 파일 또는 import 미사용 경고)
  **Step 3:** 최소 구현 (단일 에이전트 작성)
  **Step 4:** 테스트 실행 및 통과 확인
- Command: `npm run typecheck` 및 Node 실행
- Expected: PASS
  **Step 5:** `git add` / `git commit -m "feat: basic agent tutorial step in openai-tutorials.ts"`

---

## [P2] Zod 도구(Tool) 및 Handoff 파트 추가 - 상태: 🔴 대기

**목적**: `zod` 파라미터를 받는 `tool` 함수 생성과 Coordinator 에이전트를 통한 Handoff 개념을 튜토리얼에 추가 구현
**목표 연결**: `coordinator-routing-openai.ts`를 학습하기 위해 필요한 핵심 개념인 도구 사용 및 위임을 연습
**의존성**: `depends_on: [P1]`
**병렬 가능 여부**: `parallelizable: false`
**필요 스킬**: `[typescript-foundation-rules]`

**주요 변경 지점 (정확한 경로):**

- Modify: `modules/routing-patterns/openai-tutorials.ts`

**예상 난이도**: 🟢 낮음

**완료 기준:**

- [ ] `zod.object` 스키마를 사용하는 `tool(...)` 예제 작성 (예: 날씨 가져오기 또는 계산기)
- [ ] 하위 Agent와 Coordinator 구성을 통해 `handoffs` 배열을 사용한 라우팅 예제 코드 추가
- [ ] 파일 직접 실행을 위한 하단 CLI 진입점(`if (!process.env.NODE_TEST_CONTEXT)`) 구문 추가

**Step 1:** 최소 구현 코드 작성
**Step 2:** 테스트 실행 및 실패 확인

- Command: `npx tsc --noEmit modules/routing-patterns/openai-tutorials.ts`
  **Step 3:** 세부 라우팅 및 Handoff 코드 구현 (Tool 정의, Coordinator Agent 연결)
  **Step 4:** 테스트 실행 및 통과 확인
- Command: `node --env-file=.env --experimental-strip-types modules/routing-patterns/openai-tutorials.ts`
- Expected: 로그 출력 확인 (PASS)
  **Step 5:** `git add` / `git commit -m "feat: tool and handoff workflow added to tutorial"`

---

## 전체 완료 조건

- [ ] 모든 P\* 작업 🟢 완료
- [ ] `openai-tutorials.ts` 빌드 성공 (`tsc --noEmit`)
- [ ] CLI 직접 실행 스크립트로 동작 확인

---

## 📌 컨텍스트 요약 (다른 세션 전달용)

### 현재 진행 상황

- 완료: 계획 수립
- 진행중:
- 블로킹:

### 핵심 결정 사항

- 단일 파일 `openai-tutorials.ts` 내에서 2가지 Step(기본 봇 -> Tool/Handoff 통합 봇)으로 나누어 점진적으로 설명하는 코드 작성
- 주석은 한국어로 작성

### 주의 사항

- `z.infer`를 통한 타입 추출 및 `zod`를 이용한 Tool 파라미터 타입 추론 강점을 코드 주석으로 명시할 것.

### 다음 작업자에게

- 본 계획(`.sisyphus/plans/openai-tutorials-plan.md`)을 읽은 후 `superpowers:executing-plans` 규칙에 따라 순차적으로 구현을 시작해 주세요.
