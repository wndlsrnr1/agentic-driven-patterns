---
name: nestjs-foundation-rules
description: Use when implementing or reviewing NestJS backend code to enforce language baseline architecture, explicit contracts, and verification discipline.
---

# NestJS Foundation Rules

## Overview

Apply the NestJS backend baseline first, then layer-specific rules.

## Dependency Order

- `rules-governance`

## Team Conventions

- Keep OOP boundaries explicit with interface-first service contracts.
- Enforce DDD boundaries: Controller -> Service -> Repository -> Domain.
- Prefer readable code over clever shortcuts; keep Clean Code constraints.
- Preserve Effective Java spirit in TypeScript: explicit contracts, small methods, stable APIs.

## Mandatory Workflow

1. Define the behavior change and verification commands first.
2. Write a failing test first (RED).
3. Implement the minimum change to reach GREEN.
4. Refactor, then run full verification.
5. Report results with command-output evidence.

## Prohibited

- Do not import React-oriented rules into NestJS backend policy.
- Do not bypass typed contracts with `any` or unsafe dynamic access.
- Do not place business logic in transport layer controllers.

## Embedded Rule Sources (Full Text)

### `nestjs/nest-architecture.mdc`
- Scope (globs): `**/*.ts`
- alwaysApply: `false`

````md
---
description: NestJS backend architecture baseline - OOP, DDD, Clean Code, TDD, explicit contracts
globs: "**/*.ts"
alwaysApply: false
---

## NestJS Backend Baseline

- **Layer order**: Controller -> Service -> Repository -> Domain. Reverse dependency is prohibited.
- **Explicit types**: All public methods require explicit input/output types.
- **No dynamic shortcuts**: Avoid `any`, `as unknown as`, unguarded index access, and runtime reflection hacks.
- **Effective Java direction**: Prefer small focused units, stable contracts, and interface-based design.
- **DDD boundary**: Domain invariants belong to domain model; orchestration belongs to services.
- **Clean Code**: Keep nesting shallow (max 2-3), use intention-revealing names, remove dead branches.
- **TDD-first**: Red -> Green -> Refactor is mandatory.

## NestJS-Specific Rules

- Use NestJS Module boundaries to keep bounded contexts explicit.
- Keep decorators minimal and avoid hidden side effects in custom decorators.
- Use `class-validator` and DTOs at I/O boundaries only.
- Do not embed SQL/ORM logic in controllers.

## 금지 사항

- Business logic in `@Controller` classes.
- Repository access from controllers.
- Mixing frontend React hooks/effects guidance into backend rules.
````
