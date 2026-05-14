---
name: react-patterns
version: 2.0.0
description: "Modern React 19 component architecture (stable Dec 5 2024; 19.1 in 2025). Covers the new hooks (`useActionState`, `useOptimistic`, `useFormStatus`, `use()` for promises and Context), refs-as-props (no more `forwardRef`), document metadata hoisting (write `<title>` and `<meta>` anywhere), Actions for async mutations, Server Components vs Client Components, compound + generic components, custom hooks, state-management decision matrix (useState → useReducer → Context → Zustand → server cache), Error Boundaries, performance via memo/useMemo/useCallback, and Suspense boundaries. Invoke for any new component, hook, state design, or React-architecture decision."
---

# React 19 Patterns — Modern Component Architecture

**ALWAYS invoke when writing React components, hooks, or state management.**

## React 19 essentials (stable Dec 5, 2024 → 19.1 in 2025)

- **Actions** — async functions passed straight to forms; `useActionState` manages pending/error/optimistic state automatically
- **`use()`** — read promises and Context **conditionally** during render (paired with Suspense + Error Boundaries)
- **Refs as props** — pass `ref` like any other prop. **`forwardRef` is no longer needed** for new components
- **Document metadata hoisting** — `<title>`, `<meta>`, `<link>` get auto-hoisted into `<head>` from anywhere
- **Form `action` prop** — submits via the action, auto-resets uncontrolled inputs on success
- **Stylesheet management** — `<link rel="stylesheet">` in components is awaited before the Suspense boundary reveals
- **Suspense sibling pre-warming** — fallback shows immediately and queues sibling requests in parallel

## Component Patterns

### Compound Components
```tsx
const TabsContext = createContext<TabsContextValue | null>(null);

function Tabs({ children, defaultTab }: { children: ReactNode; defaultTab: string }) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className="tabs">{children}</div>
    </TabsContext.Provider>
  );
}
// + TabList, Tab, TabPanel components using useContext(TabsContext)
```

### Generic List Component
```tsx
interface ListProps<T> {
  items: T[];
  renderItem: (item: T) => ReactNode;
  keyExtractor: (item: T) => string;
}

function List<T>({ items, renderItem, keyExtractor }: ListProps<T>) {
  return <ul>{items.map(item => <li key={keyExtractor(item)}>{renderItem(item)}</li>)}</ul>;
}
```

## Custom Hooks

```tsx
// useLocalStorage
function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initial;
    try { return JSON.parse(window.localStorage.getItem(key) ?? '') } catch { return initial }
  });
  const set = useCallback((v: T | ((val: T) => T)) => {
    setValue(prev => {
      const next = v instanceof Function ? v(prev) : v;
      window.localStorage.setItem(key, JSON.stringify(next));
      return next;
    });
  }, [key]);
  return [value, set] as const;
}

// useDebounce
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => { const t = setTimeout(() => setDebounced(value), delay); return () => clearTimeout(t); }, [value, delay]);
  return debounced;
}
```

## State Management

### useReducer for Complex State
```tsx
type Action =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; payload: Item[] }
  | { type: 'FETCH_ERROR'; payload: string };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'FETCH_START': return { ...state, loading: true, error: null };
    case 'FETCH_SUCCESS': return { ...state, loading: false, items: action.payload };
    case 'FETCH_ERROR': return { ...state, loading: false, error: action.payload };
  }
}
```

### Context (avoid prop drilling)
```tsx
const AppContext = createContext<AppContextValue | undefined>(undefined);
export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
```

## Performance

```tsx
// memo — prevent re-renders
const ExpensiveList = memo(function ExpensiveList({ items }: { items: Item[] }) { ... });

// useMemo — expensive calculations
const processed = useMemo(() => data.map(d => expensiveCalc(d)), [data]);

// useCallback — stable refs
const handleClick = useCallback(() => setCount(c => c + 1), []);

// Code splitting
const Heavy = lazy(() => import('./HeavyComponent'));
<Suspense fallback={<Loading />}><Heavy /></Suspense>
```

## React 19 — Actions & form-state hooks

### `useActionState` — pending + error + result for one form

```tsx
import { useActionState } from 'react';

function LoginForm() {
  const [state, formAction, isPending] = useActionState(
    async (_prev, formData: FormData) => {
      const result = await login(formData);
      if (result.error) return { error: result.error };
      redirect('/dashboard');
    },
    { error: null as string | null }
  );

  return (
    <form action={formAction}>
      <input name="email" type="email" required />
      {state.error && <p className="text-destructive">{state.error}</p>}
      <button disabled={isPending}>{isPending ? 'Signing in…' : 'Sign In'}</button>
    </form>
  );
}
```

### `useFormStatus` — child of a form reads its parent's submit state

```tsx
import { useFormStatus } from 'react-dom';

function SubmitButton() {
  const { pending } = useFormStatus();          // ← reads the enclosing <form action={…}>
  return <button disabled={pending}>{pending ? 'Saving…' : 'Save'}</button>;
}
```

Drop `<SubmitButton />` inside any `<form action={…}>` — no prop drilling, no context.

### `useOptimistic` — instant UI feedback that auto-reverts on error

```tsx
import { useOptimistic } from 'react';

function TodoList({ todos }: { todos: Todo[] }) {
  const [optimisticTodos, addOptimistic] = useOptimistic(
    todos,
    (current, newTodo: Todo) => [...current, newTodo]
  );

  async function add(formData: FormData) {
    const todo = { id: crypto.randomUUID(), title: String(formData.get('title')), done: false };
    addOptimistic(todo);          // instant
    await saveTodo(todo);          // server confirms (or throws → revert is automatic on rerender)
  }

  return (
    <>
      <form action={add}><input name="title" /></form>
      <ul>{optimisticTodos.map(t => <li key={t.id}>{t.title}</li>)}</ul>
    </>
  );
}
```

### `use()` — read a promise or Context conditionally

```tsx
import { use, Suspense } from 'react';

function UserName({ userPromise }: { userPromise: Promise<User> }) {
  const user = use(userPromise);                // suspends until resolved
  return <span>{user.name}</span>;
}

// Parent
<Suspense fallback={<Skeleton />}>
  <UserName userPromise={fetchUser(id)} />
</Suspense>
```

`use()` is the only hook allowed inside conditionals — perfect for "render after this resource resolves" without restructuring components.

## React 19 — refs as props (no `forwardRef`)

```tsx
// React 19 — `ref` is just a prop
function Input({ ref, className, ...props }: React.InputHTMLAttributes<HTMLInputElement> & {
  ref?: React.Ref<HTMLInputElement>;
}) {
  return <input ref={ref} className={cn('h-10 px-3 …', className)} {...props} />;
}

// Usage — no different from before
const myRef = useRef<HTMLInputElement>(null);
<Input ref={myRef} />
```

`forwardRef` keeps working — but new components should ditch it.

## React 19 — document metadata anywhere

```tsx
function Article({ post }: { post: Post }) {
  return (
    <article>
      <title>{post.title} — My Site</title>          {/* hoisted into <head> */}
      <meta name="description" content={post.summary} />
      <link rel="canonical" href={`/blog/${post.slug}`} />
      <h1>{post.title}</h1>
      {/* … */}
    </article>
  );
}
```

No `next/head` / `react-helmet` needed — React handles it. Server-rendered metadata appears in the initial HTML (good for SEO).

## State Management Selection

| Complexity | Solution | When |
|---|---|---|
| Simple local | `useState` | Single component, simple values |
| Complex local | `useReducer` | Multiple related state transitions |
| Parent-child | Lift state up | 1-2 levels |
| Subtree | Context + `useReducer` | Theme, auth, 3+ levels |
| Server state | React Query / SWR | API data, caching, refetch |
| Complex global | Zustand | Cross-feature, many consumers |

## Error Boundaries

```tsx
import { Component, type ReactNode } from 'react';

class ErrorBoundary extends Component<
  { children: ReactNode; fallback?: ReactNode },
  { hasError: boolean; error?: Error }
> {
  state = { hasError: false, error: undefined as Error | undefined };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info);
    // Send to Sentry/logging
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="p-8 text-center">
          <h2 className="text-lg font-semibold text-foreground">Something went wrong</h2>
          <button onClick={() => this.setState({ hasError: false })}
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg">
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Usage: wrap routes/features
<ErrorBoundary fallback={<ErrorPage />}>
  <DashboardFeature />
</ErrorBoundary>
```

## Component Types

| Type | Use | Example |
|---|---|---|
| **Server** (RSC) | Data fetching, static content | Page-level components |
| **Client** (`'use client'`) | Interactivity, hooks, browser APIs | Forms, modals, dropdowns |
| **Presentational** | Pure display, props only | `<Badge>`, `<Avatar>` |
| **Container** | Logic + state, renders presentational | `<UserListContainer>` |

## FORBIDDEN

| Pattern | Why |
|---|---|
| `forwardRef` in new components | Refs are props in React 19 — drop the wrapper |
| `useEffect` to fetch data | Use Server Components, `use()` + Suspense, or TanStack Query |
| `useEffect` for derived state | Compute it in render or via `useMemo` |
| `next/head` / `react-helmet` in R19 | Use plain `<title>` / `<meta>` — React hoists |
| Class components | Function components only (Error Boundaries are the rare exception) |
| Prop drilling > 2 levels | Composition or `Context` |
| Inline objects/functions in hot paths | Stable refs via `useMemo` / `useCallback` (only when profiler shows it matters) |
| Direct state mutation | Always set new state — React relies on referential change |
| Index as `key` | Use stable unique IDs (`crypto.randomUUID()`, server IDs) |
| Premature memoisation | Profile with React DevTools first |
| Manual `isPending` + `error` `useState` for forms | Use `useActionState` |
| Custom optimistic-state code | `useOptimistic` + Action |

## See Also

- `react-standards` v2 — LABELS / STYLES const pattern
- `react-ui-patterns` v2 — loading/error/empty + TanStack Query v5
- `tailwind-patterns` v2 — `@theme`, container queries, OKLCH
- `shadcn-ui` v2 — primitives without `forwardRef`, `data-slot` styling
- `zod-validation` v2 — Zod 4 + RHF for form Actions
- `_shared/skills/playwright-automation` v2 — E2E coverage including R19 forms
