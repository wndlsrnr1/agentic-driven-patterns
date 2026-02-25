/**
 * Run:
 * cd modules && node --env-file=.env --experimental-strip-types ./paralleization/library-tutorial.ts
 */
import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { RunnableMap } from "@langchain/core/runnables";
import { ChatOpenAI } from "@langchain/openai";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import {
  GOOGLE_SEARCH,
  Gemini,
  InMemoryRunner,
  LlmAgent,
  ParallelAgent,
  SequentialAgent,
  isFinalResponse,
  stringifyContent,
  type Event,
} from "@google/adk";

import {
  Agent,
  OpenAIProvider,
  Runner,
  setDefaultOpenAIKey,
  setOpenAIAPI,
} from "@openai/agents";
import { createUserContent, type Content } from "@google/genai";

// === 공통 유틸리티 ===

export type Logger = (message: string) => void;

function logStep(
  log: Logger,
  framework: string,
  stepNo: number,
  title: string,
): void {
  log(`[${framework}] STEP ${stepNo} - ${title}`);
}

const SYNTHETIC_BASE_URL: string = "https://api.synthetic.new/openai/v1";
const SYNTHETIC_MODEL: string = "hf:moonshotai/Kimi-K2.5";

function resolveSyntheticApiKey(): string | undefined {
  return process.env.SYNTHETIC_API_KEY?.trim();
}

function resolveGeminiApiKey(): string | undefined {
  return (
    process.env.GEMINI_API_KEY?.trim() || process.env.GOOGLE_API_KEY?.trim()
  );
}

// 직접 실행 여부를 판단하는 간단한 헬퍼
export function isDirectExecution(fileUrl: string, argv: string[]): boolean {
  if (argv.length < 2) return false;
  try {
    const executedFile = resolve(process.cwd(), argv[1]!);
    const currentFile = pathToFileURL(executedFile).href;
    return (
      currentFile === fileUrl || currentFile.replace(/\.js$/, ".ts") === fileUrl
    );
  } catch (e) {
    return false;
  }
}

// === P2: LangChain 튜토리얼 구현 ===

export async function runLangChainDemo(
  log: Logger = console.log,
): Promise<void> {
  logStep(log, "langchain", 1, "setup");
  const apiKey = resolveSyntheticApiKey();
  if (!apiKey) {
    log("[langchain] Skipped: SYNTHETIC_API_KEY is missing.");
    return;
  }

  logStep(log, "langchain", 2, "build parallel chain with RunnableMap");
  const model = new ChatOpenAI({
    apiKey: apiKey,
    configuration: {
      baseURL: SYNTHETIC_BASE_URL,
    },
    modelName: SYNTHETIC_MODEL,
    temperature: 0,
  });

  const techPrompt = ChatPromptTemplate.fromTemplate(
    "Research the technology advances of {topic}. Summarize in exactly one sentence.",
  );

  const marketPrompt = ChatPromptTemplate.fromTemplate(
    "Research the market impact of {topic}. Summarize in exactly one sentence.",
  );

  const techChain = techPrompt.pipe(model).pipe(new StringOutputParser());
  const marketChain = marketPrompt.pipe(model).pipe(new StringOutputParser());

  // RunnableMap을 사용하여 두 체인을 병렬 실행 (선언적 병렬 처리)
  const parallelMap = RunnableMap.from({
    tech: techChain,
    market: marketChain,
  });

  logStep(log, "langchain", 3, "execute parallel chain");
  const topic = "Artificial Intelligence in Healthcare";

  try {
    const result = await parallelMap.invoke({ topic });
    log(`[langchain] Output - Tech: ${result.tech}`);
    log(`[langchain] Output - Market: ${result.market}`);
    log("[langchain] Completed\n");
  } catch (err: any) {
    log(`[langchain] Failed: ${err.message}\n`);
  }
}

// === P3: Google ADK 튜토리얼 구현 ===

export async function runGoogleAdkDemo(
  log: Logger = console.log,
): Promise<void> {
  logStep(log, "google-adk", 1, "setup");
  const apiKey = resolveGeminiApiKey();
  if (!apiKey) {
    log("[google-adk] Skipped: GEMINI_API_KEY or GOOGLE_API_KEY is missing.");
    return;
  }

  logStep(log, "google-adk", 2, "build parallel and sequential agents");
  const model = new Gemini({
    model: "gemini-2.5-flash",
    apiKey,
  });

  const topic = "Artificial Intelligence in Healthcare";

  const techResearcher = new LlmAgent({
    name: "TechResearcher",
    model,
    instruction: `Research the technology advances of ${topic}. Summarize in exactly one sentence.`,
  });

  const marketResearcher = new LlmAgent({
    name: "MarketResearcher",
    model,
    instruction: `Research the market impact of ${topic}. Summarize in exactly one sentence.`,
  });

  const parallelResearcher = new ParallelAgent({
    name: "ParallelResearchers",
    subAgents: [techResearcher, marketResearcher],
  });

  const synthesisAgent = new LlmAgent({
    name: "SynthesisAgent",
    model,
    instruction:
      "Combine the input summaries into a concise markdown report. DO NOT ADD extra fluff.",
  });

  const workflow = new SequentialAgent({
    name: "TutorialWorkflow",
    subAgents: [parallelResearcher, synthesisAgent],
  });

  logStep(log, "google-adk", 3, "execute workflow with InMemoryRunner");
  const appName = "library-tutorial-adk";
  const userId = "user1";
  const runner = new InMemoryRunner({ agent: workflow, appName });

  const session = await runner.sessionService.createSession({
    appName,
    userId,
  });
  // @google/genai 의 createUserContent 로 래핑하지 않으면 타입 에러가 날 수 있으므로 유틸리티 사용
  // import { createUserContent } 추가 완료
  const userMessage = createUserContent(`Please research ${topic}`);

  const events: Array<Event> = [];
  try {
    for await (const event of runner.runAsync({
      userId,
      sessionId: session.id,
      newMessage: userMessage,
    })) {
      events.push(event);
    }

    // 최종 응답 추출
    let output = "";
    for (let i = events.length - 1; i >= 0; i--) {
      const event = events[i]!;
      if (isFinalResponse(event)) {
        output = stringifyContent(event).trim();
        if (output) break;
      }
    }

    log(`[google-adk] Output: ${output}`);
    log("[google-adk] Completed\n");
  } catch (err: any) {
    log(`[google-adk] Failed: ${err.message}\n`);
  }
}

// === P4: OpenAI Agents 튜토리얼 구현 ===

export async function runOpenAIAgentsDemo(
  log: Logger = console.log,
): Promise<void> {
  logStep(log, "openai-agents", 1, "setup");
  const apiKey = resolveSyntheticApiKey();
  if (!apiKey) {
    log("[openai-agents] Skipped: SYNTHETIC_API_KEY is missing.");
    return;
  }

  logStep(log, "openai-agents", 2, "initialize provider and agents");
  // OpenAI Provider 설정: Synthetic Base URL로 향하게 해야 함.
  const provider = new OpenAIProvider({
    apiKey,
    baseURL: SYNTHETIC_BASE_URL,
    useResponses: false,
  });

  setDefaultOpenAIKey(apiKey);
  setOpenAIAPI("chat_completions");

  const runner = new Runner({
    modelProvider: provider,
    tracingDisabled: true,
  });

  // Agent 생성
  const techAgent = new Agent({
    name: "Tech Agent",
    instructions:
      "Research the technology advances and produce exactly one sentence.",
    model: SYNTHETIC_MODEL,
  });

  const marketAgent = new Agent({
    name: "Market Agent",
    instructions:
      "Research the market impact and produce exactly one sentence.",
    model: SYNTHETIC_MODEL,
  });

  const topic = "Artificial Intelligence in Healthcare";

  logStep(log, "openai-agents", 3, "execute using independent Runner promises");
  try {
    // OpenAI Agents에는 내장 ParallelAgent가 없으므로 Runner.run을 다중 호출
    const [techResult, marketResult] = await Promise.all([
      runner.run(techAgent, `Topic: ${topic}`, { maxTurns: 3 }),
      runner.run(marketAgent, `Topic: ${topic}`, { maxTurns: 3 }),
    ]);

    // finalOutput 속성 접근 방식을 안전하게 수정 (any 캐스팅 포함)
    log(
      `[openai-agents] Tech Output: ${(techResult as any).finalOutput ?? JSON.stringify(techResult)}`,
    );
    log(
      `[openai-agents] Market Output: ${(marketResult as any).finalOutput ?? JSON.stringify(marketResult)}`,
    );
    log("[openai-agents] Completed\n");
  } catch (err: any) {
    log(`[openai-agents] Failed: ${err.message}\n`);
  }
}

// === P5: 진입점 (CLI 실행 로직) ===

async function main() {
  const log: Logger = console.log;
  log("Starting Library Tutorials...\n");

  await runLangChainDemo(log);
  await runGoogleAdkDemo(log);
  await runOpenAIAgentsDemo(log);

  log("All tutorials finished.");
}

const isNodeTestContext: boolean = process.env.NODE_TEST_CONTEXT !== undefined;
if (!isNodeTestContext && isDirectExecution(import.meta.url, process.argv)) {
  main().catch((err: unknown) => {
    console.error(err);
    process.exitCode = 1;
  });
}
