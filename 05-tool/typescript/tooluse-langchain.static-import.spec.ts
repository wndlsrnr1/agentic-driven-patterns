import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const SCRIPT_PATH: URL = new URL("./tooluse-langchain.ts", import.meta.url);

test("tooluse-langchain uses explicit agent imports", async (): Promise<void> => {
  const source: string = await readFile(SCRIPT_PATH, "utf8");

  assert.match(
    source,
    /from "langchain\/agents";/,
    "expected an explicit langchain/agents import",
  );
  assert.doesNotMatch(
    source,
    /await import\(modulePath\)/,
    "dynamic langchain loader should be removed",
  );
  assert.doesNotMatch(
    source,
    /loadLangchainAgentsModule/,
    "helper loader function should be removed",
  );
});
