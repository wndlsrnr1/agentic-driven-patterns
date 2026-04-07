import assert from "node:assert/strict";
import { test } from "node:test";

import {
  buildDeepResearchRuntimeConfig,
  formatDeepResearchReport,
  runDeepResearchAgent,
  type DeepResearchExecutor,
  type DeepResearchResult,
  type DeepResearchRuntimeConfig,
  type DeepResearchStep,
} from "./deep-research-agents-sdk.ts";

test("buildDeepResearchRuntimeConfig throws when OPENAI_API_KEY is missing", (): void => {
  assert.throws(
    (): DeepResearchRuntimeConfig => buildDeepResearchRuntimeConfig({}),
    /OPENAI_API_KEY is missing\./,
  );
});

test("buildDeepResearchRuntimeConfig uses default model", (): void => {
  const config: DeepResearchRuntimeConfig = buildDeepResearchRuntimeConfig({
    OPENAI_API_KEY: "test-key",
  });

  assert.equal(config.apiKey, "test-key");
  assert.equal(config.model, "gpt-4.1-mini");
});

test("runDeepResearchAgent returns injected executor result shape", async (): Promise<void> => {
  const executor: DeepResearchExecutor = async (
    query: string,
    config: DeepResearchRuntimeConfig,
  ): Promise<DeepResearchResult> => {
    assert.equal(query, "Research the economic impact of semaglutide on global healthcare systems.");
    assert.equal(config.model, "gpt-4.1-mini");

    return {
      query,
      report: "Structured report with inline citations.",
      citations: [
        {
          text: "economic impact of semaglutide",
          title: "Example Source",
          url: "https://example.com",
          startIndex: 0,
          endIndex: 31,
        },
      ],
      steps: [
        {
          type: "reasoning",
          summary: "Planned search strategy.",
        },
      ],
      model: config.model,
    };
  };

  const result: DeepResearchResult = await runDeepResearchAgent({
    runtimeConfig: {
      apiKey: "test-key",
      model: "gpt-4.1-mini",
    },
    executor,
  });

  assert.equal(result.citations.length, 1);
  assert.equal(result.steps.length, 1);
  assert.equal(result.model, "gpt-4.1-mini");
});

test("runDeepResearchAgent normalizes missing citations and steps to empty arrays", async (): Promise<void> => {
  const result: DeepResearchResult = await runDeepResearchAgent({
    runtimeConfig: {
      apiKey: "test-key",
      model: "gpt-4.1-mini",
    },
    executor: async (
      query: string,
      config: DeepResearchRuntimeConfig,
    ): Promise<DeepResearchResult> => {
      return {
        query,
        report: "Research report",
        citations: undefined as unknown as DeepResearchResult["citations"],
        steps: undefined as unknown as Array<DeepResearchStep>,
        model: config.model,
      };
    },
  });

  assert.deepEqual(result.citations, []);
  assert.deepEqual(result.steps, []);
});

test("runDeepResearchAgent throws when report is empty", async (): Promise<void> => {
  await assert.rejects(
    async (): Promise<DeepResearchResult> =>
      runDeepResearchAgent({
        runtimeConfig: {
          apiKey: "test-key",
          model: "gpt-4.1-mini",
        },
        executor: async (
          query: string,
          config: DeepResearchRuntimeConfig,
        ): Promise<DeepResearchResult> => {
          return {
            query,
            report: "   ",
            citations: [],
            steps: [],
            model: config.model,
          };
        },
      }),
    /OpenAI deep research agent completed without a text report\./,
  );
});

test("formatDeepResearchReport includes report citations and intermediate steps sections", (): void => {
  const result: DeepResearchResult = {
    query: "Research the economic impact of semaglutide on global healthcare systems.",
    report: "Structured report with inline citations.",
    citations: [
      {
        text: "economic impact",
        title: "Example Source",
        url: "https://example.com",
        startIndex: 0,
        endIndex: 15,
      },
    ],
    steps: [
      {
        type: "web_search_call",
        summary: "Executed search query about semaglutide healthcare impact.",
      },
    ],
    model: "gpt-4.1-mini",
  };

  const formattedReport: string = formatDeepResearchReport(result);

  assert.match(formattedReport, /^### Report$/m);
  assert.match(formattedReport, /^### Citations$/m);
  assert.match(formattedReport, /^### Intermediate Steps$/m);
  assert.match(formattedReport, /Example Source/);
});
