---
name: summarizing-sessions
description: Analyzes conversation history to generate structured session reports, saving them to `docs/sessions/` and summarizing key outcomes. Use when the user asks to wrap up, summarize, or record the current session.
---

# Summarizing Sessions

## When to use this skill
- When the user asks to "summarize this session", "wrap up", "create a meeting record", or "what did we do today?".
- When you need to persist the context of a long session for future reference.

## Workflow

### 1. Analyze the Session
- Review the entire conversation history from the beginning.
- Identify:
  - **User's primary goal** (from the first few requests).
  - **Major tools used** (file edits, commands).
  - **Key decisions** made during brainstorming or planning.
  - **Skill Evolution Opportunities**: Identify if any "Sexy Code" or Premium patterns were established (use `pure-standards`).
  - **Pending items** or next steps.


### 2. Generate Report
- Determine the session type:
  - **Brainstorming**: If the session involved exploring options, making strategic decisions, or "ideas", use `.agent/skills/summarizing-sessions/resources/brainstorming_template.md`.
  - **General**: For standard coding or implementation tasks, use `.agent/skills/summarizing-sessions/resources/template.md`.
- Read the selected template file.
- Fill in the template fields with the analyzed data.
  - Ensure the **Date** is in `YYYY-MM-DD` format.
  - Be specific about **Files Modified** (use relative paths).
  - Extract **Insights** that might be useful for future contexts (e.g., "User prefers simple CSS over Tailwind").

### 3. Save the Report
- Determine the filename: `docs/sessions/YYYY-MM-DD-<topic-slug>.md`.
  - Example: `docs/sessions/2024-03-20-implementing-auth.md`.
- Ensure the `docs/sessions/` directory exists (create it if not).
- Write the generated content to the file.

### 4. Notify User
- Output a brief confirmation in the chat:
  > "✅ Session summary saved to `docs/sessions/...`. Here is the high-level recap:"
- Follow with a bullet-point summary of the **Top 3 Achievements** of the session.

## Instructions
- **Detail Level**: The Markdown file should be detailed (for the agent's memory), but the chat output should be concise (for the user).
- **Technical Accuracy**: lists of created files must be accurate. Use `git status` or file system checks if you are unsure what changed.
- **Tone**: Professional and organized.

## Resources
- [Session Template](resources/template.md)
- [Brainstorming Template](resources/brainstorming_template.md)
