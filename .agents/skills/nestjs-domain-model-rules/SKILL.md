---
name: nestjs-domain-model-rules
description: Use when implementing or reviewing NestJS domain models to keep invariants local and orchestration out of entities.
---

# NestJS Domain Model Rules

## Overview

Enforce `domain-model` responsibility boundaries in NestJS.

## Dependency Order

- `rules-governance`
- `nestjs-foundation-rules`

## Team Conventions

- Domain models keep state and invariants only.
- Cross-aggregate workflow logic belongs to services.
- Domain types should be explicit and intention-revealing.

## Mandatory Workflow

1. Define the behavior change and verification commands first.
2. Write a failing test first (RED).
3. Implement the minimum change to reach GREEN.
4. Refactor, then run full verification.
5. Report results with command-output evidence.

## Prohibited

- Do not call repositories/services from domain entities.
- Do not move orchestration into entity decorators/hooks.

## Embedded Rule Sources (Full Text)

### `nestjs/nest-domain-models.mdc`
- Scope (globs): `**/domain/**/*.ts`, `**/entity/**/*.ts`, `**/*entity.ts`
- alwaysApply: `false`

````md
---
description: NestJS domain models - entity state, invariants, aggregate boundaries
globs: "**/domain/**/*.ts", "**/entity/**/*.ts", "**/*entity.ts"
alwaysApply: false
---

## Domain Model Rules

- Keep intrinsic validation and invariants close to the model.
- Avoid framework-specific transport concerns in domain model.
- Use value objects/types to prevent primitive obsession.
- Keep aggregate boundaries explicit and stable.

## Persistence Compatibility

- If ORM decorators are used, do not let decorators dictate business flow.
- Domain integrity checks must be testable without HTTP layer.

## 금지 사항

- Entity methods that reach out to other aggregates via repository calls.
- Large procedural functions inside model classes.
````
