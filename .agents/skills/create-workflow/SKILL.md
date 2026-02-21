---
name: create-workflow
description: Create custom workflows for repeatable processes. Use when the user wants to define a new standard operating procedure, automation steps, or a specific sequence of actions to be reused.
disable-model-invocation: true
---

# Creating Custom Workflows

This skill guides you through creating custom workflows. Workflows are well-defined steps on how to achieve a particular thing, stored as markdown files.

## When to Use Workflows

Workflows help you:
- **Standardize processes** by defining explicit steps for complex tasks
- **Automate sequences** using turbo mode for command execution
- **Share procedures** across the team for things like deployment, setup, or code review

## Workflow Location

All workflows must be stored in:
`.agent/workflows/`

## Workflow File Format

Create a `.md` file with YAML frontmatter and a markdown body (the steps):

```markdown
---
description: [short title, e.g. how to deploy the application]
---
[specific steps on how to run this workflow]

1. First step description
2. Second step description
```

### Automation Annotations (Turbo Mode)

You can use special annotations to control the `run_command` tool's `SafeToAutoRun` property:

- `// turbo`: Place this line *immediately before* a step involving a command. It permits that specific step's command to auto-run.
- `// turbo-all`: Place this anywhere in the file. It permits *all* steps involving commands in the workflow to auto-run.

## Workflow Creation Workflow

### Step 1: Identify the Scope
Determine the sequence of actions. Is it a deployment? A setup script? A testing protocol?

### Step 2: Create the File
Create a new markdown file in `.agent/workflows/` with a kebab-case name.

```bash
touch .agent/workflows/my-workflow.md
```

### Step 3: Define Configuration
Write the YAML frontmatter with the `description` field. This description is used by the agent to understand *when* to use this workflow.

### Step 4: Write the Steps
List the instructions. Be specific. If commands are involved, specify exactly what to run.

### Step 5: Test the Workflow
Ask the agent to run the workflow to verify the steps are clear and the turbo annotations work as expected.

## Example Workflow

### Deployment Workflow (`.agent/workflows/deploy-production.md`)

```markdown
---
description: Deploy the application to the production environment
---
// turbo-all
1. Check that the git status is clean using `git status`
2. Run the build script `npm run build`
3. Deploy to the server using `npm run deploy`
```

### Setup Workflow (`.agent/workflows/setup-env.md`)

```markdown
---
description: Setup local development environment
---
1. Copy the example env file
// turbo
2. Run `cp .env.example .env`
3. Install dependencies
// turbo
4. Run `npm install`
```

## Best Practices

1. **Descriptive Filenames**: Use names that clearly indicate the action (e.g., `run-tests.md`, `db-migration.md`).
2. **Clear Descriptions**: The frontmatter description is key for retrieval.
3. **Safety First**: Only use `// turbo` or `// turbo-all` for non-destructive commands or when you are confident in the automation.
