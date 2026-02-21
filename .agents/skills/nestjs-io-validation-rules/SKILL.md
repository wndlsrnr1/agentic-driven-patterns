---
name: nestjs-io-validation-rules
description: Use when implementing or reviewing NestJS DTO and boundary validation to separate input contracts from domain rule validation.
---

# NestJS Io Validation Rules

## Overview

Enforce `io-validation` responsibility boundaries in NestJS.

## Dependency Order

- `rules-governance`
- `nestjs-foundation-rules`

## Team Conventions

- Validate I/O shape at boundary with DTOs and pipes.
- Validate domain rules in services/domain validators.
- Keep serializer/transformer code free of orchestration.

## Mandatory Workflow

1. Define the behavior change and verification commands first.
2. Write a failing test first (RED).
3. Implement the minimum change to reach GREEN.
4. Refactor, then run full verification.
5. Report results with command-output evidence.

## Prohibited

- Do not query database directly from DTO validators.
- Do not place business use-case branches in pipes.

## Embedded Rule Sources (Full Text)

### `nestjs/nest-dtos.mdc`
- Scope (globs): `**/dto/**/*.ts`, `**/*dto.ts`, `**/*request.ts`, `**/*response.ts`
- alwaysApply: `false`

````md
---
description: NestJS DTO and boundary validation rules with class-validator and transformation
globs: "**/dto/**/*.ts", "**/*dto.ts", "**/*request.ts", "**/*response.ts"
alwaysApply: false
---

## DTO Rules

- Use DTO classes with `class-validator` for shape checks.
- Keep transformation explicit (`toServiceDto`, `fromDomain` patterns).
- Separate Controller DTO and Service DTO when transport contract differs from domain contract.

## Validation Split

- Boundary validation: format, required fields, basic length/range.
- Domain validation: cross-entity and business constraints in service/domain validator.

## 금지 사항

- Repository calls from custom decorators/validators in DTO layer.
- Domain decision branching inside response mappers.
````
