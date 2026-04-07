# Planning Pattern Code Walkthrough

## 1. 어디서부터 읽어야 하나

이 파일은 아래 순서로 읽으면 됩니다.

1. `buildRuntimeConfig`
2. `runPlanningPattern`
3. `formatFinalReport`
4. 파일 맨 아래 CLI 실행부

즉, "설정 만들기 → 두 단계 실행 → 사람이 읽을 출력 만들기 → 직접 실행" 순서입니다.

## 2. `buildRuntimeConfig`: 실행 환경을 먼저 고정합니다

여기서는 런타임에 필요한 최소 설정만 만듭니다.

- `API_KEY`는 필수
- `BASE_URL`, `MODEL`은 기본값 제공

이 단계가 분리되어 있으면 좋은 점은 두 가지입니다.

- 테스트에서 네트워크 없이도 설정 로직을 검증할 수 있습니다
- 실제 agent 코드가 환경 변수 파싱 책임까지 떠안지 않습니다

## 3. `runPlanningPattern`: 이 단원의 본체입니다

이 함수 안에서 planning pattern 전체가 드러납니다.

### 3-1. PlannerAgent 생성

planner의 책임은 짧고 선명합니다.

- 주제를 이해한다
- 3~5개의 bullet plan을 만든다
- summary까지 쓰지 않는다

즉, planner는 "무엇을 어떤 순서로 다룰지"까지만 책임집니다.

### 3-2. WriterAgent 생성

writer의 책임도 제한합니다.

- planner가 만든 `plan`을 입력으로 받는다
- 그 구조를 기준으로 약 200단어 summary를 쓴다
- 새 섹션을 멋대로 확장하지 않는다

이 제한이 있어야 planning pattern이 흐려지지 않습니다.

### 3-3. 첫 번째 `runner.run(...)`

여기서 planner를 실행합니다.  
결과는 `finalOutput`으로 오고, 문자열이 아닐 수도 있으므로 문자열로 정규화합니다.

이 정규화가 필요한 이유는 간단합니다.

- SDK 결과 타입은 `unknown` 기준으로 다뤄야 안전합니다
- 다음 단계 writer는 문자열 입력 계약이 더 다루기 쉽습니다

### 3-4. 두 번째 `runner.run(...)`

이 단계가 가장 중요합니다.

writer 입력에는 아래 세 요소가 들어갑니다.

- 주제
- `Use the provided plan as the structure.`
- planner가 만든 실제 `plan`

즉, writer는 planner 결과 없이 독립적으로 쓰는 게 아니라, plan을 소비하는 단계가 됩니다.

## 4. `formatFinalReport`: 사람 기준 출력으로 바꿉니다

실행 결과를 그냥 JSON으로 찍지 않고 아래 구조로 보여줍니다.

- `### Plan`
- `### Summary`

이렇게 하면 원본 CrewAI 샘플의 학습 목표가 그대로 유지됩니다.  
따라치는 입장에서도 "계획"과 "최종 산출물"이 분리되어 보여서 이해가 빠릅니다.

## 5. CLI 실행부: 샘플 코드처럼 바로 돌릴 수 있게 합니다

파일 마지막에는 직접 실행 여부를 판단해서 `runPlanningPattern()`을 호출합니다.

실행 명령:

```bash
node --env-file=.env --experimental-strip-types ./06-planning-patterns/planning-pattern-openai.ts
```

이 구조 덕분에 한 파일이 두 역할을 같이 수행합니다.

- 학습용 예제
- import 가능한 테스트 대상

## 6. 따라치면서 바꿔보면 좋은 지점

- `DEFAULT_TOPIC`을 다른 주제로 바꿔보기
- planner 지시사항의 bullet 개수를 바꿔보기
- writer 지시사항에서 summary 길이를 바꿔보기
- `formatFinalReport`를 JSON 출력으로 바꿔보고 왜 현재 형식이 더 읽기 쉬운지 비교해보기

## 7. 이 코드에서 실수하기 쉬운 부분

- planner와 writer 역할을 섞어 한 agent로 다시 합쳐버리는 것
- writer 입력에 planner 결과를 실제로 넣지 않는 것
- `finalOutput`을 바로 문자열이라고 가정하는 것
- handoff 예제로 바꿔 이번 단원의 핵심을 흐리는 것

이 단원은 복잡한 multi-agent 시스템을 만드는 연습이 아니라, "계획을 중간 계약으로 다루는 법"을 익히는 연습이라는 점을 기준으로 보면 됩니다.
