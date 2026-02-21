---
name: generate-agents-md
description: Generate hierarchical AGENTS.md files documenting .opencode skills and rules with industry best practices. Scans project structure, discovers configurations, and creates comprehensive knowledge base files following standards from 2,500+ repository analysis.
---

# Generate AGENTS.md

Generate hierarchical AGENTS.md files that serve as your project's knowledge base for AI coding agents.

## When to Use

- **New projects**: Create initial AGENTS.md with complete skills/rules documentation
- **Updates**: Refresh after adding new skills or rules to .opencode/
- **Complex projects**: Create subdirectory AGENTS.md files for different domains
- **Best practices**: Include internet-researched standards and patterns

## Quick Start

```bash
# Generate AGENTS.md for current project
generate-agents-md

# Force regeneration (delete existing first)
generate-agents-md --create-new

# Limit directory depth

generate-agents-md --max-depth=2
```

## Workflow

### Phase 1: Discovery

**Mark "discovery" as in_progress in todo list.**

1. **Scan .opencode directory**
   - Find all skills in `.opencode/skills/`
   - Find all rules in `.opencode/rules/`
   - Read SKILL.md and rule files

2. **Analyze project structure**
   - Count files per directory
   - Measure complexity
   - Find existing AGENTS.md files

3. **Launch explore agents** (parallel)
   - Categorize skills by domain
   - Group rules by type
   - Extract project patterns

**Mark "discovery" as completed.**

### Phase 2: Scoring

**Mark "scoring" as in_progress.**

Score directories based on:
- File count (>20 = high)
- Subdirectory count (>5 = high)
- Code concentration (>70% = high)
- Unique patterns (has config = medium)
- Module boundaries (has index.ts = medium)

Decision rules:
- Score > 15: Create AGENTS.md
- Score 8-15: Create if distinct domain
- Score < 8: Skip (parent covers)
- Root (.): ALWAYS create

**Mark "scoring" as completed.**

### Phase 3: Generation

**Mark "generate" as in_progress.**

Create root AGENTS.md with sections:

1. **OVERVIEW** - Project description (1-2 sentences)
2. **STRUCTURE** - Directory tree with purposes
3. **WHERE TO LOOK** - Task-to-location mapping
4. **COMMANDS** - Dev/test/build commands
5. **CONVENTIONS** - Project-specific patterns
6. **ANTI-PATTERNS** - Explicitly forbidden practices
7. **SKILLS REFERENCE** - Categorized skills table
8. **RULES REFERENCE** - Categorized rules table
9. **BEST PRACTICES** - Application guidelines
10. **DO's and DON'Ts** - Quick reference

**Skills Categorization:**
- Core Development: TDD, debugging, refactoring
- Code Quality: Review, testing, verification
- Domain-Specific: Language/framework skills
- Workflow: Git, collaboration, sessions
- Research: Technical comparison, analysis
- Infrastructure: Context loading, utilities

**Rules Categorization:**
- General: cursor_rules, code-principles
- Backend: spring-*, java-*
- Frontend: react-*, typescript-*
- Python: python-*

**Mark "generate" as completed.**

### Phase 4: Review

**Mark "review" as in_progress.**

Quality checklist:
- [ ] Under 500 lines (root), 150 lines (subdirs)
- [ ] Skills categorized logically
- [ ] Rules grouped by type
- [ ] No generic advice (project-specific only)
- [ ] Telegraphic style (concise)
- [ ] Child files don't repeat parent content

**Mark "review" as completed.**

## Best Practices (From Industry)

### AGENTS.md Structure
1. Keep concise (50-150 lines for subdirs)
2. Use standard structure
3. Hierarchical organization
4. Update when patterns appear in 3+ files
5. Evidence-driven improvements

### Skills Application
1. Always load project context first
2. Include relevant skills in load_skills
3. Evaluate all skills for each request
4. Prioritize user-installed skills
5. Use parallel application for complex tasks

### Rules Application
1. Hierarchical loading: General → Language → Domain
2. Use .mdc format with frontmatter
3. Cross-reference with [file](mdc:path) format
4. Maintain and update regularly

## Example Output

### Skills Table Format

```
**Core Development Skills:**
| Skill | Purpose | When to Use |
|-------|---------|-------------|
| brainstorming | Creative exploration | Before creative work |
| test-driven-development | TDD workflows | Before implementation |
| systematic-debugging | Debugging | When fixing bugs |
```

### Rules Table Format

```
**General Rules:**
| Rule | Purpose |
|------|---------|
| cursor_rules.mdc | Entry point - load first |
| code-principles.mdc | Code standards |
```

## Anti-Patterns

- Static agent count (vary by project size)
- Sequential execution (use parallel)
- Ignoring existing AGENTS.md
- Over-documenting (not every dir needs one)
- Redundancy (child repeats parent)
- Generic content (applies to ALL projects)
- Verbose style (use telegraphic)

## Commands

```bash
generate-agents-md              # Generate/update
generate-agents-md --create-new # Force regeneration
generate-agents-md --max-depth=2 # Limit depth
generate-agents-md --dry-run    # Preview only
```

## Additional Resources

- See [examples.md](examples.md) for detailed examples
- See [templates.md](templates.md) for AGENTS.md templates
- See [best-practices.md](best-practices.md) for reference

## Summary

This skill creates comprehensive AGENTS.md files that:
1. Document all .opencode skills and rules
2. Include internet-researched best practices
3. Follow industry standards (2,500+ repos)
4. Support hierarchical structures
5. Provide clear, actionable guidance
