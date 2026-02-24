import { describe, expect, it, jest } from "@jest/globals";
import {
  LangchainPromptsChainClient,
  type LangchainPromptsChainRuntime,
} from "../../../src/prompts-chain/client/langchain-prompts-chain.client.js";
import type { PromptsChainRuntimeConfigDto } from "../../../src/prompts-chain/config/dto/prompts-chain-runtime-config.dto.js";

/**
 * LangChain 어댑터의 체인 조립/호출 순서를 검증한다.
 *
 * Context:
 * - 호출자: Jest 러너.
 * - 사용 목적: 실제 네트워크 없이 runtime mock으로 어댑터 계약을 테스트한다.
 * - 데이터 흐름: settings mock + runtime mock -> adapter.runChain -> 결과 assertion.
 *
 * Side effects:
 * - 없음(모든 외부 호출은 mock).
 */
describe("LangchainPromptsChainClient", () => {
  it("Given settings When runChain Then executes extraction and transform chains in order", async () => {
    const extractionInvoke = jest.fn(
      async (_input: { text_input: string }) =>
        "cpu=3.5GHz,memory=16GB,storage=1TB",
    );
    const transformInvoke = jest.fn(
      async (_input: { specifications: string }) =>
        '{"cpu":"3.5GHz","memory":"16GB","storage":"1TB"}',
    );

    const runtime: LangchainPromptsChainRuntime = {
      createModel: jest.fn(() => ({}) as never),
      createExtractionChain: jest.fn(() => ({ invoke: extractionInvoke })),
      createTransformChain: jest.fn(() => ({ invoke: transformInvoke })),
    };

    const client = new LangchainPromptsChainClient(runtime);
    const runtimeConfig: PromptsChainRuntimeConfigDto = {
      apiKey: "api-key",
      baseUrl: "https://api.synthetic.new/openai/v1",
      modelName: "hf:moonshotai/Kimi-K2.5",
    };

    const result = await client.runChain(
      "Laptop: 3.5GHz CPU, 16GB RAM, 1TB SSD",
      runtimeConfig,
    );

    expect(result).toEqual({
      extractedSpecsText: "cpu=3.5GHz,memory=16GB,storage=1TB",
      transformedSpecsText: '{"cpu":"3.5GHz","memory":"16GB","storage":"1TB"}',
      modelName: "hf:moonshotai/Kimi-K2.5",
    });
    expect(runtime.createModel).toHaveBeenCalledWith(runtimeConfig);
    expect(extractionInvoke).toHaveBeenCalledWith({
      text_input: "Laptop: 3.5GHz CPU, 16GB RAM, 1TB SSD",
    });
    expect(transformInvoke).toHaveBeenCalledWith({
      specifications: "cpu=3.5GHz,memory=16GB,storage=1TB",
    });
  });
});
