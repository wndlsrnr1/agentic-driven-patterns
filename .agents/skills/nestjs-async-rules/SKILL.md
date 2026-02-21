---
name: nestjs-async-rules
description: Use when implementing or reviewing NestJS asynchronous workflows to enforce explicit status tracking, retries, and idempotency.
---

# NestJS Async Rules

## Overview

Enforce `async` responsibility boundaries in NestJS.

## Dependency Order

- `rules-governance`
- `nestjs-foundation-rules`

## Team Conventions

- Separate request-response APIs from long-running jobs.
- Keep async status and failure paths explicit.
- Design retry and idempotency from the start.

## Mandatory Workflow

1. Define the behavior change and verification commands first.
2. Write a failing test first (RED).
3. Implement the minimum change to reach GREEN.
4. Refactor, then run full verification.
5. Report results with command-output evidence.

## Prohibited

- Do not process long-running tasks synchronously in controllers.
- Do not lose failure status transitions.

## Embedded Rule Sources (Full Text)

### `nestjs/nest-async.mdc`
- Scope (globs): `**/queue/**/*.ts`, `**/*processor.ts`, `**/*job*.ts`, `**/*scheduler*.ts`
- alwaysApply: `false`

````md
---
description: NestJS async processing rules - queues, scheduler, retry policy, and idempotent jobs
globs: "**/queue/**/*.ts", "**/*processor.ts", "**/*job*.ts", "**/*scheduler*.ts"
alwaysApply: false
---

## Async Rules

- Use queue/worker for long-running tasks.
- Track task status: `PENDING -> PROCESSING -> COMPLETED|FAILED`.
- Define explicit **retry** policy for transient failures.
- Enforce idempotent handlers to tolerate duplicated delivery.

## Failure Handling

- Persist failure reason and attempt count.
- Expose recovery/replay path through service layer.
- Keep timeout and backoff configurable.
````
