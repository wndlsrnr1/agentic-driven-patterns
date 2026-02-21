---
name: writing-plans
description: Use when creating executable implementation plans for complex development, refactoring, architecture, or process tasks before coding.
---

# Writing Plans

## Role & When to Use

**Role:** 시니어 엔지니어/아키텍트. 말만 그럴듯한 계획이 아니라, 바로 실행 가능한 계획을 만든다.

**When:** 복잡한 개발/리팩토링/아키텍처/업무 프로세스 작업에서, 코딩 전에 다단계 실행 계획이 필요할 때.

**Announce:** "I'm using the writing-plans skill to create the implementation plan."

**Single-source rule:** 이 문서 자체를 실행 기준으로 사용하며, 외부 참조 없이도 동일한 계획 품질을 보장해야 한다.

**Save to:** `.sisyphus/plans/<filename>.md`

**Code style baseline:** OOP, DDD, Clean Code, Effective Software Design, SSOT.

---

## 목적

1. 실행 가능한 계획 수립
2. 다른 AI 모델/세션이 이어받을 수 있는 컨텍스트 제공
3. 진행 상태 추적 및 의존성 관리
4. 문제 해결을 위한 조사 계획과 실행 계획 제시
5. 독립 작업은 병렬 조사/병렬 위임으로 처리
6. 서브에이전트별 필요한 스킬을 명시

---

## 선행 규칙

- 계획 시작 전에 반드시 현재 프로젝트 컨텍스트를 채운다.
- 불확실한 내용은 추측하지 말고 `🔍 조사 필요`로 표기한다.
- Java는 LSP 신뢰 이슈가 있을 수 있으므로, 검증 근거는 build/test 결과를 우선한다.
- 다른 언어는 가능한 경우 LSP 검증을 병행한다.
- 필수 7섹션(요약/목표표/P작업/의존성/조사표/완료기준/인수인계) 누락을 금지한다.
- 독립 작업은 병렬 가능 여부(`parallelizable`)와 서브에이전트 스킬(`subagent_skills`) 표기를 의무화한다.
- 종속 작업은 `depends_on` 또는 `blocks` 표기를 의무화한다.
- 모든 P 작업은 TDD 5-step(FAIL→PASS→commit) 템플릿을 포함해야 한다.

---

## Plan Header (필수)

모든 계획은 아래 헤더로 시작한다.

```markdown
# [Feature Name] Implementation Plan

> **For Claude:** Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** [한 문장]

**Architecture:** [2–3문장]

**Tech Stack:** [주요 기술/라이브러리]

---
```

---

## 프로젝트/문제 컨텍스트 (필수)

이 섹션이 비어 있으면 계획을 세우지 않는다.

- **시스템 개요:** 프로젝트명, 핵심 도메인, 기술 스택
- **현재 상황:** 문제/요구사항, 관련 코드/모듈, 제약 조건, 기존 시도 및 결과
- **필요 스킬 맵:** 이 계획 실행에 필요한 스킬 목록

템플릿:

```markdown
## 현재 프로젝트 컨텍스트

### 시스템 개요
- 프로젝트명:
- 핵심 도메인:
- 기술 스택:
- 이 계획에 필요한 skills:

### 현재 상황
- 문제/요구사항:
- 관련 코드/모듈:
- 제약 조건:
- 기존 시도 및 결과:
```

---

## 원칙

### 1) 작업 분리 원칙

- 적절한 분리: 의미 있는 비즈니스/서비스/배포 단위로 분리
- 과도한 분리 금지: 단순 함수/단일 사용 요소는 상위 작업에 포함
- 기능/행동 보존: 리팩토링 시 외부 동작 동일 유지
- 재사용성 기준: 반복/재사용 가능성이 있는 것만 모듈화

### 2) 계획 수립 원칙

- 불확실성 명시: 확신 없으면 `🔍 조사 필요`
- 계획 구체화: 추상 구호 금지, 즉시 실행 가능한 단위로 분해
- 의존성 명시: `depends_on` / `blocks` 또는 다이어그램으로 선후관계 고정
- 목표 연결: 각 작업이 궁극 목표에 기여하는 이유를 명시

### 3) 병렬 조사/위임 원칙 (필수)

- 독립 작업(상호 상태 의존 없음)은 병렬 처리 대상으로 표시한다.
- 종속 작업은 의존성이 해소될 때까지 시작 금지한다.
- 병렬 위임 시 각 서브에이전트에 필요한 skills를 함께 명시한다.
- 예시 표기:
  - `parallelizable: true`
  - `depends_on: [P1]`
  - `subagent_skills: [systematic-debugging, java-service-rules]`

### 4) Bite-sized & TDD 원칙 (필수)

- 한 Step은 2–5분 단위로 쪼갠다.
- TDD 순서 고정:
  1. failing test 작성
  2. 실패 확인
  3. 최소 구현
  4. 통과 확인
  5. 커밋
- 각 Step에 exact file path, exact command, expected result(FAIL/PASS)를 넣는다.

### 5) 금지 원칙

- 과도한 최적화 금지
- 과도하게 방어적인 코드 금지
- 동적 코드 남용 금지 (`getattr`, `setattr`, `hasattr` 등)

---

## 출력 형식 (필수)

### 1. 프로젝트/문제 요약 (3–5줄)

### 2. 궁극적인 목표 + 측정 기준

| 목표 | 측정 기준 |
|------|----------|
| 예시 | 예시 |

### 3. 작업 목록

```markdown
## [P1] 작업명 - 상태: 🔴 대기 | 🟡 진행중 | 🟢 완료 | ⛔ 블로킹

**목적**:
**목표 연결**:
**의존성**: `depends_on: [...]` 또는 `blocks: [...]`
**병렬 가능 여부**: `parallelizable: true|false`
**서브에이전트 스킬**: `subagent_skills: [...]`

**주요 변경 지점 (정확한 경로):**
- Create: `path/to/file`
- Modify: `path/to/file`
- Test: `path/to/test`

**예상 난이도**: 🟢 낮음 | 🟡 중간 | 🔴 높음
**리스크**:
**롤백 계획**:

**완료 기준:**
- [ ] 테스트 통과 조건
- [ ] 검증 명령 + 기대 결과
```

### 4. 의존성 다이어그램

```text
P0 → P1, P2
P2 → P3
```

### 5. 조사 필요 항목

| 항목 | 조사 이유 | 조사 방법 | 결정 기준 |
|------|----------|----------|----------|

### 6. 검증/완료 기준

```markdown
## 전체 완료 조건
- [ ] 모든 P* 작업 🟢 완료
- [ ] 기존 테스트 통과
- [ ] 신규 테스트 추가
- [ ] 요구 성능/품질 기준 충족
```

### 7. 다른 모델/세션 전달용 컨텍스트

```markdown
## 📌 컨텍스트 요약 (다른 세션 전달용)

### 현재 진행 상황
- 완료:
- 진행중:
- 블로킹:

### 핵심 결정 사항
- 

### 주의 사항
- 

### 다음 작업자에게
- 
```

---

## TDD Step 템플릿 (각 P 작업 내부에 삽입)

```markdown
**Step 1:** failing test 작성 (코드 전체)
**Step 2:** 테스트 실행 및 실패 확인
- Command:
- Expected: FAIL (요구사항 미구현 원인)

**Step 3:** 최소 구현
**Step 4:** 테스트 실행 및 통과 확인
- Command:
- Expected: PASS

**Step 5:** `git add` / `git commit -m "..."`
```

---

## 품질 체크리스트

- [ ] Header/Goal/Architecture/Tech Stack 포함
- [ ] 프로젝트/문제 컨텍스트 누락 없음
- [ ] 모든 P 작업에 의존성/완료 기준 존재
- [ ] 독립 작업의 병렬 가능성 판단 포함
- [ ] 조사 필요 항목 표 포함
- [ ] 검증 명령과 기대 결과가 구체적임
- [ ] 세션 인수인계 템플릿 포함
- [ ] 저장 경로가 `.sisyphus/plans/<filename>.md`로 명시됨

---

## Execution Handoff

계획 저장 후 다음 문장을 사용한다.

`Plan saved to .sisyphus/plans/<filename>.md. 이 문서 규약을 기준으로 superpowers:executing-plans를 사용해 실행한다.`
