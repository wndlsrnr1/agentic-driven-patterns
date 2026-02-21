---
name: nestjs-service-rules
description: Use when implementing or reviewing NestJS services to enforce business orchestration, transaction boundaries, and typed contracts.
---

# NestJS Service Rules

## Overview

Enforce `service` responsibility boundaries in NestJS.

## Dependency Order

- `rules-governance`
- `nestjs-foundation-rules`

## Team Conventions

- Service layer owns business rules and use-case orchestration.
- Transaction boundaries must be explicit and testable.
- Prefer interface-first contracts for service APIs.

## Mandatory Workflow

1. Define the behavior change and verification commands first.
2. Write a failing test first (RED).
3. Implement the minimum change to reach GREEN.
4. Refactor, then run full verification.
5. Report results with command-output evidence.

## Prohibited

- Do not include HTTP formatting in services.
- Do not hide domain rules inside repository queries.

## Embedded Rule Sources (Full Text)

### `nestjs/nest-services.mdc`
- Scope (globs): `**/*service.ts`
- alwaysApply: `false`

````md
---
description: NestJS services - business orchestration, transactions, repository coordination
globs: "**/*service.ts"
alwaysApply: false
---

## NestJS Services

- Pipeline pattern: validate -> load -> process -> persist -> return.
- Services call repositories and domain validators only.
- Keep method contracts explicit (`Promise<ResultDto>` etc.).
- Use transaction helpers (`QueryRunner`, unit-of-work abstraction) for multi-write consistency.

### Testing Direction

- Service tests come first.
- Test names should describe behavior with Given-When-Then semantics.
- Exceptions should express domain intent, not framework leakage.

### 금지 사항

- `@Res()` / response writing in service layer.
- Calling other layers through hidden static/global state.
````
