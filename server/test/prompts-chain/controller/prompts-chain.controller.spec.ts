import { describe, expect, it, jest } from "@jest/globals";
import { PromptsChainController } from "../../../src/prompts-chain/controller/prompts-chain.controller.js";
import { PromptsChainService } from "../../../src/prompts-chain/service/prompts-chain.service.js";

/**
 * 컨트롤러가 유스케이스에 위임만 수행하는지 검증한다.
 *
 * Context:
 * - 호출자: Jest 러너.
 * - 사용 목적: presentation 계층의 책임(입력 전달/응답 반환)만 유지되는지 보장한다.
 * - 데이터 흐름: request DTO -> controller -> use-case mock -> response.
 *
 * Side effects:
 * - 없음.
 */
describe("PromptsChainController", () => {
  it("Given valid request When runChain Then delegates to use case and returns response", async () => {
    const service = {
      run: jest.fn(async () => ({
        extractedSpecsText: "cpu=3.5GHz,memory=16GB,storage=1TB",
        structuredSpecs: {
          cpu: "3.5GHz",
          memory: "16GB",
          storage: "1TB",
        },
        transformedSpecsText:
          '{"cpu":"3.5GHz","memory":"16GB","storage":"1TB"}',
        modelName: "hf:moonshotai/Kimi-K2.5",
      })),
    } as unknown as PromptsChainService;

    const controller = new PromptsChainController(service);
    const response = await controller.runChain({
      sourceText: "Laptop: 3.5GHz CPU, 16GB RAM, 1TB SSD",
    });

    expect(service.run).toHaveBeenCalledWith({
      sourceText: "Laptop: 3.5GHz CPU, 16GB RAM, 1TB SSD",
    });
    expect(response).toEqual({
      extractedSpecsText: "cpu=3.5GHz,memory=16GB,storage=1TB",
      structuredSpecs: {
        cpu: "3.5GHz",
        memory: "16GB",
        storage: "1TB",
      },
      transformedSpecsText: '{"cpu":"3.5GHz","memory":"16GB","storage":"1TB"}',
      modelName: "hf:moonshotai/Kimi-K2.5",
    });
  });
});
