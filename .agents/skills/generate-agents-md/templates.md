# AGENTS.md Templates

## Root AGENTS.md Template

```markdown
# PROJECT KNOWLEDGE BASE

**Generated:** {TIMESTAMP}
**Type:** {project-type}

## OVERVIEW

{1-2 sentences: what the project does + core stack}

## STRUCTURE

```
project-root/
├── directory-1/     # Purpose description
├── directory-2/     # Purpose description
└── file.ext         # Purpose
```

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| Task 1 | `path/to/files/` | Specific note |
| Task 2 | `path/to/files/` | Specific note |

## COMMANDS

```bash
# Development
command-to-start-dev

# Testing
command-to-run-tests

# Build
command-to-build

# Other
command-for-other-task
```

## CONVENTIONS

- **Category 1**: Specific rule
- **Category 2**: Specific rule
- **Category 3**: Specific rule

## ANTI-PATTERNS

- **DO NOT** specific forbidden action
- **NEVER** specific forbidden action
- **AVOID** discouraged pattern

## SKILLS & RULES REFERENCE

### Core Development Skills
| Skill | Purpose | When to Use |
|-------|---------|-------------|
| `skill-name` | Description | Trigger |

### Code Quality Skills
| Skill | Purpose | When to Use |
|-------|---------|-------------|
| `skill-name` | Description | Trigger |

### Domain-Specific Skills
| Skill | Purpose | When to Use |
|-------|---------|-------------|
| `skill-name` | Description | Trigger |

### General Rules
| Rule | Purpose |
|------|---------|
| `rule-name.mdc` | Description |

### Language-Specific Rules
| Rule | Purpose |
|------|---------|
| `rule-name.mdc` | Description |

## BEST PRACTICES

### Skill Application
1. Always load project context first
2. Include relevant skills in load_skills
3. Evaluate all skills for each request
4. Prioritize user-installed skills

### Rule Application
1. Load general rules first
2. Load language-specific rules
3. Load domain-specific rules
4. Cross-reference with [file](mdc:path)

## DO's and DON'Ts

### Category 1
✅ DO:
- Specific action
- Specific action

❌ DON'T:
- Specific anti-pattern
- Specific anti-pattern

### Category 2
✅ DO:
- Specific action
- Specific action

❌ DON'T:
- Specific anti-pattern
- Specific anti-pattern
```

## Subdirectory AGENTS.md Template

```markdown
# {Directory} Knowledge Base

**Path:** `{directory-path}/`
**Type:** {directory-type}

## OVERVIEW

Brief description of this directory's purpose.

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| Task 1 | `path/` | Note |
| Task 2 | `path/` | Note |

## COMMANDS

```bash
# Development
command

# Testing
command
```

## CONVENTIONS

- Convention specific to this directory
- Another convention

## ANTI-PATTERNS

- **DO NOT** directory-specific forbidden action
- **NEVER** directory-specific forbidden action

## LAYER ACCESS MATRIX

| From \ To | A | B | C | D |
|-----------|---|---|---|---|
| **A** | ✅ | 🚫 | ✅ | 🚫 |
| **B** | ✅ | ✅ | 🚫 | 🚫 |
```

## Skills Reference Table Template

```markdown
**{Category} Skills:**
| Skill | Purpose | When to Use |
|-------|---------|-------------|
| `skill-1` | Brief description | Trigger condition |
| `skill-2` | Brief description | Trigger condition |
| `skill-3` | Brief description | Trigger condition |
```

## Rules Reference Table Template

```markdown
**{Category} Rules:**
| Rule | Purpose |
|------|---------|
| `rule-1.mdc` | Clear description of what it governs |
| `rule-2.mdc` | Clear description of what it governs |
| `rule-3.mdc` | Clear description of what it governs |
```

## Do's and Don'ts Section Template

```markdown
### {Topic}
✅ DO:
- {Specific action with context}
- {Specific action with context}
- {Specific action with context}

❌ DON'T:
- {Specific anti-pattern with consequence}
- {Specific anti-pattern with consequence}
```

## Layer Access Matrix Templates

### Java/Spring Matrix

```markdown
## LAYER ACCESS MATRIX (Java)

| From \ To | Utils | DTO | Validator | Repository | Entity | Service | Controller |
|-----------|-------|-----|-----------|------------|--------|---------|------------|
| **Utils** | ✅ | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 |
| **DTO** | ✅ | ✅ | ✅ | 🚫 | 🚫 | 🚫 | 🚫 |
| **Validator** | ✅ | 🚫 | ✅ | ✅ | ✅ | 🚫 | 🚫 |
| **Repository** | ✅ | 🚫 | 🚫 | ✅ | ✅ | 🚫 | 🚫 |
| **Service** | ✅ | 🚫 | ✅ | ✅ | ✅ | ✅ | 🚫 |
| **Controller** | ✅ | ✅ | ✅ | 🚫 | 🚫 | ✅ | ✅ |
```

### React Matrix

```markdown
## LAYER ACCESS MATRIX (React)

| From \ To | Utils | Component | Hook | API |
|-----------|-------|-----------|------|-----|
| **Utils** | ✅ | 🚫 | 🚫 | 🚫 |
| **Component** | ✅ | ✅ | ✅ | 🚫 |
| **Hook** | ✅ | 🚫 | ✅ | ✅ |
| **API** | ✅ | 🚫 | 🚫 | ✅ |
```

## Commands Section Template

```markdown
## COMMANDS

```bash
# Development
{command}  # Start dev server
{command}  # Run with hot reload

# Testing
{command}  # Run all tests
{command}  # Run unit tests only
{command}  # Run with coverage

# Build
{command}  # Production build
{command}  # Check build output

# Lint/Format
{command}  # Check code style
{command}  # Fix auto-fixable issues

# Database (if applicable)
{command}  # Run migrations
{command}  # Seed database
```
```

## Conventions Section Template

```markdown
## CONVENTIONS

- **Naming**: {Specific naming convention}
- **Architecture**: {Specific architectural pattern}
- **Dependencies**: {Dependency management rules}
- **Documentation**: {Documentation style/format}
- **Testing**: {Testing requirements}
- **Deployment**: {Deployment process}
```

## Anti-Patterns Section Template

```markdown
## ANTI-PATTERNS

- **DO NOT** {specific action} - {reason}
- **NEVER** {specific action} - {reason}
- **AVOID** {pattern} - {reason}
- **NO** {practice} - {reason}
```

## Variable Substitutions

When generating AGENTS.md, replace these variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `{TIMESTAMP}` | Generation date | 2026-02-10 |
| `{project-type}` | Project classification | React 19 SPA |
| `{directory-path}` | Subdirectory path | backend/ |
| `{directory-type}` | Directory classification | Spring Boot API |
| `{Category}` | Skills/rules category | Core Development |
| `{Topic}` | Do's/Don'ts topic | React Components |

## Size Guidelines

| File Type | Target Size | Max Size |
|-----------|-------------|----------|
| Root AGENTS.md | 300-400 lines | 500 lines |
| Subdirectory AGENTS.md | 50-100 lines | 150 lines |
| Skills table | 5-10 entries | 15 entries |
| Rules table | 5-10 entries | 15 entries |
| Do's/Don'ts section | 4-8 items | 12 items |
