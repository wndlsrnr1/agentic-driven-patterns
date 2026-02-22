import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const PACKAGE_JSON_PATH: string = new URL('./package.json', import.meta.url).pathname;

test('package scripts include every workflow command', async (): Promise<void> => {
  const packageJsonText: string = await readFile(PACKAGE_JSON_PATH, 'utf8');
  const packageJson: {
    scripts?: Record<string, string>;
  } = JSON.parse(packageJsonText) as {
    scripts?: Record<string, string>;
  };

  const scripts: Record<string, string> = packageJson.scripts ?? {};

  const requiredScripts: string[] = [
    'typecheck',
    'test',
    'info',
    'complex',
    'data',
    'content',
    'conversation',
    'codegen',
    'multimodal',
  ];

  for (const scriptName of requiredScripts) {
    assert.equal(typeof scripts[scriptName], 'string', `script ${scriptName} must exist`);
  }
});
