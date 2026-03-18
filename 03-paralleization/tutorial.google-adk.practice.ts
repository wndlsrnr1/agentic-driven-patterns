import {
  Gemini,
  InMemoryRunner,
  LlmAgent,
  ParallelAgent,
  SequentialAgent,
  isFinalResponse,
  stringifyContent,
  type Event,
} from "@google/adk";

import { createUserContent, type Content } from "@google/genai";

type GoogleAdkConfig = {
  apiKey: string;
  modelName: string;
};

type GoogleAdkResult = {
  report: string;
};

function getGoogleAdkConfig(): GoogleAdkConfig {
  return {
    apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "",
    modelName: process.env.GOOGLE_MODEL || "gemini-3-flash-preview",
  } as GoogleAdkConfig;
}

function extractFinalResponseText(events: ReadonlyArray<Event>): string {
  for (let index: number = events.length - 1; index >= 0; index -= 1) {
    const event: Event = events[index];

    // isFinalRespoonse는 event가 최종 응답인지 확인하는 함수
    if (!isFinalResponse(event)) {
      continue;
    }

    // stringifyConfig는 event를 문자열로 변환하는 함수
    const text: string = stringifyContent(event).trim();
    if (text.length > 0) {
      return text;
    }
  }

  return "";
}

async function run(): Promise<GoogleAdkResult> {
  const config: GoogleAdkConfig = getGoogleAdkConfig();

  /**
   * 요청 모낼 객체 생성
   */
  const model: Gemini = new Gemini({
    model: config.modelName,
    apiKey: config.apiKey,
  });

  const appName: string = "tutorial-google-adk";
  const userId: string = "local-user-1";

  const topic: string = "How about your face? ";

  /**
   * LlmAgent: 단일 LLM 호출을 캡슐화하는 에이전트
   * 그냥 프롬프트 + 보낼 모델을 결합해서
   * Agent 라는 특수 역할로 추상화 한 것
   */
  const technologyAgent: LlmAgent = new LlmAgent({
    name: "TechResearcher",
    model,
    instruction: `Research the technology advances of ${topic}. Summarize in exactly one sentence.`,
  });

  const marketAgent: LlmAgent = new LlmAgent({
    name: "MarketResearcher",
    model,
    instruction: `Research the market impact of ${topic}. Summaize in exactly one sentence`,
  });

  /**
   * ParallelAgent: 여러 에이전트를 병렬로 실행하는 에이전트
   * subAgents: 병렬로 실행할 에이전트 목록
   */
  const parallelAgent: ParallelAgent = new ParallelAgent({
    name: "ParallelReaserchers",
    subAgents: [technologyAgent, marketAgent],
  });

  const synthesisAgent: LlmAgent = new LlmAgent({
    name: "SynthethesisAgent",
    model,
    instruction: "Combine both summaies into a concise markdown report",
  });

  /**
   * parallel -> [techAgent, marketAgent]
   * -> synthesisAgent
   */
  const workflow: SequentialAgent = new SequentialAgent({
    name: "SeuquentialAgent",
    subAgents: [parallelAgent, synthesisAgent],
  });

  /**
   * InMemoryRunner: 메모리 기반의 러너
   * 앱과 유저를 구분해서 세션을 관리
   * 1. 실행 및 입출력 데이터 (Input/Output)
   *   가장 기본이 되는 데이터입니다.
   *
   *   Prompt/Input: LLM에 전달된 최종 프롬프트 문자열 또는 메시지 객체 배열.
   *
   *   Response/Output: 모델이 생성한 텍스트 결과물.
   *
   *   System Instructions: 실행 시 사용된 시스템 프롬프트 설정값.
   *
   *2. 성능 및 환경 메타데이터 (Metadata)

   *   디버깅과 최적화를 위해 필요한 기술적 지표들입니다.
   *
   *   Latency: 모델 호출 시작부터 응답 완료까지 걸린 시간(ms).
   *
   *   Token Usage: Prompt tokens, Completion tokens, Total tokens 소비량.
   *
   *   Model Information: 사용된 모델의 정확한 버전(예: gemini-1.5-pro-002) 및 파라미터(Temperature, Top-P 등).
   *
   *   Timestamp: 실행이 일어난 정확한 시각.
   *
   *3. 평가 지표 및 근거 (Evaluation Metrics)

   *   Evaluator와 함께 사용할 경우 생성되는 데이터입니다.
   *
   *   Scores: 정량적 점수 (예: 정확도 0.9, 유창성 1.0 등).
   *
   *   Explanations: 모델이 왜 그런 점수를 주었는지에 대한 텍스트 설명(Reasoning).
   *
   *   Error Logs: 실행 중 발생한 예외 상황이나 API 오류 메시지.
   */
  const runner: InMemoryRunner = new InMemoryRunner({
    agent: workflow,
    appName: appName,
  });

  /**
   * InMemoryRunner가 "데이터를 어디에 담느냐(Storage)"에 집중한다면, sessionService는 **"데이터를 어떻게 식별하고, 언제 시작해서 언제 끝낼 것인가(Orchestration)"**를 담당합니다.
   * 
   * 1. sessionService의 주요 역할
   * sessionService는 내부적으로 다음과 같은 매니지먼트 역할을 수행합니다.
   *  세션 식별, 상태 추적, 추적 데이터 바인딩, 
   *   
   * 세션 식별 (Session ID Management): 각 모델 실행이나 평가 작업에 고유한 sessionId를 부여합니다. 이를 통해 여러 번의 호출이 섞이지 않게 격리합니다.
   * 
   * 상태 추적 (State Tracking): 현재 세션이 '시작됨(Started)', '완료됨(Completed)', 또는 '실패함(Failed)' 상태인지를 관리합니다.
   * 
   * 추적 데이터 바인딩 (Trace Binding): 앞서 설명한 InMemory에 저장되는 데이터(입출력, 토큰 사용량 등)를 특정 세션 ID와 연결하여 나중에 "A 세션의 결과만 가져와"라고 요청할 수 있게 합니다.
   * 
   * 2. 메모리 주체와 메커니즘 (User Code vs. Google)
   * InMemoryRunner 내부의 sessionService 역시 사용자의 프로세스(User Code) 메모리에서 동작합니다.
   * 
   * 작동 방식: runner.invoke()나 evaluate()가 호출되면, sessionService는 내부적으로 새로운 세션 객체를 생성하고 이를 로컬 RAM의 Map이나 전역 변수에 등록합니다.
   * 
   * 휘발성: 사용자의 프로그램이 꺼지면 sessionService가 관리하던 모든 세션 정보와 매핑 데이터도 함께 소멸합니다.
   * 
   * 3. OOP 관점에서의 설계 구조 (TypeScript Interface)
   * Clean Code와 OOP를 선호하시는 관점에서 본다면, sessionService는 일종의 Unit of Work 또는 Identity Map 패턴이 적용된 서비스 레이어로 볼 수 있습니다.
   * 
   * 추상화된 구조는 대략 다음과 같습니다:
   * 
   * TypeScript
   * interface SessionService {
   *   // 새로운 세션을 생성하고 컨텍스트를 초기화
   *   createSession(options?: SessionOptions): Promise<Session>;
   *   
   *   // 특정 세션에 실행 로그(Trace)를 추가
   *   addEvent(sessionId: string, event: RunEvent): void;
   *   
   *   // 세션의 최종 상태를 업데이트하고 마감
   *   finalizeSession(sessionId: string): Promise<void>;
   * 
   *   // 메모리에 저장된 특정 세션 데이터를 조회
   *   getSessionData(sessionId: string): SessionRecord | undefined;
   * }
   * 
   * 4. 왜 별도의 서비스로 분리되어 있는가?
   * Runner 클래스가 직접 데이터를 저장하지 않고 sessionService를 두는 이유는 관심사의 분리(Separation of Concerns) 때문입니다.
   * 
   * 교체 가능성 (Strategy Pattern): 
   *   로컬 테스트 시: InMemorySessionService를 사용하여 RAM에 저장.
   *   운영 환경 시: 코드를 거의 수정하지 않고 RemoteSessionService로 교체하여 Google Cloud(Vertex AI Experiments 등)에 영구 저장.
   * 
   * 컨텍스트 공유: 여러 개의 Runner가 동일한 sessionService 인스턴스를 공유하면, 서로 다른 작업들을 하나의 커다란 '부모 세션' 아래에 그룹화할 수 있습니다.
   * 
   * 요약하자면
   * runner.sessionService는 "내가 지금 실행하고 있는 이 작업이 누구의 것인지, 어디까지 진행되었는지"를 기록하는 비서와 같습니다. 그리고 InMemory 환경에서는 이 비서가 사용하는 '수첩'이 바로 사용자의 컴퓨터 RAM인 것입니다.

   */
  const session: { id: string } = await runner.sessionService.createSession({
    appName: appName,
    userId: userId,
  });

  const prompt: string = `Create a short report for: ${topic}`;
  /*
   * Content는 Google AI 모델(Gemini 등)과 대화할 때 사용하는 가장 기본적인 데이터 단위입니다.
   * OpenAI의 Message 객체와 유사하지만, 구조가 조금 더 세분화되어 있습니다.
   *
   * // 추상화된 Content 인터페이스 구조
   * interface Content {
   *   role: 'user' | 'model' | 'system' | 'function';
   *   parts: Part[];
   * }
   *
   * role: 이 콘텐츠를 생성한 주체입니다.
   * 보통 사용자는 'user', 모델의 응답은 'model'로 지정합니다.
   * parts: 하나의 메시지 안에 들어가는 세부 요소들의 배열입니다.
   * Gemini는 멀티모달 모델이므로 텍스트뿐만 아니라
   * 이미지, 함수 호출 결과 등을 한 메시지에 담을 수 있기 때문에 배열 구조를 가집니다.
   * Part 인터페이스의 구성
   * parts 배열에 들어가는 요소들은 다음과 같은 형태를 가질 수 있습니다.
   * TextPart: { text: string } - 일반적인 텍스트 메시지.
   * InlineDataPart: { inlineData: { mimeType: string, data: string } } - 이미지나 비디오 등의 바이너리 데이터(Base64).
   * FunctionCallPart / FunctionResponsePart: 도구 호출(Function Calling) 시 사용되는 구조.
   */

  const userMessage: Content = createUserContent(prompt);

  const events: Array<Event> = [];

  /*
   * runAsync는 비동기 이터레이터(Async Iterator)를 반환합니다.
   * 즉, 한 번에 결과가 툭 튀어나오는 것이 아니라,
   * 모델이 추론하는 동안 발생하는 중간 과정들을 실시간으로 '스트리밍' 받습니다.
   * for await...of 루프는 이 스트림에서 이벤트가 하나씩 도착할 때마다 내부 코드를 실행합니다.
   */
  for await (const event of runner.runAsync({
    userId: userId,
    sessionId: session.id,
    newMessage: userMessage,
  })) {
    events.push(event);
  }

  return {
    report: extractFinalResponseText(events),
  };
}

const result = await run();
console.log(result);
