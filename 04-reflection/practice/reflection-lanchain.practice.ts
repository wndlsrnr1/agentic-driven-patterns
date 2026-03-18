import {
  HumanMessage,
  SystemMessage,
  type BaseMessage,
  type MessageContent,
} from "@langchain/core/messages";

import { ChatOpenAI } from "@langchain/openai";
import { config } from "node:process";

/**
 * BaseMessage & HumanMessage
 *
 * LangChain은 다른 LLM 제공자의 입출력 형식을 통일하기 위해 메시지 인터페이스를 사용한다.
 * BaseMessage
 * 모든 메시지 객체의 부모, 직접 인스턴스화해서 사용하기보다 보통 타입정의를 위해 사용된다.
 * 주요 프로퍼티:
 * content: 메시지내용
 * name: 메시지를 보낸 주체 이름
 * additional_kwargs: 추가데이터
 *
 * HumanMessage: 사용자의 메시지
 * 사용자가 LLM에게 전달하는 메시지를 나타낸다.
 * 역할: 사용자가 이렇게 말했다는 것을 모델에게 알린다.
 * Chat 모델의 인터페이스에서 user로 변환되어 전달된다.
 *
 * AIMessage: 모델의 응답
 * SystemMessage: 시스템 지침
 * ToolMessage: 도구 실행 결과
 *
 * AIMessage(system) <-> SystemMessage(assistant)
 * AI가 답변한 내용, 시스템 프롬프트
 *
 *
 */

/**
 * 설정값
 */
export type ReflectionLangChainConfig = {
  apiKey: string;
  modelName: string;
  maxIterations: number;
  taskPrompt: string;
};

/**
 * 만들어진 코드 만들어진 코드 비판
 */
export type ReflectionLangChainIteration = {
  iteration: number;
  generatedCode: string;
  critique: string;
};

/**
 * 동시성 있는 DTO는 어떻게 설계하나?
 *  로그 성 배열
 */
export type ReflectionLangChainResult = {
  finalCode: string;
  iterations: Array<ReflectionLangChainIteration>;
  completed: boolean;
};

export async function runReflectionLangChain(
  env: NodeJS.ProcessEnv = process.env,
): Promise<ReflectionLangChainResult> {
  const apiKey: string = env.API_KEY?.trim() ?? "";
  const baseUrl: string = env.BASE_URL?.trim() ?? "";
  const model: string = env.MODEL?.trim() ?? "";

  const reflectionConfig: ReflectionLangChainConfig = {
    apiKey,
    modelName: model,
    maxIterations: 3,
    taskPrompt: `
    Your task is to create a Python function named 'caculate_factorial'.
    This function should do the following:
    1. Accept a single interger 'n' as input.
    2. Calculate its factorial (n!).
    3. Include a clear docstring explaning what the function does.
    4. Handle edge cases: The factorial of 0 is 1.
    5. Handle invalid input: Raise a ValueError if the input is a negative number.
    `,
  };

  /**
   * ChatOpenAI
   *
   * 스펙을 따르는 모델 호출시에
   */
  const llm: ChatOpenAI = new ChatOpenAI({
    apiKey: reflectionConfig.apiKey,
    model: reflectionConfig.modelName,
    temperature: 0.1,
    configuration: { baseURL: baseUrl },
  });

  /**
   * 채팅이 오고간 대화를 기록하기 위한 객체
   */
  const messageHistory: Array<BaseMessage> = [
    new HumanMessage(reflectionConfig.taskPrompt),
  ];

  const iterations: Array<ReflectionLangChainIteration> = [];
  let currentCode: string = "";
  let completed: boolean = false;

  for (
    let index: number = 0;
    index < reflectionConfig.maxIterations;
    index += 1
  ) {
    const iterationNumber: number = index + 1;
    let response: BaseMessage;

    if (index === 0) {
      response = await llm.invoke(messageHistory);
    } else {
      const refinePrompt: HumanMessage = new HumanMessage(
        "refine the code using the critiques provided.",
      );
      messageHistory.push(refinePrompt);
      response = await llm.invoke(messageHistory);
    }

    const generatedContent: MessageContent = response.content;
    const generatedCode: string =
      typeof generatedContent === "string"
        ? generatedContent
        : JSON.stringify(generatedContent, null, 2);

    currentCode = generatedCode;
    messageHistory.push(response);
    console.log(
      `\n[Iteration ${iterationNumber}] Stage 1 - Generation Response`,
    );
    console.log(generatedCode);

    const reflectorPrompt: Array<BaseMessage> = [
      new SystemMessage(
        `
        너는 오늘 정말 기분이 좋지 않다. 
        최소수준 우주공학 수준의 코드에만 만족할수 있는 미친 초천재 과학자다. 
        계산 및 알고리즘에서 알고리즘 효율성 및 OOP, DDD, Clean Architecture 등 소프트웨어 공학적 관점에서 떨어지는 로직을 보면 넌 경기를 일으키며 지적하고 싶어한다. 
        You are a senior software engineer and an expert in Python.
        Your role is to perform a meticulous code review.
        Critically evaludate the provided Python code based on the original task requirements.
        Look for code is perfect and meets all requirements,
        respond with the single phrase 'CODE_IS_PERFECT'.
        Otherwise, provide a bulleted list of your critiques.
        `,
      ),
      new HumanMessage(
        `Original Task: \n${reflectionConfig.taskPrompt}\n\n` +
          `Generated Code:\n${currentCode}`,
      ),
    ];

    const critiqueResponse: BaseMessage = await llm.invoke(reflectorPrompt);
    const critiqueContent: MessageContent = critiqueResponse.content;
    const critique: string =
      typeof critiqueContent === "string"
        ? critiqueContent
        : JSON.stringify(critiqueContent, null, 2);
    console.log(
      `\n[Iteration ${iterationNumber}] Stage 2 - Reflection Response`,
    );
    console.log(critique);

    const iterationResult: ReflectionLangChainIteration = {
      iteration: iterationNumber,
      generatedCode: currentCode,
      critique,
    };

    iterations.push(iterationResult);

    if (critique.includes("CODE_IS_PERFECT")) {
      console.log(`\n[Iteration ${iterationNumber}] Stop Condition Met`);
      completed = true;
      break;
    }

    const ciritiqueMessage: HumanMessage = new HumanMessage(
      `Critique of the previous code: \n${critique}`,
    );
    messageHistory.push(ciritiqueMessage);
  }

  const result: ReflectionLangChainResult = {
    finalCode: currentCode,
    iterations,
    completed,
  };
  return result;
}

const result: ReflectionLangChainResult = await runReflectionLangChain(
  process.env,
);

console.log(result);
