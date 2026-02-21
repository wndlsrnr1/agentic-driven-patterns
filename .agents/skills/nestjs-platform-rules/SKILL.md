---
name: nestjs-platform-rules
description: Use when implementing or reviewing NestJS platform configuration and cross-cutting infrastructure boundaries.
---

# NestJS Platform Rules

## Overview

Enforce `platform` responsibility boundaries in NestJS.

## Dependency Order

- `rules-governance`
- `nestjs-foundation-rules`

## Team Conventions

- Keep config/bootstrap/middleware focused on infrastructure concerns.
- Keep business logic out of platform layer.
- Document environment-specific behavior explicitly.

## Mandatory Workflow

1. Define the behavior change and verification commands first.
2. Write a failing test first (RED).
3. Implement the minimum change to reach GREEN.
4. Refactor, then run full verification.
5. Report results with command-output evidence.

## Prohibited

- Do not hardcode secrets or environment values.
- Do not couple feature use-cases to app bootstrap code.

## Embedded Rule Sources (Full Text)

### `nestjs/nest-platform.mdc`
- Scope (globs): `**/main.ts`, `**/*module.ts`, `**/config/**/*.ts`, `**/*middleware.ts`
- alwaysApply: `false`

````md
---
description: NestJS platform rules for ConfigModule usage, bootstrap, and infrastructure boundaries
globs: "**/main.ts", "**/*module.ts", "**/config/**/*.ts", "**/*middleware.ts"
alwaysApply: false
---

## Platform Rules

- Use `ConfigModule` as the single source for environment configuration.
- Keep bootstrap deterministic and small.
- Middleware/interceptor/pipe should not contain business workflow code.
- Infrastructure providers must expose typed contracts.

## 금지 사항

- Hardcoded runtime secrets.
- Feature-specific branching in platform module registration.
````
