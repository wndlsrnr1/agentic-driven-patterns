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
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

export type OpenAIConfig = {
  apiKey: string;
  baseUrl: string;
  modelName: string;
};

export type ResearchSummary = {
  topic: string;
  summary: string;
  outputKey: string;
};

export type OpenAIWorkflowResult = {
  summaries: Array<ResearchSummary>;
  mergedReport: string;
  modelName: string;
};

export type OpenAIWorkflowExecutor = (
  config: OpenAIConfig,
) => Promise<OpenAIWorkflowResult>;

export function resolveOpenAIConfig(
  env: NodeJS.ProcessEnv = process.env,
): OpenAIConfig {
  const apiKey: string | undefined = env.SYNTHETIC_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("SYNTHETIC_API_KEY is missing.");
  }

  const config: OpenAIConfig = {
    apiKey,
    baseUrl: env.SYNTHETIC_BASE_URL?.trim() || "https://api.synthetic.new/openai/v1",
    modelName: env.SYNTHETIC_MODEL?.trim() || "hf:moonshotai/Kimi-K2.5",
  };
  return config;
}

export async function runOpenAIWorkflow(
  config: OpenAIConfig = resolveOpenAIConfig(process.env),
  executor?: OpenAIWorkflowExecutor,
): Promise<OpenAIWorkflowResult> {
  if (executor) {
    const injectedResult: OpenAIWorkflowResult = await executor(config);
    return injectedResult;
  }

  const provider: OpenAIProvider = new OpenAIProvider({
    apiKey: config.apiKey,
    baseURL: config.baseUrl,
    useResponses: false,
  });
  setDefaultOpenAIKey(config.apiKey);
  setOpenAIAPI("chat_completions");

  const runner: Runner = new Runner({
    modelProvider: provider,
    tracingDisabled: true,
  });

  const topics: Array<{
    name: string;
    topic: string;
    specialization: string;
    outputKey: string;
  }> = [
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

  const summaries: Array<ResearchSummary> = await Promise.all(
    topics.map(
      async (topicItem: {
        name: string;
        topic: string;
        specialization: string;
        outputKey: string;
      }): Promise<ResearchSummary> => {
        const researcherAgent: Agent = new Agent({
          name: topicItem.name,
          model: config.modelName,
          instructions: [
            `You are an AI Research Assistant specializing in ${topicItem.specialization}.`,
            `Research the latest advancements in '${topicItem.topic}'.`,
            "Summarize key findings concisely in 1-2 sentences.",
            "Output only the summary.",
          ].join("\n"),
        });

        const researchInput: string = [
          `Topic: ${topicItem.topic}`,
          `Specialization: ${topicItem.specialization}`,
          "Return a concise 1-2 sentence summary only.",
        ].join("\n");

        const result: { finalOutput: unknown } = (await runner.run(
          researcherAgent,
          researchInput,
          { maxTurns: 6 },
        )) as { finalOutput: unknown };

        const summaryText: string =
          typeof result.finalOutput === "string"
            ? result.finalOutput
            : JSON.stringify(result.finalOutput, null, 2);

        const summary: ResearchSummary = {
          topic: topicItem.topic,
          summary: summaryText,
          outputKey: topicItem.outputKey,
        };
        return summary;
      },
    ),
  );

  const renewableSummary: string =
    summaries.find(
      (summary: ResearchSummary): boolean =>
        summary.outputKey === "renewable_energy_result",
    )?.summary || "";
  const evSummary: string =
    summaries.find(
      (summary: ResearchSummary): boolean =>
        summary.outputKey === "ev_technology_result",
    )?.summary || "";
  const carbonCaptureSummary: string =
    summaries.find(
      (summary: ResearchSummary): boolean =>
        summary.outputKey === "carbon_capture_result",
    )?.summary || "";

  const synthesisAgent: Agent = new Agent({
    name: "SynthesisAgent",
    model: config.modelName,
    instructions: [
      "You combine research findings into a structured report.",
      "Use only provided summaries and do not add external facts.",
      "Output format:",
      "## Summary of Recent Sustainable Technology Advancements",
      "### Renewable Energy Findings",
      "### Electric Vehicle Findings",
      "### Carbon Capture Findings",
      "### Overall Conclusion",
    ].join("\n"),
  });

  const synthesisInput: string = [
    "Input Summaries:",
    `Renewable Energy: ${renewableSummary}`,
    `Electric Vehicles: ${evSummary}`,
    `Carbon Capture: ${carbonCaptureSummary}`,
  ].join("\n");

  const mergedResult: { finalOutput: unknown } = (await runner.run(
    synthesisAgent,
    synthesisInput,
    { maxTurns: 8 },
  )) as { finalOutput: unknown };

  const mergedReport: string =
    typeof mergedResult.finalOutput === "string"
      ? mergedResult.finalOutput
      : JSON.stringify(mergedResult.finalOutput, null, 2);

  const result: OpenAIWorkflowResult = {
    summaries,
    mergedReport,
    modelName: config.modelName,
  };
  return result;
}

const isNodeTestContext: boolean = process.env.NODE_TEST_CONTEXT !== undefined;
const cliPath: string | undefined = process.argv[1];
if (!isNodeTestContext && cliPath) {
  const cliUrl: string = pathToFileURL(resolve(process.cwd(), cliPath)).href;
  if (cliUrl === import.meta.url) {
    void runOpenAIWorkflow()
      .then((result: OpenAIWorkflowResult): void => {
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
