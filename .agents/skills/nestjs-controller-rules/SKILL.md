---
name: nestjs-controller-rules
description: Use when implementing or reviewing NestJS controllers to enforce HTTP boundary responsibilities with strict delegation to services.
---

# NestJS Controller Rules

## Overview

Enforce `controller` responsibility boundaries in NestJS.

## Dependency Order

- `rules-governance`
- `nestjs-foundation-rules`

## Team Conventions

- Controllers handle only transport concerns (HTTP input/output, auth context, status mapping).
- Delegate business decisions to service layer.
- Keep DTO contracts explicit and validated.

## Mandatory Workflow

1. Define the behavior change and verification commands first.
2. Write a failing test first (RED).
3. Implement the minimum change to reach GREEN.
4. Refactor, then run full verification.
5. Report results with command-output evidence.

## Prohibited

- Do not call repositories directly from controllers.
- Do not encode transaction/business branching in controllers.

## Embedded Rule Sources (Full Text)

### `nestjs/nest-controllers.mdc`
- Scope (globs): `**/*controller.ts`
- alwaysApply: `false`

````md
---
description: NestJS controllers - thin transport layer with DTO validation and service delegation
globs: "**/*controller.ts"
alwaysApply: false
---

## NestJS Controllers

- Use `@Controller` + method decorators for routing only.
- Validate request DTOs with `ValidationPipe` and `class-validator`.
- Map service result to HTTP response shape; keep mapping minimal.
- Use guards/interceptors/filters for cross-cutting concerns.

### Do

- `controller -> service` one-way dependency.
- Explicit response status mapping (`200/201/204`, error mapping by exception filter).
- Keep methods small and readable.

### Don't

- Repository or ORM imports in controller.
- Business logic branches based on domain state.
- Direct transaction control in controller.
````
