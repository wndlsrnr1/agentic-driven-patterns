---
name: loading-project-context
description: Reads AGENTS.md to establish project context BEFORE processing ANY user request. MUST USE when starting a new conversation, when the project context is unclear, when working in a new directory, when switching between different parts of a monorepo, or when the user mentions unfamiliar project terms, patterns, or technologies.
---

# Loading Project Context

## Critical Rule

**ALWAYS read AGENTS.md first** before processing any request or executing any command.

## Execution Steps

When you receive a request:

1. **Read the AGENTS.md file** from the root directory
2. **Analyze the project structure** described in AGENTS.md
3. **Identify the relevant section** for the current task
4. **Follow the conventions and patterns** specified in AGENTS.md

## What to Look For in AGENTS.md

### 1. Project Overview
- Project type and stack
- Architecture patterns
- Service boundaries

### 2. Directory Structure
- Where to find specific types of files
- Module organization
- Service locations

### 3. Skills & Rules Routing
- Which skills to apply for different directories
- Rule files to follow
- Technology-specific guidelines

### 4. Conventions
- Coding standards for each technology
- Naming conventions
- Architecture patterns

### 5. Anti-Patterns
- What NOT to do
- Common mistakes to avoid

## AGENTS.md Location

The main AGENTS.md file is located at:
```
{project_root}/AGENTS.md
```

Note: Some subdirectories (like `whisper_stt/`) may have their own AGENTS.md files for specific contexts.

## Verification Checklist

Before proceeding with any task:

- [ ] AGENTS.md has been read and understood
- [ ] Relevant section for current task identified
- [ ] Technology-specific conventions noted
- [ ] Anti-patterns for the technology acknowledged

## After Reading AGENTS.md

Once you've loaded the project context:

1. Apply the relevant skills and rules specified
2. Follow the established patterns and conventions
3. Use the directory structure guidance for file locations
4. Respect the anti-patterns and avoid prohibited approaches

---

**Remember**: AGENTS.md is the single source of truth for project conventions. Never assume standard patterns—always verify with AGENTS.md first.
