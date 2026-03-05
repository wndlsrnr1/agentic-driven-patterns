/**
 * openai-tutorials.ts
 *
 * @openai/agents와 zod의 핵심 개념을 학습하기 위한 튜토리얼입니다.
 * 이 튜토리얼은 단일 에이전트를 사용하는 기초부터
 * 도구(Tool) 및 라우팅 에이전트 다루기를 순차적으로 학습합니다.
 */

import {
  Agent,
  OpenAIProvider,
  Runner,
  setOpenAIAPI,
  setDefaultOpenAIKey,
  tool,
} from "@openai/agents";
import { config } from "node:process";
import { z } from "zod";

/**
 * 튜토리얼용 임시 환경 변수
 */
const DEFAULT_BASE_URL: string = "https://api.synthetic.new/openai/v1";
const DEFAULT_MODEL: string = "hf:moonshotai/Kimi-K2.5";

function buildRuntimeConfig(): {
  apiKey: string;
  baseUrl: string;
  modelName: string;
} {
  const apiKey = process.env.API_KEY?.trim();
  if (!apiKey) {
    throw new Error("API_KEY is missing. Please set it in your .env file.");
  }

  return {
    apiKey,
    baseUrl: process.env.BASE_URL?.trim() ?? DEFAULT_BASE_URL,
    modelName: process.env.MODEL?.trim() ?? DEFAULT_MODEL,
  };
}

function configureOpenAIProvider(): OpenAIProvider {
  const config = buildRuntimeConfig();

  const provider = new OpenAIProvider({
    apiKey: config.apiKey,
    baseURL: config.baseUrl,
    // "chat_completion" 옵션을 사용해서 표준 응갑을 받음.
    useResponses: false,
  });

  setDefaultOpenAIKey(config.apiKey);
  setOpenAIAPI("chat_completions");
  return provider;
}

/**
 * Step 1: 기본 Agent 사용하기
 * 가장 기본적인 형태의 단일 에이전트를 생성하고
 * Runner를 통해 텍스트 입축력을 ㅂ다는 예제
 */

async function runBasicAgentTutorial(): Promise<void> {
  console.log("=== Step 1: Basic Agent ====\n");

  const provider = configureOpenAIProvider();
  const config = buildRuntimeConfig();

  // Agent 인스턴스 하나를 만들어 줍니다.
  // 이름(name), 지시사항(instructions), 그리고 사용할 LLM(model)이 필요합니다.

  const simpleAgent = new Agent({
    name: "SimpleBot",
    instructions:
      "You are a helpful assistant. Provide short, concise answers.",
    model: config.modelName,
  });

  // Runner는 만들어진 Agent를 실행시키는 '구동기' 입니다.
  const runner = new Runner({
    modelProvider: provider,
    tracingDisabled: true, // 디버깅용 트레이스
  });

  const userMessage = "Hello! Introduce yourself briefly.";
  console.log(`User: ${userMessage}`);

  const result = await runner.run(simpleAgent, userMessage, {
    maxTurns: 3,
  });

  console.log(
    `Assistant Output: ${JSON.stringify(result.finalOutput, null, 2)}\n`,
  );
}

await runBasicAgentTutorial();

/**
 * Step 2: Tool 사용 및 라우팅 에이전트 구성
 * 특정 작업ㅇ르 수행할 수 있는 Tool을 AGent에 쥐여주고,
 * 여러 하위 직원을 거느리는 Coordinator 동작을 학습합니다.
 *
 * 1. Zod를 활용해 Tool의 파라미터(입력 스키마)를 저의합니다.
 * 입력 받은 도시의 날씨를 확인하는 함수라고 가정합니다.
 */
const WeaTherToolSchema = z.object({
  city: z.string().describe("날씨를 조회할 도시 이름"),
});

type WeatherToolInput = z.input<typeof WeaTherToolSchema>;

/**
 * tool() 함수로 에이전트가 사용할 도구를 생성합니다.
 * 도구의 목적(description)과 스키마를 명확히 적어야합니다.
 */

const weatherTool = tool({
  name: "get_weather",
  description: "특정 도시의 현재 날씨를 가져옵니다.",
  parameters: WeaTherToolSchema,
  execute: (input: WeatherToolInput): string => {
    return `${input.city}의 오늘 날씨는 섭씨 22도이며 맑습니다.`;
  },
});

async function runRoutingTutorial(): Promise<void> {
  console.log("=== Step 2: Handoff & Coordinator Agent ===\n");

  const provider = configureOpenAIProvider();
  const config = buildRuntimeConfig();

  // 3. 날씨 도우미 봇(WeatherBot)을 생성하고 방금 만든 날씨 도구를 장착합니다.
  const weatherAgent = new Agent({
    name: "WeatherBot",
    instructions:
      "당신은 날씨 전문가입니다. 사용자가 날씨를 물으면 get_weather 도구를 사용하여 정확히 대답하세요.",
    model: config.modelName,
    tools: [weatherTool],
  });

  // 4. 일반적인 잡답을 담당하는 길잡이 봇(GreeterBot)을 만듭니다.
  const greeterAgent = new Agent({
    name: "GreeterBot",
    instructions: "당신은 사용자에게 인사를 건네고 환영하는 친절한 봇입니다.",
    model: config.modelName,
  });

  // 5. 사용자의 요청을 분석하고 적절한 봇으로 일을 넘기는(handoffs) 코디네이터를 생성합니다.
  const coordinatorAgent = Agent.create({
    name: "Coordinator",
    instructions: `
    당신은 중앙 라우팅 코디네이터입니다.
    사용자의 요청이 날씨와 관련되어 있다면 Weather Bot으로 넘기세요.
    날씨와 관련이 없는 단순 인사라면 GreeterBot으로 넘기세요.
    당신은 항상 하위 상담원에게 전달해야하며, 직접 대답하지마세요.
    `,
    model: config.modelName,
    handoffs: [weatherAgent, greeterAgent],
  });

  const runner = new Runner({
    modelProvider: provider,
    tracingDisabled: true,
  });

  // 테스트 1: 날씨 질문

  const weatherRequest = "파리 날씨는 어떤가요?";
  const result1 = await runner.run(coordinatorAgent, weatherRequest, {
    maxTurns: 5,
  });

  console.log(
    `Assistant Output: ${JSON.stringify(result1.finalOutput, null, 2)}\n`,
  );

  // 테스트2: 일반인사
  const greetRequest = "안녕! 좋은 아침이야.";
  const result2 = await runner.run(coordinatorAgent, greetRequest, {
    maxTurns: 5,
  });
  console.log(
    `Assistant Output: ${JSON.stringify(result2.finalOutput, null, 2)}\n`,
  );
}

await runRoutingTutorial();
