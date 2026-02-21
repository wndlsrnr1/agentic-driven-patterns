export type PromptsChainRepositoryInput = {
  sourceText: string;
};

export type PromptsChainRepositoryResult = {
  extractedSpecsText: string;
  transformedSpecsText: string;
  modelName: string;
};

export interface PromptsChainRepository {
  runChain(input: PromptsChainRepositoryInput): Promise<PromptsChainRepositoryResult>;
}

export const PROMPTS_CHAIN_REPOSITORY = Symbol('PROMPTS_CHAIN_REPOSITORY');
