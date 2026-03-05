# prompts-chaining workflows

## Setup

1. Fill `modules/.env` with:
   - `API_KEY`
   - `BASE_URL`
   - `MODEL`

2. Install dependencies:

```bash
cd modules
npm install
```

## Verify

```bash
cd modules
npm run typecheck
npm test
```

## Run each workflow directly

```bash
cd modules
node --env-file=.env --experimental-strip-types ./prompts-chaining/information-processing.workflow.ts
node --env-file=.env --experimental-strip-types ./prompts-chaining/complex-query-answering.workflow.ts
node --env-file=.env --experimental-strip-types ./prompts-chaining/data-extraction-transformation.workflow.ts
node --env-file=.env --experimental-strip-types ./prompts-chaining/content-generation.workflow.ts
node --env-file=.env --experimental-strip-types ./prompts-chaining/conversational-agent-state.workflow.ts
node --env-file=.env --experimental-strip-types ./prompts-chaining/code-generation-refinement.workflow.ts
node --env-file=.env --experimental-strip-types ./prompts-chaining/multimodal-multistep-reasoning.workflow.ts
```

Optional CLI input examples:

```bash
cd modules
node --env-file=.env --experimental-strip-types ./prompts-chaining/information-processing.workflow.ts -- https://en.wikipedia.org/wiki/Artificial_intelligence
node --env-file=.env --experimental-strip-types ./prompts-chaining/complex-query-answering.workflow.ts -- "What were the main causes of the stock market crash in 1929, and how did government policy respond?"
node --env-file=.env --experimental-strip-types ./prompts-chaining/data-extraction-transformation.workflow.ts -- "Vendor: ACME, Amount Due: one thousand USD, Due Date: 2026-03-01"
node --env-file=.env --experimental-strip-types ./prompts-chaining/content-generation.workflow.ts -- "agentic workflows for finance"
node --env-file=.env --experimental-strip-types ./prompts-chaining/conversational-agent-state.workflow.ts -- "I need a meeting|With Mina and David|Tuesday 10AM"
node --env-file=.env --experimental-strip-types ./prompts-chaining/code-generation-refinement.workflow.ts -- "Create a typed debounce function"
node --env-file=.env --experimental-strip-types ./prompts-chaining/multimodal-multistep-reasoning.workflow.ts -- https://example.com/image.png
```
