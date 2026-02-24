/**
 * Run:
 * cd modules && node --env-file=.env --experimental-strip-types ./paralleization/parallelization_openai.ts
 */
import {
  Agent,
  OpenAIProvider,
  Runner,
  setDefaultOpenAIKey,
  setOpenAIAPI,
} from "@openai/agents";

const DEFAULT_SYNTHETIC_BASE_URL: string =
  "https://api.synthetic.new/openai/v1";
const DEFAULT_SYNTHETIC_MODEL: string = "hf:moonshotai/Kimi-K2.5";

const DEFAULT_RESEARCH_TOPICS: Array<ResearchTopicConfig> = [
  {
    name: "RenewableEnergyResearcher",
    topic: "renewable energy sources",
    specialization: "energy",
    outputKey: "renewable_energy_result",
  },
  {
    name: "EVResearcher",
    topic: "electric vehicle technology",
    specialization: "transportation",
    outputKey: "ev_technology_result",
  },
  {
    name: "CarbonCaptureResearcher",
    topic: "carbon capture methods",
    specialization: "climate solutions",
    outputKey: "carbon_capture_result",
  },
];

export type RuntimeConfig = {
  apiKey: string;
  baseUrl: string;
  modelName: string;
};

export type ResearchTopicConfig = {
  name: string;
  topic: string;
  specialization: string;
  outputKey: string;
};

export type ResearchSummary = {
  topic: string;
  summary: string;
  outputKey: string;
};

export type ParallelResearchResult = {
  summaries: Array<ResearchSummary>;
  mergedReport: string;
  modelName: string;
};

export type AgentExecutionPayload = {
  agent: Agent;
  input: string;
  maxTurns: number;
};

type AgentExecutor = (payload: AgentExecutionPayload) => Promise<unknown>;

type RunParallelResearchWorkflowOptions = {
  agentExecutor?: AgentExecutor;
  topics?: Array<ResearchTopicConfig>;
};

function requireEnvValue(env: NodeJS.ProcessEnv, key: string): string {
  const value: string | undefined = env[key]?.trim();
  if (!value) {
    throw new Error(`${key} is missing.`);
  }
  return value;
}

export function buildRuntimeConfigFromEnv(
  env: NodeJS.ProcessEnv,
): RuntimeConfig {
  const runtimeConfig: RuntimeConfig = {
    apiKey: requireEnvValue(env, "SYNTHETIC_API_KEY"),
    baseUrl: env.SYNTHETIC_BASE_URL?.trim() ?? DEFAULT_SYNTHETIC_BASE_URL,
    modelName: env.SYNTHETIC_MODEL?.trim() ?? DEFAULT_SYNTHETIC_MODEL,
  };
  return runtimeConfig;
}

function createRunner(runtimeConfig: RuntimeConfig): Runner {
  const provider: OpenAIProvider = new OpenAIProvider({
    apiKey: runtimeConfig.apiKey,
    baseURL: runtimeConfig.baseUrl,
    useResponses: false,
  });
  setDefaultOpenAIKey(runtimeConfig.apiKey);
  setOpenAIAPI("chat_completions");
  const runner: Runner = new Runner({
    modelProvider: provider,
    tracingDisabled: true,
  });
  return runner;
}

function createResearcherAgent(
  modelName: string,
  topicConfig: ResearchTopicConfig,
): Agent {
  const instruction: string = [
    `You are an AI Research Assistant specializing in ${topicConfig.specialization}.`,
    `Research the latest advancements in '${topicConfig.topic}'.`,
    "Summarize key findings concisely in 1-2 sentences.",
    "Output only the summary.",
  ].join("\n");

  const researcherAgent: Agent = new Agent({
    name: topicConfig.name,
    model: modelName,
    instructions: instruction,
  });
  return researcherAgent;
}

function createSynthesisAgent(modelName: string): Agent {
  const synthesisInstruction: string = [
    "You combine research findings into a structured report.",
    "Use only the provided summaries and do not add external facts.",
    "Output format:",
    "## Summary of Recent Sustainable Technology Advancements",
    "### Renewable Energy Findings",
    "### Electric Vehicle Findings",
    "### Carbon Capture Findings",
    "### Overall Conclusion",
  ].join("\n");

  const synthesisAgent: Agent = new Agent({
    name: "SynthesisAgent",
    model: modelName,
    instructions: synthesisInstruction,
  });
  return synthesisAgent;
}

function buildResearchRequest(topicConfig: ResearchTopicConfig): string {
  const request: string = [
    `Topic: ${topicConfig.topic}`,
    `Specialization: ${topicConfig.specialization}`,
    "Return a concise 1-2 sentence summary only.",
  ].join("\n");
  return request;
}

function buildSynthesisInput(summaries: Array<ResearchSummary>): string {
  const renewableSummary: string =
    summaries.find(
      (summary: ResearchSummary): boolean =>
        summary.outputKey === "renewable_energy_result",
    )?.summary ?? "";
  const evSummary: string =
    summaries.find(
      (summary: ResearchSummary): boolean =>
        summary.outputKey === "ev_technology_result",
    )?.summary ?? "";
  const carbonCaptureSummary: string =
    summaries.find(
      (summary: ResearchSummary): boolean =>
        summary.outputKey === "carbon_capture_result",
    )?.summary ?? "";

  const synthesisInput: string = [
    "Input Summaries:",
    `Renewable Energy: ${renewableSummary}`,
    `Electric Vehicles: ${evSummary}`,
    `Carbon Capture: ${carbonCaptureSummary}`,
  ].join("\n");
  return synthesisInput;
}

function toText(finalOutput: unknown): string {
  if (typeof finalOutput === "string") {
    return finalOutput;
  }
  const normalizedOutput: string = JSON.stringify(finalOutput, null, 2);
  return normalizedOutput;
}

async function runAgentWithRunner(
  runner: Runner,
  payload: AgentExecutionPayload,
): Promise<unknown> {
  const result: { finalOutput: unknown } = (await runner.run(
    payload.agent,
    payload.input,
    { maxTurns: payload.maxTurns },
  )) as { finalOutput: unknown };
  return result.finalOutput;
}

function createDefaultAgentExecutor(
  runtimeConfig: RuntimeConfig,
): AgentExecutor {
  const runner: Runner = createRunner(runtimeConfig);
  const agentExecutor: AgentExecutor = async (
    payload: AgentExecutionPayload,
  ): Promise<unknown> => {
    return runAgentWithRunner(runner, payload);
  };
  return agentExecutor;
}

export async function runParallelResearchWorkflow(
  runtimeConfig: RuntimeConfig,
  options: RunParallelResearchWorkflowOptions = {},
): Promise<ParallelResearchResult> {
  const topics: Array<ResearchTopicConfig> =
    options.topics ?? DEFAULT_RESEARCH_TOPICS;
  const agentExecutor: AgentExecutor =
    options.agentExecutor ?? createDefaultAgentExecutor(runtimeConfig);

  const summaries: Array<ResearchSummary> = await Promise.all(
    topics.map(
      async (topicConfig: ResearchTopicConfig): Promise<ResearchSummary> => {
        const researcherAgent: Agent = createResearcherAgent(
          runtimeConfig.modelName,
          topicConfig,
        );
        const researchRequest: string = buildResearchRequest(topicConfig);
        const finalOutput: unknown = await agentExecutor({
          agent: researcherAgent,
          input: researchRequest,
          maxTurns: 6,
        });

        const researchSummary: ResearchSummary = {
          topic: topicConfig.topic,
          summary: toText(finalOutput),
          outputKey: topicConfig.outputKey,
        };
        return researchSummary;
      },
    ),
  );

  const synthesisAgent: Agent = createSynthesisAgent(runtimeConfig.modelName);
  const synthesisInput: string = buildSynthesisInput(summaries);
  const mergedOutput: unknown = await agentExecutor({
    agent: synthesisAgent,
    input: synthesisInput,
    maxTurns: 8,
  });

  const result: ParallelResearchResult = {
    summaries,
    mergedReport: toText(mergedOutput),
    modelName: runtimeConfig.modelName,
  };
  return result;
}

export async function runParallelResearchWorkflowFromCli(
  env: NodeJS.ProcessEnv = process.env,
  log: (message: string) => void = console.log,
  errorLog: (message: string) => void = console.error,
): Promise<void> {
  try {
    log("=== Parallel Research Workflow (OpenAI) ===");

    const runtimeConfig: RuntimeConfig = buildRuntimeConfigFromEnv(env);
    const result: ParallelResearchResult =
      await runParallelResearchWorkflow(runtimeConfig);

    log(JSON.stringify(result, null, 2));
  } catch (error: unknown) {
    const errorMessage: string =
      error instanceof Error ? error.message : String(error);
    errorLog(`Parallel research workflow failed: ${errorMessage}`);
    throw error;
  }
}

const isNodeTestContext: boolean = process.env.NODE_TEST_CONTEXT !== undefined;
if (!isNodeTestContext) {
  void runParallelResearchWorkflowFromCli().catch((): void => {
    process.exitCode = 1;
  });
}
