---
name: evolving-skills
description: Dynamically updates and refines the agent's skills based on proven best practices and high-quality patterns discovered during development. Includes a strict filter to exclude temporary hacks or short-term fixes.
---

# Evolving Skills (Premium Quality Filter)

## When to use this skill
- After a successful implementation that feels "Premium" or "Sexy".
- When a new, highly maintainable pattern is established.
- When the user praises a specific architectural decision that should be standardized.
- **NEVER** use for temporary workarounds, ad-hoc fixes, or "dirty" code.

## The Quality Filter (The 3-Step Test)
Before updating any skill, the new insight must pass the **GOLDEN TEST**:
1.  **Maintainability**: Does this simplify future changes? (Yes = Pass)
2.  **Aesthetics (Sexy)**: Is the code elegant, readable, and "premium"? (Yes = Pass)
3.  **Longevity**: Will this be relevant 12 months from now? (Yes = Pass)

*If any answer is "No", discard it from the skill evolution. Keep it in session notes only.*

## Workflow
1.  **Identify Excellence**: Spot a pattern that passes the Golden Test.
2.  **Abstract the Pattern**: Remove project-specific variables; keep the architectural logic.
3.  **Update Target Skill**: Use `multi_replace_file_content` to integrate the pattern into the relevant `SKILL.md`.
4.  **Log the Evolution**: Record *why* this change was made in the skill's history or a `CHANGELOG.md`.

## Instructions
- Focus on: Clean Architecture, Design Patterns (SOLID, DRY), Premium UI/UX Heuristics.
- Reject: Quick hacks, complex "clever" code that is hard to read, temporary library versions.
