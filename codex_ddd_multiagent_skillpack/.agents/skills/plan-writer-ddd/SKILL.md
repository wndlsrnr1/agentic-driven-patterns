---
name: plan-writer-ddd
description: Write a DDD + Clean Architecture plan as a file with Waves/Tasks, verification, and risk-driven contract testing. Use after intent brief is ready.
---

Goal: Intent Brief를 PLAN 파일로 만든다. 결과는 반드시 파일로 저장한다.
Target path: `.agents/plans/PLAN.<slug>.md` (slug는 짧고 의미있게)

Non-negotiables:
- 목적/비목적/성공 기준(수용 기준) 포함
- DDD: 유비쿼터스 언어/경계/도메인 규칙
- Clean Architecture: Domain ↔ Infra 분리, 의존성 방향 명시
- Wave/Task: 병렬 가능하도록 분해 + 의존성
- Risk-driven + Contract-driven testing: Wave 0 스파이크 + 최소 계약 테스트

How to write:
1) 먼저 repo 컨텍스트를 확인한다(이미 있는 구조/테스트/CI/언어/프레임워크).
2) Plan의 “도메인 목표/수용 기준”을 먼저 고정한다.
3) Task 분해 규칙:
- 1 Task = 1 PR 수준(작고 리뷰 가능)
- Task마다: 목적, 변경 파일 후보, 수용 기준, 검증 커맨드, Must NOT, 리스크
- 서로 다른 Task가 같은 파일을 대량으로 만지지 않게(병렬 충돌 최소화)
4) Wave 구성 규칙:
- Wave 0: 불확실성 깨기(스파이크/계약/데모)
- Wave 1..N: 의존성 DAG 기준으로 병렬 묶음
- 마지막 Wave: 통합/회귀/문서/정리
5) 테스트 전략:
- 불확실성 단계(Wave 0): 테스트보다 스파이크/데모/관측
- 계약 생김: Golden 1~3, Edge 1~3, Regression(버그 발생 시 고정)
- 안정화: 리팩터링 보험으로 확장

PLAN template (use these sections, keep it tight):
# <Plan Title>

## TL;DR
- Objective:
- Deliverables:
- Effort:
- Parallelism:

## 1. Intent and Success Criteria (DDD Anchor)
### Ultimate intent (Why)
### Ubiquitous Language (terms)
### Acceptance Criteria (verifiable)
- AC1: <command/output>
- AC2: ...

### Non-goals (Must NOT Have)
- ...

## 2. Domain Model (DDD)
- Bounded context:
- Entities / Value Objects:
- Domain invariants:
- Domain events (if any):

## 3. Architecture (Clean Architecture)
- Layers: Domain / Application / Interface / Infrastructure
- Dependency rule: <explicit>
- Module boundaries + file layout proposal (align to existing repo)

## 4. Uncertainty Register (Risk-driven)
- U1: ... (impact/likelihood) -> Wave 0 spike
- U2: ...

## 5. Wave Plan
### Wave 0 (Spike / Contract Definition)
- Goal:
- Steps:
- Output artifacts:
- Stop condition:

### Wave 1..N
For each wave:
- Goal
- Parallel Tasks list (T1..Tk)

## 6. Task List (each task is executable)
T1: <title>
- Layer: Domain|App|Interface|Infra
- What to change:
- Files:
- Dependencies:
- Must NOT:
- Verification:
- Contract tests (if applicable):
- Risks:

(Repeat)

## 7. Plan Review Gate
- Reviewers: feasibility / uncertainty / smell / intent
- Merge policy: blocking first, then non-blocking

## 8. Implementation & Verification Loop
- Per-task verification
- Per-wave verification
- Post-implementation audit (security/requirements/quality)

Finally:
- Save the plan to `.agents/plans/PLAN.<slug>.md`
- Print the path and a 5-line summary.
