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

const DEFAULT_SYNTHETIC_BASE_URL: string =
  "https://api.synthetic.new/openai/v1";
const DEFAULT_SYNTHETIC_MODEL: string = "hf:moonshotai/Kimi-K2.5";
const DEFAULT_TOPIC: string = "The history of space exploration";
const MODEL_TEMPERATURE: number = 0.7;

type Logger = (message: string) => void;

type StringRunnable<TInput> = {
  invoke(input: TInput): Promise<string>;
};

type ParallelMapInput = {
  topic: string;
};

type ParallelMapOutput = {
  summary: string;
  questions: string;
  key_terms: string;
  topic: string;
};

export type RuntimeConfig = {
  apiKey: string;
  baseUrl: string;
  modelName: string;
};

export type RunParallelizationLangchainWorkflowResult = {
  topic: string;
  summary: string;
  questions: string;
  keyTerms: string;
  finalResponse: string;
  processLogs: Array<string>;
  modelName: string;
};

export type ParallelizationLangchainWorkflowRunner = (
  topic: string,
  runtimeConfig: RuntimeConfig,
) => Promise<RunParallelizationLangchainWorkflowResult>;

export type RunParallelizationLangchainWorkflowInput = {
  topic?: string;
  runtimeConfig?: RuntimeConfig;
  env?: NodeJS.ProcessEnv;
  log?: Logger;
  workflowRunner?: ParallelizationLangchainWorkflowRunner;
};

function buildModel(runtimeConfig: RuntimeConfig): ChatOpenAI {
  const model: ChatOpenAI = new ChatOpenAI({
    apiKey: runtimeConfig.apiKey,
    model: runtimeConfig.modelName,
    temperature: MODEL_TEMPERATURE,
    timeout: 180000,
    maxRetries: 1,
    configuration: {
      baseURL: runtimeConfig.baseUrl,
    },
  });
  return model;
}

function buildParallelMapChain(
  model: ChatOpenAI,
): RunnableMap<ParallelMapInput, ParallelMapOutput> {
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

  const mapChain: RunnableMap<ParallelMapInput, ParallelMapOutput> =
    RunnableMap.from<ParallelMapInput, ParallelMapOutput>({
      summary: summaryPrompt.pipe(model).pipe(parser),
      questions: questionsPrompt.pipe(model).pipe(parser),
      key_terms: keyTermsPrompt.pipe(model).pipe(parser),
      topic: (input: ParallelMapInput): string => {
        return input.topic;
      },
    });
  return mapChain;
}

function buildSynthesisChain(
  model: ChatOpenAI,
): StringRunnable<ParallelMapOutput> {
  const parser: StringOutputParser = new StringOutputParser();
  const synthesisChain: StringRunnable<ParallelMapOutput> =
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
    ])
      .pipe(model)
      .pipe(parser) as StringRunnable<ParallelMapOutput>;
  return synthesisChain;
}

async function runDefaultParallelizationLangchainWorkflow(
  topic: string,
  runtimeConfig: RuntimeConfig,
): Promise<RunParallelizationLangchainWorkflowResult> {
  const processLogs: Array<string> = [];
  const model: ChatOpenAI = buildModel(runtimeConfig);
  const mapChain: RunnableMap<ParallelMapInput, ParallelMapOutput> =
    buildParallelMapChain(model);
  const synthesisChain: StringRunnable<ParallelMapOutput> =
    buildSynthesisChain(model);

  processLogs.push("start");
  processLogs.push("parallel-start");
  const parallelOutput: ParallelMapOutput = await mapChain.invoke({ topic });
  processLogs.push("parallel-done");
  processLogs.push("synthesis-start");
  const finalResponse: string = await synthesisChain.invoke(parallelOutput);
  processLogs.push("synthesis-done");
  processLogs.push("completed");

  const result: RunParallelizationLangchainWorkflowResult = {
    topic: parallelOutput.topic,
    summary: parallelOutput.summary,
    questions: parallelOutput.questions,
    keyTerms: parallelOutput.key_terms,
    finalResponse,
    processLogs,
    modelName: runtimeConfig.modelName,
  };
  return result;
}

export function buildRuntimeConfigFromEnv(
  env: NodeJS.ProcessEnv,
): RuntimeConfig {
  const apiKey: string | undefined = env.SYNTHETIC_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("SYNTHETIC_API_KEY is missing.");
  }

  const runtimeConfig: RuntimeConfig = {
    apiKey,
    baseUrl: env.SYNTHETIC_BASE_URL?.trim() ?? DEFAULT_SYNTHETIC_BASE_URL,
    modelName: env.SYNTHETIC_MODEL?.trim() ?? DEFAULT_SYNTHETIC_MODEL,
  };
  return runtimeConfig;
}

export function resolveCliInput(argv: readonly string[]): string | undefined {
  const topic: string = argv.slice(2).join(" ").trim();
  return topic.length > 0 ? topic : undefined;
}

export function isDirectExecution(
  moduleUrl: string,
  argv: readonly string[],
): boolean {
  const scriptPath: string | undefined = argv[1];
  if (!scriptPath) {
    return false;
  }

  const scriptUrl: string = pathToFileURL(resolve(scriptPath)).href;
  return scriptUrl === moduleUrl;
}

export async function runParallelizationLangchainWorkflow(
  options: RunParallelizationLangchainWorkflowInput = {},
): Promise<RunParallelizationLangchainWorkflowResult> {
  const runtimeConfig: RuntimeConfig =
    options.runtimeConfig ??
    buildRuntimeConfigFromEnv(options.env ?? process.env);
  const topic: string = options.topic ?? DEFAULT_TOPIC;
  const logger: Logger = options.log ?? console.log;
  const workflowRunner: ParallelizationLangchainWorkflowRunner =
    options.workflowRunner ?? runDefaultParallelizationLangchainWorkflow;

  logger(`[parallelization-langchain] topic: ${topic}`);
  const result: RunParallelizationLangchainWorkflowResult =
    await workflowRunner(topic, runtimeConfig);
  logger("[parallelization-langchain] final response ready");
  logger(result.finalResponse);

  return result;
}

async function runFromCli(): Promise<void> {
  const topic: string | undefined = resolveCliInput(process.argv);
  const result: RunParallelizationLangchainWorkflowResult =
    await runParallelizationLangchainWorkflow({
      topic,
    });
  console.log(JSON.stringify(result, null, 2));
}

if (isDirectExecution(import.meta.url, process.argv)) {
  void runFromCli().catch((error: unknown): void => {
    const errorMessage: string =
      error instanceof Error ? error.message : String(error);
    console.error(errorMessage);
    process.exitCode = 1;
  });
}
