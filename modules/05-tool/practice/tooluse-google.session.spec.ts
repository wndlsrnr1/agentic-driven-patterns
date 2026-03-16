import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";
import test from "node:test";

const SCRIPT_PATH: URL = new URL("./tooluse-google.ts", import.meta.url);

test("tooluse-google creates a session before runAsync", async (): Promise<void> => {
  const source: string = await readFile(SCRIPT_PATH, "utf8");
  const createSessionIndex: number = source.indexOf(
    "await runner.sessionService.createSession({",
  );
  const runAsyncIndex: number = source.indexOf(
    "for await (const event of runner.runAsync({",
  );

  assert.notEqual(createSessionIndex, -1);
  assert.notEqual(runAsyncIndex, -1);
  assert.ok(createSessionIndex < runAsyncIndex);
});
