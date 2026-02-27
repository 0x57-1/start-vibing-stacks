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

## FORBIDDEN

1. **Class components** — function components only
2. **Prop drilling** — use context or composition
3. **Inline objects/functions in JSX** — causes re-renders
4. **useEffect for derived state** — use useMemo
5. **Mutating state directly** — always setState/dispatch
