# UI Standards for Ported Components

## Visual Constraints
All ported components must use the "Vibrant & Premium" design system.

### Colors
- **Brand**: Use `brand-500` (#6366f1 equivalent) for primary actions.
- **Glassmorphism**: Use `backdrop-blur-md` and `bg-white/70` for overlays.

### Typography
- Header: `font-bold text-gray-900`
- Body: `text-sm text-gray-600`

### Buttons
- Use the standard `Button` component if available, or apply:
  - `bg-brand-500 text-white rounded-xl px-4 py-2 hover:bg-brand-600 transition-all`

## Animation Rules
- Every interaction must have a subtle transition.
- Use `transition-all duration-300 ease-in-out`.
