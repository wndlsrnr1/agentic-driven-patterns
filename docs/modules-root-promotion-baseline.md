# Modules Root Promotion Baseline

## Verified Runtime State

- Root `npm install`: PASS
- Root `npm run typecheck`: PASS
- Root `npm test`: PASS (`13` tests, `0` failures)
- Root Python compile check via `./venv/bin/python -m py_compile`: PASS
- Root `venv` dependency install: PASS (`./venv/bin/pip list` 확인)
- Current workspace top-level runtime dirs: `01-prompts-chaining`, `02-routing-patterns`, `03-paralleization`, `04-reflection`, `05-tool`, `node_modules`, `venv`
- Current workspace does not contain legacy `modules/`, `client/`, `server/` directories, so their smoke checks are not part of the current acceptance evidence

## Reflection Baseline

- Command:
  - `npm run test:reflection-baseline`
- Result:
  - FAIL (`04-reflection/example-code/typescript/reflextion-openai.spec.ts`)
- Current failure mechanism:
  - `04-reflection/example-code/typescript/reflextion-openai.ts` has a top-level `await runReflectionOpenAI(process.env);`
  - The spec imports that module before injecting `createTestEnv()`
  - Because import-time execution reads the real `process.env`, the test stays red until that legacy behavior is refactored
- Decision:
  - Treat this as a pre-existing baseline failure, not a regression introduced by root promotion

## Current Layout Note

- The current workspace no longer has a legacy `modules/` wrapper directory.
- Manual cleanup steps for `/home/jik/projects/adp/modules/*` are therefore not applicable in this workspace snapshot.
