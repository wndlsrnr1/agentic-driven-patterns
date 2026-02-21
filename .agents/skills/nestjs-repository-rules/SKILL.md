---
name: nestjs-repository-rules
description: Use when implementing or reviewing NestJS repositories to keep persistence concerns isolated and business decisions out of data access code.
---

# NestJS Repository Rules

## Overview

Enforce `repository` responsibility boundaries in NestJS.

## Dependency Order

- `rules-governance`
- `nestjs-foundation-rules`

## Team Conventions

- Repository layer owns persistence and query composition only.
- Keep APIs typed and deterministic for service consumers.
- Use ORM-agnostic principles, with TypeORM examples as reference.

## Mandatory Workflow

1. Define the behavior change and verification commands first.
2. Write a failing test first (RED).
3. Implement the minimum change to reach GREEN.
4. Refactor, then run full verification.
5. Report results with command-output evidence.

## Prohibited

- Do not implement business branching in repository methods.
- Do not leak ORM internals into controller layer.

## Embedded Rule Sources (Full Text)

### `nestjs/nest-repositories.mdc`
- Scope (globs): `**/*repository.ts`, `**/repository/**/*.ts`
- alwaysApply: `false`

````md
---
description: NestJS repositories - persistence abstraction, query optimization, typed data access
globs: "**/*repository.ts", "**/repository/**/*.ts"
alwaysApply: false
---

## Repository Rules

- Keep repository methods focused on fetch/save/delete.
- Return explicit result types (`Promise<Entity | null>`, `Promise<Entity[]>`).
- Use pagination primitives and avoid unbounded list reads.
- Prevent N+1 by explicit relation loading strategy.

## ORM-Agnostic Principles

- Query orchestration belongs to repository, use-case decisions belong to service.
- Transaction entry point is service layer.
- Consistent not-found contract (`null` or domain error mapping in service).

## TypeORM Example Direction

- Use `Repository<Entity>` injection and `createQueryBuilder` for complex reads.
- Prefer explicit select/join clauses.
- Keep locking usage explicit and rare.

## 금지 사항

- Hidden side effects (write while reading).
- Domain policy checks inside query methods.
````
