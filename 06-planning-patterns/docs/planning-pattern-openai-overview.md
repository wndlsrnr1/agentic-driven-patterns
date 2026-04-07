# Planning Pattern With OpenAI Agents SDK

## 1. 이 단원이 풀려는 문제

이 예제의 핵심은 "바로 답을 쓰게 하지 말고, 먼저 계획을 만들게 한 뒤 그 계획을 기준으로 최종 결과를 쓰게 한다"입니다.  
즉, planning pattern은 모델을 두 번 호출하는 기술이 아니라, 중간 산출물인 `plan`을 다음 단계의 입력 계약으로 승격시키는 방식입니다.

원본 `CrewAI` 샘플도 본질은 같습니다.

- 하나의 agent가 있다
- 하나의 task 안에서 먼저 계획을 세운다
- 그 계획을 기준으로 summary를 쓴다
- 전체 흐름은 sequential 하다

이번 리팩토링에서는 그 개념을 `@openai/agents` 기준으로 더 명시적으로 드러냅니다.

## 2. CrewAI 개념을 OpenAI Agents SDK로 옮기면

대응 관계는 아래처럼 보면 됩니다.

- `Agent` → `new Agent(...)`
- `Task` → `runner.run(agent, input)` 호출 시 넘기는 프롬프트
- `Crew(process=sequential)` → TypeScript 함수 안에서 `await`로 순차 실행
- `expected_output` → 최종 출력 포맷 함수와 결과 타입

중요한 차이는 `OpenAI Agents SDK`에서는 orchestration(실행 흐름)을 코드가 직접 쥔다는 점입니다.  
그래서 planning pattern을 배울 때는 오히려 구조가 더 잘 보입니다.

## 3. 왜 handoff가 아니라 2단계 실행인가

이 저장소의 `02-routing-patterns`는 handoff와 coordinator를 배우는 단원입니다.  
이번 단원에서 handoff까지 섞으면 학습 포인트가 흐려집니다.

그래서 흐름을 아래처럼 고정했습니다.

1. `PlannerAgent`가 bullet plan 생성
2. `WriterAgent`가 그 plan만 기준으로 summary 작성
3. 최종 보고서 포맷으로 출력

이 구조의 장점은 명확합니다.

- planning 패턴의 핵심이 코드에서 바로 보입니다
- CrewAI의 sequential 감각을 자연스럽게 유지합니다
- 초보자가 따라칠 때 "무슨 데이터가 다음 단계로 넘어가는지"를 놓치지 않습니다

## 4. top-down으로 보면 실행 흐름은 네 층입니다

### Runtime Layer

환경 변수에서 `API_KEY`, `BASE_URL`, `MODEL`을 읽어 실행 설정을 만듭니다.

### Agent Layer

역할이 분리된 두 agent를 만듭니다.

- `PlannerAgent`: 어떤 내용을 어떤 순서로 다룰지 결정
- `WriterAgent`: planner가 만든 구조를 기준으로 최종 문장 생성

### Orchestration Layer

`Runner` 하나 위에서 두 agent를 순차 실행합니다.

- 첫 번째 실행 결과가 `plan`
- 두 번째 실행 입력에 그 `plan`을 그대로 주입

이 부분이 planning pattern의 중심입니다.

### Presentation Layer

마지막에는 `### Plan`, `### Summary` 두 섹션으로 묶어서 사람이 읽기 쉬운 결과로 출력합니다.

## 5. 이 예제에서 꼭 봐야 할 포인트

- 순차 실행은 프레임워크 옵션이 아니라 `await` 순서로도 충분히 표현됩니다.
- 좋은 planning pattern은 "계획이 실제로 다음 단계에 쓰이느냐"가 핵심입니다.
- planner 출력이 문자열이 아니어도 문자열로 정규화해서 writer 입력 계약을 안정적으로 유지합니다.
- writer는 새로 생각하는 agent가 아니라, plan을 따라 쓰는 agent로 제한됩니다.

## 6. 이 단원이 끝나면 이해해야 하는 것

이 코드는 "에이전트 둘이 협업한다"보다 "중간 산출물을 명시적 인터페이스로 다룬다"는 감각을 익히기 위한 예제입니다.  
Planning pattern을 잘 이해하면 다음 패턴들에서도 같은 질문을 할 수 있어야 합니다.

- 중간 산출물은 무엇인가
- 그 산출물의 소비자는 누구인가
- 다음 단계가 그 산출물에 실제로 의존하는가

그 관점으로 보면 이 예제의 핵심은 `PlannerAgent`도 `WriterAgent`도 아니라, 둘 사이를 연결하는 orchestration 코드입니다.
