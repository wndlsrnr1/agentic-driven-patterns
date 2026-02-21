---
name: nestjs-security-rules
description: Use when implementing or reviewing NestJS security-sensitive code to enforce authentication, authorization, and regression verification.
---

# NestJS Security Rules

## Overview

Enforce `security` responsibility boundaries in NestJS.

## Dependency Order

- `rules-governance`
- `nestjs-foundation-rules`

## Team Conventions

- Apply authentication and authorization consistently.
- Keep controller checks declarative with guards and decorators.
- Verify security behavior with explicit regression tests.

## Mandatory Workflow

1. Define the behavior change and verification commands first.
2. Write a failing test first (RED).
3. Implement the minimum change to reach GREEN.
4. Refactor, then run full verification.
5. Report results with command-output evidence.

## Prohibited

- Do not leave temporary bypass flags in production paths.
- Do not mix authorization decisions into repository methods.

## Embedded Rule Sources (Full Text)

### `nestjs/nest-security.mdc`
- Scope (globs): `**/*guard.ts`, `**/*strategy.ts`, `**/*controller.ts`, `**/auth/**/*.ts`
- alwaysApply: `false`

````md
---
description: NestJS security - JWT auth, guard policy, and test-first security verification
globs: "**/*guard.ts", "**/*strategy.ts", "**/*controller.ts", "**/auth/**/*.ts"
alwaysApply: false
---

## Security Rules (TDD-First)

- AuthN: JWT strategy and guard chain must be explicit.
- AuthZ: Role/permission checks should be service-visible and testable.
- CORS/origin policy must be environment-driven.

## Required Tests

- Unauthorized request returns **401**.
- Forbidden request returns **403**.
- Authorized request returns expected success code.
- Sensitive endpoints verify header and token parsing behavior.

## 금지 사항

- Hardcoded secrets.
- Silent fallback to anonymous principal for protected APIs.
````
