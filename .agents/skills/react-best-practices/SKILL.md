---
name: react-best-practices
description: Core guidelines for React 19 development, focusing on State Management (Global vs Form) and Component Architecture. Merges best practices for Client State, Server State, and Complex Forms.
---

# React Best Practices & State Management

## Overview
This skill consolidates the "Golden Rules" for managing state and logic in our React application.

---

## Part 1: Global State (Client vs Server)

### 1. The Separation Principle
- **Server State**: Data from API. **MUST** use `TanStack Query (React Query)`.
  - *Why?* Caching, loading states, and deduplication are handled automatically.
  - *Rule*: Never store API data in Redux/Zustand unless manually persisting offline.
- **Client State**: UI state (Theme, Sidebar, Modals) or Session (Auth Token).
  - *Rule*: Use a global store (Redux Toolkit/Zustand) or Context.

### 2. Global Store Pattern (if using Redux Toolkit)
- **Slices**: Use `createSlice` for modularity.
- **Selectors**: Access state ONLY via selectors (e.g., `useSelector(selectCurrentUser)`), never raw state.
- **Immutability**: RTK handles this via Immer.

---

## Part 2: Form State Management

### 1. When to use what?
- **Simple Form (< 3 fields)**: `useState` is fine.
- **Complex Form (> 3 fields / Dependencies)**: Use `useReducer` or `react-hook-form`.

### 2. The Custom Hook Pattern
Encapsulate form logic separate from the UI component.

```typescript
// useUserForm.ts
export function useUserForm() {
  const [state, dispatch] = useReducer(formReducer, initialState);

  const handleSubmit = () => {
    // Validation logic here
    if (isValid) submit();
  };

  return { state, dispatch, handleSubmit };
}
```

### 3. Rules
- **No Direct SetState**: Expose semantic handlers (`handleNameChange`) instead of raw setters.
- **Validation**: Track `errors` object in the state.

---

## Part 3: Component Architecture

- **Container/Presenter**: Separate logic (Container) from rendering (Presenter) for complex screens.
- **Custom Hooks**: Extract any logic used by more than one component.
- **Prop Drilling**: Avoid it deeper than 2 levels; use Composition or Context.
