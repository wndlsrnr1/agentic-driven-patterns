# 06 Planning Patterns

이 단원은 "에이전트를 어떻게 나누느냐"보다 "생각의 흐름을 어떻게 구조화하느냐"를 배우는 단원입니다.

학습 순서는 아래처럼 가져가면 됩니다.

1. 먼저 `planning` lesson으로 순차 orchestration을 이해합니다.
2. 그다음 `research` lesson으로 외부 정보 수집이 붙은 agent 흐름을 봅니다.

## Lesson 1. Planning Pattern

이 lesson은 중간 산출물인 `plan`이 다음 단계의 입력 계약이 되는 구조를 보여줍니다.

실행:

```bash
node --env-file=.env --experimental-strip-types ./06-planning-patterns/planning-pattern-openai.ts
```

문서:

- [Planning Pattern Overview](./docs/planning-pattern-openai-overview.md)
- [Planning Pattern Walkthrough](./docs/planning-pattern-openai-walkthrough.md)

핵심 포인트:

- `PlannerAgent`가 먼저 구조를 만든다
- `WriterAgent`가 그 구조를 따라 결과를 쓴다
- 핵심은 agent 개수보다 `plan`이라는 중간 계약이다

## Lesson 2. Research Agent With Agents SDK

이 lesson은 `@openai/agents`와 hosted web search tool을 사용해, 조사형 agent가 어떻게 동작하는지 보여줍니다.

실행 준비:

- `.env.openai-research` 파일을 만들고 `OPENAI_API_KEY`를 넣습니다.
- 필요하면 `OPENAI_RESEARCH_MODEL`을 넣습니다.

예시:

```bash
OPENAI_API_KEY=your_openai_key
OPENAI_RESEARCH_MODEL=gpt-4.1-mini
```

실행:

```bash
node --env-file=.env.openai-research --experimental-strip-types ./06-planning-patterns/deep-research-agents-sdk.ts
```

문서:

- [Research Agent Overview](./docs/deep-research-agents-sdk-overview.md)
- [Research Agent Walkthrough](./docs/deep-research-agents-sdk-walkthrough.md)

핵심 포인트:

- 이번에는 `plan` 대신 `tool + search + synthesis` 흐름이 중심이다
- `Runner` 실행 결과에서 `finalOutput`과 `newItems`를 함께 읽는다
- 사람이 읽는 최종 보고서와 내부 intermediate step을 같이 본다

## 단원 전체를 볼 때 중요한 차이

- planning lesson은 "중간 산출물을 다음 단계에 넘기는 법"을 보여줍니다.
- research lesson은 "외부 정보를 모아 하나의 보고서로 합치는 법"을 보여줍니다.

즉, 둘 다 패턴 단원이지만 보는 포인트가 다릅니다.

- planning: 구조화된 생각의 흐름
- research: 도구를 포함한 조사와 합성의 흐름
