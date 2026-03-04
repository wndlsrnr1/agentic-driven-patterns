---
name: intent-discovery
description: "Use when the user is unsure/vague and needs idea shaping: ask targeted questions + do web/doc research to converge on an Intent Brief."
---

Goal: '대화 → Intent Brief(궁극 의도/성공 기준/제약/스코프)'를 합의 가능한 수준으로 만든다.
You are not writing code. You are turning ambiguity into decisions.

Process:

1. Intent classification

- user가 잘 모르는 상태인지(아이디어 탐색/옵션 비교/라이브러리 추천) 확인한다.
- Intent type: Refactor | Build | Research | Architecture | Mid-sized | Collaborative

2. Evidence first (필요한 경우)

- 기술/라이브러리 선택이 핵심이면 웹/문서로 2~3개 옵션을 조사한다.
- 옵션마다: 장점/단점/리스크/선택 기준을 3~5줄로 요약한다.
- “버전/호환성/라이선스/유지보수성” 중 리스크가 큰 항목을 먼저 확인한다.

3. 질문 설계(최소 질문, 최대 정보)

- 질문은 ‘결정이 필요한 것’만. 일반론 질문 금지.
- 우선순위: (1) 성공 기준(검증 가능) (2) 스코프/비목적 (3) 제약 (4) 데이터/인터페이스 (5) 운영/보안

4. Intent Brief 작성(초안)

- 사용자가 답하면 즉시 Intent Brief를 업데이트한다.
- 모르는 부분은 Assumptions로 명시하고 “검증 방법”을 붙인다.

Output format (copy exactly):
Intent Brief

- Ultimate intent (Why):
- Success criteria (verifiable commands or observable outcomes):
- Non-goals (Out of scope):
- Constraints (tech, time, policy):
- Users / stakeholders:
- Inputs / outputs (contracts):
- Data model (draft):
- Candidate approaches (2-3) + trade-offs:
- Key risks (top 5) + mitigations:
- Open questions (only the blockers):
- Next step: plan-writer-ddd
