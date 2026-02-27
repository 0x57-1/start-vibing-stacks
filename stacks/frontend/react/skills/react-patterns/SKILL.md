# React Patterns — Modern Component Architecture

**ALWAYS invoke when writing React components, hooks, or state management.**

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

## React 19 Hooks

```tsx
// useActionState — form submission state
import { useActionState } from 'react';

function LoginForm() {
  const [state, formAction, isPending] = useActionState(
    async (prev, formData: FormData) => {
      const result = await login(formData);
      if (result.error) return { error: result.error };
      redirect('/dashboard');
    },
    { error: null }
  );

  return (
    <form action={formAction}>
      <input name="email" type="email" />
      {state.error && <p className="text-destructive">{state.error}</p>}
      <button disabled={isPending}>
        {isPending ? 'Signing in...' : 'Sign In'}
      </button>
    </form>
  );
}

// useOptimistic — instant UI feedback
import { useOptimistic } from 'react';

function TodoList({ todos }: { todos: Todo[] }) {
  const [optimisticTodos, addOptimistic] = useOptimistic(
    todos,
    (state, newTodo: Todo) => [...state, newTodo]
  );

  const addTodo = async (formData: FormData) => {
    const todo = { id: crypto.randomUUID(), title: formData.get('title') as string, done: false };
    addOptimistic(todo);  // Instant UI
    await saveTodo(todo);  // Server sync
  };

  return <ul>{optimisticTodos.map(t => <li key={t.id}>{t.title}</li>)}</ul>;
}
```

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

1. **Class components** — function components only (except ErrorBoundary)
2. **Prop drilling** — use context or composition
3. **Inline objects/functions in JSX** — causes re-renders
4. **useEffect for derived state** — use useMemo
5. **Mutating state directly** — always setState/dispatch
6. **Index as key** — use stable unique ID (`uuid`, `id`)
7. **Premature optimization** — profile first with React DevTools
8. **useEffect for everything** — prefer server components for data
