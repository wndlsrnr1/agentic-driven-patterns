# Preferred Tech Stack & Implementation Rules

When generating code or UI components for this brand, you **MUST** strictly adhere to the following technology choices and design patterns.

## Core Stack
* **Framework:** React (Vite 7)
* **Styling Engine:** Tailwind CSS
* **Component Library:** shadcn/ui (Customized for Premium Tone & Manner)
* **Icons:** Lucide React

## Design System: "Solid White Tone & Manner"

### 1. Color Strategy
* **Solid Backgrounds:** Always use solid white (`bg-white`) for Cards and Dialogs. Avoid translucency (`bg-white/70`) or heavy backdrop blurs unless specifically for overlays.
* **Apple Blue:** Use `#0071e3` (Primary) for buttons, active states, and primary indicators.
* **Tertiary Colors:** Use `#86868b` for secondary text and `#1d1d1f` for primary headings.

### 2. Branding Patterns (Visual Identity)
* **Vertical Bar Indicator (`|`):** 
    * Every session title, guideline title, and form label MUST be prefixed with a vertical bar `|`.
    * **Color Guide:**
        * Primary/Blue (`#0071e3`) for Projects, Sessions, and Form Labels.
        * Emerald/Green (`#10B981`) for Guidelines/Questionnaires.
    * **Example implementation:** `<span className="text-primary font-bold">|</span> <span>Label</span>`

### 3. Component Architecture
* **Cards:** Use `rounded-[2rem]` with `bg-white` and `shadow-xl shadow-gray-200/40`.
* **Dialogs:** 
    * Use `rounded-[1.5rem]` or `rounded-[2rem]`.
    * Background MUST be `bg-white`.
    * Max height for content-heavy dialogs should be `max-h-[80vh]`.
* **Inputs/Selects:** 
    * Use `bg-white` and `rounded-xl`.
    * Avoid gray backgrounds (`bg-gray-50`) for interactive inputs to maintain the "Solid White" look.

### 4. Forbidden Patterns
* Do NOT use standard gray-on-gray UI patterns.
* Do NOT use semi-transparent backgrounds for main containers.
* Do NOT remove the automatic AI generation logic when modifying file upload components.
* Do NOT change text labels unless specifically requested; focus solely on the visual style.
