---
name: contract-driven-testing
description: Design risk-driven tests: Wave 0 spike for uncertainty, then minimal contract tests (golden/edge/regression) once the contract is defined.
---

Use when:
- 테스트 전략을 정해야 하는데, 지금 단계가 '불확실성'인지 '계약이 정의됨'인지 헷갈릴 때.

Decision rules:
1) 불확실성 단계(계약/인터페이스/요구가 흐림):
- 테스트 먼저 쓰지 않는다.
- Wave 0 스파이크로 계약(입출력, 예제, 제약, 실패 모드)을 먼저 만든다.
- 산출물: API 스케치, 데이터 모델 초안, 샘플 I/O, 제한 사항, 짧은 데모 커맨드

2) 계약이 생김(동작 정의됨):
- 최소 계약 테스트 3종만 먼저:
  - Golden: 대표 케이스 1~3
  - Edge: 경계/실패 1~3
  - Regression: 버그 케이스 고정

3) 안정화(리팩터링이 필요):
- 리팩터링 보험으로 테스트 확장(필요할 때만)

Output:
- Current stage: Uncertain | Contract-defined | Stable
- Recommended test set (files + commands)
- What to postpone
