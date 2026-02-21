---
name: nestjs-testing-rules
description: Use when implementing or reviewing NestJS tests to enforce Red-Green-Refactor and layered verification coverage.
---

# NestJS Testing Rules

## Overview

Enforce `testing` responsibility boundaries in NestJS.

## Dependency Order

- `rules-governance`
- `nestjs-foundation-rules`

## Team Conventions

- Service tests first, then controller/integration tests.
- Keep tests behavior-focused and deterministic.
- Preserve Red-Green-Refactor evidence in workflow.

## Mandatory Workflow

1. Define the behavior change and verification commands first.
2. Write a failing test first (RED).
3. Implement the minimum change to reach GREEN.
4. Refactor, then run full verification.
5. Report results with command-output evidence.

## Prohibited

- Do not write blind tests that always pass.
- Do not over-mock core domain behavior.

## Embedded Rule Sources (Full Text)

### `nestjs/nest-testing.mdc`
- Scope (globs): `**/*.spec.ts`, `**/*.test.ts`
- alwaysApply: `false`

````md
---
description: NestJS testing policy - Red Green Refactor, service-first layering, and Given-When-Then naming
globs: "**/*.spec.ts", "**/*.test.ts"
alwaysApply: false
---

## Testing Rules

- Follow Red -> Green -> Refactor sequence for every behavior change.
- Name tests with clear intent using **Given-When-Then** phrasing.
- Prioritize service unit tests; add controller tests for wiring and guards.
- Integration tests should verify module wiring and persistence boundaries.

## Test Quality

- Assert domain outcomes, not framework internals.
- Keep fixtures minimal and deterministic.
- Include negative-path tests for business constraints.
````
