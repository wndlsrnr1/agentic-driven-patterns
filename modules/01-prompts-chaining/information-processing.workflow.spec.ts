import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  buildRuntimeConfigFromEnv,
  resolveCliInput,
  runInformationProcessingWorkflow,
  type RuntimeConfig,
  type RunInformationProcessingWorkflowResult,
} from './information-processing.workflow.ts';

test('buildRuntimeConfigFromEnv throws when SYNTHETIC_API_KEY is missing', (): void => {
  assert.throws((): RuntimeConfig => buildRuntimeConfigFromEnv({}), /SYNTHETIC_API_KEY is missing\./);
});

test('resolveCliInput returns first CLI argument', (): void => {
  const cliInput: string | undefined = resolveCliInput(['node', 'script.ts', 'https://example.com']);
  assert.equal(cliInput, 'https://example.com');
});

test('runInformationProcessingWorkflow returns runner result', async (): Promise<void> => {
  const result: RunInformationProcessingWorkflowResult = await runInformationProcessingWorkflow({
    sourceUrl: 'https://example.com',
    runtimeConfig: {
      apiKey: 'test-key',
      baseUrl: 'https://example.com/v1',
      modelName: 'test-model',
    },
    workflowRunner: async (): Promise<RunInformationProcessingWorkflowResult> => {
      return {
        sourceUrl: 'https://example.com',
        extractedText: 'extracted',
        summary: 'summary',
        entities: [{ name: 'Seoul', type: 'location' }],
        knowledgeBaseFindings: [{ entity: 'Seoul', snippet: 'Capital of Korea', sourceUrl: 'https://kb.local/seoul' }],
        finalReport: 'report',
        modelName: 'test-model',
      };
    },
  });

  assert.equal(result.finalReport, 'report');
  assert.equal(result.entities.length, 1);
});
