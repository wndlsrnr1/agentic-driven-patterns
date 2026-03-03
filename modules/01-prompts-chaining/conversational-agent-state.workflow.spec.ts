import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  buildRuntimeConfigFromEnv,
  resolveCliInput,
  runConversationalAgentStateWorkflow,
  type RuntimeConfig,
  type RunConversationalAgentStateWorkflowResult,
} from './conversational-agent-state.workflow.ts';

test('buildRuntimeConfigFromEnv requires API key', (): void => {
  assert.throws((): RuntimeConfig => buildRuntimeConfigFromEnv({}), /SYNTHETIC_API_KEY is missing\./);
});

test('resolveCliInput splits turns by pipe', (): void => {
  const turns: string[] | undefined = resolveCliInput(['node', 'script.ts', 'hello|book meeting']);
  assert.deepEqual(turns, ['hello', 'book meeting']);
});

test('runConversationalAgentStateWorkflow accumulates turn results', async (): Promise<void> => {
  const result: RunConversationalAgentStateWorkflowResult = await runConversationalAgentStateWorkflow({
    userTurns: ['hello', 'book meeting'],
    runtimeConfig: {
      apiKey: 'key',
      baseUrl: 'https://example.com/v1',
      modelName: 'model',
    },
    workflowRunner: async (): Promise<RunConversationalAgentStateWorkflowResult> => {
      return {
        turns: [
          {
            userUtterance: 'hello',
            intent: 'greeting',
            entities: {},
            response: 'hi',
            nextRequiredInfo: 'meeting date',
          },
        ],
        finalState: {
          lastIntent: 'greeting',
          collectedEntities: {},
          pendingInfo: 'meeting date',
        },
        modelName: 'model',
      };
    },
  });

  assert.equal(result.turns.length, 1);
  assert.equal(result.finalState.pendingInfo, 'meeting date');
});
