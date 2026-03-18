import {
  // 사람이 보내는 메시지 요청을 뜻한다
  HumanMessage,
  // System Prompt를 뜻함
  SystemMessage,
  // 메세지의 기본 타입 보통 단독으로 사용 되기 보다 배열로서 받기 위해서 type으로 가져온다.
  type BaseMessage,
  //MessageContent Message로 받은 타입 text이거나 실행 명령등 다양할 수 잇다.
  type MessageContent,
} from "@langchain/core/messages";

import { ChatOpenAI } from "@langchain/openai";

const DEFAULT_BASE_URL: string = "https://api.synthetic.new/openai/v1";
const DEFAULT_MODEL: string = "hf:moonshotai/Kimi-K2.5";

export type ReflectionLangChainConfig = {
  apiKey: string;
  baseUrl: string;
  modelName: string;
  maxIterations: number;
  taskPrompt: string;
};

export type ReflectionLangChainIteration = {
  iteration: number;
  generatedCode: string;
  critique: string;
};

export type ReflectionLangChainResult = {
  finalCode: string;
  iterations: Array<ReflectionLangChainIteration>;
  completed: boolean;
};

export async function runReflectionLangChain(
  env: NodeJS.ProcessEnv = process.env,
): Promise<ReflectionLangChainResult> {
  const apiKey: string = env.API_KEY?.trim() ?? "";
  const baseUrl: string = env.BASE_URL?.trim() || DEFAULT_BASE_URL;
  const modelName: string = env.MODEL?.trim() || DEFAULT_MODEL;
  if (apiKey.length === 0) {
    throw new Error("API_KEY is missing.");
  }

  const config: ReflectionLangChainConfig = {
    apiKey,
    baseUrl,
    modelName,
    maxIterations: 3,
    taskPrompt: [
      "Your task is to create a Python function named `calculate_factorial`.",
      "This function should do the following:",
      "1. Accept a single integer `n` as input.",
      "2. Calculate its factorial (n!).",
      "3. Include a clear docstring explaining what the function does.",
      "4. Handle edge cases: The factorial of 0 is 1.",
      "5. Handle invalid input: Raise a ValueError if the input is a negative number.",
    ].join("\n"),
  };

  const llm: ChatOpenAI = new ChatOpenAI({
    apiKey: config.apiKey,
    model: config.modelName,
    temperature: 0.1,
    configuration: { baseURL: config.baseUrl },
  });

  const messageHistory: Array<BaseMessage> = [
    new HumanMessage(config.taskPrompt),
  ];

  const iterations: Array<ReflectionLangChainIteration> = [];

  let currentCode: string = "";

  let completed: boolean = false;

  for (let index: number = 0; index < config.maxIterations; index += 1) {
    let response: BaseMessage;

    if (index === 0) {
      response = await llm.invoke(messageHistory);
    } else {
      const refinePrompt: HumanMessage = new HumanMessage(
        "Please refine the code using the critiques provided.",
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

    const reflectorPrompt: Array<BaseMessage> = [
      new SystemMessage(
        [
          "You are a senior software engineer and an expert in Python.",
          "Your role is to perform a meticulous code review.",
          "Critically evaluate the provided Python code based on the original task requirements.",
          "Look for bugs, style issues, missing edge cases, and areas for improvement.",
          "If the code is perfect and meets all requirements,",
          "respond with the single phrase 'CODE_IS_PERFECT'.",
          "Otherwise, provide a bulleted list of your critiques.",
        ].join("\n"),
      ),
      new HumanMessage(
        `Original Task:\n${config.taskPrompt}\n\nCode to Review:\n${currentCode}`,
      ),
    ];

    const critiqueResponse: BaseMessage = await llm.invoke(reflectorPrompt);
    const critiqueContent: MessageContent = critiqueResponse.content;
    const critique: string =
      typeof critiqueContent === "string"
        ? critiqueContent
        : JSON.stringify(critiqueContent, null, 2);

    const iterationResult: ReflectionLangChainIteration = {
      iteration: index + 1,
      generatedCode: currentCode,
      critique,
    };
    iterations.push(iterationResult);

    if (critique.includes("CODE_IS_PERFECT")) {
      completed = true;
      break;
    }

    const critiqueMessage: HumanMessage = new HumanMessage(
      `Critique of the previous code:\n${critique}`,
    );
    messageHistory.push(critiqueMessage);
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
