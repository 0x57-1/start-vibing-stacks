---
name: react-api-standards
version: 2.1.1
description: "React 19.3 + Vite 8 + Axios ≥1.20.0 standards for a Laravel-backed JSON API SPA. Page shell + skeleton-first paint, async data via `api.get`, 422 validation binding to React Hook Form, protected-route + catch-all routing, NO Inertia. Pairs with `axios-laravel-api` 2.1 (HTTP client) and `laravel-api-architecture` (backend). TanStack Query v5 (`isPending` + `signal`), Zod 4, `useOptimistic` / `useActionState` / `useFormStatus`, Tailwind 4.3 `@theme` + OKLCH. Invoke for any new page, layout, or component in a Laravel + Sanctum SPA."
---

# React 19.3 API-First Standards (Laravel + Axios) — 2026

**ALWAYS invoke when creating React pages, components, or layouts in a project
that uses a Laravel JSON API as backend (NOT Inertia.js).**

## Version Requirements

- **React ≥ 19.3.0** — MANDATORY (`useActionState`, `useOptimistic`, `useFormStatus`, `use()`, `ViewTransition`, `browser()`)
- **Vite ≥ 6** with `@vitejs/plugin-react`
- **Tailwind CSS ≥ 4.3** (CSS-first `@theme`, Oxide, scrollbar / `@container-size`)
- **Axios ≥ 1.20.0** — boolean `withXSRFToken`, `allowAbsoluteUrls: false` (see `axios-laravel-api`)
- **TanStack Query ≥ 5** — `isPending` vs `isFetching`; thread `signal` through `queryFn` → `api.get(url, { signal })`
- **Zod ≥ 4** — top-level `z.email()`/`z.url()` for tree-shaking
- **react-router-dom ≥ 7.13.2** — Framework-mode / RSC XSS floors (CVE-2026-21884, CVE-2026-33245)

## Folder Structure

```
resources/js/
├── app.jsx                       # Root: <BrowserRouter> + <QueryClientProvider>
├── App.jsx                       # Top-level <Routes> with <ProtectedRoute>
├── lib/
│   ├── api.js                    # Axios instance (see axios-laravel-api skill)
│   ├── auth.js                   # login/logout/fetchCurrentUser
│   ├── queryClient.ts            # TanStack QueryClient config
│   └── utils.ts                  # cn(), formatters, date helpers
├── Pages/
│   ├── Dashboard/
│   │   └── Index.tsx             # Renders shell+skeleton; calls api.get
│   ├── Users/
│   │   ├── Index.tsx
│   │   ├── Show.tsx
│   │   └── _components/          # Page-private components
│   │       ├── UsersTable.tsx
│   │       └── UsersTableSkeleton.tsx
│   └── Auth/
│       ├── Login.tsx
│       └── Register.tsx
├── Components/                   # Reusable cross-page components
│   ├── ErrorState.tsx
│   ├── EmptyState.tsx
│   ├── ProtectedRoute.tsx
│   └── SectionLoader.tsx
├── Layouts/
│   ├── AuthenticatedLayout.tsx
│   └── GuestLayout.tsx
├── Icons/                        # Each icon is a separate .svg file
│   ├── index.js                  # Barrel
│   ├── CheckIcon.svg
│   └── AlertIcon.svg
└── store/                        # Zustand / Context for cross-page UI state
    └── auth.ts
```

## The Page Contract

Every Page component MUST:

1. **Render shell + skeleton on first paint** — never block on data.
2. **Fetch via `api` instance** (or `useQuery`) — never raw `axios`/`fetch`.
3. **Show error/empty/loading states** before the happy path.
4. **Define `LABELS` and `STYLES` as `const` ABOVE the component** — stable refs.

```tsx
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import ErrorState from '@/Components/ErrorState';
import EmptyState from '@/Components/EmptyState';
import OrdersTable from './_components/OrdersTable';
import OrdersTableSkeleton from './_components/OrdersTableSkeleton';

const LABELS = {
    title: 'Orders',
    empty: 'No orders yet',
    emptyHint: 'Orders will appear here once customers start checking out.',
} as const;

const STYLES = {
    page: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8',
    heading: 'text-2xl font-bold text-foreground',
    section: 'mt-6',
} as const;

export default function OrdersIndexPage() {
    const [data, setData] = useState<{ data: Order[]; meta: Meta } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const load = async () => {
        try {
            setError(null);
            setLoading(true);
            const res = await api.get('/api/orders');
            setData(res.data);
        } catch (e: any) {
            setError(e.response?.data?.message ?? 'Failed to load orders');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    return (
        <div className={STYLES.page}>
            <h1 className={STYLES.heading}>{LABELS.title}</h1>

            <section className={STYLES.section}>
                {error && <ErrorState error={error} onRetry={load} />}
                {!error && loading && !data && <OrdersTableSkeleton />}
                {!error && data && data.data.length === 0 && (
                    <EmptyState title={LABELS.empty} description={LABELS.emptyHint} />
                )}
                {!error && data && data.data.length > 0 && (
                    <OrdersTable orders={data.data} meta={data.meta} />
                )}
            </section>
        </div>
    );
}
```

## TanStack Query Variant (Preferred for any List/Detail)

```tsx
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import api from '@/lib/api';

const fetchOrders = async (params: { page: number; per_page: number; status?: string }) => {
    const { data } = await api.get('/api/orders', { params });
    return data;
};

export default function OrdersIndexPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const page = Number(searchParams.get('page') ?? 1);
    const status = searchParams.get('status') ?? undefined;

    const { data, error, isPending, refetch } = useQuery({
        queryKey: ['orders', { page, status }],
        queryFn: () => fetchOrders({ page, per_page: 25, status }),
        placeholderData: (prev) => prev,        // smooth pagination
    });

    if (error) return <ErrorState error={error} onRetry={refetch} />;
    if (isPending && !data) return <OrdersTableSkeleton />;
    if (!data?.data.length) return <EmptyState title={LABELS.empty} />;

    return (
        <OrdersTable
            orders={data.data}
            meta={data.meta}
            onPageChange={(p) => setSearchParams({ page: String(p), status: status ?? '' })}
        />
    );
}
```

**Rules:**

- `queryKey` MUST include all filter inputs that change the response.
- `placeholderData: (prev) => prev` keeps the old table visible while the new
  page loads — no skeleton flash on pagination.
- URL state via `useSearchParams` so users can bookmark filtered views.

## Mutations + Optimistic UI

```tsx
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

function ToggleArchive({ order }: { order: Order }) {
    const qc = useQueryClient();
    const m = useMutation({
        mutationFn: () => api.post(`/api/orders/${order.id}/archive`),
        onMutate: async () => {
            await qc.cancelQueries({ queryKey: ['orders'] });
            const prev = qc.getQueriesData<any>({ queryKey: ['orders'] });
            qc.setQueriesData({ queryKey: ['orders'] }, (old: any) => ({
                ...old,
                data: old.data.map((o: Order) =>
                    o.id === order.id ? { ...o, archived: !o.archived } : o,
                ),
            }));
            return { prev };
        },
        onError: (_err, _vars, ctx) => {
            ctx?.prev?.forEach(([key, value]) => qc.setQueryData(key, value));
        },
        onSettled: () => qc.invalidateQueries({ queryKey: ['orders'] }),
    });
    return <button onClick={() => m.mutate()} disabled={m.isPending}>Archive</button>;
}
```

## Forms — 422 Validation Binding

```tsx
import { useState } from 'react';
import api from '@/lib/api';

const STYLES = {
    form: 'space-y-4 max-w-md',
    label: 'block text-sm font-medium text-foreground mb-1',
    input: 'w-full h-10 px-3 rounded-md border border-border bg-background',
    inputError: 'w-full h-10 px-3 rounded-md border border-destructive bg-background',
    error: 'mt-1 text-sm text-destructive',
    btn: 'px-4 py-2 bg-primary text-primary-foreground rounded-lg disabled:opacity-50',
} as const;

export default function CreateOrderForm({ onCreated }: { onCreated: () => void }) {
    const [form, setForm] = useState({ product_id: '', quantity: 1 });
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [submitting, setSubmitting] = useState(false);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});
        setSubmitting(true);
        try {
            const { data } = await api.post('/api/orders', form);
            onCreated();
        } catch (err: any) {
            if (err.validation) setErrors(err.validation);
        } finally {
            setSubmitting(false);
        }
    };

    const cls = (field: string) =>
        errors[field]?.length ? STYLES.inputError : STYLES.input;

    return (
        <form className={STYLES.form} onSubmit={submit}>
            <div>
                <label className={STYLES.label}>Product ID</label>
                <input
                    className={cls('product_id')}
                    value={form.product_id}
                    onChange={(e) => setForm({ ...form, product_id: e.target.value })}
                />
                {errors.product_id?.[0] && (
                    <p className={STYLES.error}>{errors.product_id[0]}</p>
                )}
            </div>

            <button type="submit" disabled={submitting} className={STYLES.btn}>
                {submitting ? 'Creating…' : 'Create Order'}
            </button>
        </form>
    );
}
```

## Authentication Layer

```tsx
// resources/js/store/auth.ts
import { create } from 'zustand';
import api from '@/lib/api';
import { fetchCurrentUser, login as doLogin, logout as doLogout } from '@/lib/auth';

interface AuthState {
    user: User | null;
    booted: boolean;
    boot: () => Promise<void>;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
}

export const useAuth = create<AuthState>((set) => ({
    user: null,
    booted: false,
    boot: async () => {
        try {
            const user = await fetchCurrentUser();
            set({ user, booted: true });
        } catch {
            set({ user: null, booted: true });
        }
    },
    login: async (email, password) => {
        await doLogin(email, password);
        const user = await fetchCurrentUser();
        set({ user });
    },
    logout: async () => {
        await doLogout();
        set({ user: null });
    },
}));
```

```tsx
// resources/js/Components/ProtectedRoute.tsx
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/store/auth';
import SectionLoader from './SectionLoader';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { user, booted } = useAuth();
    const location = useLocation();

    if (!booted) return <SectionLoader />;
    if (!user) return <Navigate to="/login" state={{ from: location }} replace />;

    return <>{children}</>;
}
```

```tsx
// resources/js/App.tsx
import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuth } from './store/auth';
import ProtectedRoute from './Components/ProtectedRoute';
import AuthenticatedLayout from './Layouts/AuthenticatedLayout';
import LoginPage from './Pages/Auth/Login';
import DashboardPage from './Pages/Dashboard/Index';

export default function App() {
    const boot = useAuth((s) => s.boot);
    useEffect(() => { boot(); }, [boot]);

    return (
        <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<ProtectedRoute><AuthenticatedLayout /></ProtectedRoute>}>
                <Route path="/" element={<DashboardPage />} />
                {/* ... */}
            </Route>
        </Routes>
    );
}
```

## Skeletons — One per Component, Match the Shape

```tsx
// resources/js/Pages/Orders/_components/OrdersTableSkeleton.tsx
const STYLES = {
    table: 'w-full',
    headerRow: 'border-b border-border',
    headerCell: 'h-4 w-24 bg-muted rounded animate-pulse my-3 mx-4',
    row: 'border-b border-border',
    cell: 'h-4 w-full bg-muted rounded animate-pulse my-4 mx-4',
} as const;

export default function OrdersTableSkeleton({ rows = 8 }: { rows?: number }) {
    return (
        <div role="status" aria-label="Loading orders" className={STYLES.table}>
            <div className={STYLES.headerRow}>
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className={STYLES.headerCell} />
                ))}
            </div>
            {Array.from({ length: rows }).map((_, r) => (
                <div key={r} className={STYLES.row}>
                    {Array.from({ length: 4 }).map((_, c) => (
                        <div key={c} className={STYLES.cell} />
                    ))}
                </div>
            ))}
        </div>
    );
}
```

## Error & Empty States (Reusable)

```tsx
// resources/js/Components/ErrorState.tsx
const STYLES = {
    wrap: 'flex flex-col items-center justify-center py-12 text-center',
    icon: 'h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4',
    title: 'text-lg font-semibold text-foreground',
    msg: 'mt-1 text-sm text-muted-foreground max-w-md',
    btn: 'mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg',
} as const;

export default function ErrorState({
    error, onRetry, title = 'Something went wrong',
}: { error: unknown; onRetry?: () => void; title?: string }) {
    const message = typeof error === 'string'
        ? error
        : (error as any)?.message ?? 'Please try again.';
    return (
        <div className={STYLES.wrap}>
            <div className={STYLES.icon}>!</div>
            <h3 className={STYLES.title}>{title}</h3>
            <p className={STYLES.msg}>{message}</p>
            {onRetry && <button className={STYLES.btn} onClick={onRetry}>Try again</button>}
        </div>
    );
}
```

## TypeScript — Shape Types from Resources

```ts
// resources/js/types/index.d.ts

export interface PaginatedResponse<T> {
    data: T[];
    meta: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    links: {
        first: string | null;
        last: string | null;
        next: string | null;
        prev: string | null;
    };
}

export interface User {
    id: string;
    name: string;
    email: string;
    role: 'user' | 'admin' | 'superadmin';
    created_at: string;
    updated_at: string;
}

export interface Order {
    id: string;
    product_id: string;
    quantity: number;
    status: 'pending' | 'paid' | 'shipped' | 'cancelled';
    created_at: string;
}
```

**Rule:** Types live in `resources/js/types/`, NOT scattered in components.
Match the field names from your Laravel API Resources exactly.

## Path Aliases (`@/...`)

```js
// vite.config.js
import path from 'path';

resolve: {
    alias: {
        '@': path.resolve(__dirname, 'resources/js'),
    },
},
```

```json
// tsconfig.json
{
    "compilerOptions": {
        "baseUrl": ".",
        "paths": {
            "@/*": ["resources/js/*"]
        }
    }
}
```

## Checklist — Before Shipping a Page

- [ ] Renders shell + heading on first paint (no waterfall blocking)
- [ ] Skeleton matches the shape of the loaded content
- [ ] Error state with retry handler
- [ ] Empty state for collections
- [ ] All API calls go through `@/lib/api` (interceptors apply)
- [ ] Form errors bound from `error.validation` (422)
- [ ] LABELS + STYLES defined as `const` above the component
- [ ] Page is wrapped in `<ProtectedRoute>` if auth required
- [ ] Filters reflected in URL via `useSearchParams`

## FORBIDDEN

| Pattern | Reason | Use Instead |
|--------|--------|-------------|
| `Inertia::render()` for new pages | Blocks first paint on DB | `api.get()` from React |
| `fetch()` in components | Bypasses CSRF/interceptors | `api.get/post/...` |
| `axios.get(...)` direct | Bypasses interceptors | `import api from '@/lib/api'` |
| Absolute URL into `api.get` | Overrides `baseURL`, leaks cookies | Relative path only |
| axios `< 1.20.0` | Known XSRF / SSRF / size / NO_PROXY CVEs | Pin ≥ 1.20.0 |
| `useEffect` to derive state | Anti-pattern | `useMemo` |
| `<a href>` for internal links | Full reload | `<Link>` from react-router-dom |
| `window.location.assign` for SPA nav | Full reload | `useNavigate()` |
| `localStorage` for tokens | XSS-readable | HttpOnly session cookie (Sanctum) |
| Skipping skeleton/empty/error states | Bad UX | All three are mandatory per page |
| Inline Tailwind class soup | Unstable refs | `STYLES` const at top |
| `__()`-style i18n inside JSX | React Hook violation | LABELS const at top |
| `dd()`-style debug | n/a in JS | Controlled debug constant pattern |
| Storing API tokens in `VITE_*` | Bundled = public | Server-side via session/Sanctum |

## See Also

- `axios-laravel-api` — the `api.js` instance and Sanctum CSRF flow
- `laravel-api-architecture` — the backend Controller→Service→Resource pipeline
- `react-patterns` v2.1 — React 19.3 hooks + generic axios contract
- `react-ui-patterns` — loading/error/empty patterns and decision tree
- `tailwind-patterns` — utility class composition with `cn()`
