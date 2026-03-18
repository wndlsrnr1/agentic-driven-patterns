import {
  Agent,
  MemorySession,
  OpenAIProvider,
  Runner,
  tool,
  type Session,
} from "@openai/agents";
import { randomUUID } from "node:crypto";
import z from "zod";

type ConfigDTO = {
  apiKey: string;
  baseUrl: string;
  modelName: string;
  sessionRouting: OpenAICalculatorSessionRouting;
};

type OpenAICalculatorSessionRouting = {
  appName: string;
  userId: string;
  sessionId: string;
};

function getConfig(env: NodeJS.ProcessEnv = process.env): ConfigDTO {
  return {
    apiKey: env.API_KEY?.trim() || env.OPENAI_API_KEY?.trim() || "",
    baseUrl: env.BASE_URL?.trim() || "https://api.z.ai/api/coding/paas/v4",
    modelName: env.MODEL?.trim() || "glm-5",
    sessionRouting: {
      appName: "calculator",
      userId: randomUUID(),
      sessionId: randomUUID(),
    },
  };
}

function runExample(query: string, config: ConfigDTO): Promise<string> {
  const provider: OpenAIProvider = new OpenAIProvider({
    apiKey: config.apiKey,
    baseURL: config.baseUrl,
    useResponses: false,
  });

  const runner = new Runner({
    modelProvider: provider,
    tracingDisabled: true,
  });

  const calculatorToolSchema: z.ZodObject<{
    expression: z.ZodString;
  }> = z.object({
    expression: z.string(),
  });

  /**
   * Tool
   *• Using: using-superpowers
  네. 정리하면 이렇게 보시면 됩니다.

  1. 이 ToolOptions는 무엇인가
  ToolOptions는 OpenAI Agents JS SDK에서 tool(...) 헬퍼에 넣는
  “함수 도구(function tool) 정의용 입력 타입”입니다.

  로컬 설치본 기준 정의 위치:

  - node_modules/@openai/agents-core/dist/tool.d.ts:286
  - node_modules/@openai/agents-core/dist/tool.d.ts:329
  - node_modules/@openai/agents-core/dist/tool.d.ts:370

  공식 문서 기준:

  - OpenAI Agents SDK ToolOptions 타입 문서:

  https://openai.github.io/openai-agents-js/openai/agents/type-aliases/tooloptions/
  - OpenAI Agents SDK Tools 가이드:
    https://openai.github.io/openai-agents-js/guides/tools/

  2. name, description, parameters, execute는 어디에 적혀 있나
  로컬 0.3.0 설치본에서는 ToolOptions가 StrictToolOptions |
  NonStrictToolOptions 유니언으로 정의되어 있고, 거기에 적혀 있습
  니다.

  로컬 선언:

  - name?: node_modules/@openai/agents-core/dist/tool.d.ts:288
  - description: node_modules/@openai/agents-core/dist/
    tool.d.ts:292
  - parameters: node_modules/@openai/agents-core/dist/
    tool.d.ts:296
  - execute: node_modules/@openai/agents-core/dist/tool.d.ts:306

  비엄격(non-strict) 쪽도 동일 구조입니다:

  - node_modules/@openai/agents-core/dist/tool.d.ts:331
  - node_modules/@openai/agents-core/dist/tool.d.ts:335
  - node_modules/@openai/agents-core/dist/tool.d.ts:339
  - node_modules/@openai/agents-core/dist/tool.d.ts:347

  공식 Tools 가이드도 같은 구조를 표준 옵션으로 설명합니다.

  - name, description, parameters, strict, execute, errorFunctio
    n, needsApproval, isEnabled 등:
    https://openai.github.io/openai-agents-js/ko/guides/tools/

  3. 이게 SDK의 공통 표준 구조인가
  정확히는 “모든 tool의 공통 구조”는 아니고, function tool의 표준
  구조입니다.

  OpenAI Agents SDK에는 tool 종류가 여러 개 있습니다.

  - Function tools: tool({...})
  - Hosted tools
  - Computer tool
  - MCP tools
  - Agent-as-tool

  그래서 name / description / parameters / execute는 모든 tool 공
  통이 아니라, tool()로 만드는 function tool 쪽의 표준 입력 구조
  입니다.

  공식 Tools 가이드도 tool을 여러 카테고리로 나눕니다:

  - https://openai.github.io/openai-agents-js/guides/tools/

  4. 런타임에서 실제로는 어떻게 바뀌나
  중요한 점은 ToolOptions는 “입력 옵션”이고, tool(options)를 거치
  면 런타임용 FunctionTool로 변환된다는 점입니다.

  로컬 구현:

  - node_modules/@openai/agents-core/dist/tool.js:143

  변환 결과:

  - execute를 받아서 내부 invoke로 래핑함: node_modules/@openai/
    agents-core/dist/tool.js:158
  - 최종 반환 shape는 type, name, description, parameters,
    strict, invoke, needsApproval, isEnabled: node_modules/
    @openai/agents-core/dist/tool.js:213

  즉:

  - 작성 시 표준 구조: ToolOptions
  - 런타임 표준 구조: FunctionTool

  공식 TypeDoc도 최종 FunctionTool shape를 따로 보여 줍니다:

  -
  https://openai.github.io/openai-agents-js/openai/agents/type-aliases/functiontool/

  여기서 보이는 핵심 필드:

  - name
  - description
  - parameters
  - strict
  - invoke
  - needsApproval
  - isEnabled

  즉 execute는 작성용 필드이고, 런타임에선 invoke로 표준화됩니다.

  5. 로컬 설치본 0.3.0 기준 tool() 옵션
  현재 설치 버전:

  - node_modules/@openai/agents-core/package.json:5
  - 0.3.0

  로컬 0.3.0에서 확인되는 ToolOptions 필드:

  - name?
  - description
  - parameters
  - strict 또는 strict?: true
  - execute
  - errorFunction?
  - needsApproval?
  - isEnabled?

  근거:

  - node_modules/@openai/agents-core/dist/tool.d.ts:286
  - node_modules/@openai/agents-core/dist/tool.d.ts:329

  6. 현재 공식 문서 기준 추가된 옵션
  Context7와 공식 OpenAI Agents SDK 문서 기준 현재 function tool
  옵션 표는 더 큽니다.

  공식 Tools 가이드 옵션 표:

  - name
  - description
  - parameters
  - strict
  - execute
  - errorFunction
  - timeoutMs
  - timeoutBehavior
  - timeoutErrorFunction
  - needsApproval
  - isEnabled
  - inputGuardrails
  - outputGuardrails

  근거:

  - OpenAI Agents SDK Tools 가이드 Options reference:
    https://openai.github.io/openai-agents-js/ko/guides/tools/
  - Context7 OpenAI Agents JS 문서:

  https://github.com/openai/openai-agents-js/blob/main/docs/src/content/docs/guides/tools.mdx

  그리고 최신 공식 문서 예시에는 deferLoading: true도 나옵니다.
  이건 tool search와 함께 쓰는 지연 로딩 옵션입니다.

  - 공식 Tools 가이드 예시:
    https://openai.github.io/openai-agents-js/ko/guides/tools/

  7. 결론
  질문하신 name, description, parameters, execute는:

  - 임의로 만든 필드가 아니라
  - OpenAI Agents SDK의 tool() function tool 입력 계약인
    ToolOptions에 정의된 표준 필드입니다.

  다만 범위를 정확히 말하면:

  - “Agents SDK 전체의 모든 tool 공통 표준”은 아니고
  - “tool() helper로 만드는 function tool의 표준 옵션 구조”입니
    다.

  그리고 현재 로컬 설치본 0.3.0은 공식 최신 문서보다 옵션이 적습
  니다.
  즉, 지금 로컬 코드에서 보이는 표준과 현재 공식 문서 표준 사이에
  는 버전 차이가 있습니다.
   */
  const toolOptions = {
    name: "safe_calculator",
    description: "",
    parameters: calculatorToolSchema,
    execute: (input: { expression: string }): string => {
      return "";
    },
  };

  const calcualtorTool: ReturnType<typeof tool> = tool(toolOptions);

  const calulatorAgent = null;

  const mappedSessionId = null;
  const session = null;
  const runResult = null;
  const finalOutput = null;
  const finalText = null;

  return finalText;
}

// 설정을 가져온다.
const config: ConfigDTO = getConfig(process.env);

// 예제 실행 1번
const firstResult: string = await runExample(
  "Calculate the value of (5 + 7) * 3",
  config,
);
const secondResult: string = await runExample("What is 10 fatorial?", config);

console.log(`===FirstResult===\n ${firstResult}`);
console.log(`===SecondResult===\n ${secondResult}`);
