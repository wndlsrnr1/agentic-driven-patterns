import axiosInstance from '@/api/axiosInstance';

export type PromptChainRequest = {
  sourceText: string;
};

export type PromptChainResponse = {
  extractedSpecsText: string;
  structuredSpecs: {
    cpu: string;
    memory: string;
    storage: string;
  };
  transformedSpecsText: string;
  modelName: string;
};

const llm = {
  runPromptChain: () => ({
    mutationFn: async (request: PromptChainRequest): Promise<PromptChainResponse> => {
      const { data } = await axiosInstance.post<PromptChainResponse>('/v1/prompts-chain/run', request);
      return data;
    },
  }),
};

export default llm;
