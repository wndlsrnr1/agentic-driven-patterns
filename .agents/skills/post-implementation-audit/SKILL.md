---
name: post-implementation-audit
description: After implementation, run parallel audits (security/requirements/quality). Rejects must be fixed and re-audited.
---

Input:

- PLAN path + current code state

Goal:

- 구현 후에 놓친 위험/요구사항 누락/품질 문제를 병렬로 잡는다.

Steps:

1. 아래 3개 역할로 sub-agent를 병렬 spawn:

- security_auditor
- requirements_auditor
- quality_reviewer

2. 병합 규칙:

- REJECT가 하나라도 있으면, 해당 영역 수정 후 그 감사만 재실행.
- APPROVE면 종료.

Output:

- Audit summary (3 verdicts)
- If fixed: list of fixes + re-audit result
