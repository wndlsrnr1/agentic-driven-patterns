codex-ddd-multiagent-skillpack

이 패키지는 Codex CLI에서 “계획 → 병렬 리뷰 → 반영 → (요청 시) 구현 → 검증 → 사후 감사” 루프를 안정적으로 반복하기 위한
AGENTS.md + 멀티에이전트 role config + Skills(SKILL.md) 템플릿 모음입니다.

설치(레포 루트 기준):
1) 이 zip을 레포 루트에 풀어서 다음이 생기게 합니다.
   - AGENTS.md
   - .codex/config.toml
   - agents/*.toml
   - .agents/skills/*/SKILL.md

2) Codex CLI를 레포에서 실행하고, 필요할 때 스킬을 호출합니다.
   - $intent-discovery
   - $intent-inference
   - $plan-writer-ddd
   - $plan-review-fanout
   - $wave-executor
   - $post-implementation-audit

권장 사용 흐름:
- 사용자가 “뭘 해야 할지 잘 모르겠다/아이디어부터” → $intent-discovery → $plan-writer-ddd → $plan-review-fanout
- 사용자가 “요구사항이 꽤 구체적” → $intent-inference → $plan-writer-ddd → $plan-review-fanout
- 사용자가 “구현해줘” → (위 계획 완료 후) $wave-executor → (완료 후) $post-implementation-audit

산출물 기본 경로:
- 계획: .agents/plans/PLAN.<slug>.md
- 구현 진행 로그(선택): .agents/runs/<slug>/
- 리뷰 기록(선택): .agents/reviews/<slug>/

주의:
- 이 템플릿은 “Agent=클래스 / Skill=메서드” 관점에서 SRP(단일 책임)로 쪼갠 구성이므로,
  프로젝트에 맞게 역할/스킬 수를 줄이거나 합쳐도 됩니다.
