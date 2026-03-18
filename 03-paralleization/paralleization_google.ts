/**
 * Run:
 * node --env-file=.env.modules --experimental-strip-types ./03-paralleization/paralleization_google.ts
 */
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
import { createUserContent, type Content } from "@google/genai";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

export type GoogleConfig = {
  apiKey: string;
  modelName: string;
  appName: string;
  userId: string;
  topic: string;
};

export type GoogleWorkflowResult = {
  report: string;
  modelName: string;
  topic: string;
};

export type GoogleWorkflowExecutor = (payload: {
  config: GoogleConfig;
  workflow: SequentialAgent;
  userMessage: Content;
}) => Promise<string>;

export function resolveGoogleConfig(
  env: NodeJS.ProcessEnv = process.env,
): GoogleConfig {
  const apiKey: string | undefined =
    env.GEMINI_API_KEY?.trim() ||
    env.GOOGLE_API_KEY?.trim() ||
    env.API_KEY?.trim();

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY or GOOGLE_API_KEY or API_KEY is missing.");
  }

  const config: GoogleConfig = {
    apiKey,
    modelName: env.GEMINI_MODEL?.trim() || "gemini-2.0-flash",
    appName: "paralleization-google-workflow",
    userId: "paralleization-google-user",
    topic: "sustainable technology advancements",
  };
  return config;
}

export async function runGoogleWorkflow(
  config: GoogleConfig = resolveGoogleConfig(process.env),
  executor?: GoogleWorkflowExecutor,
): Promise<GoogleWorkflowResult> {
  const model: Gemini = new Gemini({
    model: config.modelName,
    apiKey: config.apiKey,
  });

  const renewableAgent: LlmAgent = new LlmAgent({
    name: "RenewableEnergyResearcher",
    model,
    instruction: [
      "You are an AI Research Assistant specializing in energy.",
      "Research the latest advancements in 'renewable energy sources'.",
      "Use the Google Search tool provided.",
      "Summarize your key findings concisely (1-2 sentences).",
      "Output *only* the summary.",
    ].join("\n"),
    tools: [GOOGLE_SEARCH],
    outputKey: "renewable_energy_result",
  });

  const evAgent: LlmAgent = new LlmAgent({
    name: "EVResearcher",
    model,
    instruction: [
      "You are an AI Research Assistant specializing in transportation.",
      "Research the latest advancements in 'electric vehicle technology'.",
      "Use the Google Search tool provided.",
      "Summarize your key findings concisely (1-2 sentences).",
      "Output *only* the summary.",
    ].join("\n"),
    tools: [GOOGLE_SEARCH],
    outputKey: "ev_technology_result",
  });

  const carbonCaptureAgent: LlmAgent = new LlmAgent({
    name: "CarbonCaptureResearcher",
    model,
    instruction: [
      "You are an AI Research Assistant specializing in climate solutions.",
      "Research the latest advancements in 'carbon capture methods'.",
      "Use the Google Search tool provided.",
      "Summarize your key findings concisely (1-2 sentences).",
      "Output *only* the summary.",
    ].join("\n"),
    tools: [GOOGLE_SEARCH],
    outputKey: "carbon_capture_result",
  });

  const parallelAgent: ParallelAgent = new ParallelAgent({
    name: "ParallelWebResearchAgent",
    subAgents: [renewableAgent, evAgent, carbonCaptureAgent],
    description: "Runs research agents in parallel.",
  });

  const mergerAgent: LlmAgent = new LlmAgent({
    name: "SynthesisAgent",
    model,
    instruction: [
      "You are an AI Assistant responsible for combining research findings into a structured report.",
      "Your primary task is to synthesize the following research summaries, clearly attributing findings to their source areas.",
      "Structure your response using headings for each topic.",
      "Ensure the report is coherent and integrates the key points smoothly.",
      "",
      "Crucially: Your entire response MUST be grounded exclusively on the information provided in the Input Summaries below.",
      "Do NOT add any external knowledge, facts, or details not present in these specific summaries.",
      "",
      "Input Summaries:",
      "- Renewable Energy:",
      "{renewable_energy_result}",
      "- Electric Vehicles:",
      "{ev_technology_result}",
      "- Carbon Capture:",
      "{carbon_capture_result}",
      "",
      "Output Format:",
      "## Summary of Recent Sustainable Technology Advancements",
      "### Renewable Energy Findings",
      "(Based on RenewableEnergyResearcher's findings)",
      "[Synthesize and elaborate only on the renewable energy input summary provided above.]",
      "### Electric Vehicle Findings",
      "(Based on EVResearcher's findings)",
      "[Synthesize and elaborate only on the EV input summary provided above.]",
      "### Carbon Capture Findings",
      "(Based on CarbonCaptureResearcher's findings)",
      "[Synthesize and elaborate only on the carbon capture input summary provided above.]",
      "### Overall Conclusion",
      "[Provide a brief (1-2 sentence) concluding statement that connects only the findings presented above.]",
      "",
      "Output only the structured report following this format.",
      "Do not include introductory or concluding phrases outside this structure.",
    ].join("\n"),
  });

  const workflow: SequentialAgent = new SequentialAgent({
    name: "ResearchAndSynthesisPipeline",
    subAgents: [parallelAgent, mergerAgent],
  });

  const userMessage: Content = createUserContent(
    [
      "Create the final report now.",
      "Use only the gathered summaries from the three researcher agents.",
      "Follow the required markdown format exactly.",
    ].join("\n"),
  );

  let report: string = "";
  if (executor) {
    report = await executor({
      config,
      workflow,
      userMessage,
    });
  } else {
    const runner: InMemoryRunner = new InMemoryRunner({
      agent: workflow,
      appName: config.appName,
    });

    const session: { id: string } = await runner.sessionService.createSession({
      appName: config.appName,
      userId: config.userId,
    });

    const events: Array<Event> = [];
    for await (const event of runner.runAsync({
      userId: config.userId,
      sessionId: session.id,
      newMessage: userMessage,
    })) {
      events.push(event);
    }

    for (let index: number = events.length - 1; index >= 0; index -= 1) {
      const event: Event = events[index]!;
      if (!isFinalResponse(event)) {
        continue;
      }

      const text: string = stringifyContent(event).trim();
      if (text.length > 0) {
        report = text;
        break;
      }
    }

    if (report.length === 0) {
      for (let index: number = events.length - 1; index >= 0; index -= 1) {
        const event: Event = events[index]!;
        const text: string = stringifyContent(event).trim();
        if (text.length > 0) {
          report = text;
          break;
        }
      }
    }
  }

  if (report.length === 0) {
    throw new Error("Google workflow completed without a text response.");
  }

  const result: GoogleWorkflowResult = {
    report,
    modelName: config.modelName,
    topic: config.topic,
  };
  return result;
}

const isNodeTestContext: boolean = process.env.NODE_TEST_CONTEXT !== undefined;
const cliPath: string | undefined = process.argv[1];
if (!isNodeTestContext && cliPath) {
  const cliUrl: string = pathToFileURL(resolve(process.cwd(), cliPath)).href;
  if (cliUrl === import.meta.url) {
    void runGoogleWorkflow()
      .then((result: GoogleWorkflowResult): void => {
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
