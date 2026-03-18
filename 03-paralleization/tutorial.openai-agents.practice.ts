import {
  Agent,
  OpenAIProvider,
  Runner,
  setDefaultOpenAIKey,
  setOpenAIAPI,
} from "@openai/agents";

/**
 * OpenAi Agents SDK 결과에서 핵심 출력(finalOutput)을 안전하게 추출합니다.
 */

export async function run(): Promise<{ biology: unknown; chemistry: unknown }> {
  const provider: OpenAIProvider = new OpenAIProvider({
    apiKey: process.env.API_KEY || "",
    baseURL: process.env.BASE_URL || "",
    useResponses: false,
  });

  //   setDefaultOpenAIKey(process.env.API_KEY || "");
  //   setOpenAIAPI("chat_completions");

  const runner: Runner = new Runner({
    modelProvider: provider,
    tracingDisabled: true,
  });

  const biologyAgent: Agent = new Agent({
    name: "BiologyExpert",
    model: process.env.MODEL || "",
    instructions:
      "You are a biology expert. Summarize CRISPR technology in one sentence.",
  });

  const chemistryAgent: Agent = new Agent({
    name: "ChemistryExpert",
    model: process.env.MODEL || "",
    instructions:
      "You are a chemistry expert. Summarize solid-state batteries in one sentence.",
  });

  const [biologyResult, chemistryResult] = await Promise.all([
    runner.run(biologyAgent, "Provide your summary.", { maxTurns: 3 }),
    runner.run(chemistryAgent, "Provide your summary.", { maxTurns: 3 }),
  ]);
  const biologySummary: unknown = biologyResult.finalOutput;
  const chemistrySummary: unknown = chemistryResult.finalOutput;

  console.log(biologySummary);
  console.log(chemistrySummary);

  return {
    biology: biologySummary,
    chemistry: chemistrySummary,
  };
}

const result = await run();
console.log(result);
