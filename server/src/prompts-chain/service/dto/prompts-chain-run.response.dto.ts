import type { StructuredSpecsProps } from '../../entity/structured-specs.entity.js';

export type PromptsChainRunResponseDto = {
  extractedSpecsText: string;
  structuredSpecs: StructuredSpecsProps;
  transformedSpecsText: string;
  modelName: string;
};
