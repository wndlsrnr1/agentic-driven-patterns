---
name: brand-identity
description: Provides the single source of truth for brand guidelines, design tokens, technology choices, and voice/tone. Use this skill whenever generating UI components, styling applications, writing copy, or creating user-facing assets to ensure brand consistency.
---

# Brand Identity & Guidelines

**Brand Name:** Summarize React (Premium AI Summarizer)

This skill defines the core constraints for visual design and technical implementation for the brand. You must adhere to these guidelines strictly to maintain consistency.

## Source of Truth: Gold Standard Components
If you are unsure about the design pattern, refer to these "Gold Standard" files:
- `src/pages/user/features/project/components/ProjectList.jsx` (List & Card pattern)
- `src/pages/user/features/project/components/session/SessionDialog.jsx` (Dialog & Form pattern)
- `src/pages/user/features/project/dialogs/QuestionnaireDialog.jsx` (AI Integration pattern)

## Reference Documentation (Resources)

Depending on the task you are performing, use `view_file` to consult the specific resource files below. Do not guess brand elements; always read the corresponding file.

### 1. For Visual Design & UI Styling (`resources/design-tokens.json`)
Read this when you need exact values for:
- **Colors** (Primary: #0071e3, Success: #10B981, Background: Solid White)
- **Typography** (SF Pro/Inter stack)
- **Brand Patterns** (The `|` vertical bar indicator pattern)

### 2. For Coding & Tech Stack (`resources/tech-stack.md`)
Read this when you are generating boilerplate or choosing libraries:
- **Style:** "Solid White Tone & Manner" (No translucency, heavy rounded corners)
- **Frameworks:** React (Vite 7) + Tailwind CSS
- **Constraints:** Never use `bg-white/70` for main cards; use `bg-white`.

### 3. For Copywriting & Voice (`resources/voice-tone.md`)
Read this when you are writing user-facing text:
- **Tone:** Professional, direct, and "AI-Efficient".
- **Syntax:** Always prefix form labels and list structural items with a bold `|`.

## Usage Instructions

1.  **Identify the nature of the task** (UI? Code? Copy?).
2.  **Read the specific resource file** listed above.
3.  **Apply constraints strictly**. Ensure all new components use the `|` indicator and solid backgrounds.
4.  If a value is missing, check the **Gold Standard Components** listed above.
