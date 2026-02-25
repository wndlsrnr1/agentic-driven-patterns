# Libarary Tutorial Implementation Plan

> **For Claude:** Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** `@google/adk` 및 `@google/genai`의 주요 TS 컴포넌트 10개(Gemini, InMemoryRunner 등)에 대응하는 파이썬 튜토리얼 코드를 `libarary-tutorial.py`에 구현한다.

**Architecture:** Python `google.adk` 및 `google.genai` (또는 동등한 라이브러리)의 구조를 분석하고, TS 튜토리얼(`tutorial.google-adk.ts`)과 동일한 수준의 로직을 Python `libarary-tutorial.py`에 1:1로 매핑하여 가상환경에서 실행 가능한 튜토리얼 제공.

**Tech Stack:** Python 3.x, google.adk.agents, google.genai, asyncio

---

## 현재 프로젝트 컨텍스트

### 시스템 개요

- 프로젝트명: adp (Agentic Driven Patterns)
- 핵심 도메인: 병렬 에이전트 파이프라인(Parallelization) 튜토리얼
- 기술 스택: Python, TypeScript, Google ADK, LangChain
- 이 계획에 필요한 skills: `writing-plans`, `executing-plans`, `systematic-debugging`

### 현재 상황

- 문제/요구사항: TS 버전(`tutorial.google-adk.ts`)에서 사용된 핵심 객체 및 타입(Gemini, InMemoryRunner, LlmAgent, ParallelAgent, SequentialAgent, isFinalResponse, stringifyContent, Event, createUserContent, Content)들을 Python 가상 환경에서 동작하는 `libarary-tutorial.py`에 튜토리얼 형태로 각자 소개 및 구현해야 함.
- 관련 코드/모듈: `modules/paralleization/tutorial.google-adk.ts`, `modules/paralleization/tutorial_google_adk.py`, `modules/paralleization/libarary-tutorial.py`
- 제약 조건: "가상환경에서 실행된다"는 전제. Python 타입 힌팅 엄격 적용(`-> ...`).
- 기존 시도 및 결과: `tutorial_google_adk.py`에서 일부(`LlmAgent`, `ParallelAgent`, `SequentialAgent`)는 사용 중 확인됨. 나머지(`Gemini`, `InMemoryRunner`, `isFinalResponse` 등)의 Python 매핑 조사가 선행되어야 함.

---

## [P1] 환경 및 의존성 분석 - 상태: 🔴 대기

**목적**: `google.adk`의 Python 패키지에 TS 패키지의 컴포넌트들과 정확히 1:1 매칭되는 클래스/함수가 있는지 조사.
**목표 연결**: 튜토리얼 코드 작성 전 정확한 Import 경로 확인.
**의존성**: 없으며 가장 먼저 시작해야 함.
**병렬 가능 여부**: `parallelizable: false`
**필요 스킬**: `[systematic-debugging]`

**주요 변경 지점 (정확한 경로):**

- 없음 (순수 조사 및 모듈 탐색)

**예상 난이도**: 🟡 중간
**리스크**: Python SDK에 없는 컴포넌트일 경우 대체 구현 방법이나 모의(Mock) 클래스를 명시해야 함.
**롤백 계획**: 없음

**완료 기준:**

- [ ] 파이썬 가상환경 `.venv`에서 `google.adk` 및 `google.genai`의 10개 요소에 대한 Import 경로 탐색 완료 및 문서화

---

## [P2] libarary-tutorial.py 뼈대 작성 - 상태: 🔴 대기

**목적**: 파일에 TDD 기반의 스텝별 튜토리얼 구조를 잡고 공통 유틸 함수 구현.
**목표 연결**: TS의 `toStepResult`, `resolveApiKey`, `logStep` 대응 Python 기본 구조 작성.
**의존성**: `depends_on: [P1]`
**병렬 가능 여부**: `parallelizable: false`
**필요 스킬**: `[executing-plans]`

**주요 변경 지점 (정확한 경로):**

- Modify: `/home/jik/projects/adp/modules/paralleization/libarary-tutorial.py`

**예상 난이도**: 🟢 낮음

**완료 기준:**

- [ ] 기본 로깅 및 API Key Resolve 함수, Result 클래스 작성
- [ ] `python libarary-tutorial.py` 단순 실행 시 문법 오류 없음

```markdown
**Step 1:** libarary-tutorial.py 기본 뼈대 구상
**Step 2:** 파이썬 실행

- Command: `python /home/jik/projects/adp/modules/paralleization/libarary-tutorial.py`
- Expected: PASS (no elements yet, but executes without error)
  **Step 3:** 최소 구현 적용
  **Step 4:** 재실행 통과 확인
- Command: `python /home/jik/projects/adp/modules/paralleization/libarary-tutorial.py`
- Expected: PASS
  **Step 5:** git add & commit
```

---

## [P3] 10개 컴포넌트 튜토리얼 파이프라인 구현 - 상태: 🔴 대기

**목적**: 대상 객체들(Gemini, InMemoryRunner, LlmAgent, ParallelAgent, SequentialAgent, Event 등)을 활용한 병렬 요약 워크플로우를 완성.
**목표 연결**: 핵심 요구사항 달성 (`tutorial.google-adk.ts`와 동일한 튜토리얼 논리 구현).
**의존성**: `depends_on: [P2]`
**병렬 가능 여부**: `parallelizable: false`
**필요 스킬**: `[executing-plans]`

**주요 변경 지점 (정확한 경로):**

- Modify: `/home/jik/projects/adp/modules/paralleization/libarary-tutorial.py`

**예상 난이도**: 🟡 중간

**완료 기준:**

- [ ] 튜토리얼 스크립트에 10가지 개념이 차례로 적용된 예시 주석 및 구현 포함
- [ ] 비동기 실행 전체 흐름 정상 동작

```markdown
**Step 1:** Pipeline 뼈대 작성 (Pipeline 생성 부)
**Step 2:** 실행 및 실패 여부 확인

- Command: `python /home/jik/projects/adp/modules/paralleization/libarary-tutorial.py`
- Expected: FAIL (미완성 또는 API 에러 등)
  **Step 3:** 각 컴포넌트 실제 바인딩
  **Step 4:** 재실행하여 출력 확인
- Command: `python /home/jik/projects/adp/modules/paralleization/libarary-tutorial.py`
- Expected: PASS (ADK tutorial log + text output)
  **Step 5:** git add & commit
```

---

## 조사 필요 항목

| 항목                                                       | 조사 이유                    | 조사 방법                                                                       | 결정 기준                                                             |
| ---------------------------------------------------------- | ---------------------------- | ------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `InMemoryRunner`, `isFinalResponse`, `stringifyContent` 등 | Python SDK 내 존재 여부 파악 | 가상환경 내에서 `python -c "import google.adk..."` 또는 `pip freeze`, 코드 스캔 | 클래스 존재 시 공식 임포트 사용, 없을 시 직접 Mock 함수/클래스로 구현 |

---

## 📌 컨텍스트 요약 (다른 세션 전달용)

### 현재 진행 상황

- 계획 수립 완료. (진행 상태: 대기)

### 핵심 결정 사항

- TS의 각 10가지 컴포넌트 요소들을 Python 매핑 기준으로 튜토리얼 파이썬 모듈 내에 단계별로 구현함.

### 다음 작업자에게

- `libarary-tutorial.py` 작업 전 P1의 조사(Python 매핑)를 반드시 먼저 수행할 것. (파이썬 google-adk 버전 및 제공 클래스 확인 필수)
