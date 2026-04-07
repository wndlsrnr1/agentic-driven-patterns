# Research Agent Code Walkthrough

## 1. 어디서부터 읽어야 하나

이 lesson은 아래 순서로 보면 가장 이해가 쉽습니다.

1. `buildDeepResearchRuntimeConfig`
2. `runDeepResearchAgent`
3. `formatDeepResearchReport`
4. 파일 맨 아래 CLI 실행부

즉, "실행 조건을 읽고 → agent를 돌리고 → 사람이 읽을 결과로 바꾸고 → 직접 실행한다"는 순서입니다.

## 2. `buildDeepResearchRuntimeConfig`: 먼저 실행 자격을 고정합니다

이 함수는 이번 lesson이 어떤 환경에서 돌아갈지를 결정합니다.

- `OPENAI_API_KEY`는 필수입니다
- `OPENAI_RESEARCH_MODEL`은 선택입니다
- 기본 모델은 `gpt-4.1-mini`입니다

이 단계가 먼저 있는 이유는 단순합니다.  
조사형 agent는 "질문을 어떻게 처리할지"보다 먼저 "어떤 모델로 호출할지"가 정해져야 하기 때문입니다.

## 3. `runDeepResearchAgent`: 이 lesson의 본체입니다

이 함수 하나에 research lesson의 핵심이 다 들어 있습니다.

### 3-1. `ResearchAgent` 생성

여기서 agent의 역할을 고정합니다.

- 신뢰할 만한 자료를 찾는다
- 데이터 중심으로 정리한다
- 인라인 citation이 포함된 보고서를 만든다

즉, 이 agent는 일반 assistant가 아니라 "조사 보고서를 쓰는 사람"처럼 설정됩니다.

### 3-2. `webSearchTool()` 연결

이 줄이 planning lesson과 가장 크게 갈라지는 지점입니다.

planning lesson에서는 agent가 내부적으로 구조를 나눴습니다.  
이번 lesson에서는 agent가 외부 세계를 조회할 수 있게 만듭니다.

그래서 이 도구는 부가 기능이 아니라, lesson 전체의 성격을 바꾸는 핵심 장치입니다.

### 3-3. `Runner` 실행

`runner.run(...)`은 연구 질문을 agent에 넘기는 순간입니다.

여기서 중요한 건 결과를 하나로만 보지 않는다는 점입니다.

- `finalOutput`: 최종 보고서
- `newItems`: reasoning, hosted tool call, message output 같은 중간 산출물

즉, 실행 결과를 "최종 답"과 "중간 흔적"으로 나눠 읽는 것이 이 lesson의 핵심 습관입니다.

## 4. citation 추출: 왜 이 단계가 필요한가

최종 보고서만 출력하면 사람은 보기 편하지만,  
"이 문장이 어디 근거를 보고 나온 건가"를 확인하기 어렵습니다.

그래서 코드에서는 assistant message 안의 `output_text.annotations`를 읽어 citation 목록을 만듭니다.

이때 읽는 정보는 아래입니다.

- 인용된 텍스트 구간
- 제목
- URL
- 시작/끝 문자 위치

즉, citation 추출은 보기 좋은 덤이 아니라  
사람이 보고서를 검증할 수 있게 만드는 장치입니다.

## 5. intermediate step 추출: 왜 `newItems`를 보나

이 lesson은 "답변 생성"보다 "조사 과정 이해"가 중요합니다.  
그래서 `newItems`에서 최소한 아래 흔적을 읽습니다.

- `reasoning`
- `web_search_call`
- `code_interpreter_call`

이 정보를 사람이 읽기 쉬운 `steps` 배열로 정리하면,  
나중에 "무슨 검색을 했는지", "중간에 어떤 사고가 있었는지"를 추적할 수 있습니다.

## 6. `formatDeepResearchReport`: 사람 친화적인 최종 출력

raw JSON은 기계가 보기엔 좋지만, 사람이 따라치며 읽기엔 밀도가 너무 높습니다.  
그래서 이 lesson은 결과를 아래 세 덩어리로 보여줍니다.

- `### Report`
- `### Citations`
- `### Intermediate Steps`

이 구조 덕분에 학습자는 한 번에 세 가지를 같이 볼 수 있습니다.

- 최종 결과
- 근거
- 과정

## 7. 따라치면서 바꿔보면 좋은 지점

- 기본 질의를 다른 경제/의료 주제로 바꿔보기
- `webSearchTool`의 `searchContextSize`를 바꿔보기
- 기본 모델을 `o4-mini-deep-research`로 바꿔보기
- 에이전트 지시사항에서 보고서 스타일을 더 짧게 혹은 더 분석적으로 바꿔보기

## 8. 이 코드에서 실수하기 쉬운 부분

- `Agents SDK` lesson인데 `responses.create(...)` 직호출 예제로 다시 바꾸는 것
- `finalOutput`만 보고 `newItems`를 아예 버리는 것
- citation이 항상 있다고 가정하는 것
- research lesson인데 planning lesson처럼 agent를 불필요하게 여러 개로 쪼개는 것
- OpenAI deep-research 모델과 일반 research agent 개념을 혼동하는 것

이번 lesson은 "더 많은 코드"보다 "더 선명한 구조"가 중요합니다.  
그래서 어디서 데이터를 읽고, 어디서 사람이 이해하기 쉬운 출력으로 바꾸는지 기준으로 보면 됩니다.
