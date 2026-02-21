---
description: General code principles — OOP, DDD, DRY, Clean Code, TDD; no blind tests; layer separation; explicit types
globs: "**/*"
alwaysApply: true
---

# Code Principles (General)

## OOP

- **Encapsulation**: Hide internal state; expose only necessary interfaces.
- **Single Responsibility**: One reason to change per class/function.
- **Dependency Inversion**: Depend on abstractions (interfaces, contracts), not concretions.

## DDD

- **Bounded Context**: Clear domain boundaries; avoid one Big Model.
- **Aggregate**: Consistency boundary; load/save as a unit.
- **Ubiquitous Language**: Names in code match domain terms.
- **Domain-first**: Domain logic stays in domain layer; keep infrastructure (DB, HTTP) out.

## DRY

- Extract duplicated logic to shared modules/functions.
- Reference other rules or shared types instead of copying.

## Clean Code

- **Naming**: Clear, searchable; avoid abbreviations unless well-known.
- **Functions**: Small, one level of abstraction; prefer under 20 lines.
- **Nesting**: Prefer shallow (max 2–3 levels); early return / extract.
- **Explicit over clever**: Readable first; no tricks.

## TDD

- Red → Green → Refactor. Write a failing test first, then minimal code to pass, then refine.
- Test behavior and contracts, not implementation details.

## 눈가림 테스트 방지 (No Blind/Meaningless Tests)

- **금지**: `expect(true).toBe(true)`, `expect(1).toBe(1)`, asserts that always pass.
- **금지**: Over-mocking that makes the test never run real logic (테스트가 실제 로직을 검증하지 않음).
- **필수**: 테스트는 **실패할 수 있어야** 함. 요구사항·로직 변경 시 실패로 드러나야 함.
- **필수**: Given–When–Then: 입력·상황을 주고, 동작 후, 기대 결과를 구체적으로 assert.

## Layer 분할

- **경계**: Controller/View → Service/UseCase → Repository/API. 상위는 하위만 호출; 역방향·건너뛰기 금지.
- **책임**: Controller/View — 입력·출력·라우팅. Service — 비즈니스·오케스트레이션. Repository/API — 영속·외부 I/O.
- 도메인 규칙·엔티티는 Service·Domain; View/Controller에 비즈니스 로직 두지 말 것.

## 타입 명시

- 함수·변수·반환값에 **명시적 타입**. `any`, `@ts-ignore`, 암시적 `var`(Java) 등 최소화.
- 제네릭·API 응답 등 추론이 애매한 곳은 반드시 타입 명시. 컴파일/정적 분석으로 오류 조기 발견.
