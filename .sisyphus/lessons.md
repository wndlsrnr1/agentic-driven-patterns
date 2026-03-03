# Lessons Learned

## 2026-02-22

- Pattern: User requested a narrowly scoped wording change, but I initially wrote a broader/stronger rule than intended.
- Prevention Rule 1: For policy text edits, mirror user scope words explicitly (e.g., "when coding/using") in the first sentence.
- Prevention Rule 2: Avoid adding extra enforcement mechanisms unless the user asked for them.
- Prevention Rule 3: After user correction, immediately update this lessons file in the same turn.
- Pattern: User asked to rework prior implementation with a specific technology stack (LangChain TypeScript + real API), and I must replace approach fully instead of incremental tweaks.
- Prevention Rule 1: When user says "다시 만들어", treat it as full-stack replacement and restate required stack explicitly before editing.
- Prevention Rule 2: If user asks for "실제 API 호출", wire runtime env validation and provider SDK call path in the same change.
- Prevention Rule 3: Include runnable command comments at file top whenever creating executable workflow scripts.
- Pattern: User corrected implementation direction to require exact runtime mode (.env + real LangChain API calls) across multiple files.
- Prevention Rule 1: When user requests environment-driven execution, enforce env-file based scripts in package.json immediately.
- Prevention Rule 2: For "real API" requests, validate missing-key and invalid-key flows as part of verification.
- Prevention Rule 3: Apply the same runtime contract consistently to all requested files, not partially.
- Pattern: User rejects static corpus/embedded data as mock when request explicitly demands real calls.
- Prevention Rule 1: If user says "no mock", remove all hardcoded retrieval datasets from the target workflow.
- Prevention Rule 2: For research steps, wire live retrieval endpoints (e.g., Wikipedia API) instead of local sample corpora.
- Pattern: User said code looked unchanged; I must provide immediate file/line evidence instead of high-level summary.
- Prevention Rule 1: After large refactors, always report 3+ concrete line references proving key behavior changes.
- Prevention Rule 2: Explicitly mention git state (tracked/untracked) when diffs are not obvious in IDE.
- Pattern: User requested validation of real URLs/data sources before accepting workflow completion.
- Prevention Rule 1: For external-data workflows, run explicit URL health checks (status code + endpoint list) before final reporting.
- Prevention Rule 2: Separate failures by layer (URL source vs. LLM timeout vs. parsing) and only then apply targeted fixes.
- Prevention Rule 3: Always include end-to-end smoke results for every runnable script after changing data sources.
- Pattern: User switched from planning output to explicit implementation request, so I must execute immediately instead of staying in planning posture.
- Prevention Rule 1: When user says "PLEASE IMPLEMENT THIS PLAN", start code edits in the same turn and avoid additional planning output.
- Prevention Rule 2: In default collaboration mode, treat provided plan as execution contract and report progress through implementation checkpoints.
- Prevention Rule 3: Confirm plan-required verification commands are run before final response.

## 2026-02-23

- Pattern: User requested alignment with "original intent" naming (`booking_agent`), but implementation used function-only naming (`bookingHandler`) that obscured intent.
- Prevention Rule 1: When porting examples, preserve intent-bearing domain names from source (agent roles/IDs), not just functional equivalence.
- Prevention Rule 2: Add a focused RED test that checks intent markers (e.g., delegated agent ID/log/output wording) before refactor.
- Prevention Rule 3: If target file differs from main implementation (`*.example.ts` vs production file), implement and verify in the exact file user named.

## 2026-02-23

- Pattern: User clarified the runtime context was WSL, and initial environment assumption did not include Windows-side verification.
- Prevention Rule 1: When user mentions WSL, verify both Linux and Windows layers before concluding environment-dependent checks.
- Prevention Rule 2: For font/tool installation checks in WSL, inspect `/mnt/c/Windows` and user-profile Windows paths in addition to Linux package/font lists.
- Pattern: User requested a direct code change ("단계별 로그 추가") after a partial/ambiguous message.
- Prevention Rule 1: When the follow-up clarifies an explicit implementation action, switch to immediate code edits instead of extra discussion.
- Prevention Rule 2: For logging enhancement requests, add verifiable step logs and back them with tests that assert log messages.
- Pattern: User asked which newly added TypeScript blocks replaced specific original-spec blocks, and plain implementation without replacement annotations reduced readability.
- Prevention Rule 1: When porting code from another language/spec, add explicit `original -> replacement` comments at each major block (config, router, delegation, entrypoint).
- Pattern: User-provided library list was an example set, but scope needed all LangChain and external libraries at real usage points.
- Prevention Rule 1: When a request lists libraries with formatting examples, default to "example list" semantics unless user explicitly says "only these".
- Prevention Rule 2: In comment/docstring tasks, derive final coverage from actual import usage (all LangChain + third-party packages), not from the sample names alone.
- Pattern: User asked for a simplified variant but explicitly wanted it as a separate file, not edits to the existing implementation.
- Prevention Rule 1: When user says "do not modify, create separately", create a new `*.minimal.*` (or equivalent) file and leave existing files untouched.
- Prevention Rule 2: In completion report, explicitly state original file unchanged and include new file path.
- Pattern: User requested minimal script execution without entry guard/conditional wrapper, but prior version kept `isDirectExecution` conditional.
- Prevention Rule 1: For "single execution" requests, prefer top-level execution line directly unless the user explicitly asks for import-safe guard behavior.
- Pattern: User wanted single-question workflow, but implementation kept multi-request loop with fixed array.
- Prevention Rule 1: When user says "one question only", remove loop/array batch processing and return a single result contract.

## 2026-02-24

- Pattern: User corrected target scope from `coordinator-routing.workflow.ts` to `coordinator-routing.workflow.example.ts` after an interrupted turn.
- Prevention Rule 1: After any interruption or correction, restate the exact target path and verify edits are applied only to that file before proceeding.
- Pattern: User requested additional refactor to resolve branching behavior via type-to-handler mapping rather than direct handler wiring.
- Prevention Rule 1: When users ask for "type-based" branching, introduce a typed lookup map (`Record<type, handler>`) as SSOT first, then update call sites.
- Prevention Rule 2: Keep existing handler behavior strings intact during structural refactors unless the user explicitly requests output-text changes.
- Pattern: User asked a style concept first, then immediately requested direct code conversion in the same style.
- Prevention Rule 1: When a user says "아래 코드를 그렇게 바꿔", interpret it as immediate in-place refactor with the exact style just discussed (no extra explanation step).
- Pattern: User escalated from local snippet cleanup to whole-file restructuring focused on readable top-level flow and clear responsibilities.
- Prevention Rule 1: When user says "전체 그렇게 리팩토링", refactor the entire file structure (not only the selected block) and keep a single explicit top-level execution entry.
- Pattern: User corrected tutorial direction from broad infra refactor to learner-first execution flow (independent runnable tutorials, minimal CLI/env, internal fixed flow).
- Prevention Rule 1: When user asks for tutorial simplicity, prioritize runnable per-library scripts and explicit step logs over large-scale naming/architecture normalization.
- Prevention Rule 2: Keep CLI as a thin entrypoint only; avoid adding option parsing unless explicitly requested.
- Prevention Rule 3: Hardcode learning context (topic/model/prompt/base URL) in code and restrict env usage to the minimal secret-key injection path.

## 2026-02-25

- Pattern: I reported execution completion even though real model output was empty due ignored ADK error events.
- Prevention Rule 1: For ADK runs, inspect event-level `errorMessage`/`errorCode` before claiming success.
- Prevention Rule 2: If model output is empty, fail explicitly with the runtime error instead of returning a completed fallback.
- Prevention Rule 3: Validate model availability with the same API key and update deprecated model IDs before final reporting.
- Pattern: User explicitly asked for non-verbose/minimal changes, so extra guards or architecture cleanup caused friction.
- Prevention Rule 1: If user says "장황하지 않게", touch only the requested line(s)/block and avoid additional improvements.
- Prevention Rule 2: Keep response and patch scope strictly to request intent; postpone optional cleanup unless asked.
- Pattern: User asked for concise changes ("장황하지 않게"), so long explanations and broad refactors reduce usability.
- Prevention Rule 1: When user requests concise work, make the smallest direct edit that fixes the exact issue.
- Prevention Rule 2: Keep completion message to changed points + run result only.
- Pattern: User requested simplification but later corrected that prompt wording had been altered unintentionally.
- Prevention Rule 1: During refactors, treat prompt/instruction text as behavioral contract unless user explicitly asks to rewrite prompts.
- Prevention Rule 2: When simplifying orchestration, separate "flow refactor" from "prompt content change" and preserve original prompt literals by default.
