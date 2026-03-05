import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { RunnableMap } from "@langchain/core/runnables";
import { ChatOpenAI } from "@langchain/openai";
import { env } from "node:process";
import { string } from "zod/v4";

type ModelConfig = {
  apiKey: string;
  modelName: string;
  baseUrl: string;
};

function resolveModelConfig(): ModelConfig {
  return {
    apiKey: String(env.API_KEY),
    modelName: String(env.MODEL),
    baseUrl: String(env.BASE_URL),
  } as ModelConfig;
}

async function runLanchainExaple(): Promise<string> {
  const modelConfig: ModelConfig = resolveModelConfig();

  const model: ChatOpenAI = new ChatOpenAI({
    apiKey: modelConfig.apiKey,
    model: modelConfig.modelName,
    temperature: 0.2,
    configuration: { baseURL: modelConfig.baseUrl },
  });

  const parser: StringOutputParser = new StringOutputParser();

  const summaryPrompt: ReturnType<typeof ChatPromptTemplate.fromMessages> =
    ChatPromptTemplate.fromMessages([
      ["system", "Summarize the following topic in one sentence."],
      ["user", "{topic1}{topic2}"],
    ]);

  const questikonPrompt: ReturnType<typeof ChatPromptTemplate.fromMessages> =
    ChatPromptTemplate.fromMessages([
      ["system", "Generate two interesting questions for this topic."],
      ["user", "{topic1}{topic2}"],
    ]);

  const keywordsPrompt: ReturnType<typeof ChatPromptTemplate.fromMessages> =
    ChatPromptTemplate.fromMessages([
      ["system", "Extract three key terms as comma-separated text."],
      ["user", "{topic1}"],
    ]);

  /**
   * python의 RunnableParallel 과 동일한 영학을 한다
   * Runnable 객체를 병렬로 실행하고 각 결과 값을 key, value 객체로 묶어서 반환하는 핵심 컴포넌트임
   *
   * 단일 입력 데이터를 RunnableMap 내부에 정의된 모든 하위 Runnable 컴포넌트에 동일하게 전달함.
   * 주로 다중 LLM 호출이나 여러 검색 엔진 동시 조회와 가은 I/O 바운드 작업의 전체 지연 시간을 최소화 하는데 사용된다.
   *
   * 주요 특징 및 동작 방식:
   * 병렬 처리 (Parallel Execution): 내부에 선언된 모든 작업이 비동기적으로 동시에 실행됩니다.
   * 전체 실행 시간은 선언된 작업 중 가장 오래 걸리는 작업 소요 시간과 거의 동일하게 최적화 됩니다.
   * const parallelmMap = RunnableMap.from({
   * summary: summaryPrompt.pip(model).pipe(parser)},
   * question: questikonPrompt.pipe(model).pipe(parser),
   * keywords: keywordsPrompt.pipe(model).pipe(parser)
   * })
   * 이런 형식으로 나올대 데이터 출력 형식 고정해준다
   */

  const parallelMap: RunnableMap<
    {
      topic1: string;
      topic2: string;
    },
    {
      summary: string;
      questions: string;
      keywords: string;
    }
  > = RunnableMap.from({
    summary: summaryPrompt.pipe(model).pipe(parser),
    questions: questikonPrompt.pipe(model).pipe(parser),
    keywords: keywordsPrompt.pipe(model).pipe(parser),
  });

  const result: { summary: string; questions: string; keywords: string } =
    await parallelMap.invoke({
      topic1: "Play alone in my room. and writing some code in my room.",
      topic2: "so i selpt in my room",
    });
  const output: string = JSON.stringify(result, null, 2);

  return output;
}

console.log(await runLanchainExaple());
