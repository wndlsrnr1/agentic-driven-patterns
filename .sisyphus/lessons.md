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

## 2026-03-03

- Pattern: User added content to an already-fixed file, reintroducing syntax/indentation breakage via accidental block concatenation.
- Prevention Rule 1: After each user-requested formatting fix, re-run `py_compile` on all sibling example `.py` files in the same directory, not only the edited file.
- Prevention Rule 2: If a file contains mixed script fragments from different examples, remove out-of-scope appended fragments and preserve only the file's intended example flow.
- Pattern: User explicitly wanted an added code block preserved, but I removed it while fixing formatting.
- Prevention Rule 1: When user says "add this", preserve and format the provided block first; do not delete as out-of-scope unless user asks.
- Prevention Rule 2: For broken snippets with `break`/context dependency, add minimal surrounding context so the block remains present and syntactically valid.
- Pattern: User corrected generation scope to specific source paths, destination directory, and strict formatting constraint (no comments).
- Prevention Rule 1: For file generation requests, restate and enforce exact source path(s), target path, tech stack, and style constraints before writing.
- Prevention Rule 2: When user says "주석 제외", strip all explanatory comments from generated code even if reference style file contains comments.
- Pattern: User asked to increase reusability with "Agent spec", and library-level refactor can overfit to unstable package typings.
- Prevention Rule 1: When user asks for "spec-based reusability", first encode shared role/prompt contracts as typed spec objects (SSOT) inside the target file.
- Prevention Rule 2: Prefer the repository's currently type-stable runtime path unless user explicitly requires a specific SDK package migration.
- Pattern: User demanded official OpenAI library conformance, and assumptions without citing docs caused trust loss.
- Prevention Rule 1: For OpenAI SDK refactors, verify against current official docs first and align request shape (`responses.create`, `instructions`, `input`, `output_text`) before editing.
- Pattern: User pointed to a concrete reference file to define the expected pattern, and any alternate pattern was rejected.
- Prevention Rule 1: When user says "look at this file", treat that file as the implementation contract and mirror its architecture first.
- Pattern: User explicitly requested a concrete SDK composition (`Agent + run + MemorySession`), but I kept a different execution primitive (`Runner`) and missed the contract.
- Prevention Rule 1: When the user specifies exact classes/functions to use, implement that exact composition first and avoid substituting with "equivalent" abstractions.
- Prevention Rule 2: If an API name is uncertain (e.g., InMemory runner vs session), verify package exports immediately and align the final code with the user's provided snippet.
- Pattern: User requested project-style runtime adaptation (SYNTHETIC env/baseURL) without changing core workflow, and I initially focused on structural parity only.
- Prevention Rule 1: When asked for "project style", apply repository runtime config conventions (env key names/default base URL/provider wiring) while preserving the same business flow.
- Prevention Rule 2: Separate "execution flow changes" from "runtime wiring changes"; prefer only runtime wiring when user says logic must stay intact.

## 2026-03-04

- Pattern: User requested Google ADK/GenAI -> OpenAI Agents skill with runtime-semantics equivalence, but initial skill draft emphasized primitive mapping and missed explicit decision matrices for determinism/session/tool/event policy.
- Prevention Rule 1: For SDK migration skills, define boundaries first (orchestration migration vs model-only swap) before writing mapping tables.
- Prevention Rule 2: Include explicit selection rules for app-controlled sequence vs handoff when source has workflow agents.
- Prevention Rule 3: Treat session/state, tool error model, and event/tracing contracts as required parity sections, not optional notes.
- Pattern: User reported skill-loading YAML parse errors caused by unquoted `description` values containing `:` in `SKILL.md` frontmatter.
- Prevention Rule 1: In all `SKILL.md` frontmatter, always quote `description` values with double quotes.
- Prevention Rule 2: After editing skill metadata, re-check each edited file's first frontmatter block (`--- ... ---`) for YAML-safe scalars before finishing.
- Pattern: User asked for a follow-up integration step (registering new agent in `.codex/config.toml`) after file creation, implying initial completion scope was too narrow.
- Prevention Rule 1: When creating a new `.codex/agents/*.toml`, always check `.codex/config.toml` for matching `[agents.<role>]` registration in the same turn unless user explicitly says not to.
- Prevention Rule 2: Finalize agent-creation tasks with a two-file completion checklist: agent file present + config entry wired.
- Pattern: Session role was explicitly set to `implement-orchestrator`, but I still moved toward direct file implementation under default "implement immediately" behavior.
- Prevention Rule 1: If user sets/acknowledges an orchestrator role, treat delegation-only constraints in that role file as highest-priority local execution contract for the session.
- Prevention Rule 2: Before any code edit under orchestrator role, confirm path: `approved plan present` -> `subagent delegation` -> `wave verification`; if any link is missing, do not implement directly.
- Prevention Rule 3: When two instructions conflict (global default direct-implementation vs role-specific delegation), explicitly surface the conflict and follow the narrower role-specific constraint.
- Pattern: User asked for exact provenance of an instruction, and I initially gave summarized wording without exact location/quote.
- Prevention Rule 1: When citing prompt constraints, always provide exact section path (e.g., `developer message -> Working with the user -> Autonomy and persistence`) and verbatim key sentence.
- Prevention Rule 2: Distinguish clearly between direct quote and my paraphrase in the same response.
- Pattern: While fixing invalid config format, full-file replacement looked like unintended deletion to the user.
- Prevention Rule 1: For config normalization patches, announce explicitly that structural wrapping (e.g., `developer_instructions = \"\"\"...\"\"\"`) requires moving existing content, not removing policy.
- Prevention Rule 2: Prefer staged/incremental edits for high-visibility config files and show post-edit diff intent before applying large replacements.
