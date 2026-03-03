/**
 * Run:
 * cd modules && node --env-file=.env --experimental-strip-types ./paralleization/tutorial.ts
 */
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import {
  runLibraryTutorial,
  type LibraryTutorialResult,
} from "./library-tutorial.ts";

export async function runTutorial(): Promise<LibraryTutorialResult> {
  const result: LibraryTutorialResult = await runLibraryTutorial();
  return result;
}

const isNodeTestContext: boolean = process.env.NODE_TEST_CONTEXT !== undefined;
const cliPath: string | undefined = process.argv[1];
if (!isNodeTestContext && cliPath) {
  const cliUrl: string = pathToFileURL(resolve(process.cwd(), cliPath)).href;
  if (cliUrl === import.meta.url) {
    void runTutorial()
      .then((result: LibraryTutorialResult): void => {
        console.log(JSON.stringify(result, null, 2));
      })
      .catch((error: unknown): void => {
        const errorMessage: string =
          error instanceof Error ? error.message : String(error);
        console.error(errorMessage);
        process.exitCode = 1;
      });
  }
}
