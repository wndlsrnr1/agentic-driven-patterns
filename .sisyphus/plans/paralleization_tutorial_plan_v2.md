# Parallelization Tutorial Replan (Executable, Minimal-CLI, Step-by-Step)

> **For Claude:** Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** `modules/paralleization`의 튜토리얼을 라이브러리별로 각각 단독 실행 가능하게 재구성하고, CLI/환경변수 의존을 최소화하여 단계별 학습 흐름을 명확히 만든다.

**Architecture:** 기존의 거대한 `tutorial.ts`/`tutorial.py`를 얇은 오케스트레이터로 축소하고, Google ADK/LangChain/OpenAI Agents를 각각 독립 실행 파일로 분리한다. 각 파일은 "학습 단계(1: 설정, 2: 병렬 구성, 3: 실행/결과)"를 코드와 로그로 명시하고, 런타임 값(모델/주제/프롬프트/베이스 URL)은 내부 상수로 고정한다.

**Tech Stack:** TypeScript(Node test + strip-types), Python(venv), @google/adk, @langchain/openai, @openai/agents, openai-agents(Python)

---

## 현재 프로젝트 컨텍스트

### 시스템 개요
- 프로젝트명: adp/modules tutorial samples
- 핵심 도메인: 병렬 처리 패턴 학습용 실행 스크립트
- 기술 스택: TS + Python 멀티 런타임
- 이 계획에 필요한 skills: `executing-plans`, `test-driven-development`, `verification-before-completion`

### 현재 상황
- 문제/요구사항:
  - "각각 실행 가능한 튜토리얼" 필요
  - "CLI/환경변수 많이 쓰지 말기"
  - 내부 하드코딩 중심, CLI는 실행 진입점만
  - 각 라이브러리를 단계별로 학습 가능해야 함
- 관련 코드/모듈:
  - `modules/paralleization/tutorial.ts` (단일 대형 파일)
  - `modules/paralleization/tutorial.py` (단일 대형 파일)
  - `modules/paralleization/parallelization_*.ts`, `paralleization_*.py` (라이브러리별 예제)
- 제약 조건:
  - 보안상 실제 비밀키는 코드에 하드코딩 금지
  - 그러나 모델/주제/프롬프트/URL/학습 단계는 코드 상수로 고정
- 기존 시도 및 결과:
  - 이전 계획은 대규모 네이밍 정규화/광범위 API 재설계 중심이었고, 현재 요구(학습용 실행성/간결성)와 우선순위가 다름

---

## 1) 프로젝트/문제 요약
- 튜토리얼의 목표를 "운영형 설정 유연성"이 아니라 "학습형 실행 단순성"으로 전환한다.
- 각 라이브러리별 파일이 단독 실행 가능해야 하므로 파일 경계를 런타임 기능이 아니라 학습 단위로 재설계한다.
- 환경변수는 최소 1개 수준(키 주입용)으로 축소하고, 나머지는 내부 상수로 통일한다.
- `tutorial.ts`/`tutorial.py`는 전체 튜토리얼 인덱스(순차 실행) 역할만 담당한다.

## 2) 궁극적인 목표 + 측정 기준

| 목표 | 측정 기준 |
|------|----------|
| 라이브러리별 독립 튜토리얼 실행 | 각 파일이 인자 없이 단독 실행되어 단계 로그 + 결과를 출력 |
| CLI/ENV 단순화 | step 선택/모델/URL/topic CLI 파라미터 제거, 필수 키 외 env 의존 제거 |
| 단계별 학습 구조 고정 | 모든 튜토리얼이 동일한 3단계 로그 포맷(SETUP/PARALLEL/EXECUTE) 제공 |
| 회귀 안정성 | 기존 TS 테스트 + 신규 튜토리얼 구조 테스트 통과 |

## 3) 작업 목록

## [P1] 튜토리얼 구조 재정의 및 파일 경계 확정 - 상태: 🔴 대기

**목적**: 학습 단위 중심으로 파일 역할을 고정
**목표 연결**: "각각 실행 가능" 요구를 구조적으로 보장
**의존성**: `blocks: [P2, P3, P4]`
**병렬 가능 여부**: `parallelizable: false`
**필요 스킬**: `[test-driven-development]`

**주요 변경 지점 (정확한 경로):**
- Modify: `modules/paralleization/tutorial.ts`
- Modify: `modules/paralleization/tutorial.py`
- Create: `modules/paralleization/tutorial.google-adk.ts`
- Create: `modules/paralleization/tutorial.langchain.ts`
- Create: `modules/paralleization/tutorial.openai-agents.ts`
- Create: `modules/paralleization/tutorial_google_adk.py`
- Create: `modules/paralleization/tutorial_langchain.py`
- Create: `modules/paralleization/tutorial_openai_agents.py`

**완료 기준:**
- [ ] 기존 대형 파일에서 라이브러리별 분리 완료
- [ ] 각 파일이 자체 `run...Tutorial()` 엔트리 보유
- [ ] 공통 단계 라벨 상수(`STEP 1/2/3`) 통일

**TDD Step:**
1. failing test: 새 파일 export/엔트리 기대 테스트 작성
2. 실패 확인: `cd modules && npm test -- --test-name-pattern="tutorial"`
3. 최소 구현: 파일 생성 + 엔트리 함수 연결
4. 통과 확인: 동일 명령 PASS
5. 커밋

## [P2] TypeScript: 독립 실행 튜토리얼 3종 구현 - 상태: 🔴 대기

**목적**: TS에서 라이브러리별 학습 파일 완성
**목표 연결**: 각 라이브러리의 단계 학습 가능
**의존성**: `depends_on: [P1]`
**병렬 가능 여부**: `parallelizable: true`
**필요 스킬**: `[test-driven-development, typescript-foundation-rules]`

**주요 변경 지점:**
- Create/Modify:
  - `modules/paralleization/tutorial.google-adk.ts`
  - `modules/paralleization/tutorial.langchain.ts`
  - `modules/paralleization/tutorial.openai-agents.ts`
  - `modules/paralleization/tutorial.ts` (인덱스 실행기)
  - `modules/paralleization/tutorial.spec.ts`
  - `modules/package.json` (실행 스크립트 단순화)

**구현 규약:**
- CLI 파싱 금지 (`--step`, argv 기반 선택 제거)
- 학습 상수 하드코딩:
  - topic, instruction, model name, base URL
- 비밀키는 하드코딩 금지:
  - 각 파일에서 단일 입력만 허용 (`const API_KEY: string = process.env.X ?? ""`)
- 키 없으면 예외 대신 `skipped` + 명확한 안내 로그

**완료 기준:**
- [ ] `npm run tutorial:google-adk`, `tutorial:langchain`, `tutorial:openai-agents` 실행 가능
- [ ] 각 실행 로그에 `STEP 1`, `STEP 2`, `STEP 3` 포함
- [ ] `tutorial.ts`는 세 파일을 순차 실행만 수행

## [P3] Python: 독립 실행 튜토리얼 3종 구현 - 상태: 🔴 대기

**목적**: Python에서도 동일 학습 흐름 제공
**목표 연결**: 언어별 차이 없이 라이브러리 개념 학습 가능
**의존성**: `depends_on: [P1]`
**병렬 가능 여부**: `parallelizable: true`
**필요 스킬**: `[test-driven-development]`

**주요 변경 지점:**
- Create/Modify:
  - `modules/paralleization/tutorial_google_adk.py`
  - `modules/paralleization/tutorial_langchain.py`
  - `modules/paralleization/tutorial_openai_agents.py`
  - `modules/paralleization/tutorial.py` (인덱스 실행기)
  - `modules/requirements.txt`

**구현 규약:**
- 인자 파싱/환경변수 매트릭스 제거
- 내부 상수(주제/모델/프롬프트/URL) 고정
- 키 입력은 최소화(파일당 1개 env fallback 허용)
- `openai-agents>=0.10.1` 추가 및 `agents` import 경로 사용

**완료 기준:**
- [ ] `modules/venv/bin/python modules/paralleization/tutorial_google_adk.py` 실행
- [ ] `modules/venv/bin/python modules/paralleization/tutorial_langchain.py` 실행
- [ ] `modules/venv/bin/python modules/paralleization/tutorial_openai_agents.py` 실행
- [ ] 각 파일 단계 로그 통일

## [P4] 검증 및 문서화 정리 - 상태: 🔴 대기

**목적**: 실행성/학습성/회귀 안정성 증명
**목표 연결**: "학습용 튜토리얼" 품질 완성
**의존성**: `depends_on: [P2, P3]`
**병렬 가능 여부**: `parallelizable: false`
**필요 스킬**: `[verification-before-completion]`

**주요 변경 지점:**
- Modify: `modules/package.json` (튜토리얼 스크립트)
- Optional Modify: `modules/paralleization/README.md` (없으면 생성)

**완료 기준:**
- [ ] TypeScript typecheck/test 통과
- [ ] Python py_compile 통과
- [ ] 독립 튜토리얼 실행 로그 확인
- [ ] 최종 리포트에 실행 커맨드/결과 요약 포함

---

## 4) 의존성 다이어그램

```text
P1 → P2, P3
P2, P3 → P4
```

---

## 5) 조사 필요 항목

| 항목 | 조사 이유 | 조사 방법 | 결정 기준 |
|------|----------|----------|----------|
| ADK Python run API (`InvocationContext`/runner) | 단독 실행 파일에서 가장 안정적인 호출 방식 선택 필요 | 기존 `tutorial.py` + `paralleization_google.py` 재사용 | 기존 코드에서 이미 동작한 경로 우선 |
| openai-agents Python 최소 예제 | step3를 짧고 학습용으로 유지하기 위함 | `agents` 패키지 클래스(`Agent`, `Runner`)로 최소 병렬 샘플 작성 | 30~50줄 내 병렬 핵심 표현 가능 여부 |

---

## 6) 검증/완료 기준

## 전체 완료 조건
- [ ] 모든 P* 작업 🟢 완료
- [ ] TS 검증
  - `cd modules && npm run typecheck`
  - `cd modules && npm test`
- [ ] Python 검증
  - `modules/venv/bin/python -m py_compile modules/paralleization/*.py`
  - `modules/venv/bin/python -m pip show openai-agents`
- [ ] 실행 검증
  - `cd modules && npm run tutorial:google-adk`
  - `cd modules && npm run tutorial:langchain`
  - `cd modules && npm run tutorial:openai-agents`
  - `cd modules && npm run tutorial:all`

---

## 7) 다른 모델/세션 전달용 컨텍스트

## 📌 컨텍스트 요약 (다른 세션 전달용)

### 현재 진행 상황
- 완료: 요구사항 재정의(독립 실행/최소 CLI/단계 학습)
- 진행중: 구현 대기
- 블로킹: 없음

### 핵심 결정 사항
- 이번 스코프는 "학습 실행성" 최우선이며 광범위 네이밍 정규화는 제외
- 비밀키 외 런타임 값은 내부 상수 하드코딩
- `tutorial.ts`/`tutorial.py`는 인덱스 러너로 축소

### 주의 사항
- 기존 워크트리가 더티 상태이므로 튜토리얼 관련 파일만 수정
- 기존 `parallelization_*` 예제는 회귀 위험 줄이기 위해 최대한 재사용

### 다음 작업자에게
- Plan saved to `.sisyphus/plans/paralleization_tutorial_plan_v2.md`. 이 문서 규약을 기준으로 superpowers:executing-plans를 사용해 실행한다.
