/**
 * Run:
 * cd modules && node --env-file=.env --experimental-strip-types ./paralleization/parallelization_langchain.ts
 */
import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { RunnableMap } from "@langchain/core/runnables";
import { ChatOpenAI } from "@langchain/openai";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

export type LangchainConfig = {
  apiKey: string;
  baseUrl: string;
  modelName: string;
  topic: string;
};

export type LangchainWorkflowResult = {
  topic: string;
  summary: string;
  questions: string;
  keyTerms: string;
  finalResponse: string;
  modelName: string;
};

export type LangchainWorkflowExecutor = (
  config: LangchainConfig,
  topic: string,
) => Promise<LangchainWorkflowResult>;

export function resolveLangchainConfig(
  env: NodeJS.ProcessEnv = process.env,
): LangchainConfig {
  const apiKey: string | undefined = env.API_KEY?.trim();
  if (!apiKey) {
    throw new Error("API_KEY is missing.");
  }

  const config: LangchainConfig = {
    apiKey,
    baseUrl: env.BASE_URL?.trim() || "https://api.synthetic.new/openai/v1",
    modelName: env.MODEL?.trim() || "hf:moonshotai/Kimi-K2.5",
    topic: "The history of space exploration",
  };
  return config;
}

export async function runLangchainWorkflow(
  config: LangchainConfig = resolveLangchainConfig(process.env),
  topic: string = config.topic,
  executor?: LangchainWorkflowExecutor,
): Promise<LangchainWorkflowResult> {
  if (executor) {
    const injectedResult: LangchainWorkflowResult = await executor(
      config,
      topic,
    );
    return injectedResult;
  }

  const model: ChatOpenAI = new ChatOpenAI({
    apiKey: config.apiKey,
    model: config.modelName,
    temperature: 0.2,
    timeout: 180000,
    maxRetries: 1,
    configuration: {
      baseURL: config.baseUrl,
    },
  });

  const parser: StringOutputParser = new StringOutputParser();

  const summaryPrompt: ReturnType<typeof ChatPromptTemplate.fromMessages> =
    ChatPromptTemplate.fromMessages([
      ["system", "Summarize the following topic concisely:"],
      ["user", "{topic}"],
    ]);

  const questionsPrompt: ReturnType<typeof ChatPromptTemplate.fromMessages> =
    ChatPromptTemplate.fromMessages([
      [
        "system",
        "Generate three interesting questions about the following topic:",
      ],
      ["user", "{topic}"],
    ]);

  const keyTermsPrompt: ReturnType<typeof ChatPromptTemplate.fromMessages> =
    ChatPromptTemplate.fromMessages([
      [
        "system",
        "Identify 5-10 key terms from the following topic, separated by commas:",
      ],
      ["user", "{topic}"],
    ]);

  const mapChain: RunnableMap<
    { topic: string },
    { summary: string; questions: string; key_terms: string }
  > = RunnableMap.from({
    summary: summaryPrompt.pipe(model).pipe(parser),
    questions: questionsPrompt.pipe(model).pipe(parser),
    key_terms: keyTermsPrompt.pipe(model).pipe(parser),
  });

  const parallelResult: {
    summary: string;
    questions: string;
    key_terms: string;
  } = await mapChain.invoke({ topic });

  const synthesisPrompt: ReturnType<typeof ChatPromptTemplate.fromMessages> =
    ChatPromptTemplate.fromMessages([
      [
        "system",
        [
          "Based on the following information:",
          "Summary: {summary}",
          "Related Questions: {questions}",
          "Key Terms: {key_terms}",
          "Synthesize a comprehensive answer.",
        ].join("\n"),
      ],
      ["user", "Original topic: {topic}"],
    ]);

  const synthesisInput: {
    topic: string;
    summary: string;
    questions: string;
    key_terms: string;
  } = {
    topic,
    summary: parallelResult.summary,
    questions: parallelResult.questions,
    key_terms: parallelResult.key_terms,
  };

  const finalResponse: string = await synthesisPrompt
    .pipe(model)
    .pipe(parser)
    .invoke(synthesisInput);

  const result: LangchainWorkflowResult = {
    topic,
    summary: parallelResult.summary,
    questions: parallelResult.questions,
    keyTerms: parallelResult.key_terms,
    finalResponse,
    modelName: config.modelName,
  };
  return result;
}

const isNodeTestContext: boolean = process.env.NODE_TEST_CONTEXT !== undefined;
const cliPath: string | undefined = process.argv[1];
if (!isNodeTestContext && cliPath) {
  const cliUrl: string = pathToFileURL(resolve(process.cwd(), cliPath)).href;
  if (cliUrl === import.meta.url) {
    const cliConfig: LangchainConfig = resolveLangchainConfig(process.env);
    const topicFromCli: string = process.argv.slice(2).join(" ").trim();
    const topic: string =
      topicFromCli.length > 0 ? topicFromCli : cliConfig.topic;
    void runLangchainWorkflow(cliConfig, topic)
      .then((result: LangchainWorkflowResult): void => {
        console.log(JSON.stringify(result, null, 2));
      })
      .catch((error: unknown): void => {
        const errorMessage: string =
          error instanceof Error ? error.message : String(error);
        console.error(errorMessage);
        process.exitCode = 1;
      });
  }
}
