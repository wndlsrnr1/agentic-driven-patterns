# Repository Guidelines

## GLOBAL SKILL GATE (HARD)

Before ANY response (including greetings), invoke skill `using-superpowers`.
Then print first line exactly: `Using: using-superpowers`.
If this line is missing, do not answer and retry internally.

**Generated:** 2026-02-14
**Type:** Multi-service Monorepo (Meeting Minutes System)

[text](AGENTS.md)

## Self-Improvement Loop

- Review `.sisyphus/lessons.md` at session start for relevant project
- After ANY correction from the user: update `.sisyphus/lessons.md` with the pattern
- Write rules for yourself that prevent the same mistake
- Ruthlessly iterate on these lessons until mistake rate drops
- keep `.sisyphus/lessons.md` under 200 lines

## 조사 원칙

니가 조사해서 알수 있는 것은 나에게 묻지마라
조사 한후에도 모르겠다면 그때 물어봐라

## Shared-Only Extraction

Do not split logic into a separte function unless that logic is truly shared and called by at least two different function definitions.
if it is used in only one function, extracting it is prohibit ed and it must remain inline in that function

## When plans

Before creating a plan, invoke the `writing-plans` skill. When implementing the plan, invoke the `execute-plans` skill.
Follow all instructions in `writing-plans`.
When executing `writing-plans`, map all required skills in advance based on the implementation scope.

## Code Style

All code must follow OOP, DDD, Clean Code, SSOT, explicit return type annotation, human-readable and Effective Software Design principles. Prioritize domain model clarity, separation of responsibilities, readability, and maintainability over language/framework-specific idioms. No over-engineering. Only the necessary abstractions. Avoid writing overly defensive code. Self-Documenting Code, Narrative Style

## Strict Explicit Typing Policy

- 공통 원칙:
  - 메서드 및 모든 함수 작성 시 매개변수/반환 타입을 반드시 명시한다.
  - 변수/상수 선언 시 쉬운 타입이라도 반드시 명시한다.
  - 예시: `const hi: string = "hi"`

- Python:
  - 모든 함수/메서드에 타입 힌트와 반환 타입(`-> ...`)을 명시한다.
  - 생성자 타입 명시를 강제한다.
    - `__init__(...) -> None`
    - `__new__(...) -> Self` (필요 시 구체 클래스 타입)

- TypeScript:
  - 모든 함수/메서드(`async` 포함) 매개변수/반환 타입을 명시한다.
  - 변수/상수 타입 명시를 강제한다(추론 가능해도 생략 금지).
  - `constructor`는 언어 문법상 반환 타입 표기가 불가하므로, 매개변수 타입/접근제어자 프로퍼티 타입/클래스 필드 타입을 명시한다.
  - 생성자 반환 동작에 대한 암묵 의존을 금지한다.

## Maximize context understanding

Be THOROUGH when gathering information. Make sure you have the FULL picture before replying. Use additional tool calls or clarifying questions as needed.
TRACE every symbol back to its definitions and usages so you fully understand it.
Look past the first seemingly relevant result. EXPLORE alternative implementations, edge cases, and varied search terms until you have COMPREHENSIVE coverage of the topic.

Semantic search is your MAIN exploration tool.

- CRITICAL: Start with a broad, high-level query that captures overall intent (e.g. "authentication flow" or "error-handling policy"), not low-level terms.
- Break multi-part questions into focused sub-queries (e.g. "How does authentication work?" or "Where is payment processed?").
- MANDATORY: Run multiple searches with different wording; first-pass results often miss key details.
- Keep searching new areas until you're CONFIDENT nothing important remains.
- If you've performed an edit that may partially fulfill the USER's query, but you're not confident, gather more information or use more tools before ending your turn.

Bias towards not asking the user for help if you can find the answer yourself.

## Build, Test, and Development Commands

Not Yet

## Skills

A skill is a set of local instructions to follow that is stored in a `SKILL.md` file. Below is the list of skills that can be used. Each entry includes a name, description, and file path so you can open the source for full instructions when using a specific skill.

### Available skills

- brainstorming: You MUST use this before any creative work - creating features, building components, adding functionality, or modifying behavior. Explores user intent, requirements and design before implementation. (file: `.agents/skills/brainstorming/SKILL.md`)
- brand-identity: Provides the single source of truth for brand guidelines, design tokens, technology choices, and voice/tone. Use this skill whenever generating UI components, styling applications, writing copy, or creating user-facing assets to ensure brand consistency. (file: `.agents/skills/brand-identity/SKILL.md`)
- code-tutor: Explains the codebase, architecture, and patterns to help users understand and learn the project. Use when users ask "how does this work?", "explain this code", "what does this do?", or want to understand project structure and patterns. (file: `.agents/skills/code-tutor/SKILL.md`)
- comment-docstring-for-langchain-and-external-libs: Use when users ask to improve comments or docstrings in TypeScript LangChain files for beginners, especially when they require structured annotations at each LangChain and external library usage point without changing logic, types, exports, or runtime behavior. (file: `.agents/skills/comment-docstring-for-langchain-and-external-libs/SKILL.md`)
- config-file-senior-explainer: Explain configuration files in beginner-friendly but senior-depth documentation. Use when a user asks what each config key/value means, why it exists, which framework/module/library consumes it, what lifecycle stage uses it, and when output must be saved to `.sisyphus/docs/{name}.md`. (file: `.agents/skills/config-file-senior-explainer/SKILL.md`)
- create-skill: Guides users through creating effective Agent Skills for Cursor. Use when the user wants to create, write, or author a new skill, or asks about skill structure, best practices, or SKILL.md format. (file: `.agents/skills/create-skills/SKILL.md`)
- create-subagent: Create custom subagents for specialized AI tasks. Use when the user wants to create a new type of subagent, set up task-specific agents, configure code reviewers, debuggers, or domain-specific assistants with custom prompts. (file: `.agents/skills/create-agent/SKILL.md`)
- create-workflow: Create custom workflows for repeatable processes. Use when the user wants to define a new standard operating procedure, automation steps, or a specific sequence of actions to be reused. (file: `.agents/skills/create-workflow/SKILL.md`)
- database-design-and-migration: Agile database development for rapid prototyping. Focuses on speed, 'code-first' changes, and seed data management rather than strict migration history or performance tuning. (file: `.agents/skills/database-design-and-migration/SKILL.md`)
- deconstructing-knowledge: Breaks down complex topics or keywords into fundamental "atomic" units using First Principles thinking. Use when starting a new learning journey or when a topic feels too complex. (file: `.agents/skills/deconstructing-knowledge/SKILL.md`)
- dispatching-parallel-agents: Use when facing 2+ independent tasks that can be worked on without shared state or sequential dependencies (file: `.agents/skills/dispatching-parallel-agents/SKILL.md`)
- evolving-skills: Dynamically updates and refines the agent's skills based on proven best practices and high-quality patterns discovered during development. Includes a strict filter to exclude temporary hacks or short-term fixes. (file: `.agents/skills/evolving-skills/SKILL.md`)
- executing-plans: Use when you have a written implementation plan to execute in a separate session with review checkpoints (file: `.agents/skills/executing-plans/SKILL.md`)
- finishing-a-development-branch: Use when implementation is complete, all tests pass, and you need to decide how to integrate the work - guides completion of development work by presenting structured options for merge, PR, or cleanup (file: `.agents/skills/finishing-a-development-branch/SKILL.md`)
- generate-agents-md: Generate hierarchical AGENTS.md files documenting .agents skills and rules with industry best practices. Scans project structure, discovers configurations, and creates comprehensive knowledge base files following standards from 2,500+ repository analysis. (file: `.agents/skills/generate-agents-md/SKILL.md`)
- git-collaboration: Standardizes git usage for the agent. Enforces Conventional Commits, safe push/pull workflows, and proper branch management to prevent errors and ensure a clean history. (file: `.agents/skills/git-collaboration/SKILL.md`)
- korean-docstring-context-typescript: Use when TypeScript/React JSDoc must be written in Korean and must explain full project context (callers, usage, roles) across this repository. (file: `.agents/skills/korean-docstring-context-typescript/SKILL.md`)
- legacy-logic-porting: Skill for porting legacy business logic and components from 'meeting_minutes_front' to the new React 19 + Vite 7 architecture. Ensures adherence to 'Pure Standards' and Facade patterns. (file: `.agents/skills/legacy-logic-porting/SKILL.md`)
- loading-project-context: Reads AGENTS.md to establish project context BEFORE processing ANY user request. MUST USE when starting a new conversation, when the project context is unclear, when working in a new directory, when switching between different parts of a monorepo, or when the user mentions unfamiliar project terms, patterns, or technologies. (file: `.agents/skills/loading-project-context/SKILL.md`)
- migrate-rules-to-skills: Convert `.agents/rules` rule sets into reusable skills in `.agents/skills` while preserving hierarchy and role boundaries. Use when migrating `.md/.mdc` rules, building a language/layer/capability migration plan, or scaffolding role-based SKILL folders from existing rules. (file: `.agents/skills/migrate-rules-to-skills/SKILL.md`)
- nestjs-async-rules: Use when implementing or reviewing NestJS asynchronous workflows to enforce explicit status tracking, retries, and idempotency. (file: `.agents/skills/nestjs-async-rules/SKILL.md`)
- nestjs-controller-rules: Use when implementing or reviewing NestJS controllers to enforce HTTP boundary responsibilities with strict delegation to services. (file: `.agents/skills/nestjs-controller-rules/SKILL.md`)
- nestjs-domain-capability-rules: Use when implementing or reviewing NestJS domain capabilities that must align with foundation and layer policies. (file: `.agents/skills/nestjs-domain-capability-rules/SKILL.md`)
- nestjs-domain-model-rules: Use when implementing or reviewing NestJS domain models to keep invariants local and orchestration out of entities. (file: `.agents/skills/nestjs-domain-model-rules/SKILL.md`)
- nestjs-foundation-rules: Use when implementing or reviewing NestJS backend code to enforce language baseline architecture, explicit contracts, and verification discipline. (file: `.agents/skills/nestjs-foundation-rules/SKILL.md`)
- nestjs-io-validation-rules: Use when implementing or reviewing NestJS DTO and boundary validation to separate input contracts from domain rule validation. (file: `.agents/skills/nestjs-io-validation-rules/SKILL.md`)
- nestjs-platform-rules: Use when implementing or reviewing NestJS platform configuration and cross-cutting infrastructure boundaries. (file: `.agents/skills/nestjs-platform-rules/SKILL.md`)
- nestjs-repository-rules: Use when implementing or reviewing NestJS repositories to keep persistence concerns isolated and business decisions out of data access code. (file: `.agents/skills/nestjs-repository-rules/SKILL.md`)
- nestjs-security-rules: Use when implementing or reviewing NestJS security-sensitive code to enforce authentication, authorization, and regression verification. (file: `.agents/skills/nestjs-security-rules/SKILL.md`)
- nestjs-service-rules: Use when implementing or reviewing NestJS services to enforce business orchestration, transaction boundaries, and typed contracts. (file: `.agents/skills/nestjs-service-rules/SKILL.md`)
- nestjs-testing-rules: Use when implementing or reviewing NestJS tests to enforce Red-Green-Refactor and layered verification coverage. (file: `.agents/skills/nestjs-testing-rules/SKILL.md`)
- prompt-clarifier: Clarifies vague user requests into precise, actionable prompts by asking clarifying questions. Creates structured .md prompt files in .sisyphus/prompts/ directory. Use when user requests are ambiguous, incomplete, or need specification before implementation. Only performs research when explicitly requested. (file: `.agents/skills/prompt-clarifier/SKILL.md`)
- react-best-practices: Core guidelines for React 19 development, focusing on State Management (Global vs Form) and Component Architecture. Merges best practices for Client State, Server State, and Complex Forms. (file: `.agents/skills/react-best-practices/SKILL.md`)
- receiving-code-review: Use when receiving code review feedback, before implementing suggestions, especially if feedback seems unclear or technically questionable - requires technical rigor and verification, not performative agreement or blind implementation (file: `.agents/skills/receiving-code-review/SKILL.md`)
- refactoring-safely: Refactor legacy or messy code without breaking functionality. Focuses on creating a safety net (tests) first, then applying small, verifiable structural changes. (file: `.agents/skills/refactoring-safely/SKILL.md`)
- requesting-code-review: Use when completing tasks, implementing major features, or before merging to verify work meets requirements (file: `.agents/skills/requesting-code-review/SKILL.md`)
- rules-governance: Repository-wide engineering governance. Use first for any task to enforce TDD-first flow, evidence-based completion reporting, and strict layer boundaries. (file: `.agents/skills/rules-governance/SKILL.md`)
- security: Frontend security — no secrets in code, token handling, XSS; match backend (JWT, CORS) (file: `.agents/skills/security/SKILL.md`)
- skill-creator: Guide for creating effective skills. This skill should be used when users want to create a new skill (or update an existing skill) that extends Codex's capabilities with specialized knowledge, workflows, or tool integrations. (file: `/home/jik/.codex/skills/.system/skill-creator/SKILL.md`)
- skill-installer: Install Codex skills into $CODEX_HOME/skills from a curated list or a GitHub repo path. Use when a user asks to list installable skills, install a curated skill, or install a skill from another repo (including private repos). (file: `/home/jik/.codex/skills/.system/skill-installer/SKILL.md`)
- subagent-driven-development: Use when executing implementation plans with independent tasks in the current session (file: `.agents/skills/subagent-driven-development/SKILL.md`)
- summarizing-sessions: Analyzes conversation history to generate structured session reports, saving them to `docs/sessions/` and summarizing key outcomes. Use when the user asks to wrap up, summarize, or record the current session. (file: `.agents/skills/summarizing-sessions/SKILL.md`)
- systematic-debugging: Use when encountering any bug, test failure, or unexpected behavior, before proposing fixes (file: `.agents/skills/systematic-debugging/SKILL.md`)
- technical-research-and-comparison: Systematically research and compare technical solutions to make informed decisions. (file: `.agents/skills/technical-research-and-comparison/SKILL.md`)
- test-driven-development: Use when implementing any feature or bugfix, before writing implementation code (file: `.agents/skills/test-driven-development/SKILL.md`)
- testing-mastery: Verifies understanding using the Feynman Technique and active recall. Use to ensure the user has actually mastered a "layer" of the curriculum. (file: `.agents/skills/testing-mastery/SKILL.md`)
- typescript-foundation-rules: TypeScript baseline policy. Use before role-specific work to enforce architecture, explicit contracts/types, and verification discipline. (file: `.agents/skills/typescript-foundation-rules/SKILL.md`)
- using-git-worktrees: Use when starting feature work that needs isolation from current workspace or before executing implementation plans - creates isolated git worktrees with smart directory selection and safety verification (file: `.agents/skills/using-git-worktrees/SKILL.md`)
- using-superpowers: ALWAYS READ THIS SKILLS. Use when starting any conversation - establishes how to find and use skills, requiring Skill tool invocation before ANY response including clarifying questions. (file: `.agents/skills/using-superpowers/SKILL.md`)
- verification-before-completion: Use when about to claim work is complete, fixed, or passing, before committing or creating PRs - requires running verification commands and confirming output before making any success claims; evidence before assertions always (file: `.agents/skills/verification-before-completion/SKILL.md`)
- writing-plans: Use when creating executable implementation plans for complex development, refactoring, architecture, or process tasks before coding. (file: `.agents/skills/writing-plans/SKILL.md`)
- writing-skills: Use when creating new skills, editing existing skills, or verifying skills work before deployment (file: `.agents/skills/writing-skills/SKILL.md`)

### How to use skills

- Discovery: The list above is the skills available in this session (name + description + file path). Skill bodies live on disk at the listed paths.
- Trigger rules: If the user names a skill (with `$SkillName` or plain text) OR the task clearly matches a skill's description shown above, you must use that skill for that turn. Multiple mentions mean use them all. Do not carry skills across turns unless re-mentioned.
- Missing/blocked: If a named skill isn't in the list or the path can't be read, say so briefly and continue with the best fallback.
- How to use a skill (progressive disclosure):
  1. After deciding to use a skill, open its `SKILL.md`. Read only enough to follow the workflow.
  2. When `SKILL.md` references relative paths (e.g., `scripts/foo.py`), resolve them relative to the skill directory listed above first, and only consider other paths if needed.
  3. If `SKILL.md` points to extra folders such as `references/`, load only the specific files needed for the request; don't bulk-load everything.
  4. If `scripts/` exist, prefer running or patching them instead of retyping large code blocks.
  5. If `assets/` or templates exist, reuse them instead of recreating from scratch.
- Coordination and sequencing:
  - If multiple skills apply, choose the minimal set that covers the request and state the order you'll use them.
  - Announce which skill(s) you're using and why (one short line). If you skip an obvious skill, say why.
- Context hygiene:
  - Keep context small: summarize long sections instead of pasting them; only load extra files when needed.
  - Avoid deep reference-chasing: prefer opening only files directly linked from `SKILL.md` unless you're blocked.
  - When variants exist (frameworks, providers, domains), pick only the relevant reference file(s) and note that choice.
- Safety and fallback: If a skill can't be applied cleanly (missing files, unclear instructions), state the issue, pick the next-best approach, and continue.
