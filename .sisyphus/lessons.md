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
