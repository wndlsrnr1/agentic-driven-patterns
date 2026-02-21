---
name: nestjs-domain-capability-rules
description: Use when implementing or reviewing NestJS domain capabilities that must align with foundation and layer policies.
---

# NestJS Domain Capability Rules

## Overview

Apply NestJS domain capability rules consistently.

## Dependency Order

- `rules-governance`
- `nestjs-foundation-rules`

## Team Conventions

- Keep capability scope explicit and bounded.
- Avoid conflicts with baseline/layer policies.
- Define capability-level regression checkpoints.

## Mandatory Workflow

1. Define the behavior change and verification commands first.
2. Write a failing test first (RED).
3. Implement the minimum change to reach GREEN.
4. Refactor, then run full verification.
5. Report results with command-output evidence.

## Prohibited

- Do not merge unrelated capability concerns into one skill.
- Do not bypass baseline security/testing requirements.

## Embedded Rule Sources (Full Text)

### `nestjs/nest-openapi-docs.mdc`
- Scope (globs): `**/*controller.ts`, `**/dto/**/*.ts`, `**/*response.ts`
- alwaysApply: `false`

````md
---
description: NestJS API documentation policy with OpenAPI decorators and capability-level acceptance tests
globs: "**/*controller.ts", "**/dto/**/*.ts", "**/*response.ts"
alwaysApply: false
---

## Domain Capability Example: API Documentation

- Document endpoints with `@ApiOperation`, `@ApiResponse`, `@ApiTags`.
- Document DTO fields with `@ApiProperty` and clear examples.
- Keep docs synchronized with runtime contracts and validation rules.

## Regression Direction

- Add capability tests for generated OpenAPI schema stability.
- Test descriptions should keep behavior intent clear using Given-When-Then framing.
- When auth scope is documented, ensure guard behavior is tested together.
````
