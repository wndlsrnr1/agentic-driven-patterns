import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  buildRuntimeConfigFromEnv,
  resolveCliInput,
  runDataExtractionTransformationWorkflow,
  type RuntimeConfig,
  type RunDataExtractionTransformationWorkflowResult,
} from './data-extraction-transformation.workflow.ts';

test('buildRuntimeConfigFromEnv validates required key', (): void => {
  assert.throws((): RuntimeConfig => buildRuntimeConfigFromEnv({}), /SYNTHETIC_API_KEY is missing\./);
});

test('resolveCliInput returns invoice text', (): void => {
  const cliInput: string | undefined = resolveCliInput(['node', 'script.ts', 'invoice', 'text']);
  assert.equal(cliInput, 'invoice text');
});

test('runDataExtractionTransformationWorkflow returns structured output', async (): Promise<void> => {
  const result: RunDataExtractionTransformationWorkflowResult = await runDataExtractionTransformationWorkflow({
    sourceDocument: 'invoice text',
    runtimeConfig: {
      apiKey: 'key',
      baseUrl: 'https://example.com/v1',
      modelName: 'model',
    },
    workflowRunner: async (): Promise<RunDataExtractionTransformationWorkflowResult> => {
      return {
        sourceDocument: 'invoice text',
        extractedInvoice: {
          vendorName: 'ACME',
          address: 'Seoul',
          amountText: 'one thousand and fifty',
          currency: 'USD',
          dueDate: '2026-03-01',
        },
        normalizedInvoice: {
          vendorName: 'ACME',
          address: 'Seoul',
          amountValue: 1050,
          currency: 'USD',
          dueDate: '2026-03-01',
        },
        calculationResult: 1155,
        retries: 1,
        modelName: 'model',
      };
    },
  });

  assert.equal(result.normalizedInvoice.amountValue, 1050);
  assert.equal(result.calculationResult, 1155);
});
