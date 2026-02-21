import { Inject, Injectable, Optional } from '@nestjs/common';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { ChatOpenAI } from '@langchain/openai';
import type { PromptsChainRuntimeConfigDto } from '../config/dto/prompts-chain-runtime-config.dto.js';
import { PROMPTS_CHAIN_RUNTIME } from '../config/prompts-chain.tokens.js';

type ExtractionInput = {
  text_input: string;
};

type TransformInput = {
  specifications: string;
};

type StringRunnable<TInput> = {
  invoke(input: TInput): Promise<string>;
};

export type PromptsChainClientResult = {
  extractedSpecsText: string;
  transformedSpecsText: string;
  modelName: string;
};

export type LangchainPromptsChainRuntime = {
  createModel(config: PromptsChainRuntimeConfigDto): ChatOpenAI;
  createExtractionChain(model: ChatOpenAI): StringRunnable<ExtractionInput>;
  createTransformChain(model: ChatOpenAI): StringRunnable<TransformInput>;
};

export const defaultLangchainPromptsChainRuntime: LangchainPromptsChainRuntime = {
  createModel(config: PromptsChainRuntimeConfigDto): ChatOpenAI {
    return new ChatOpenAI({
      apiKey: config.apiKey,
      model: config.modelName,
      temperature: 0,
      configuration: {
        baseURL: config.baseUrl,
      },
    });
  },
  createExtractionChain(model: ChatOpenAI): StringRunnable<ExtractionInput> {
    const extractPrompt = ChatPromptTemplate.fromTemplate(
      'Extract the technical specifications from the following text:\n\n{text_input}',
    );
    return extractPrompt.pipe(model).pipe(new StringOutputParser()) as StringRunnable<ExtractionInput>;
  },
  createTransformChain(model: ChatOpenAI): StringRunnable<TransformInput> {
    const transformPrompt = ChatPromptTemplate.fromTemplate(
      "Transform the following specifications into a JSON object with 'cpu', 'memory', and 'storage' as keys:\n\n{specifications}",
    );
    return transformPrompt.pipe(model).pipe(new StringOutputParser()) as StringRunnable<TransformInput>;
  },
};

@Injectable()
export class LangchainPromptsChainClient {
  constructor(
    @Optional()
    @Inject(PROMPTS_CHAIN_RUNTIME)
    private readonly runtime: LangchainPromptsChainRuntime = defaultLangchainPromptsChainRuntime,
  ) {}

  async runChain(
    sourceText: string,
    runtimeConfig: PromptsChainRuntimeConfigDto,
  ): Promise<PromptsChainClientResult> {
    const model = this.runtime.createModel(runtimeConfig);
    const extractionChain = this.runtime.createExtractionChain(model);
    const transformChain = this.runtime.createTransformChain(model);

    const extractedSpecsText = await extractionChain.invoke({
      text_input: sourceText,
    });
    const transformedSpecsText = await transformChain.invoke({
      specifications: extractedSpecsText,
    });

    return {
      extractedSpecsText,
      transformedSpecsText,
      modelName: runtimeConfig.modelName,
    };
  }
}
