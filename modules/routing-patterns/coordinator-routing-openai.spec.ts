import {
  Agent,
  OpenAIProvider,
  Runner,
  setOpenAIAPI,
  setDefaultOpenAIKey,
  tool,
} from "@openai/agents";
import { z } from "zod";
const DEFAULT_SYNTHETIC_BASE_URL: string =
  "https://api.synthetic.new/openai/v1";
const DEFAULT_SYNTHETIC_MODEL: string = "hf:moonshotai/Kimi-K2.5";
const DEFAULT_SINGLE_REQUEST: string = "Book me a hotel in Paris.";

type CoordinatorDecision = "booker" | "info" | "unclear";
type CoordinatorAgentName = "booking_agent" | "info_agent" | "unclear_agent";

type RoutingPayload = {
  decision: CoordinatorDecision;
  agentName: CoordinatorAgentName;
  output: string;
};

type AgentsRunnerOutput = {
  finalOutput: unknown;
};

type AgentsRunner = (requestText: string) => Promise<AgentsRunnerOutput>;
type OpenAiApiMode = "reponses" | "chat_completions";
type Logger = (message: string) => void;

export type RuntimeConfig = {
  apiKey: string;
  baseUrl: string;
  modelName: string;
};

export type RoutingResult = {
  request: string;
  decision: CoordinatorDecision;
  output: string;
  agentName: CoordinatorAgentName;
  modelName: string;
};

export type RunRout3WorkflowOptions = {
  env?: NodeJS.ProcessEnv;
  agentsRunner?: AgentsRunner;
  log?: Logger;
};
