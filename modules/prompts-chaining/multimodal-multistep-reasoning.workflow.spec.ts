import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  buildRuntimeConfigFromEnv,
  resolveCliInput,
  runMultimodalMultistepReasoningWorkflow,
  type RuntimeConfig,
  type RunMultimodalMultistepReasoningWorkflowResult,
} from './multimodal-multistep-reasoning.workflow.ts';

test('buildRuntimeConfigFromEnv validates key existence', (): void => {
  assert.throws((): RuntimeConfig => buildRuntimeConfigFromEnv({}), /SYNTHETIC_API_KEY is missing\./);
});

test('resolveCliInput returns image URL', (): void => {
  const cliInput: string | undefined = resolveCliInput(['node', 'script.ts', 'https://example.com/image.png']);
  assert.equal(cliInput, 'https://example.com/image.png');
});

test('runMultimodalMultistepReasoningWorkflow returns all reasoning stages', async (): Promise<void> => {
  const result: RunMultimodalMultistepReasoningWorkflowResult =
    await runMultimodalMultistepReasoningWorkflow({
      imageUrl: 'https://example.com/image.png',
      runtimeConfig: {
        apiKey: 'key',
        baseUrl: 'https://example.com/v1',
        modelName: 'model',
      },
      workflowRunner: async (): Promise<RunMultimodalMultistepReasoningWorkflowResult> => {
        return {
          imageUrl: 'https://example.com/image.png',
          extractedText: 'label A, label B',
          labelMapping: 'A -> row1, B -> row2',
          tableInterpretation: 'row2 exceeds threshold',
          finalConclusion: 'alert required',
          modelName: 'model',
        };
      },
    });

  assert.match(result.tableInterpretation, /threshold/);
  assert.equal(result.finalConclusion, 'alert required');
});
