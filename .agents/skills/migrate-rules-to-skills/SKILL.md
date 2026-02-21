---
name: migrate-rules-to-skills
description: Convert `.agents/rules` rule sets into reusable skills in `.agents/skills` while preserving hierarchy and role boundaries. Use when migrating `.md/.mdc` rules, building a language/layer/capability migration plan, or scaffolding role-based SKILL folders from existing rules.
---

# Migrate Rules to Skills

## Overview

Use this skill to migrate rule-centric guidance to skill-centric guidance without losing precedence and ownership boundaries. It classifies rules by hierarchy (L0-L3), groups them by role, and can scaffold target skill folders.

## Quick Start

1. Inventory and classify rules.

```bash
python scripts/analyze_rules.py --rules-dir .agents/rules --format markdown
```

2. Generate a role-aware migration plan.

```bash
python scripts/migrate_rules_to_skills.py \
  --rules-dir .agents/rules \
  --skills-dir .agents/skills
```

3. Scaffold grouped skills only when the plan is approved.

```bash
python scripts/migrate_rules_to_skills.py \
  --rules-dir .agents/rules \
  --skills-dir .agents/skills \
  --scaffold \
  --prefix migrated-
```

4. Validate each generated skill.

```bash
python /home/jik/.codex/skills/.system/skill-creator/scripts/quick_validate.py \
  .agents/skills/<generated-skill-name>
```

## Hierarchy Model (Preserve This Order)

- `L0-governance`: Global principles and rule-authoring policy.
- `L1-language-foundation`: Per-language architecture baseline.
- `L2-layer-role`: Controller/service/repository/model/security/test and similar layer ownership.
- `L3-domain-capability`: Domain features such as STT, AI summarization, performance tuning.

Apply lower levels only after higher levels are mapped. Never collapse L0 or L1 into narrow feature skills.

## Role Mapping Rules

- Keep `general/*` as cross-language governance skills.
- Keep `java/*`, `python/*`, `typescript/*` as language namespaces.
- Split `L2-layer-role` by ownership boundary:
  - HTTP/API surface (`controller`, `views`, `rest`, `urls`)
  - Application orchestration (`service`, `async`)
  - Persistence (`repository`, `jpa`, `model`, `entity`)
  - Contracts and validation (`dto`, `serializer`, `validation`, `form`)
  - Security and testing (`security`, `test`)
- Keep `L3-domain-capability` focused on a single capability per skill.

For full heuristics and examples, read [references/migration-strategy.md](references/migration-strategy.md).

## Workflow

1. Run `scripts/analyze_rules.py` to produce an inventory of source rules.
2. Confirm tiers and roles match project architecture.
3. Run `scripts/migrate_rules_to_skills.py` to build a migration plan.
4. Review generated group names and source-to-target mapping.
5. Scaffold only approved groups, then refine generated SKILL.md files.
6. Validate with `quick_validate.py` before calling migration complete.

## Guardrails

- Prefer `.mdc` as source of truth.
- Use `.md` only as fallback when `.mdc` peer does not exist.
- Preserve rule intent; rewrite wording for skill trigger semantics only.
- Do not merge unrelated roles to reduce file count.
- Keep generated names stable and deterministic.

## Resources (optional)

### scripts/

- `analyze_rules.py`: Parse and classify rules by language, tier, and role.
- `migrate_rules_to_skills.py`: Generate plan and scaffold grouped skills.

### references/

- `migration-strategy.md`: Tier model, role taxonomy, naming rules, and review checklist.
