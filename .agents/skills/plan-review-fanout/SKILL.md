---
name: plan-review-fanout
description: Fan out plan review to multiple specialized sub-agents (feasibility/uncertainty/smell/intent) in parallel and merge results back into the plan.
---

Input: path to a PLAN file (e.g., .agents/plans/PLAN.foo.md)

Goal:

- 계획을 병렬 리뷰로 검증하고, 반영 가능한 형태로 PLAN에 기록한다.

Steps:

1. PLAN을 읽고, 리뷰 질문(각 역할별)을 고정한다.
2. 아래 4개 역할로 sub-agent를 병렬 spawn 하고, 모두 완료될 때까지 기다린다:

- feasibility_reviewer
- uncertainty_analyst
- smell_detector
- intent_guard

3. 결과 병합 규칙:

- REJECT(Blocking) 먼저 해결한다.
- 충돌하는 조언이 있으면 “사용자 궁극 의도/성공 기준”을 기준으로 선택한다.
- 선택 이유를 PLAN의 Review Log에 기록한다.

4. PLAN 업데이트:

- “Plan Review Gate” 섹션에 리뷰 결과 요약(VERDICT + 핵심 이슈)을 추가
- 변경된 Task/Wave/Acceptance criteria는 diff 형태로 명확히

Output format:

- Updated PLAN file saved (overwrite)
- Summary:
  - Feasibility: APPROVE/REJECT
  - Uncertainty: ...
  - Smell: ...
  - Intent: ...
  - Changes applied: N
