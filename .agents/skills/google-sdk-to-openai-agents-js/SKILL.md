---
name: google-sdk-to-openai-agents-js
description: Translate TypeScript agent workflows from Google ADK or @google/genai to @openai/agents while preserving runtime semantics. Use when migrating SequentialAgent pipelines, session/state handling, callback policy hooks, tool schemas, or event-stream behavior.
---

# Google SDK to OpenAI Agents JS

## Overview

이 스킬은 Google SDK 기반 에이전트 코드를 OpenAI Agents SDK(JS)로 이주할 때 사용한다.
목표는 API 이름 치환이 아니라 runtime semantics-preserving translation이다.

## Scope Boundary

먼저 어떤 마이그레이션인지 확정한다.

1. ADK 오케스트레이션 이주: `LlmAgent`, `SequentialAgent`, `Runner`, `SessionService`, callbacks/policy를 OpenAI Agents 구조로 재구성
2. Gemini 호출 치환만 수행: `@google/genai` 모델 호출 계층만 교체, 상위 오케스트레이션은 유지

기본값은 1번(ADK 앱 전체 이주)이다.

## Priority Model

변환 규칙의 우선순위는 아래 순서로 고정한다.

1. 세션/상태 동치
2. 툴 스키마 및 에러 모델 동치
3. 워크플로우 결정론 동치
4. 이벤트/스트리밍 인터페이스 동치
5. 가드레일/정책 동치
6. 관측 가능성(트레이싱/로그) 동치
7. 모델/파라미터 치환

## Decision Rules

### Rule A: 결정론 유지가 필요한가?

- yes: 앱 코드가 순서를 강제한다. `run()`을 A -> B -> C 순서로 직접 호출한다.
- no: 위임 판단을 모델에 맡긴다. `handoff` 또는 `agent-as-tool`을 사용한다.

### Rule B: 상태 전달이 구조화 데이터인가?

- yes: 세션 히스토리 외에 명시적 typed context 객체를 함께 전달한다.
- no: `MemorySession` 재사용으로 대화 히스토리 기반 전달을 사용한다.

### Rule C: 외부 호환 API가 ADK Event 형태를 요구하는가?

- yes: 어댑터 계층에서 ADK 유사 이벤트 인터페이스를 유지한다.
- no: OpenAI run/trace 결과를 표준 인터페이스로 노출한다.

## Primitive Mapping (Semantics)

| Google Side                    | OpenAI Side                             | Mapping Rule                                         |
| ------------------------------ | --------------------------------------- | ---------------------------------------------------- |
| `LlmAgent`                     | `Agent`                                 | `instruction` -> `instructions`, 역할명(`name`) 보존 |
| `SequentialAgent`              | app-controlled sequence with `run()`    | 결정론 보존이 목표면 모델 위임 없이 순차 실행        |
| `SequentialAgent`              | `handoff` / `agent-as-tool`             | LLM 기반 분기/위임이 원래 의도였을 때만 사용         |
| `InMemoryRunner` / `Runner`    | `Runner` 또는 `run()` + provider config | 실행 정책은 Runner/전역 설정으로 이동                |
| `SessionService.createSession` | `MemorySession` 또는 저장형 Session     | user/app 식별자 매핑 규칙을 코드에 명시              |
| ADK callbacks                  | tracing + wrapper hooks                 | 관측/검증/차단 포인트를 입력/출력/툴 경계에 재배치   |

## Session and State Equivalence

### Required Rules

- 원본의 `appName`, `userId`, `sessionId` 의미를 OpenAI Session 식별 전략으로 명시한다.
- 단계 간 공유 상태는 두 채널로 나눈다.
  - 대화 히스토리: `Session`
  - 구조화 데이터: typed context object (`workflowContext`)
- 멀티 에이전트 실행 시 session 공유/분리 정책을 명시한다.
  - ADK Sequential 기본 동작을 따를 때는 공유가 기본값

### Session Strategy Template

```typescript
type SessionRoutingConfig = {
  appName: string;
  userId: string;
  sessionKey: string;
  shareAcrossAgents: boolean;
};
```

## Tool Schema and Error Model

### Required Rules

- 툴 스키마는 필수/옵셔널/enum/중첩 객체를 손실 없이 변환한다.
- `needsApproval` 같은 휴먼 게이트 정책은 기존 confirmation 정책과 동등하게 유지한다.
- 실패 정책을 명시한다.
  - timeout
  - rate limit
  - partial stream interruption
- 실패 시 세션 커밋 정책을 명시한다.
  - none: 전체 롤백
  - partial: 성공 단계만 커밋
  - full: 실패 정보 포함 커밋

### Tool Contract Template

```typescript
type ToolFailurePolicy = {
  retryCount: number;
  timeoutMs: number;
  commitOnFailure: "none" | "partial" | "full";
};
```

## Event and Streaming Equivalence

### Required Rules

- 기존 ADK 코드가 `Event` 순회로 최종 응답을 추출하면, OpenAI 쪽에서는 어댑터가 동일 인터페이스를 제공해야 한다.
- 내부 관측과 외부 API를 분리한다.
  - 외부: 제품 요구 인터페이스(ADK-style event or OpenAI-style result)
  - 내부: tracing span/event
- 최종 출력 추출 규칙을 단일 SSOT로 유지한다.

### Final Output Extraction Template

```typescript
function extractFinalText(finalOutput: unknown): string {
  const text: string = String(finalOutput ?? "").trim();
  if (text.length === 0) {
    throw new Error("Workflow completed without a text response.");
  }
  return text;
}
```

## Guardrails and Policy Equivalence

- ADK 정책 엔진/콜백의 검증 위치를 OpenAI 경계로 대응시킨다.
  - 모델 호출 전 검증 -> input guardrail
  - 모델 호출 후 검증 -> output guardrail
  - 툴 호출 검증 -> tool wrapper validation
- 정책 실패 시 동작을 원본과 동일하게 맞춘다.
  - block
  - rewrite
  - retry
  - human approval

## Observability and Regression

### Tracing Rules

- 단계별 span 이름을 원본 역할명과 1:1로 맞춘다.
  - `CodeWriter`, `Reviewer`, `Refactorer`
- 아래 로그를 변환 전/후 모두 비교 가능하게 남긴다.
  - prompt/instructions
  - tool input
  - tool output
  - final output

### Regression Harness

- 동일 입력 세트에 대해 변환 전/후 결과를 비교한다.
- 최소 3개 케이스를 고정한다.
  - 정상 경로
  - 툴 실패 경로
  - 빈 출력 경로

## Implementation Workflow

1. Source classification: ADK full migration vs model-only swap
2. Determinism decision: app-controlled sequence vs handoff
3. Session plan: identifier mapping + share/split rules
4. Tool plan: schema conversion + failure policy
5. Event plan: external contract + internal tracing split
6. Guardrail plan: validation point mapping
7. Code migration with explicit types
8. Regression verification

## Code Generation Rules

- 모든 함수/파라미터/반환/변수 타입을 명시한다.
- 원본 프롬프트의 의미와 출력 키를 유지한다.
- 단일 함수에서만 사용하는 로직은 인라인 유지한다.
- 추상화 추가는 두 군데 이상에서 재사용될 때만 허용한다.

## Verification Checklist

- `@google/adk`, `@google/genai` import 제거 여부
- 원본 단계 순서와 프롬프트 의도 유지 여부
- 출력 타입/키 계약 유지 여부
- 세션 식별자 매핑 규칙 명시 여부
- 툴 실패 정책(timeout/retry/commit) 명시 여부
- 결정론 선택 규칙(app sequence vs handoff) 명시 여부
- 이벤트 인터페이스(외부)와 tracing(내부) 분리 여부
- 가드레일 검증 위치 동치 여부
- 대상 모듈 테스트 + 타입 체크 통과 여부

## Common Mistakes

- `SequentialAgent`를 무조건 handoff로 치환해 결정론이 깨짐
- 세션 공유 정책 누락으로 단계 간 컨텍스트가 단절됨
- 툴 스키마 변환에서 enum/optional 제약이 유실됨
- ADK 이벤트 추출 로직을 제거하고 빈 `finalOutput` 예외 처리를 누락함
- 정책 검증 위치가 바뀌어 차단/승인 동작이 달라짐
- tracing span 이름이 달라져 전후 비교가 불가능해짐

## References

- ADK Sequential Agents: https://google.github.io/adk-docs/agents/workflow-agents/sequential-agents/
- ADK Callbacks: https://google.github.io/adk-docs/callbacks/
- ADK TypeScript API: https://google.github.io/adk-docs/api-reference/typescript/
- Gemini GenAI SDK Migration: https://ai.google.dev/gemini-api/docs/migrate
- OpenAI Agents JS (Overview): https://openai.github.io/openai-agents-js/
- OpenAI Agents JS Agents: https://openai.github.io/openai-agents-js/guides/agents/
- OpenAI Agents JS Handoffs: https://openai.github.io/openai-agents-js/guides/handoffs/
- OpenAI Agents JS Sessions: https://openai.github.io/openai-agents-js/guides/sessions/
- OpenAI Agents JS Tools: https://openai.github.io/openai-agents-js/guides/tools/
- OpenAI Agents JS Tracing: https://openai.github.io/openai-agents-js/guides/tracing/
- OpenAI Agents JS Guardrails: https://openai.github.io/openai-agents-js/guides/guardrails/
