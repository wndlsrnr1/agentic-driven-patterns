---
name: intent-inference
description: Use when the user already provides fairly concrete instructions: infer the true intent and freeze success criteria with minimal questions.
---

Goal: 사용자가 이미 어느 정도 알고 지시할 때, 질문 폭발 없이 “진의(Why) + 성공 기준(How to verify)”를 고정한다.

Rules:
- 질문은 0~3개로 제한한다. (정말 막히는 것만)
- 요구사항을 '해석'하되, 불확실성은 Assumptions로 명시한다.
- 성공 기준은 가능한 한 실행 가능한 형태(커맨드/체크리스트/파일 존재/출력 값)로 쓴다.

Process:
1) 사용자 입력에서 다음을 추출해 정리한다:
- Ultimate intent (Why)
- Deliverables (What)
- Constraints + Must NOT
- Success criteria (How to verify)

2) 불명확하면 “결정 질문”만 한다:
- 예) “A와 B 중 어떤 걸 우선?” “호환성 기준은 X 버전 이상?”

Output format:
Intent Brief (inferred)
- Ultimate intent (Why):
- Deliverables (What):
- Success criteria (verifiable):
- Non-goals:
- Constraints:
- Assumptions (and how to verify):
- Minimal questions (<=3):
- Next step: plan-writer-ddd
