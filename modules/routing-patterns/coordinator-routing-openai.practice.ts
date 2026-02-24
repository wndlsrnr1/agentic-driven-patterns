import {
  Agent,
  OpenAIProvider,
  Runner,
  setOpenAIAPI,
  setDefaultOpenAIKey,
  tool,
} from "@openai/agents";
import { z } from "zod";

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
