---
name: comment-docstring-for-langchain-and-external-libs
description: Use when users ask to improve comments or docstrings in TypeScript LangChain files for beginners, especially when they demand strict structured annotations at each LangChain and external library usage point without changing logic, types, exports, or runtime behavior.
---

# Comment Docstring For LangChain And External Libs

## Overview

Strengthen comments and docstrings only.
Preserve behavior exactly.

Treat any named library list from the user as examples unless they explicitly say "only these".

## Hard Constraints

- Edit comments/docstrings only.
- Do not change logic, types, exports, return contracts, or runtime flow.
- Do not add refactors unrelated to readability comments.
- Do not modify tests unless the user explicitly requests it.

## Scope Rule: Example vs Full Coverage

- If the user gives a list like `StringOutputParser`, `ChatPromptTemplate`, etc., treat that list as an example set by default.
- Annotate all actual usage points for:
  - LangChain libraries
  - Other third-party/external libraries imported from packages
- If uncertain whether a package is external, resolve by import path:
  - External: non-relative import (for example `@langchain/...`, `openai`, `zod`)
  - Internal: relative/local project imports

## Required Comment Format

At each real usage point of every in-scope library, place this block immediately above the code:

- `Library Role:`
- `Why Here:`
- `Signature:`
- `Failure Mode:`
- `Alternative:`

Use beginner-friendly language and avoid jargon when possible.

## Required File-Level Sections

Add near file top when requested:

1. Integrated flow overview
- Show end-to-end flow in one line.
- Example format: `input -> routing decision -> branch execution -> output`

2. Mini glossary
- Explain these terms in 1-2 beginner sentences each:
  - `Runnable`
  - `Sequence`
  - `Branch`
  - `Assign`
  - `Passthrough`
  - `PromptTemplate`
  - `OutputParser`

## Required JSDoc Policy

For core functions, add Korean JSDoc that includes:
- `Context` (caller, purpose, data flow)
- `@param`
- `@returns`
- Optional `Side effects` and `@throws` only when truly applicable

## Workflow

1. Read target file fully.
2. Enumerate all imported LangChain and external libraries used in executable code.
3. Insert file-level overview and glossary sections if requested.
4. Add structured usage blocks above each usage site.
5. Add or upgrade Korean JSDoc on core functions.
6. Verify diff is comments/docstrings only.
7. Run requested checks and report results.

## Completion Report Template

- Added annotation locations with `file:line`
- Verification command results, if requested by user

## Copy-Paste Prompt

Use `references/prompt-template.ko.md`.

