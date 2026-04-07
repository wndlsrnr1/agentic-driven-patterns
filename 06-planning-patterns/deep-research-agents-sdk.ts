/**
 * Run:
 * node --env-file=.env.openai-research --experimental-strip-types ./06-planning-patterns/deep-research-agents-sdk.ts
 */
import {
  Agent,
  OpenAIProvider,
  Runner,
  webSearchTool,
} from "@openai/agents";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const DEFAULT_MODEL: string = "gpt-4.1-mini";
const DEFAULT_QUERY: string =
  "Research the economic impact of semaglutide on global healthcare systems.";

export type DeepResearchRuntimeConfig = {
  apiKey: string;
  model: string;
};

export type DeepResearchCitation = {
  text: string;
  title: string;
  url: string;
  startIndex: number;
  endIndex: number;
};

export type DeepResearchStep = {
  type: string;
  summary: string;
};

export type DeepResearchResult = {
  query: string;
  report: string;
  citations: Array<DeepResearchCitation>;
  steps: Array<DeepResearchStep>;
  model: string;
};

export type DeepResearchExecutor = (
  query: string,
  config: DeepResearchRuntimeConfig,
) => Promise<DeepResearchResult>;

export type RunDeepResearchAgentOptions = {
  query?: string;
  runtimeConfig?: DeepResearchRuntimeConfig;
  executor?: DeepResearchExecutor;
};

export function buildDeepResearchRuntimeConfig(
  env: NodeJS.ProcessEnv = process.env,
): DeepResearchRuntimeConfig {
  const apiKey: string | undefined = env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is missing.");
  }

  const config: DeepResearchRuntimeConfig = {
    apiKey,
    model: env.OPENAI_RESEARCH_MODEL?.trim() || DEFAULT_MODEL,
  };
  return config;
}

export function formatDeepResearchReport(
  result: DeepResearchResult,
): string {
  const citationsText: string =
    result.citations.length === 0
      ? "- None"
      : result.citations
          .map(
            (citation: DeepResearchCitation): string =>
              `- "${citation.text}" | ${citation.title} | ${citation.url} | chars ${citation.startIndex}-${citation.endIndex}`,
          )
          .join("\n");

  const stepsText: string =
    result.steps.length === 0
      ? "- None"
      : result.steps
          .map(
            (step: DeepResearchStep): string =>
              `- [${step.type}] ${step.summary}`,
          )
          .join("\n");

  const formatted: string = [
    `Query: ${result.query}`,
    `Model: ${result.model}`,
    "",
    "### Report",
    result.report,
    "",
    "### Citations",
    citationsText,
    "",
    "### Intermediate Steps",
    stepsText,
  ].join("\n");

  return formatted;
}

export async function runDeepResearchAgent(
  options: RunDeepResearchAgentOptions = {},
): Promise<DeepResearchResult> {
  const config: DeepResearchRuntimeConfig =
    options.runtimeConfig ?? buildDeepResearchRuntimeConfig(process.env);
  const query: string = options.query?.trim() || DEFAULT_QUERY;

  if (options.executor) {
    const injectedResult: DeepResearchResult = await options.executor(
      query,
      config,
    );
    const normalizedInjectedResult: DeepResearchResult = {
      ...injectedResult,
      citations: injectedResult.citations ?? [],
      steps: injectedResult.steps ?? [],
    };

    if (normalizedInjectedResult.report.trim().length === 0) {
      throw new Error(
        "OpenAI deep research agent completed without a text report.",
      );
    }

    return normalizedInjectedResult;
  }

  const provider: OpenAIProvider = new OpenAIProvider({
    apiKey: config.apiKey,
  });

  const runner: Runner = new Runner({
    modelProvider: provider,
    tracingDisabled: true,
  });

  const researchAgent: Agent = new Agent({
    name: "ResearchAgent",
    model: config.model,
    instructions: [
      "You are a professional researcher preparing a structured, data-driven report.",
      "Use web search to gather reliable sources before answering.",
      "Focus on data-rich insights and practical implications.",
      "Include inline citations in the report whenever possible.",
      "Return a well-structured final report.",
    ].join("\n"),
    tools: [
      webSearchTool({
        searchContextSize: "high",
      }),
    ],
    modelSettings: {
      reasoning: {
        summary: "auto",
      },
      text: {
        verbosity: "medium",
      },
    },
  });

  const runResult: { finalOutput: unknown; newItems: Array<unknown> } =
    (await runner.run(researchAgent, query, {
      maxTurns: 8,
    })) as { finalOutput: unknown; newItems: Array<unknown> };

  const report: string =
    typeof runResult.finalOutput === "string"
      ? runResult.finalOutput.trim()
      : JSON.stringify(runResult.finalOutput, null, 2).trim();

  if (report.length === 0) {
    throw new Error("OpenAI deep research agent completed without a text report.");
  }

  const citations: Array<DeepResearchCitation> = [];
  const steps: Array<DeepResearchStep> = [];

  for (const item of runResult.newItems) {
    const rawItem: {
      type?: string;
      name?: string;
      status?: string;
      arguments?: string;
      providerData?: Record<string, unknown>;
      content?: Array<{
        type?: string;
        text?: string;
        annotations?: Array<{
          type?: string;
          title?: string;
          url?: string;
          start_index?: number;
          end_index?: number;
        }>;
      }>;
    } | undefined =
      typeof item === "object" && item !== null && "rawItem" in item
        ? (Reflect.get(item, "rawItem") as {
            type?: string;
            name?: string;
            status?: string;
            arguments?: string;
            providerData?: Record<string, unknown>;
            content?: Array<{
              type?: string;
              text?: string;
              annotations?: Array<{
                type?: string;
                title?: string;
                url?: string;
                start_index?: number;
                end_index?: number;
              }>;
            }>;
          })
        : undefined;

    if (!rawItem) {
      continue;
    }

    if (rawItem.type === "reasoning") {
      const reasoningText: string =
        Array.isArray(rawItem.content) && rawItem.content.length > 0
          ? rawItem.content
              .map((contentItem: { text?: string }): string => contentItem.text || "")
              .join(" ")
              .trim()
          : "Reasoning step recorded.";

      steps.push({
        type: "reasoning",
        summary: reasoningText || "Reasoning step recorded.",
      });
      continue;
    }

    if (
      rawItem.type === "hosted_tool_call" &&
      (rawItem.providerData?.type === "web_search_call" ||
        rawItem.providerData?.type === "web_search")
    ) {
      const action: { query?: string } | undefined =
        typeof rawItem.providerData.action === "object" &&
        rawItem.providerData.action !== null
          ? (rawItem.providerData.action as { query?: string })
          : undefined;
      const querySummary: string =
        action?.query?.trim() ||
        rawItem.arguments?.trim() ||
        "Executed web search.";

      steps.push({
        type: "web_search_call",
        summary: `${querySummary} (${rawItem.status ?? "unknown"})`,
      });
      continue;
    }

    if (
      rawItem.type === "hosted_tool_call" &&
      (rawItem.providerData?.type === "code_interpreter_call" ||
        rawItem.providerData?.type === "code_interpreter")
    ) {
      const codeText: string =
        typeof rawItem.providerData.code === "string" &&
        rawItem.providerData.code.trim().length > 0
          ? rawItem.providerData.code.trim()
          : "Executed code interpreter.";

      steps.push({
        type: "code_interpreter_call",
        summary: `${codeText} (${rawItem.status ?? "unknown"})`,
      });
      continue;
    }

    if (!Array.isArray(rawItem.content)) {
      continue;
    }

    for (const contentItem of rawItem.content) {
      if (
        contentItem.type !== "output_text" ||
        !Array.isArray(contentItem.annotations)
      ) {
        continue;
      }

      for (const annotation of contentItem.annotations) {
        if (
          annotation.type !== "url_citation" ||
          typeof annotation.url !== "string" ||
          typeof annotation.title !== "string" ||
          typeof annotation.start_index !== "number" ||
          typeof annotation.end_index !== "number"
        ) {
          continue;
        }

        citations.push({
          text: report.slice(annotation.start_index, annotation.end_index),
          title: annotation.title,
          url: annotation.url,
          startIndex: annotation.start_index,
          endIndex: annotation.end_index,
        });
      }
    }
  }

  const result: DeepResearchResult = {
    query,
    report,
    citations,
    steps,
    model: config.model,
  };

  return result;
}

const isNodeTestContext: boolean = process.env.NODE_TEST_CONTEXT !== undefined;
const cliPath: string | undefined = process.argv[1];
if (!isNodeTestContext && cliPath) {
  const cliUrl: string = pathToFileURL(resolve(process.cwd(), cliPath)).href;
  if (cliUrl === import.meta.url) {
    void runDeepResearchAgent()
      .then((result: DeepResearchResult): void => {
        console.log("## Running the research agent ##");
        console.log("");
        console.log("---");
        console.log("## Research Result ##");
        console.log("---");
        console.log(formatDeepResearchReport(result));
      })
      .catch((error: unknown): void => {
        const message: string = error instanceof Error ? error.message : String(error);
        console.error(message);
        process.exitCode = 1;
      });
  }
}
