# Research Agent With OpenAI Agents SDK

## 1. 이 lesson이 풀려는 문제

Planning lesson에서는 모델이 이미 머릿속에 알고 있는 내용을 더 잘 구조화하는 방법을 봤습니다.  
이번 lesson은 거기서 한 걸음 더 나아가, **모델이 외부 정보를 찾아와서 정리해야 하는 경우**를 다룹니다.

즉, 이번 질문은 이런 쪽입니다.

- 그냥 설명하면 안 되고
- 최신 정보나 근거가 필요하고
- 어디서 가져왔는지 흔적(citation)도 보고 싶다

그래서 이번 lesson의 핵심은 "검색 가능한 조사형 agent"입니다.

## 2. 이 코드를 사람 기준으로 보면 무엇을 배우는가

이 lesson에서 진짜로 익혀야 하는 것은 API 이름이 아닙니다.  
아래 흐름을 머리에 넣는 것이 핵심입니다.

1. 질문을 받는다
2. agent가 검색 도구를 쓴다
3. 검색 결과를 읽고 정리한다
4. 최종 보고서를 만든다
5. 사람이 나중에 검토할 수 있도록 citation과 intermediate step을 남긴다

즉, 이 코드는 "검색 기능 달린 챗봇"을 만드는 예제가 아니라,  
**조사 과정을 가진 agent를 어떻게 설계하는가**를 보여주는 예제입니다.

## 3. Planning lesson과 무엇이 다른가

두 lesson은 같은 `06` 단원 안에 있지만, 중심축이 다릅니다.

### Planning lesson

- 내부 사고를 두 단계로 나눈다
- `plan`이 핵심 산출물이다
- `plan -> summary` 흐름이 중심이다

### Research lesson

- 외부 정보를 끌어온다
- `webSearchTool()`이 핵심 도구다
- `search -> synthesis -> report` 흐름이 중심이다

즉, planning lesson이 "생각을 나누는 구조"라면, research lesson은 "조사 과정을 가진 구조"입니다.

## 4. top-down으로 보면 이 lesson은 네 층입니다

### Runtime Layer

먼저 OpenAI 실행 설정을 읽습니다.

- `OPENAI_API_KEY`
- `OPENAI_RESEARCH_MODEL`

여기서는 모델 호출 자격과 기본 모델을 고정하는 역할만 합니다.

### Agent Layer

`ResearchAgent`는 조사자 역할을 맡습니다.

- 질문을 이해한다
- 검색이 필요하면 검색한다
- 결과를 요약한다
- 근거가 드러나는 보고서를 만든다

이 agent는 planner/writer처럼 분업하지 않고, 하나의 연구자처럼 움직입니다.

### Tool Layer

이번 lesson의 차별점은 `webSearchTool()`입니다.

이 도구가 붙으면서 agent는 "아는 척하는 모델"이 아니라,  
"찾아보고 정리하는 모델"에 가까워집니다.

### Orchestration / Presentation Layer

`Runner`가 agent를 실행하고, 결과를 두 갈래로 나눠 읽습니다.

- `finalOutput`: 사람이 읽을 최종 보고서
- `newItems`: reasoning, hosted tool call 같은 중간 흔적

이 레이어가 중요한 이유는, 사람은 최종 답만 보는 게 아니라  
"무슨 검색을 했고 어떤 단계를 거쳤는지"도 같이 이해할 수 있기 때문입니다.

## 5. 왜 Agents SDK로 구현하나

사용자가 원한 건 `responses.create(...)` 직호출이 아니라 `Agents SDK`입니다.  
이 선택의 장점은 분명합니다.

- agent 역할이 더 선명하게 보입니다
- tool 연결이 더 자연스럽습니다
- `Runner` 결과에서 intermediate step을 읽는 구조를 학습하기 좋습니다

즉, 이번 lesson은 OpenAI API 기능 자체보다 **agent를 중심으로 사고하는 방식**을 익히는 데 더 적합합니다.

## 6. Deep Research 모델은 어디에 들어오나

이 lesson은 research agent를 기본으로 설명합니다.  
하지만 더 깊은 조사 품질이 필요하면 OpenAI의 deep-research 계열 모델로 바꿀 수 있습니다.

여기서 중요한 구분은 이것입니다.

- 이 lesson의 본체: `Agents SDK + research agent`
- 강화 옵션: `deep-research` 계열 모델 사용

즉, "deep research"라는 말이 lesson 전체를 지배하지 않게 하고,  
기본 구조는 어디까지나 **research agent pattern**으로 유지합니다.

## 7. 이 lesson을 다 보고 나면 이해해야 하는 것

이 lesson의 핵심은 "검색 툴을 붙였다"가 아닙니다.  
더 정확히는 아래를 이해해야 합니다.

- 어떤 질문은 내부 지식만으로 처리하면 안 된다
- 그런 질문은 agent에 외부 정보 접근 경로가 필요하다
- 최종 답뿐 아니라 근거와 intermediate step도 함께 다뤄야 한다

그 관점으로 보면, 이번 코드의 중심은 검색 API가 아니라  
`ResearchAgent + webSearchTool + Runner 결과 해석`의 조합입니다.
