import { describe, expect, it, jest } from "@jest/globals";
import {
  type PromptsChainRepository,
  type PromptsChainRepositoryResult,
} from "../../../src/prompts-chain/repository/prompts-chain.repository.js";
import { StructuredOutputParserUtil } from "../../../src/prompts-chain/utils/structured-output-parser.util.js";
import { PromptsChainService } from "../../../src/prompts-chain/service/prompts-chain.service.js";

/**
 * `RunPromptsChainUseCase`의 오케스트레이션 계약을 검증한다.
 *
 * Context:
 * - 호출자: Jest 러너.
 * - 사용 목적: 포트 호출 결과가 API 응답 계약으로 정확히 매핑되는지 확인한다.
 * - 데이터 흐름: port mock output -> use-case -> structured response/예외.
 *
 * Side effects:
 * - 없음.
 */
describe("PromptsChainService", () => {
  it("Given model output When run Then returns contract-shaped response", async () => {
    const repository: PromptsChainRepository = {
      runChain: jest.fn(
        async () =>
          ({
            extractedSpecsText: "cpu=3.5GHz,memory=16GB,storage=1TB",
            transformedSpecsText:
              '{"cpu":"3.5GHz","memory":"16GB","storage":"1TB"}',
            modelName: "hf:moonshotai/Kimi-K2.5",
          }) as Promise<PromptsChainRepositoryResult>,
      ),
    };
    const service = new PromptsChainService(
      repository,
      new StructuredOutputParserUtil(),
    );

    const result = await service.run({
      sourceText: "Laptop: 3.5GHz CPU, 16GB RAM, 1TB SSD",
    });

    expect(result).toEqual({
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

  it("Given malformed transform output When run Then throws domain parse error", async () => {
    const repository: PromptsChainRepository = {
      runChain: jest.fn(async () => ({
        extractedSpecsText: "unstructured text without specs",
        transformedSpecsText: "not-json",
        modelName: "hf:moonshotai/Kimi-K2.5",
      })),
    };
    const service = new PromptsChainService(
      repository,
      new StructuredOutputParserUtil(),
    );

    await expect(service.run({ sourceText: "input" })).rejects.toThrow(
      "Failed to parse structured output.",
    );
  });

  it("Given non-json transform output with specs When run Then parses using fallback extraction", async () => {
    const repository: PromptsChainRepository = {
      runChain: jest.fn(async () => ({
        extractedSpecsText:
          "3.5 GHz octa-core processor, 16GB RAM, 1TB NVMe SSD",
        transformedSpecsText:
          "Here are specs: cpu: 3.5 GHz octa-core processor; memory: 16GB RAM; storage: 1TB NVMe SSD",
        modelName: "hf:moonshotai/Kimi-K2.5",
      })),
    };
    const service = new PromptsChainService(
      repository,
      new StructuredOutputParserUtil(),
    );

    const result = await service.run({
      sourceText: "Laptop: 3.5GHz CPU, 16GB RAM, 1TB SSD",
    });

    expect(result.structuredSpecs).toEqual({
      cpu: "3.5 GHz octa-core processor",
      memory: "16GB RAM",
      storage: "1TB NVMe SSD",
    });
  });
});
