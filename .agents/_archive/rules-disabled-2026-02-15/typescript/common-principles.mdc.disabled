---
description: Common principles for TS (from general/java/python) — Layer, types, Clean, TDD, no blind tests, DRY, no premature opt, OOP/DDD, no dynamic
globs: "**/*.ts", "**/*.tsx"
alwaysApply: false
---

# Common Principles (TypeScript)

`rules/general`, `rules/java`, `rules/python` 공통 원리를 TS에 적용. Layer·타입·React 상세는 **react-common.mdc**, **always.mdc**.

- **1. Layer** — Component→Hook→API→Utils. Component는 API/비즈니스 로직 금지. Hook만 API 호출. → react-common §5–6.
- **2. 타입** — 파라미터·반환·제네릭 명시. `any` 최소화. → react-common §3.
- **3. Clean** — 얕은 중첩(2단계), 짧은 함수. 장황·과도한 방어 금지. → react-common §1, 2.3; always.
- **4. TDD** — Red→Green→Refactor. Hook/도메인 테스트 우선, Component/API는 배선·권한. Given–When–Then.
- **5. 눈가림 테스트** — `expect(true).toBe(true)`, 항상 통과, 과한 mock 금지. 실패 가능한 테스트, Given–When–Then으로 구체 assert.
- **6. DRY** — 공통 로직·타입 추출. 구현 전 기존 모듈 확인. → always.
- **7. 과도한 최적화** — 실측 없이 useMemo/cache 금지. → react-common §1; always.
- **8. OOP/DDD** — SRP·캡슐화·인터페이스(타입) 의존. 도메인은 Hook. → react-common §5.
- **9. 동적/리플렉션** — `eval`, `Function`, `any` 남발, 타입 가드 없는 동적 접근 금지. → react-common §2.1.
