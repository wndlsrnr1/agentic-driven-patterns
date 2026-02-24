/**
 * Run:
 * cd modules && node --env-file=.env --experimental-strip-types ./paralleization/paralleization_google.ts
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

const DEFAULT_MODEL_NAME: string = "gemini-2.0-flash";
const DEFAULT_APP_NAME: string = "paralleization-google-workflow";
const DEFAULT_USER_ID: string = "paralleization-google-user";
const DEFAULT_WORKFLOW_PROMPT: string = [
  "Create the final report now.",
  "Use only the gathered summaries from the three researcher agents.",
  "Follow the required markdown format exactly.",
].join("\n");

const MERGER_AGENT_NAME: string = "SynthesisAgent";
const PARALLEL_AGENT_NAME: string = "ParallelWebResearchAgent";
const ROOT_AGENT_NAME: string = "ResearchAndSynthesisPipeline";

const DEFAULT_RESEARCH_AGENT_SPECS: Array<ResearchAgentSpec> = [
  {
    name: "RenewableEnergyResearcher",
    topic: "renewable energy sources",
    specialization: "energy",
    description: "Researches renewable energy sources.",
    outputKey: "renewable_energy_result",
  },
  {
    name: "EVResearcher",
    topic: "electric vehicle technology",
    specialization: "transportation",
    description: "Researches electric vehicle technology.",
    outputKey: "ev_technology_result",
  },
  {
    name: "CarbonCaptureResearcher",
    topic: "carbon capture methods",
    specialization: "climate solutions",
    description: "Researches carbon capture methods.",
    outputKey: "carbon_capture_result",
  },
];

export type RuntimeConfig = {
  apiKey: string;
  modelName: string;
};

export type ResearchAgentSpec = {
  name: string;
  topic: string;
  specialization: string;
  description: string;
  outputKey: string;
};

export type ParallelResearchWorkflowResult = {
  mergedReport: string;
  modelName: string;
  researchAgentSpecs: Array<ResearchAgentSpec>;
};

export type RunParalleizationGoogleWorkflowPayload = {
  runtimeConfig: RuntimeConfig;
  rootAgent: SequentialAgent;
  researchAgentSpecs: Array<ResearchAgentSpec>;
  appName: string;
  userId: string;
  userPrompt: string;
};

type WorkflowRunner = (
  payload: RunParalleizationGoogleWorkflowPayload,
) => Promise<ParallelResearchWorkflowResult>;

export type RunParalleizationGoogleWorkflowOptions = {
  runtimeConfig?: RuntimeConfig;
  env?: NodeJS.ProcessEnv;
  appName?: string;
  userId?: string;
  userPrompt?: string;
  workflowRunner?: WorkflowRunner;
};

function cloneResearchAgentSpecs(
  specs: Array<ResearchAgentSpec>,
): Array<ResearchAgentSpec> {
  const clonedSpecs: Array<ResearchAgentSpec> = specs.map(
    (spec: ResearchAgentSpec): ResearchAgentSpec => {
      return {
        name: spec.name,
        topic: spec.topic,
        specialization: spec.specialization,
        description: spec.description,
        outputKey: spec.outputKey,
      };
    },
  );
  return clonedSpecs;
}

function requireGeminiApiKey(env: NodeJS.ProcessEnv): string {
  const geminiApiKey: string | undefined = env.GEMINI_API_KEY?.trim();
  if (geminiApiKey) {
    return geminiApiKey;
  }

  const googleApiKey: string | undefined = env.GOOGLE_API_KEY?.trim();
  if (googleApiKey) {
    return googleApiKey;
  }

  const syntheticApiKey: string | undefined = env.SYNTHETIC_API_KEY?.trim();
  if (syntheticApiKey) {
    return syntheticApiKey;
  }

  throw new Error(
    "GEMINI_API_KEY or GOOGLE_API_KEY or SYNTHETIC_API_KEY is missing.",
  );
}

export function buildRuntimeConfigFromEnv(
  env: NodeJS.ProcessEnv,
): RuntimeConfig {
  const runtimeConfig: RuntimeConfig = {
    apiKey: requireGeminiApiKey(env),
    modelName: env.GEMINI_MODEL?.trim() ?? DEFAULT_MODEL_NAME,
  };
  return runtimeConfig;
}

function createResearcherInstruction(spec: ResearchAgentSpec): string {
  const instruction: string = [
    `You are an AI Research Assistant specializing in ${spec.specialization}.`,
    `Research the latest advancements in '${spec.topic}'.`,
    "Use the Google Search tool provided.",
    "Summarize your key findings concisely (1-2 sentences).",
    "Output *only* the summary.",
  ].join("\n");

  return instruction;
}

function createResearcherAgent(
  model: Gemini,
  spec: ResearchAgentSpec,
): LlmAgent {
  const researcherAgent: LlmAgent = new LlmAgent({
    name: spec.name,
    model,
    instruction: createResearcherInstruction(spec),
    description: spec.description,
    tools: [GOOGLE_SEARCH],
    outputKey: spec.outputKey,
  });

  return researcherAgent;
}

function createMergerInstruction(specs: Array<ResearchAgentSpec>): string {
  const renewableOutputKey: string = specs[0].outputKey;
  const evOutputKey: string = specs[1].outputKey;
  const carbonCaptureOutputKey: string = specs[2].outputKey;

  const mergerInstruction: string = [
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
    `{${renewableOutputKey}}`,
    "- Electric Vehicles:",
    `{${evOutputKey}}`,
    "- Carbon Capture:",
    `{${carbonCaptureOutputKey}}`,
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
  ].join("\n");

  return mergerInstruction;
}

function buildResearchAndSynthesisAgentFromRuntimeConfig(
  runtimeConfig: RuntimeConfig,
  researchAgentSpecs: Array<ResearchAgentSpec>,
): SequentialAgent {
  const model: Gemini = new Gemini({
    model: runtimeConfig.modelName,
    apiKey: runtimeConfig.apiKey,
  });

  const researcherAgents: Array<LlmAgent> = researchAgentSpecs.map(
    (spec: ResearchAgentSpec): LlmAgent => {
      return createResearcherAgent(model, spec);
    },
  );

  const parallelResearchAgent: ParallelAgent = new ParallelAgent({
    name: PARALLEL_AGENT_NAME,
    subAgents: researcherAgents,
    description:
      "Runs multiple research agents in parallel to gather information.",
  });

  const mergerAgent: LlmAgent = new LlmAgent({
    name: MERGER_AGENT_NAME,
    model,
    instruction: createMergerInstruction(researchAgentSpecs),
    description:
      "Combines research findings from parallel agents into a structured report that is grounded only on the provided input summaries.",
  });

  const sequentialPipelineAgent: SequentialAgent = new SequentialAgent({
    name: ROOT_AGENT_NAME,
    subAgents: [parallelResearchAgent, mergerAgent],
    description: "Coordinates parallel research and synthesizes the results.",
  });

  return sequentialPipelineAgent;
}

export function buildResearchAndSynthesisAgent(): SequentialAgent {
  const runtimeConfig: RuntimeConfig = buildRuntimeConfigFromEnv(process.env);
  const researchAgentSpecs: Array<ResearchAgentSpec> = cloneResearchAgentSpecs(
    DEFAULT_RESEARCH_AGENT_SPECS,
  );

  return buildResearchAndSynthesisAgentFromRuntimeConfig(
    runtimeConfig,
    researchAgentSpecs,
  );
}

function buildDefaultUserMessage(prompt: string): Content {
  const userMessage: Content = createUserContent(prompt);
  return userMessage;
}

function extractFinalReportFromEvents(events: Array<Event>): string {
  for (let index: number = events.length - 1; index >= 0; index -= 1) {
    const event: Event = events[index];
    const finalResponseEvent: boolean = isFinalResponse(event);
    if (!finalResponseEvent) {
      continue;
    }

    const eventText: string = stringifyContent(event).trim();
    if (eventText.length > 0) {
      return eventText;
    }
  }

  for (let index: number = events.length - 1; index >= 0; index -= 1) {
    const event: Event = events[index];
    const eventText: string = stringifyContent(event).trim();
    if (eventText.length > 0) {
      return eventText;
    }
  }

  return [
    "## Summary of Recent Sustainable Technology Advancements",
    "### Renewable Energy Findings",
    "No renewable energy summary was produced.",
    "### Electric Vehicle Findings",
    "No electric vehicle summary was produced.",
    "### Carbon Capture Findings",
    "No carbon capture summary was produced.",
    "### Overall Conclusion",
    "The workflow completed without a text response from the model.",
  ].join("\n");
}

async function runWorkflowWithInMemoryRunner(
  payload: RunParalleizationGoogleWorkflowPayload,
): Promise<ParallelResearchWorkflowResult> {
  const runner: InMemoryRunner = new InMemoryRunner({
    agent: payload.rootAgent,
    appName: payload.appName,
  });

  const session: {
    id: string;
  } = await runner.sessionService.createSession({
    appName: payload.appName,
    userId: payload.userId,
  });

  const userMessage: Content = buildDefaultUserMessage(payload.userPrompt);
  const events: Array<Event> = [];

  for await (const event of runner.runAsync({
    userId: payload.userId,
    sessionId: session.id,
    newMessage: userMessage,
  })) {
    events.push(event);
  }

  const mergedReport: string = extractFinalReportFromEvents(events);

  const workflowResult: ParallelResearchWorkflowResult = {
    mergedReport,
    modelName: payload.runtimeConfig.modelName,
    researchAgentSpecs: payload.researchAgentSpecs,
  };
  return workflowResult;
}

export async function runParalleizationGoogleWorkflow(
  options: RunParalleizationGoogleWorkflowOptions = {},
): Promise<ParallelResearchWorkflowResult> {
  const runtimeConfig: RuntimeConfig =
    options.runtimeConfig ??
    buildRuntimeConfigFromEnv(options.env ?? process.env);

  const researchAgentSpecs: Array<ResearchAgentSpec> = cloneResearchAgentSpecs(
    DEFAULT_RESEARCH_AGENT_SPECS,
  );

  const rootAgent: SequentialAgent =
    buildResearchAndSynthesisAgentFromRuntimeConfig(
      runtimeConfig,
      researchAgentSpecs,
    );

  const payload: RunParalleizationGoogleWorkflowPayload = {
    runtimeConfig,
    rootAgent,
    researchAgentSpecs,
    appName: options.appName ?? DEFAULT_APP_NAME,
    userId: options.userId ?? DEFAULT_USER_ID,
    userPrompt: options.userPrompt ?? DEFAULT_WORKFLOW_PROMPT,
  };

  const workflowRunner: WorkflowRunner =
    options.workflowRunner ?? runWorkflowWithInMemoryRunner;

  const result: ParallelResearchWorkflowResult = await workflowRunner(payload);
  return result;
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

async function runParalleizationGoogleWorkflowFromCli(): Promise<void> {
  const result: ParallelResearchWorkflowResult =
    await runParalleizationGoogleWorkflow({
      env: process.env,
    });

  console.log(JSON.stringify(result, null, 2));
}

if (isDirectExecution(import.meta.url, process.argv)) {
  void runParalleizationGoogleWorkflowFromCli().catch(
    (error: unknown): void => {
      const errorMessage: string =
        error instanceof Error ? error.message : String(error);
      console.error(errorMessage);
      process.exitCode = 1;
    },
  );
}
