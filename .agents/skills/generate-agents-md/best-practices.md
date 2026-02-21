# AGENTS.md Best Practices Reference

Based on analysis of 2,500+ repositories and industry standards from GitHub Copilot, Builder.io, and Cursor teams.

## Core Principles

### 1. Conciseness Over Completeness

**Goal**: 50-150 lines for subdirectory files, under 500 for root.

✅ DO:
- Remove generic advice that applies to ALL projects
- Focus on project-specific deviations
- Use telegraphic style (omit articles, be brief)

❌ DON'T:
- Explain basic concepts agents already know
- Include obvious information ("JavaScript is a programming language")
- Write prose when bullet points suffice

### 2. Structure Consistency

**Standard sections** (in order):
1. OVERVIEW (1-2 sentences)
2. STRUCTURE (tree view)
3. WHERE TO LOOK (task → location table)
4. COMMANDS (dev/test/build)
5. CONVENTIONS (project-specific)
6. ANTI-PATTERNS (explicitly forbidden)
7. SKILLS & RULES REFERENCE
8. BEST PRACTICES (application guidelines)
9. DO's and DON'Ts (quick reference)

### 3. Hierarchical Organization

```
./AGENTS.md                    # Root - project overview
├── backend/AGENTS.md          # Backend-specific
├── frontend/AGENTS.md         # Frontend-specific
├── packages/
│   ├── core/AGENTS.md         # Package-specific
│   └── utils/AGENTS.md        # Package-specific
└── shared/AGENTS.md           # Shared components
```

**Rules**:
- Root NEVER includes subdirectory details
- Children NEVER repeat parent content
- Cross-reference with relative links

## Skills Documentation

### Categorization Standards

Organize skills into 6 categories:

| Category | Examples | When to Include |
|----------|----------|-----------------|
| **Core Development** | TDD, debugging, refactoring | Always if present |
| **Code Quality** | Review, testing, verification | Always if present |
| **Domain-Specific** | Spring, React, Python | Group by domain |
| **Workflow** | Git, collaboration | Always if present |
| **Research** | Technical comparison | Optional |
| **Infrastructure** | Context loading | Always if present |

### Table Format

```markdown
**Category Name:**
| Skill | Purpose | When to Use |
|-------|---------|-------------|
| `skill-name` | One-line description | Trigger condition |
```

**Rules**:
- Use code backticks for skill names
- Purpose: max 10 words
- When to Use: specific trigger, not generic

## Rules Documentation

### Categorization Standards

Organize rules by type:

| Category | File Pattern | Order |
|----------|--------------|-------|
| **General** | `general/*.mdc` | 1st |
| **Backend** | `java/*.mdc`, `spring-*.mdc` | 2nd |
| **Frontend** | `typescript/*.mdc`, `react-*.mdc` | 3rd |
| **Python** | `python/*.mdc` | 4th |
| **Other** | `go/*.mdc`, `rust/*.mdc` | 5th |

### Reference Format

```markdown
**Category Rules:**
| Rule | Purpose |
|------|---------|
| `rule-name.mdc` | Clear description |
```

**Rules**:
- Include `.mdc` extension
- Purpose should explain WHEN to use
- Sort alphabetically within category

## Best Practices Section

### Skills Application

Document 5 key practices:

1. **Load Context First**
   ```typescript
   skill("loading-project-context")
   ```

2. **Mandatory Skill Loading**
   ```typescript
   delegate_task(
     category="...",
     load_skills=["skill-1", "skill-2"]  // Never empty
   )
   ```

3. **Evaluate All Skills**
   - Check domain overlap
   - Justify exclusions

4. **Prioritize User Skills**
   - User-installed skills get priority
   - Include when domain matches

5. **Parallel Application**
   ```typescript
   // Fire multiple agents for complex tasks
   delegate_task(agent="explore", prompt="...")
   delegate_task(agent="librarian", prompt="...")
   ```

### Rules Application

Document 4 key practices:

1. **Hierarchical Loading**
   ```
   General → Language → Domain → Project
   ```

2. **Format Compliance**
   ```yaml
   ---
   description: Clear description
   globs: path/to/files/*.ext
   alwaysApply: boolean
   ---
   ```

3. **Cross-Referencing**
   ```markdown
   See [rule-name](mdc:path/to/rule.mdc)
   ```

4. **Regular Updates**
   - Update when patterns emerge in 3+ files
   - Sync with code changes

## Anti-Patterns to Document

### File Organization

- **Over-documenting**: Not every directory needs AGENTS.md
- **Redundancy**: Child repeats parent content
- **Generic content**: Applies to ALL projects
- **Outdated info**: Stale patterns, old versions

### Content Quality

- **Verbose**: Long prose instead of bullets
- **Vague**: "Be careful" instead of "DO NOT X"
- **Inconsistent**: Mixed terminology
- **Incomplete**: Missing critical constraints

### Maintenance

- **Never updated**: Created once, abandoned
- **Not versioned**: Changes not tracked
- **No ownership**: No one maintains it

## Language-Specific Patterns

### Java/Spring

**Include**:
- Layer access matrix (Controller/Service/Repository/Entity)
- Constructor injection requirement
- Transaction boundaries
- DTO two-layer pattern

**Example**:
```markdown
## LAYER ACCESS MATRIX
| From \ To | Utils | DTO | Repository | Entity | Service | Controller |
|-----------|-------|-----|------------|--------|---------|------------|
| **Utils** | ✅ | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 |
| **Service** | ✅ | 🚫 | ✅ | ✅ | ✅ | 🚫 |
| **Controller** | ✅ | ✅ | 🚫 | 🚫 | ✅ | ✅ |
```

### React/TypeScript

**Include**:
- Layer access matrix (Component/Hook/API)
- State management approach
- Data fetching patterns
- Type strictness rules

**Example**:
```markdown
## LAYER ACCESS MATRIX
| From \ To | Utils | Component | Hook | API |
|-----------|-------|-----------|------|-----|
| **Component** | ✅ | ✅ | ✅ | 🚫 |
| **Hook** | ✅ | 🚫 | ✅ | ✅ |
```

### Python

**Include**:
- Type hint requirements
- Docstring style
- Testing framework
- Virtual environment setup

## Commands Section

### Structure

```markdown
## COMMANDS

```bash
# Development
npm run dev

# Testing
npm test
npm run test:unit

# Build
npm run build

# Lint
npm run lint
```
```

**Rules**:
- Group by purpose (Development, Testing, Build, Deploy)
- Use comments to explain WHEN to use
- Include full command with flags

## Conventions Section

### Project-Specific Only

✅ DO:
- "Use MUI v3, ensure compatibility"
- "API docs use Korean/English format"
- "Mobile-first design"

❌ DON'T:
- "Use functions" (generic)
- "Write clean code" (subjective)
- "Follow best practices" (vague)

### Specificity Levels

| Level | Example |
|-------|---------|
| **High** | "Use `css={{}}` prop format for Emotion" |
| **Medium** | "Use design tokens from `DynamicStyles.tsx`" |
| **Low** | "Avoid hard-coding colors" |

## Anti-Patterns Section

### Format

Use bold imperative:
```markdown
## ANTI-PATTERNS

- **DO NOT** hard code colors
- **NEVER** use `any` type
- **AVOID** prop drilling
- **NO** reflection in backend
```

### Content

- Be specific: "DO NOT use class components" not "Avoid old patterns"
- Include reason: "(legacy, being migrated)"
- Cross-reference: "See [Migration Guide](link)"

## Do's and Don'ts Section

### Format

```markdown
## DO's and DON'Ts

### Topic
✅ DO:
- Specific action 1
- Specific action 2

❌ DON'T:
- Specific anti-pattern 1
- Specific anti-pattern 2
```

### Categories

Group by domain:
- React/TypeScript
- Java/Spring
- Python
- Testing
- Git/Workflow

## Research Sources

When documenting best practices, cite:
- GitHub Copilot blog (2,500+ repos analysis)
- Builder.io AGENTS.md guide
- Cursor agent best practices
- Project-specific patterns

## Quality Checklist

Before finalizing AGENTS.md:

- [ ] Under 500 lines (root) / 150 lines (subdirs)
- [ ] Project-specific (no generic advice)
- [ ] Telegraphic style (concise)
- [ ] All skills categorized
- [ ] All rules grouped by type
- [ ] Commands tested and working
- [ ] Anti-patterns specific and actionable
- [ ] Cross-references valid
- [ ] No redundancy with parent files
- [ ] Examples concrete, not abstract

## Update Frequency

| Trigger | Action |
|---------|--------|
| New pattern in 3+ files | Update conventions |
| New skill added | Add to skills reference |
| New rule added | Add to rules reference |
| Breaking change | Update anti-patterns |
| Quarterly | Full review |

## References

- GitHub Copilot: "How to write a great agents.md" (2,500+ repos)
- Builder.io: "Improve your AI code output with AGENTS.md"
- Cursor: "Best practices for coding with agents"
- AGENTS.md spec: https://agentsmd.io/
