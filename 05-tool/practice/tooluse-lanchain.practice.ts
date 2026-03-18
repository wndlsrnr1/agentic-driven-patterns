import { ChatPromptTemplate } from "@langchain/core/prompts";
import {
  tool,
  type DynamicTool,
  type StructuredToolInterface,
} from "@langchain/core/tools";
import { ChatOpenAI } from "@langchain/openai";
import { AgentExecutor, createToolCallingAgent } from "langchain/agents";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { z } from "zod";

type RuntimeConfig = {
  apiKey: string;
  baseUrl: string;
  model: string;
};

type AgentResponse = {
  output?: unknown;
};
/**
 * 도구 호출(Tool Calling) 능력을 갖춘 에이전트를 생성할 때 필요한 설정 객체입니다.
 *
 * Langchain 프레임워크에서 에이전트가 어쩐 지능을 가지고 어떤 장비를 사용할 수 있으며,
 * 어떤 지침에 따라 행동할지를 정의하는 3가지 핵심 요소를 포함합니다.
 *
 * @property { ChatOpenAI } llm - 에이전트의 뇌 역할을 하는 언어 모델.도구 호출 API를 지원하는 모델이어야 합니다.
 * Array<unkown> tools - 에이전트가 상황에 따라 자율적으로 선택하고 실행할수 있는 외부 도구 들의 목록
 * 에이전트의 역할과 대화 규칙을 정의하는 ㅈ박업 지시서
 *
 */
type AgentExecutorLike = {
  invoke(input: { input: string }): Promise<AgentResponse>;
};

function getRuntimeConfig(env: NodeJS.ProcessEnv = process.env): RuntimeConfig {
  const apiKey: string = env.API_KEY?.trim() ?? "";
  const baseUrl: string = env.BASE_URL?.trim() ?? "";
  const model: string = env.MODEL?.trim() ?? "";

  if (apiKey === "" || baseUrl == "" || model == "") {
    throw new Error(
      `API_KEY = ${apiKey}, BASE_URL = ${baseUrl}, MODEL = ${model} is missing.`,
    );
  }
  return {
    apiKey,
    baseUrl,
    model,
  };
}
/**
 * lanchain/agent 모듈을 동적으로 불러오고 필수 함수들이 제대로 포함되어 있는지 검증합니다.
 *
 * @returns {Promise<LangchainAgentsModule>} 검증된 모듈 객체
 *
 * too: 평범함 함수를 래핑하는 팩토리 함수
 * RunnableFunc: 우리가 실제로 작성하는 비즈니스 실행 로직
 * ToolWrapperParams & DynamicTool: 모델에게
 * 이 함수는 이런 용도이고, 이런 타입의 입력을 받아 라고 알려주는 메타데이터와 그 결과물.
 *
 * RunnableFunc<string, sring, ToolRunnableConfig>
 * 도구가 호출될때 실행 되는 핵심 비즈니스 로직 함수입니다.
 *
 * 에이전트는 제공된 schema에 맞춰 입려값을 생성한 뒤 이 함수를 호출하며
 * 이 함수가 반호나한 결과 값은 다시 에이전트에게 전달 되어 다음 행동의 근거가 도비니다.
 * @param {string} query - 에이전트(LLM)이 zod 스키마를 기반으로 생성 하여 넘겨부는 검색어
 * 검색 도구의 실행 결과 모델에게 다시 돌아갈 정보
 */

const searchInformationTool: DynamicTool<string> = tool(
  (query: string): string => {
    console.log(
      `\n--- Tool Called: search_information with query: '${query}' ---\n`,
    );

    const simulatedResults: Record<string, string> = {
      "weather in london":
        "The weather in London is currently cloudy with a temperature of 15C.",
      "capital of france": "The capital of France is Paris.",
      "population of earth":
        "The estimated population of Earth is around 8 billion people.",
      "tallest mountain":
        "Mount Everest is the tallest mountain above sea level.",
    };

    const normalizedQuery: string = query.toLowerCase();
    const defaultResult: string = `Simulated search result for '${query}': No specific information found, but the topic seems interesting.`;
    const result: string = simulatedResults[normalizedQuery] ?? defaultResult;

    console.log(`--- TOOL RESULT: ${result} ---`);
    return result;
  },
  {
    name: "search_information",
    description:
      "Return simulated factual information for a few preset queryies.",
    schema: z.string().describe("The search query text."),
  },
);

const tools: Array<StructuredToolInterface> = [searchInformationTool];

async function runAgentWithTool(
  executor: AgentExecutorLike,
  query: string,
): Promise<void> {
  console.log(`\n--- Running Agent with Query: '${query}' ---\n`);

  try {
    const response: AgentResponse = await executor.invoke({
      input: query,
    });
    const outputText: string = String(response.output ?? "");

    console.log("\n--- Final Agent Response ---");
    console.log(outputText);
  } catch (error: unknown) {
    const errorMessage: string =
      error instanceof Error ? error.message : String(error);
    console.log(`\nAn error occurred during agent execution: ${errorMessage}`);
  }
}

/**
 * ToolWrapperParams
 * LLM에게 이 도구를 소개하는 메타 데이터
 * 에이전트는 이 이력서의 name과 description을 읽고 아 날씨를 물어보면 이 도구를 써야겠군 하고
 * 깨닫게 됩니다.
 * z.ZodString은 입력값이 문자열 이ㅓ야 함ㅅ을 엄격하게 정의합니다.
 * 반환되는 Dynamic Toll은 래핑이 완료된 최종 결과물입니다.
 */

async function main(): Promise<void> {
  const config: RuntimeConfig = getRuntimeConfig(process.env);
  const llm: ChatOpenAI = new ChatOpenAI({
    apiKey: config.apiKey,
    model: config.model,
    temperature: 0,
    configuration: {
      baseURL: config.baseUrl,
    },
  });
  const prompt: ReturnType<typeof ChatPromptTemplate.fromMessages> =
    ChatPromptTemplate.fromMessages([
      ["system", "You are a helpful assistant."],
      ["human", "{input}"],
      ["placeholder", "{agent_scratchpad}"],
    ]);

  const agent = await createToolCallingAgent({
    llm,
    tools,
    prompt,
  });

  const executor: AgentExecutorLike = new AgentExecutor({
    agent,
    tools,
    verbose: true,
  });

  console.log(`Language model initialized: ${config.model}`);

  // await runAgentWithTool(executor, "What is the capital of France?");
  // await runAgentWithTool(executor, "What's the weather like in London?");
  // await runAgentWithTool(executor, "Tell me something about dogs.");
}

await main();
