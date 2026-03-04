---
name: wave-executor
description: Execute an approved PLAN in Waves/Tasks using Codex multi-agents, with per-wave verification. Use only after the user explicitly requests implementation.
---

Hard gate:
- 사용자가 “구현”을 명시적으로 요청하지 않았다면 이 스킬을 사용하지 않는다.

Input:
- PLAN path: .agents/plans/PLAN.<slug>.md

Goal:
- Plan을 그대로 구현한다. 스코프 드리프트 금지.
- Wave 단위로 병렬 실행하고, Wave마다 검증한다.

Process:
1) PLAN에서 Wave/Task를 파싱한다(수동 파싱 OK).
2) Wave 0가 있으면 먼저 실행:
- Spike 결과(계약/예제/제약/데모)를 산출물로 남기고, PLAN의 Uncertainty를 업데이트한다.
3) Wave 1..N:
- Wave 내 Task를 병렬로 worker sub-agents에 분배한다.
- 각 worker에게 Task 계약(What/Must NOT/Verification)을 그대로 전달한다.
- 충돌 가능성이 큰 Task는 같은 Wave에 두지 않는다(같은 파일/모듈 대량 수정).

4) Wave 검증:
- PLAN의 verification commands 실행
- 실패 시: 실패 원인 최소 수정 → 재검증 → 다음 Wave

5) 진행 기록(권장):
- .agents/runs/<slug>/wave-<n>.md 에 무엇을 했고 어떤 검증을 통과했는지 기록

Output:
- Wave별 완료 요약
- 최종 검증 결과
- 다음: post-implementation-audit
