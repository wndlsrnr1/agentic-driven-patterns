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
import { z } from "zod";

/**
 * 튜토리얼용 임시 환경 변수
 */
const DEFAULT_SYNTHETIC_BASE_URL: string =
  "https://api.synthetic.new/openai/v1";
const DEFAULT_SYNTHETIC_MODEL: string = "hf:moonshotai/Kimi-K2.5";

function buildRuntimeConfig(): {
  apiKey: string;
  baseUrl: string;
  modelName: string;
} {
  const apiKey = process.env.SYNTHETIC_API_KEY?.trim();
  if (!apiKey) {
    throw new Error(
      "SYNTHETIC_API_KEY is missing. Please set it in your .env file.",
    );
  }

  return {
    apiKey,
    baseUrl:
      process.env.SYNTHETIC_BASE_URL?.trim() ?? DEFAULT_SYNTHETIC_BASE_URL,
    modelName: process.env.SYNTHETIC_MODEL?.trim() ?? DEFAULT_SYNTHETIC_MODEL,
  };
}

function configureOpenAIProvider(): OpenAIProvider {
  const config = buildRuntimeConfig();

  // @openai/agents가 제공하는 OpenAIProvider는 Agent가
  // LLM과 통신하도록 환경을 구성합니다.
  const provider = new OpenAIProvider({
    apiKey: config.apiKey,
    baseURL: config.baseUrl,
    // "chat_completions" 옵션을 사용하여 표준 응답을 받습니다.
    useResponses: false,
  });

  // 글로벌 설정을 주입합니다.
  setDefaultOpenAIKey(config.apiKey);
  setOpenAIAPI("chat_completions");

  return provider;
}

/**
 * Step 1: 기본 Agent 사용하기
 * 가장 기본적인 형태의 단일 에이전트를 생성하고
 * Runner를 통해 텍스트 입출력을 받는 예제입니다.
 */
async function runBasicAgentTutorial(): Promise<void> {
  console.log("=== Step 1: Basic Agent ===\n");

  const provider = configureOpenAIProvider();
  const config = buildRuntimeConfig();

  // Agent 인스턴스를 하나 만들어 줍니다.
  // 이름(name), 지시사항(instructions), 그리고 사용할 LLM(model)이 필요합니다.
  const simpleAgent = new Agent({
    name: "SimpleBot",
    instructions:
      "You are a helpful assistant. Provide short, concise answers.",
    model: config.modelName,
  });

  // Runner는 만들어진 Agent를 실행시키는 '구동기'입니다.
  const runner = new Runner({
    modelProvider: provider,
    tracingDisabled: true, // 디버깅용 트레이스를 끌지 여부
  });

  const userMessage = "Hello! Introduce yourself briefly.";
  console.log(`User: ${userMessage}`);

  // runner.run() 메서드를 통해 에이전트와 대화를 시작합니다.
  const result = await runner.run(simpleAgent, userMessage, {
    maxTurns: 3,
  });

  console.log(
    `Assistant Output: ${JSON.stringify(result.finalOutput, null, 2)}\n`,
  );
}

/**
 * 실행 진입점
 */
export async function runTutorial(): Promise<void> {
  try {
    await runBasicAgentTutorial();
  } catch (error) {
    console.error("Tutorial execution failed:", error);
  }
}

// 직접 파일을 실행한 경우만 동작하도록 처리
const isNodeTestContext: boolean = process.env.NODE_TEST_CONTEXT !== undefined;
if (!isNodeTestContext) {
  runTutorial();
}
