# Rule-to-Skill Migration Strategy

## 1) Migration Goal

Move policy from `.agents/rules` into `.agents/skills` while preserving:

- precedence (`general -> language -> layer/capability`)
- ownership boundaries (controller/service/repository/etc.)
- triggering intent (file globs -> skill description triggers)

## 2) Tier Taxonomy

- `L0-governance`
  - scope: repository-wide policy
  - source examples: `general/cursor_rules.mdc`, `general/code-principles.mdc`
- `L1-language-foundation`
  - scope: language architecture baseline
  - source examples: `java/spring-architecture.mdc`, `python/django-artitecture.mdc`, `typescript/react-common.mdc`
- `L2-layer-role`
  - scope: layer ownership and responsibilities
  - role examples: controller, service, repository, model/entity, io-validation, security, testing, platform, async
- `L3-domain-capability`
  - scope: domain-specific capabilities
  - source examples: `python/ai-summarization.mdc`, `python/stt-integration.mdc`, `python/performance-optimization.mdc`

## 3) Role Classification Heuristics

- `controller`: controller, views, rest, urls
- `service`: service
- `repository`: repository, jpa
- `domain-model`: entity, model, domain
- `io-validation`: dto, serializer, request, response, validation, form
- `security`: security, auth
- `testing`: test
- `platform`: config, configuration, middleware
- `async`: async, task, scheduler
- fallback: `capability` or `misc`

## 4) Naming Rules

- General governance: `rules-<role>`
- Language foundation: `<language>-foundation-rules`
- Layer-role: `<language>-<role>-rules`
- Capability: `<language>-<role>-capability-rules`

Use a migration prefix (for example `migrated-`) when scaffolding into an existing skill set.

## 5) Conversion Checklist

- Source file selected from `.mdc` first, `.md` only as fallback.
- Description rewritten with explicit "Use when..." trigger text.
- Body rewritten from static rule text to actionable workflow text.
- Conflicting or duplicated rules merged only if ownership boundary is identical.
- Generated skill passes `quick_validate.py`.

## 6) Review Checklist

- Every rule appears in exactly one proposed target skill group.
- L0/L1 policy is never buried inside narrow feature skills.
- L2 skills stay role-specific.
- L3 skills stay capability-specific.
- Trigger description is broad enough to activate when needed and narrow enough to avoid noisy activation.
