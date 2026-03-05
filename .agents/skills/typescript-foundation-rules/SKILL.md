---
name: typescript-foundation-rules
description: whenever you write code in typescript, apply this rule
---

# Typescript Foundation Rules

## Overview

Apply the TypeScript baseline first, then layer-specific rules.

## Dependency Order

- `rules-governance`

## Team Conventions

- Apply the language baseline architecture first, then layer-specific rules.
- Keep types and contracts explicit.
- Prioritize shared quality standards (TDD, evidence-based reporting).

## Mandatory Workflow

1. Define the behavior change and verification commands first.
2. Write a failing test first (RED).
3. Implement the minimum change to reach GREEN.
4. Refactor, then run full verification.
5. Report results with command-output evidence.

## Overengineering Replacement Checklist (Mandatory)

Use this checklist during TypeScript code review/refactor. Replace each anti-pattern with the corresponding principle.

### 1) Instead of excessive abstraction (wrappers/helpers/classes everywhere)

- Is this abstraction removing duplication or creating new duplication?
- If removing this layer makes call sites clearer, remove it.
- Is the protected "change axis" explicit and real?
- Is the same concept reused by 2+ functions? If not, inline first.
- Was interface/class introduced for real test-double need, not habit?
- If behavior is under ~20 lines, can one function solve it directly?
- If you cannot name it with a domain term, do not introduce it.
- Prefer minimum structure for current requirements, not speculative extensibility.

### 2) Instead of meaningless defensive code / optional chaining abuse

- Can input contract (type/runtime) be stated in one sentence?
- Is each guard based on real evidence (logs/spec/tests)?
- Does defaulting (for example `?? ""`) create silent failure?
- Separate "must fail" cases from "safe default" cases explicitly.
- Use optional chaining only for truly optional paths.
- Normalize null/undefined once at function entry, not repeatedly.
- Failure action must be explicit: throw, Result, or early return.

### 3) Instead of type gymnastics (unnecessary generics/conditional types)

- Does generic typing provide meaningful inference to callers?
- Do runtime branches and static types actually match?
- Keep conditional types minimal at public API boundaries only.
- Treat `as any` as a design-smell signal and simplify structure.
- Prefer the simplest return union that models reality.
- Types must constrain logic, not hide it.

### 4) Instead of splitting into meaningless utility functions

- If helper is used once, is inline flow clearer?
- Split only when function name conveys domain meaning.
- Ensure extracted function does not lose caller context.
- Use pipe/compose only when team-standard and readability improves.
- Do not extract trivial 3-line expressions without clear gain.
- Do not force DRY for fewer than 2 repeated occurrences.

### 5) Instead of over-explanatory names and duplicated intent

- Variable names should represent concepts, not full sentences.
- Remove duplicated meaning and redundant boolean expressions.
- Add intermediate variables only with real debug/readability value.
- Boolean names should start with `is/has/can/should` and avoid double negatives.
- Extract computed values only when next line becomes clearer.
- Keep final return expression as direct and short as possible.

### 6) Instead of unnecessary Promise/async chains

- Do not mark logic async unless real async I/O exists.
- Remove `Promise.resolve().then()` around synchronous logic.
- Avoid serial awaits when work is safely parallelizable.
- Ensure async return type is truly needed by callers.
- Prefer one `try/catch` boundary or caller delegation over catch chains.

### 7) Instead of unnecessary error wrapping / excessive try-catch

- Use try/catch only for recovery or meaningful context addition.
- Remove pass-through catch blocks that only rethrow new generic errors.
- If adding context, preserve root cause (`cause`) where possible.
- Keep failure point visible in stack trace; avoid nested try blocks.
- Do not overwrite rich errors with flat strings.
- For safe parsing/validation, consider explicit `Result` shapes.

### 8) Instead of speculative option objects and configuration surfaces

- If options are under three and stable, positional args may be clearer.
- Add extension points only with roadmap-backed evidence.
- Do not hide important behavior behind silent defaults.
- Split unrelated option clusters into separate functions.
- Ensure option object + type docs provide real caller value.
- Keep 90% common call path shortest.

### 9) Instead of unnecessary enum/constant extraction

- If value is used once, keep literal in place unless it harms clarity.
- Confirm enum improves safety beyond added verbosity.
- Extract constants when values map to volatile external contracts.
- Prefer literal unions with `as const` when sufficient.
- Extract only when multi-use + meaningful change risk exist.

### 10) Instead of callback/event decomposition for simple linear flow

- Prefer Promise/async for single-result async control flow.
- Use events only for true multi-subscriber/streaming semantics.
- For one success/failure outcome, return value + throw/Result is usually enough.
- If callback nesting exceeds two levels, redesign to linear flow.
- Confirm testability improves rather than degrades.
- Keep consumer-facing API as a single readable flow.

## Prohibited

- Do not add temporary patterns that bypass baseline language rules.

## Embedded Rule Sources (Full Text)

### `typescript/always.mdc`

- Scope (globs): `**/*.ts", "**/*.tsx`
- alwaysApply: `false`

```md
---
description: React state and effects — derived in render/useMemo; React Query for async; useReducer for compound; useEffect only for real side effects; mobile-first; no verbose or over-optimization
globs: "**/*.ts", "**/*.tsx"
alwaysApply: false
---

파생 상태는 계산으로 처리: props/state로 바로 렌더하거나, 꼭 필요할 때만 useMemo로 계산 값을 만들고 별도 상태로 두지 않습니다. 불필요한 sync용 useEffect를 줄입니다.

이벤트 기반으로 갱신: 사용자 입력/이벤트 시 setState로 바로 상태를 갱신하고, 후속 로직은 그 값에 의존해 렌더에서 계산합니다. "값 변경 → 후속 계산"을 useEffect에 두지 말고 계산식으로 표현합니다.

비동기 데이터는 React Query v5: useQuery/useMutation으로 서버 상태를 관리하고, 로딩/에러/데이터를 바로 JSX에 사용합니다. 별도 useEffect로 fetch/setState 하지 않습니다.

복합 상태 전환은 useReducer: 여러 상태가 함께 변할 때 effect 대신 "액션 → 리듀서"로 명시적 전이 테이블을 만듭니다.

커스텀 훅으로 역할 분리: 데이터 로딩, 폼 상태, 타이머 등 effect가 필요한 로직을 훅으로 감싸고, 컴포넌트는 "무엇을 한다"만 호출합니다. 의존성을 훅 내부에서 단일 책임으로 관리합니다.

의존성 명시 원칙: "이 값이 바뀔 때마다 해야 하는 일인가?"를 먼저 확인하고, 아니라면 effect 대신 계산/이벤트/리듀서로 전환합니다. effect는 진짜로 외부 I/O나 구독 해제 등이 필요한 경우에만 사용합니다.

적용 순서 가이드
fetch/setState 형태의 useEffect → React Query로 이동
입력값 변화에 따른 파생 값 setState → 렌더 계산 또는 최소 useMemo
여러 상태를 동시에 맞추는 effect → useReducer로 상태 전이 정의
남는 effect는 "구독/타이머/브라우저 API 사용/로그 전송" 같은 진짜 사이드이펙트만 유지

**모바일**: 웹·앱 패키징 전제. 모바일 환경에 맞는 CSS·className 사용.

**필수**: 구현 전 공통 로직 존재 여부 검토.

**금지**: 한 번에 긴 코드, 장황한 코드, useEffect 남발, 과도한 방어 코드, useMemo 남발, 깊은 depth.
```

### `typescript/common-principles.mdc`

- Scope (globs): `**/*.ts", "**/*.tsx`
- alwaysApply: `false`

```md
---
description: Common principles for TS (from general/java/python) — Layer, types, Clean, TDD, no blind tests, DRY, no premature opt, OOP/DDD, no dynamic
globs: "**/*.ts", "**/*.tsx"
alwaysApply: false
---

# Common Principles (TypeScript)

`rules/general`, `rules/java`, `rules/python` 공통 원리를 TS에 적용. Layer·타입·React 상세는 **react-common.mdc**, **always.mdc**.

- **1. Layer** — Component→Hook→API→Utils. Component는 API/비즈니스 로직 금지. Hook만 API 호출. → react-common §5–6.
- **2. 타입** — 파라미터·반환·제네릭 명시. `any` 최소화. → react-common §3.
- **3. Clean** — 얕은 중첩(2단계), 짧은 함수. 장황·과도한 방어 금지. → react-common §1, 2.3; always.
- **4. TDD** — Red→Green→Refactor. Hook/도메인 테스트 우선, Component/API는 배선·권한. Given–When–Then.
- **5. 눈가림 테스트** — `expect(true).toBe(true)`, 항상 통과, 과한 mock 금지. 실패 가능한 테스트, Given–When–Then으로 구체 assert.
- **6. DRY** — 공통 로직·타입 추출. 구현 전 기존 모듈 확인. → always.
- **7. 과도한 최적화** — 실측 없이 useMemo/cache 금지. → react-common §1; always.
- **8. OOP/DDD** — SRP·캡슐화·인터페이스(타입) 의존. 도메인은 Hook. → react-common §5.
- **9. 동적/리플렉션** — `eval`, `Function`, `any` 남발, 타입 가드 없는 동적 접근 금지. → react-common §2.1.
```

### `typescript/react-common.mdc`

- Scope (globs): `**/*.ts", "**/*.tsx`
- alwaysApply: `false`

````md
---
description: React + TypeScript Architecture & Code Generation — comprehensive guide for layered architecture, code generation, and React best practices
globs: "**/*.ts", "**/*.tsx"
alwaysApply: false
---

# React + TypeScript Architecture & Code Generation Guide

## Role

You are a senior frontend engineer building a **React + TypeScript** mobile web application with a strict **Layered Architecture**:

**Component → Hook → API/Repository → Utils**

You generate **production-ready**, **human-readable**, **type-safe** code while respecting all constraints below.

---

## 0) Mandatory Response Format

Respond **only** in this structure:

1. **Intent (1–2 lines)**: Summarize what the user wants.
2. **Tasks (bullets)**: List changes by layer (Component / Hook / API / Utils).
3. **Implementation (minimal code)**: Only essential diffs; keep it short.
4. **Self-check (bullets)**: Confirm no rule violations.

---

## 1) Coding Priorities (Most → Least)

1. **Human-readable** code above all else
2. **Static typing ("Java-like TypeScript")**: every function/component must declare **input + output types**
3. **Shallow nesting**: maximum **2 levels** total across `if/for/try`
4. **No premature optimization**: no speculative memoization/caches/complexity
5. **No overly defensive code**: do not add 20 edge-case checks that bloat code

---

## 2) Absolute Prohibitions (If violated: explicitly say "RULE VIOLATION" and propose an alternative)

### 2.1 Dynamic / Reflection / Runtime Tricks

- **Never use**: `eval`, `Function` constructor, dynamic property access without type guards
- **Never use**: dynamic imports in render (use `lazy()` at module level)
- **Never use**: `any` type without explicit reason comment
- **Never use**: runtime type branching via `instanceof` for business logic (design types/contracts instead)

### 2.2 Layer Violations

- **Components must not import/use API functions directly**
- **Components must not contain business logic**
- **Hooks must not call other hooks conditionally**
- **API functions are called only by Hooks**
- **Utils are pure functions only (no state, no side effects)**

### 2.3 Code Quality Anti-patterns

- **Avoid overly defensive code**: Don't handle every possible edge case if it makes code unnecessarily long
- **No verbose example data**: Don't include dummy data or meaningless test values
- **No meaningless comments**: Code should be self-explanatory
- **No complex logic in components**: Move all conditional logic to hooks

### 2.4 React-Specific Anti-patterns

- **Never use useEffect for data fetching**: Use React Query v5 (`useQuery`/`useMutation`)
- **Never use useEffect for derived state**: Calculate in render or use `useMemo` only when necessary
- **Never use multiple useState for related state**: Use `useReducer` for complex state transitions
- **Never use useEffect to sync state**: Use event handlers or computed values instead

---

## 3) Type Rules (Mandatory)

- Every function/component has explicit parameter + return types
- Important locals must have explicit types (especially `array/object` and external API responses)
- Prefer **interfaces** for object shapes, **type aliases** for unions/intersections
- Avoid `any` spam; if unavoidable, state the reason in **1 line comment**
- TypeScript **5.7+** syntax: `T | null` (avoid `T | null | undefined` when possible), `Array<T>`, `Record<string, T>`
- Use **generic types** for reusable components/hooks
- Prefer **const assertions** for literal types: `as const`

---

## 4) HTTP / IO Rules

- Request/Response JSON keys: **snake_case only** (match backend)
- API function return types: **explicit Promise<T>**
- Error handling: Use React Query error states, don't throw in components
- API functions never do complex branching; return data or throw errors

---

## 5) Layer Responsibilities (Core)

### 5.1 Component (UI Rendering Only)

- **Responsibilities**:
  - Render JSX based on props/state
  - Call hooks for data/logic
  - Handle user events (delegate to hooks)
  - No business logic, no API calls
- **Pattern**: Function components only (no class components)
- **Props**: Explicit interface/type definitions

### 5.2 Hook (Business Logic & State Management)

- **Responsibilities**:
  - Use-case orchestration
  - State management (`useState`, `useReducer`)
  - Data fetching via React Query (`useQuery`, `useMutation`)
  - Side effects coordination (only when necessary)
- **Naming**: `use` prefix (e.g., `useUserList`, `useProjectCreate`)
- **Return**: Object with data/loading/error/actions

### 5.3 API/Repository (Data Fetching & Transformation)

- **Responsibilities**:
  - HTTP requests (via axiosInstance)
  - Response transformation
  - Query key management (for React Query)
  - No business rules, no state
- **Pattern**: Return `UseQueryOptions` or `UseMutationOptions` for React Query
- **Location**: `src/api/modules/` directory

### 5.4 Utils

- **Pure functions only** (no state, no side effects, no API calls)
- **Type-safe**: All parameters and return types explicit
- **Location**: `src/utils/` directory

---

## 6) Allowed Layer Access Matrix

**Components must not touch API functions directly.**

| From \ To      | Utils | Component | Hook | API/Repository | Types |
| -------------- | ----: | --------: | ---: | -------------: | ----: |
| Utils          |    ✅ |        🚫 |   🚫 |             🚫 |    ✅ |
| Component      |    ✅ |        ✅ |   ✅ |             🚫 |    ✅ |
| Hook           |    ✅ |        🚫 |   ✅ |             ✅ |    ✅ |
| API/Repository |    ✅ |        🚫 |   🚫 |             ✅ |    ✅ |

**Key prohibitions:**

- Component↔API direct calls forbidden
- Hook↔Hook conditional calls forbidden
- API functions only accessible by Hook layer
- Utils are pure functions only

---

## 7) Request → Response Flow

`Component → Hook (useQuery/useMutation) → API (queryFn) → Backend → API (transform) → Hook (state) → Component (render)`

- Data fetching boundary is **Hook only** (via React Query)
- API is **HTTP I/O only**, Hook is **orchestration only**, Component is **rendering only**
- Each layer passes type-safe data to the next

---

## 8) Context

- **Project Type**: React-based mobile web application (will be packaged as app)
- **Architecture**: Layered architecture (Component → Hook → API/Repository → Utils)
- **Framework**: React 19.1.1 + TypeScript 5.7.2
- **State Management**: React Query v5 (server state) + Redux Toolkit (global client state only)
- **Styling**: Tailwind CSS (mobile-first)
- **Build Tool**: Vite

---

## 9) React Query v5 Patterns (Mandatory)

### 9.1 Data Fetching

**BAD: useEffect + fetch**

```typescript
// BAD
function UserList() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch('/api/users')
      .then(res => res.json())
      .then(data => {
        setUsers(data);
        setLoading(false);
      });
  }, []);

  return <div>{/* render */}</div>;
}
```

**GOOD: useQuery**

```typescript
// GOOD
function UserList() {
  const { data: users = [], isLoading, error } = useQuery($axios.user.getUserList());

  if (isLoading) return <Loading />;
  if (error) return <Error message={error.message} />;

  return <div>{/* render */}</div>;
}
```

### 9.2 Mutations

**BAD: useState + fetch**

```typescript
// BAD
function CreateUser() {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: UserForm) => {
    setLoading(true);
    try {
      await fetch("/api/users", { method: "POST", body: JSON.stringify(data) });
    } finally {
      setLoading(false);
    }
  };
}
```

**GOOD: useMutation**

```typescript
// GOOD
function CreateUser() {
  const queryClient = useQueryClient();
  const { mutate, isPending } = useMutation({
    mutationFn: (data: UserForm) => axiosInstance.post("/users", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  const handleSubmit = (data: UserForm) => mutate(data);
}
```

---

## 10) State Management Rules

### 10.1 Derived State (Computed Values)

**BAD: useEffect to sync state**

```typescript
// BAD
function FilteredList({ items }: { items: Item[] }) {
  const [filtered, setFiltered] = useState<Item[]>([]);

  useEffect(() => {
    setFiltered(items.filter(item => item.active));
  }, [items]);

  return <div>{/* render filtered */}</div>;
}
```

**GOOD: Calculate in render**

```typescript
// GOOD
function FilteredList({ items }: { items: Item[] }) {
  const filtered = items.filter(item => item.active);

  return <div>{/* render filtered */}</div>;
}
```

### 10.2 Complex State (Multiple Related Values)

**BAD: Multiple useState**

```typescript
// BAD
function Form() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  // ... complex sync logic
}
```

**GOOD: useReducer**

```typescript
// GOOD
type FormState = {
  name: string;
  email: string;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
};

type FormAction =
  | { type: "SET_FIELD"; field: string; value: string }
  | { type: "SET_ERROR"; field: string; error: string }
  | { type: "TOUCH_FIELD"; field: string };

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case "SET_FIELD":
      return { ...state, [action.field]: action.value };
    case "SET_ERROR":
      return {
        ...state,
        errors: { ...state.errors, [action.field]: action.error },
      };
    case "TOUCH_FIELD":
      return { ...state, touched: { ...state.touched, [action.field]: true } };
    default:
      return state;
  }
}

function Form() {
  const [state, dispatch] = useReducer(formReducer, initialState);
  // ... use dispatch for actions
}
```

### 10.3 Event-Based Updates

**BAD: useEffect for side effects of state changes**

```typescript
// BAD
function SearchInput() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);

  useEffect(() => {
    if (query.length > 2) {
      searchAPI(query).then(setResults);
    }
  }, [query]);
}
```

**GOOD: React Query with enabled option or event handler**

```typescript
// GOOD
function SearchInput() {
  const [query, setQuery] = useState("");
  const { data: results = [] } = useQuery({
    ...$axios.search.search(query),
    enabled: query.length > 2,
  });
}
```

---

## 11) Custom Hooks Pattern

**Purpose**: Extract reusable logic from components

**Pattern**:

```typescript
// hooks/useUserList.ts
export function useUserList() {
  const { data: users = [], isLoading, error } = useQuery($axios.user.getUserList());

  return {
    users,
    isLoading,
    error,
  };
}

// Component
function UserList() {
  const { users, isLoading, error } = useUserList();

  if (isLoading) return <Loading />;
  if (error) return <Error />;

  return <div>{/* render */}</div>;
}
```

---

## 12) TypeScript Type Patterns

### 12.1 Component Props

**BAD: Inline types or any**

```typescript
// BAD
function UserCard(props: any) {
  return <div>{props.name}</div>;
}
```

**GOOD: Explicit interface**

```typescript
// GOOD
interface UserCardProps {
  user: User;
  onEdit?: (id: number) => void;
}

function UserCard({ user, onEdit }: UserCardProps) {
  return <div>{user.name}</div>;
}
```

### 12.2 API Response Types

**BAD: any or implicit**

```typescript
// BAD
const getUser = async (id: number) => {
  const { data } = await axiosInstance.get(`/users/${id}`);
  return data; // any
};
```

**GOOD: Explicit generic**

```typescript
// GOOD
const getUser = async (id: number): Promise<User> => {
  const { data } = await axiosInstance.get<User>(`/users/${id}`);
  return data;
};
```

### 12.3 Generic Components

```typescript
// GOOD
interface ListProps<T> {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
}

function List<T>({ items, renderItem }: ListProps<T>) {
  return <div>{items.map(renderItem)}</div>;
}
```

---

## 13) Mobile Web Specific Rules

### 13.1 CSS / Styling

- **Use Tailwind CSS mobile-first classes**: `sm:`, `md:`, `lg:` breakpoints
- **Touch-friendly sizes**: Minimum 44x44px for interactive elements
- **Viewport meta**: Ensure proper mobile viewport settings
- **Module CSS**: Use `*.module.css` for component-specific styles (avoid global CSS conflicts)

### 13.2 Touch Events

- **Prefer standard events**: Use `onClick` (works on touch), avoid `onTouchStart` unless necessary
- **Touch feedback**: Provide visual feedback (e.g., `active:` states in Tailwind)

### 13.3 Performance

- **Code splitting**: Use `lazy()` for route-level code splitting
- **Image optimization**: Use appropriate image formats and sizes
- **Bundle size**: Monitor and optimize bundle size (avoid large dependencies)

### 13.4 Responsive Design

- **Mobile-first**: Design for mobile, enhance for larger screens
- **Flexible layouts**: Use Flexbox/Grid with responsive units (rem, %, vw/vh)

---

## 14) Canonical Layer Templates

### 14.1 Component (Thin, rendering only)

```typescript
import { useUserList } from '@/hooks/useUserList';

interface UserListProps {
  onUserSelect?: (id: number) => void;
}

export default function UserList({ onUserSelect }: UserListProps) {
  const { users, isLoading, error } = useUserList();

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error.message} />;

  return (
    <ul className="space-y-2">
      {users.map((user) => (
        <li key={user.id} onClick={() => onUserSelect?.(user.id)}>
          {user.name}
        </li>
      ))}
    </ul>
  );
}
```

### 14.2 Hook (Business logic orchestration)

```typescript
// hooks/useUserList.ts
import { useQuery } from "@tanstack/react-query";
import $axios from "@/api/controller";

export function useUserList() {
  const {
    data: users = [],
    isLoading,
    error,
  } = useQuery($axios.user.getUserList());

  return {
    users,
    isLoading,
    error,
  };
}
```

### 14.3 API/Repository (Data fetching)

```typescript
// api/modules/user.ts
import axiosInstance from "@/api/axiosInstance";
import { UseQueryOptions } from "@tanstack/react-query";

export interface User {
  id: number;
  name: string;
  email: string;
}

const user = {
  getUserList: (): UseQueryOptions<User[], Error, User[], string[]> => ({
    queryKey: ["users"],
    queryFn: async () => {
      const { data } = await axiosInstance.get<User[]>("/users");
      return data;
    },
  }),

  getUser: (
    id: number | string,
  ): UseQueryOptions<User, Error, User, string[]> => ({
    queryKey: ["user", String(id)],
    queryFn: async () => {
      const { data } = await axiosInstance.get<User>(`/users/${id}`);
      return data;
    },
    enabled: !!id,
  }),
};

export default user;
```

### 14.4 Utils (Pure functions)

```typescript
// utils/format.ts
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("ko-KR");
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
  }).format(amount);
}
```

---

## 15) Project Structure

```
src/
  api/                    # API layer (Repository)
    modules/              # Domain-specific API modules
      user.ts
      project.ts
    controller.ts         # API module aggregator
    axiosInstance.ts      # Axios configuration
  components/             # Reusable UI components
    modal/
    spinner/
  hooks/                  # Custom hooks (Business logic)
    useUserList.ts
    useProjectCreate.ts
  pages/                  # Route pages (Components)
    (root)/
    user/
  store/                  # Redux store (Global client state only)
    reducers/
  types/                  # TypeScript type definitions
    user.ts
    api.ts
  utils/                  # Pure utility functions
    format.ts
    validation.ts
  assets/                 # Static assets
    index.css
```

**File Naming**:

- Components: `PascalCase.tsx` (e.g., `UserList.tsx`)
- Hooks: `camelCase.ts` with `use` prefix (e.g., `useUserList.ts`)
- API modules: `camelCase.ts` (e.g., `user.ts`)
- Utils: `camelCase.ts` (e.g., `formatDate.ts`)
- Types: `camelCase.ts` (e.g., `user.ts`)

---

## 16) Comprehensive Examples: Good vs Bad

### Example 1: Component with Business Logic

**BAD: Business logic in component, direct API call**

```typescript
// BAD
export default function UserList() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    axiosInstance.get('/users')
      .then(res => {
        setUsers(res.data);
        setLoading(false);
      });
  }, []);

  const filteredUsers = users.filter(u => u.active);

  return (
    <div>
      {loading ? <p>Loading...</p> : filteredUsers.map(u => <div key={u.id}>{u.name}</div>)}
    </div>
  );
}
```

**GOOD: Hook separation, React Query**

```typescript
// hooks/useUserList.ts
export function useUserList() {
  const { data: users = [], isLoading, error } = useQuery($axios.user.getUserList());
  const activeUsers = users.filter(u => u.active);

  return { users: activeUsers, isLoading, error };
}

// components/UserList.tsx
export default function UserList() {
  const { users, isLoading, error } = useUserList();

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error.message} />;

  return (
    <div>
      {users.map(user => (
        <UserCard key={user.id} user={user} />
      ))}
    </div>
  );
}
```

### Example 2: Form State Management

**BAD: Multiple useState, useEffect sync**

```typescript
// BAD
function CreateUserForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (name.length < 2) {
      setErrors((prev) => ({ ...prev, name: "Name too short" }));
    } else {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.name;
        return next;
      });
    }
  }, [name]);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await axiosInstance.post("/users", { name, email });
    } finally {
      setSubmitting(false);
    }
  };
}
```

**GOOD: useReducer + useMutation**

```typescript
// GOOD
type FormState = {
  name: string;
  email: string;
  errors: Record<string, string>;
};

type FormAction =
  | { type: 'SET_FIELD'; field: 'name' | 'email'; value: string }
  | { type: 'SET_ERROR'; field: string; error: string }
  | { type: 'CLEAR_ERROR'; field: string };

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value };
    case 'SET_ERROR':
      return { ...state, errors: { ...state.errors, [action.field]: action.error } };
    case 'CLEAR_ERROR':
      const { [action.field]: _, ...rest } = state.errors;
      return { ...state, errors: rest };
    default:
      return state;
  }
}

function CreateUserForm() {
  const [state, dispatch] = useReducer(formReducer, { name: '', email: '', errors: {} });
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: (data: { name: string; email: string }) =>
      axiosInstance.post('/users', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const handleSubmit = () => {
    if (state.name.length < 2) {
      dispatch({ type: 'SET_ERROR', field: 'name', error: 'Name too short' });
      return;
    }
    mutate({ name: state.name, email: state.email });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={state.name}
        onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'name', value: e.target.value })}
      />
      {state.errors.name && <span>{state.errors.name}</span>}
      {/* ... */}
    </form>
  );
}
```

### Example 3: Type Safety

**BAD: any types, implicit types**

```typescript
// BAD
function processData(data: any) {
  return data.map((item: any) => item.name);
}

function UserCard(props: any) {
  return <div>{props.user?.name}</div>;
}
```

**GOOD: Explicit types, interfaces**

```typescript
// GOOD
interface User {
  id: number;
  name: string;
  email: string;
}

interface UserCardProps {
  user: User;
  onEdit?: (id: number) => void;
}

function processData(data: User[]): string[] {
  return data.map((item) => item.name);
}

function UserCard({ user, onEdit }: UserCardProps) {
  return (
    <div>
      <span>{user.name}</span>
      {onEdit && <button onClick={() => onEdit(user.id)}>Edit</button>}
    </div>
  );
}
```

---

## 17) Self-check Checklist

Before submitting code, verify:

- [ ] Response format follows: Intent → Tasks → Implementation → Self-check
- [ ] All layers respect boundaries (Component → Hook → API → Utils)
- [ ] No prohibited patterns (any, useEffect for data fetching, direct API calls in components, etc.)
- [ ] API functions only used by Hooks
- [ ] Components only render UI and call hooks
- [ ] File length ≤150 lines per example file
- [ ] Function length ≤30 lines (prefer ≤20 lines)
- [ ] Maximum nesting depth 2 levels
- [ ] All functions have type annotations (TypeScript)
- [ ] Code is production-ready
- [ ] Brief explanation provided (≤5 lines)
- [ ] React Query used for all server state
- [ ] No unnecessary useEffect
- [ ] Mobile-friendly CSS classes used

---

## 18) Continuous Improvement (Evidence-driven)

- **Evidence-driven**: Propose improvements backed by failing tests or perf metrics
- **Pattern capture**: When a pattern appears in 3+ files, add/update rules
- **Security/perf**: Create tests that prevent regression (bundle size, render counts)

### Process

1. Detect issue or opportunity with data/tests
2. Write failing tests capturing the gap
3. Implement minimal change → green
4. Communicate summary with impact and risks

---
````
