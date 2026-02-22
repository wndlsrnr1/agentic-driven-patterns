# prompts-chaining workflows

## Setup

1. Fill `modules/prompts-chaining/.env` with:
   - `SYNTHETIC_API_KEY`
   - `SYNTHETIC_BASE_URL`
   - `SYNTHETIC_MODEL`

2. Install dependencies:

```bash
cd modules/prompts-chaining
npm install
```

## Verify

```bash
npm run typecheck
npm run test
```

## Run each workflow

```bash
npm run info
npm run complex
npm run data
npm run content
npm run conversation
npm run codegen
npm run multimodal
```

Optional CLI input examples:

```bash
npm run info -- https://en.wikipedia.org/wiki/Artificial_intelligence
npm run complex -- "What were the main causes of the stock market crash in 1929, and how did government policy respond?"
npm run data -- "Vendor: ACME, Amount Due: one thousand USD, Due Date: 2026-03-01"
npm run content -- "agentic workflows for finance"
npm run conversation -- "I need a meeting|With Mina and David|Tuesday 10AM"
npm run codegen -- "Create a typed debounce function"
npm run multimodal -- https://example.com/image.png
```
