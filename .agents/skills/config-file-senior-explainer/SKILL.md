---
name: config-file-senior-explainer
description: Use when a user asks for config-file documentation that beginners can understand without losing senior-level evidence about consumer modules, lifecycle timing, rationale, and change impact, and the result must be saved to `.sisyphus/docs/{name}.md`.
---

# Config File Senior Explainer

## Overview

Create deep config docs that are easy for beginners to follow while still being auditable by senior engineers.
The target tone is plain and concrete, not childish.
Always connect each key to syntax, framework, module consumer, lifecycle stage, architectural role, and trade-offs.

## Beginner-Friendly Elements (Not Childish)

Before writing, ensure these elements are present:
- `용어 브릿지`: first mention of jargon includes a one-line plain Korean meaning
- `단계형 설명`: explain in order `한 줄 의미 -> 왜 필요한가 -> 런타임에서 누가 읽는가 -> 바꾸면 무엇이 깨지는가`
- `선행지식 최소화`: avoid assuming knowledge of compiler/bundler/runtime internals without quick context
- `오해 방지`: include one common misconception per complex key
- `검증 가능성`: every advanced claim links to concrete file/package evidence

Never use a childish tone, exaggerated metaphors, or entertainment-style wording.

## Input Contract

Collect these inputs before writing:
- Target file path(s)
- Output name `{name}` for `.sisyphus/docs/{name}.md`
- Audience level (`beginner`, `intermediate`, `mixed`)
- Scope (`single file` or `cross-file config chain`)
- Optional list of terms the reader already finds confusing

If `{name}` is not provided, derive a slug from the primary file name (for example `server-nest-cli-config-explained`).

## Output Contract

Produce exactly one Markdown file:
- Path: `.sisyphus/docs/{name}.md`
- Language: Korean by default (keep code/identifiers in original form)
- Structure: Follow `references/doc-template.md`
- Depth: Explain every meaningful key/value; do not skip non-obvious defaults
- Explanation layers for each key:
  - Layer 1 (Beginner): one-line meaning + why it exists in plain Korean
  - Layer 2 (Senior): concrete consumer/lifecycle evidence + change impact mechanism

## Workflow

1. Read target file and neighboring configuration files that influence behavior.
2. Identify stack consumers from local context (`package.json`, framework config, build tooling files).
3. Mark likely beginner blockers (jargon, hidden defaults, lifecycle jumps) before writing.
4. Build a key map for every setting:
   - Literal value and syntax/type
   - Direct consumer (framework/module/library)
   - Read timing in lifecycle (build/startup/request/runtime/deploy/test)
   - Architectural role and invariant
   - Why this value is chosen and what breaks if changed
5. Explain interaction graph across files when values are coupled.
6. Write the document with the template sections.
7. Save using `scripts/save_doc.sh`.
8. Re-open the saved file and verify completeness.

## Explanation Rules Per Key

For each key/value, explain all of the following:
- `한 줄 의미(초보자용)`: non-jargon summary in one sentence
- `왜 존재하는가(초보자용)`: operational problem this key solves
- `자주 생기는 오해`: one common misunderstanding and correction
- `문법`: data type, allowed grammar, parser behavior, schema constraints
- `프레임워크`: which framework convention this key belongs to
- `모듈/라이브러리`: exact package or runtime module consuming it
- `패러다임`: architectural principle it supports (DDD boundary, DI, layering, etc.)
- `라이프사이클`: when the value is read and applied
- `라이프사이클 내 역할`: what decision this key controls at that stage
- `근본`: why this category of setting exists in software systems
- `오버뷰 연결`: how this key supports the file-level and system-level objective
- `변경 영향`: behavioral, performance, security, DX impact when modified

If the key is inherited or defaulted, state:
- Where the default comes from
- Why explicit declaration is still useful (or unnecessary)
- What misunderstanding occurs when teams rely on implicit defaults

## Required File Reads

Read at least:
- Target config file(s)
- Nearest `package.json`
- Core framework bootstrap files (for NestJS example: `main.ts`, `nest-cli.json`, `tsconfig*.json`)

Only load additional files that are needed to prove consumer/lifecycle claims.

## Save Procedure

Use this command:

```bash
.agents/skills/config-file-senior-explainer/scripts/save_doc.sh "<name>" <<'MD'
# ...final markdown content...
MD
```

Then verify:
- File exists in `.sisyphus/docs/`
- Filename is slug-safe
- Content sections are complete

## Quality Bar

A document passes only if it satisfies all:
- Beginner can answer "why this key exists" without extra search
- Senior can verify claims with concrete consumer/lifecycle evidence
- Every non-trivial value has rationale and change impact
- Cross-file dependencies are explicitly traced
- No vague claims like "for performance" without mechanism
- No childish phrasing; plain professional tone only
- Reader can map each key to an execution stage without guessing

## Must Do
- Use `references/doc-template.md` as the baseline layout.
- Tie each key to concrete consumers (package/framework/module).
- Include an end-of-document checklist for safe edits.
- Keep explanations technically precise and avoid marketing language.
- Save only to `.sisyphus/docs/{name}.md`.

## Must Not Do
- Do not explain keys in isolation without runtime context.
- Do not omit lifecycle timing.
- Do not write to other directories.
- Do not leave placeholders like `TBD` in final output.
- Do not invent consumers without file/package evidence.
- Do not use childish metaphors, meme-style wording, or oversimplified false analogies.
- Do not replace technical accuracy with "easy words" that distort behavior.

## Resources
- Template: `references/doc-template.md`
- Save helper: `scripts/save_doc.sh`

## Example Triggers
- "nest-cli.json 값 하나하나 왜 필요한지 초보도 이해되게 설명해줘"
- "tsconfig 설정을 프레임워크/라이프사이클까지 연결해서 문서로 정리해줘"
- "이 config 파일을 시니어 수준으로 해설해서 `.sisyphus/docs`에 저장해줘"
