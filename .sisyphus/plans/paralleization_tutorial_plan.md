# Paralleization Tutorial Implementation Plan

> **For Claude:** Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** `modules/paralleization/tutorial.py`에 `google.adk.agents`와 `LangChain`의 병렬 처리(`RunnableParallel`)를 활용한 완벽한 튜토리얼 스크립트를 작성합니다.

**Architecture:** 튜토리얼은 하나의 실행 가능한 파이썬 스크립트 구조로, 첫 번째 섹션에서는 Custom `LlmAgent` 및 `ParallelAgent/SequentialAgent`를 활용한 리서치 파이프라인을 시연하고, 두 번째 섹션에서는 `LangChain`의 `RunnableParallel`을 활용한 요약/질문생성/키워드추출 병렬 파이프라인을 시연합니다. 각 섹션 전후에 마크다운 스타일의 출력(print)으로 설명을 제공합니다.

**Tech Stack:** Python 3, `google.adk.agents`, `langchain_core`, `langchain_openai`, `asyncio`

---

## 현재 프로젝트 컨텍스트

### 시스템 개요

- 프로젝트명: Agentic Driven Patterns (adp)
- 핵심 도메인: AI Agent 파이프라인 및 병렬 처리 패턴
- 기술 스택: Python, LangChain, Google Custom ADK (LlmAgent, ParallelAgent 등)
- 이 계획에 필요한 skills: `writing-plans`, `executing-plans`, `python-development`

### 현재 상황

- 문제/요구사항: 제시된 import 문을 사용하여 완전한 튜토리얼 코드(`tutorial.py`)를 구현하는 계획을 수립해야 함. 주어진 import에는 google.adk.agents와 langchain의 컴포넌트가 모두 포함되어 있으므로, 이 둘을 모두 효과적으로 시연하는 코드가 필요.
- 관련 코드/모듈:
  - `modules/paralleization/paralleization_google.py` (ADK 사용 예시 코드 존재)
  - `modules/paralleization/paralleization_langchain.py` (Langchain 사용 예시 코드 존재)
  - `modules/paralleization/tutorial.py` (빈 파일, 구현 대상)
- 제약 조건: 주어진 `import` 문 목록을 모두 사용하며, 타입 힌팅을 적용하고, 코드가 명확하고 교육적으로 주석과 출력을 갖추어야 함.
- 기존 시도 및 결과: 대상 파일 `tutorial.py`는 현재 비어있음.

---

## 궁극적인 목표 + 측정 기준

| 목표                                                    | 측정 기준                                                                                             |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `tutorial.py`에 ADK와 LangChain을 활용한 시연 코드 작성 | `tutorial.py` 스크립트가 에러 없이 두 가지 방식(ADK / Langchain)의 파이프라인을 차례로 실행 및 출력함 |

---

## 작업 목록

## [P1] 튜토리얼 뼈대 구성 및 기초 함수 작성 - 상태: 🔴 대기

**목적**: 전체 진입점(Entry point), 환경 변수 체크, LLM 및 기본 도구 생성 함수 구현
**목표 연결**: 튜토리얼의 실행 가능성을 보장하고 기본 모델 셋업을 모듈화함
**의존성**: `blocks: [P2, P3]`
**병렬 가능 여부**: `parallelizable: false`
**필요 스킬**: `[python-development]`

**주요 변경 지점 (정확한 경로):**

- Modify: `modules/paralleization/tutorial.py`

**예상 난이도**: 🟢 낮음
**리스크**: `OPENAI_API_KEY` 환경 변수가 없으면 LangChain 파트 실행 시 오류가 날 수 있음. 검증 필요.
**롤백 계획**: 빈 상태로 되돌리기

**완료 기준:**

- [ ] 스크립트에 `if __name__ == "__main__": asyncio.run(main())` 뼈대 추가
- [ ] 타입 힌트와 상수 정의 완료

**Step 1:** failing test 작성 (튜토리얼 스크립트에 의도적 에러 삽입)
**Step 2:** 테스트 실행 및 실패 확인

- Command: `python modules/paralleization/tutorial.py`
- Expected: FAIL (미구현으로 인한 에러)
  **Step 3:** 최소 구현 (기본 뼈대, llm 셋업 함수, 상수 추가)
  **Step 4:** 테스트 실행 및 통과 확인
- Command: `python modules/paralleization/tutorial.py`
- Expected: PASS
  **Step 5:** `git add` / `git commit -m "feat: setup tutorial skeleton"`

## [P2] google.adk 기반 파이프라인 튜토리얼 구현 - 상태: 🔴 대기

**목적**: `LlmAgent`, `ParallelAgent`, `SequentialAgent`, `google_search`를 사용해 병렬 리서치 후 요약하는 구조 작성
**목표 연결**: Custom ADK 병렬 처리 시연
**의존성**: `depends_on: [P1]`
**병렬 가능 여부**: `parallelizable: true`
**필요 스킬**: `[python-development]`

**주요 변경 지점 (정확한 경로):**

- Modify: `modules/paralleization/tutorial.py`

**예상 난이도**: 🟡 중간
**리스크**: `google_search` 툴의 정상 작동 여부, ADK 모듈 호환성
**롤백 계획**: P1의 결과 상태로 git checkout

**완료 기준:**

- [ ] `ParallelAgent`에 서브 에이전트를 넣어 병렬로 동작하는 코드 확인
- [ ] `SequentialAgent`로 취합 단계까지 이어지는 코드 작성

## [P3] LangChain 기반 RunnableParallel 튜토리얼 구현 - 상태: 🔴 대기

**목적**: `RunnableParallel`, `ChatPromptTemplate`, `StrOutputParser`를 사용해 3가지 분석(요약, 키워드, 질문)을 동시에 진행하는 체인 구축
**목표 연결**: LangChain 생태계 코드를 활용한 병렬성 시연
**의존성**: `depends_on: [P1]`
**병렬 가능 여부**: `parallelizable: true`
**필요 스킬**: `[python-development]`

**주요 변경 지점 (정확한 경로):**

- Modify: `modules/paralleization/tutorial.py`

**예상 난이도**: 🟡 중간
**리스크**: Langchain 버전 차이에 의한 API 변경 등
**롤백 계획**: 해당 구현부 삭제

**완료 기준:**

- [ ] `RunnableParallel` 생성 및 `ainvoke` 로 체인 병렬 실행 정상 반환

## [P4] Main 통합 및 교육용 주석 정리 - 상태: 🔴 대기

**목적**: 두 파이프라인(P2, P3)을 차례대로 실행하여 튜토리얼로서 완성도 있게 콘솔에 설명과 결과를 출력하도록 개선
**목표 연결**: 사용자 친화적 튜토리얼 문서화 완료
**의존성**: `depends_on: [P2, P3]`
**병렬 가능 여부**: `parallelizable: false`
**필요 스킬**: `[python-development]`

**주요 변경 지점 (정확한 경로):**

- Modify: `modules/paralleization/tutorial.py`

**예상 난이도**: 🟢 낮음
**리스크**: 없음
**롤백 계획**: 부분 되돌리기

**완료 기준:**

- [ ] 명확한 콘솔 출력 `print` 문 및 코드 상의 인라인 주석 추가
- [ ] 최종 스크립트 `python modules/paralleization/tutorial.py` 런타임 통과 확인
- [ ] Linter 오류 없음 확인

---

## 4. 의존성 다이어그램

```text
P1 → P2, P3
P2, P3 → P4
```

---

## 5. 조사 필요 항목

| 항목                         | 조사 이유                                                    | 조사 방법                                                     | 결정 기준                                                                        |
| ---------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| ADK의 `root_agent` 실행 방식 | ADK 에이전트들을 생성한 후 어떻게 `run`/`invoke` 하는지 파악 | `paralleization_google.py`의 다른 호출 부분이나 ADK 소스 검색 | 구현 코드 상에 `await sequential_pipeline_agent.run()` 등 메서드가 명확히 확인됨 |

---

## 6. 검증/완료 기준

## 전체 완료 조건

- [ ] 모든 P\* 작업 🟢 완료
- [ ] `modules/paralleization/tutorial.py` 파일 내 요구된 모든 `import` 문항 존재
- [ ] `python modules/paralleization/tutorial.py` 실행 시 ADK 파트와 Langchain 파트 성공적으로 콘솔 출력 발생

---

## 7. 다른 모델/세션 전달용 컨텍스트

## 📌 컨텍스트 요약 (다른 세션 전달용)

### 현재 진행 상황

- 완료: 요구사항 분석 및 구현 계획 수립 (Plan 작성을 통한 튜토리얼 설계)
- 진행중: -
- 블로킹: -

### 핵심 결정 사항

- 주어진 모든 import 모듈을 한 파일에서 시연하는 Two-Part 튜토리얼 구성
- TDD 프로세스와 Bite-sized 태스크 원칙을 엄격하게 적용하여 구현 예정

### 주의 사항

- `google.adk`의 동작 방식이 표준 툴과 다를 수 있으므로 `paralleization_google.py`를 참조하여 구현.

### 다음 작업자에게

- Plan saved to `.sisyphus/plans/paralleization_tutorial_plan.md`.
- 이 문서 규약을 기준으로 `superpowers:executing-plans`를 사용해 실행(Execution)해 주세요.
