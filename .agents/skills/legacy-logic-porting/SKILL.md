---
name: legacy-logic-porting
description: Skill for porting legacy business logic and components from 'meeting_minutes_front' to the new React 19 + Vite 7 architecture. Ensures adherence to 'Pure Standards' and Facade patterns.
---

# Legacy Logic Porting Skill

This skill provides a systematic approach to migrating logic from the legacy `meeting_minutes_front` project to the modern `react_new` codebase.

## Core Conversion Principles

1. **Facade Service Pattern**: Instead of calling `axiosInstance` directly in components or scattered files, all API calls must be encapsulated within a service Facade (e.g., `geminiService`, `authService`).
2. **Type Safety**: New types must be added to `src/types.ts` (or the root `types.ts`) before implementing logic.
3. **Design Consistency**: UI components must use the shared `Components.tsx` library and design tokens for "Premium" aesthetics.
4. **Directory Agnosticism**: Use relative paths for all internal references.

## Migration Workflow

### 1. Analysis phase
- Identify the logic in `meeting_minutes_front/src/...`.
- Check if the target API endpoint exists in `react_new/api/modules`.
- If not, use the `creating-react-api-modules` skill to create it.

### 2. Service Implementation
- Map the legacy function calls to the new `axiosInstance` structure.
- Adhere to the `axiosInstance` response interceptor which automatically handles token renewal and standardized errors.

### 3. State Management
- Prefer local hooks (`useState`, `useReducer`) or specific global stores if required.
- Maintain compatibility with the `App.tsx` global state where relevant.

## Mapping Resources

Refer to the following resources for detailed mapping:
- [mapping-rules.md](resources/mapping-rules.md): API and State mapping logic.
- [ui-standards.md](resources/ui-standards.md): Visual property conversion (colors, spacing).
