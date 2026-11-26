---
name: axios-laravel-api
version: 2.1.2
description: "Axios ≥1.20.0 HTTP client for a Laravel JSON endpoint (Sanctum cookie). A page is Inertia::render, not this client. Boolean `withCredentials` + `withXSRFToken`, `allowAbsoluteUrls: false`, bounded 419 retry, CSRF priming, interceptors for 401/403/422/5xx."
---

# Axios + Laravel Sanctum SPA Client

**ALWAYS invoke when creating the API client, login flow, or CSRF/cookie
configuration for a React (Vite) SPA hitting a Laravel 13 API.**

## Why this exists

This client calls a JSON endpoint under `routes/api.php`. A page does not
use it for the first load. A page returns `Inertia::render` and the React
page receives props (`inertia-react`).

Use Axios when a page that is already on screen needs a JSON route:

1. The page is already rendered from controller props.
2. The page calls `api.get('/api/whatever')` for the extra request.
3. Laravel's API controller delegates to a Service and returns a Resource.

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                     SAME ORIGIN (RECOMMENDED)                     │
│                                                                  │
│  Browser ──GET /───▶ Laravel (web.php catch-all → Vite shell)   │
│  Browser ──GET /sanctum/csrf-cookie──▶ XSRF-TOKEN cookie set    │
│  Browser ──POST /login──▶ Laravel session cookie set            │
│  Browser ──GET /api/x──▶ auth:sanctum (cookie) ──▶ JSON         │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                  CROSS-ORIGIN (api.example.com ↔ app.example.com)│
│                                                                  │
│  Both hosts MUST be on the same parent domain (`example.com`)    │
│  for the session cookie to be shared. Set:                       │
│    SESSION_DOMAIN=.example.com                                   │
│    SANCTUM_STATEFUL_DOMAINS=app.example.com                      │
│    CORS supports_credentials: true + allowed_origins: app URL    │
└──────────────────────────────────────────────────────────────────┘
```

## The Axios Instance — `resources/js/lib/api.js`

```js
import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/',
    withCredentials: true,        // MUST be boolean — session cookies
    withXSRFToken: true,          // MUST be boolean true (CVE-2026-42042)
    allowAbsoluteUrls: false,     // block absolute-URL override (CVE-2025-27152)
    timeout: 15000,
    maxContentLength: 10_000_000,
    maxBodyLength: 10_000_000,
    headers: {
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
    },
});

// ── 1. CSRF cookie cache (avoid hitting /sanctum/csrf-cookie on every POST) ──
let csrfReady = false;
async function ensureCsrf() {
    if (csrfReady) return;
    await api.get('/sanctum/csrf-cookie');
    csrfReady = true;
}

// ── 2. Request interceptor — fetch CSRF cookie before any unsafe method ──
api.interceptors.request.use(async (config) => {
    const method = (config.method ?? 'get').toLowerCase();
    if (['post', 'put', 'patch', 'delete'].includes(method)) {
        await ensureCsrf();
    }
    return config;
});

// ── 3. Response interceptor — centralized error handling ──
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const status = error.response?.status;

        if (status === 401) {
            // Session expired or not authenticated → bounce to login
            csrfReady = false;
            if (window.location.pathname !== '/login') {
                window.location.assign(
                    `/login?redirect=${encodeURIComponent(window.location.pathname)}`,
                );
            }
        }

        if (status === 419 && !error.config?._csrfRetry) {
            // CSRF token mismatch — re-prime cookie and retry ONCE
            csrfReady = false;
            error.config._csrfRetry = true;
            await ensureCsrf();
            return api.request(error.config);
        }

        if (status === 403) {
            // Authorization (Policy) failed — surface as toast
            window.dispatchEvent(new CustomEvent('api:forbidden', {
                detail: error.response?.data?.message ?? 'Forbidden',
            }));
        }

        if (status === 422) {
            // Validation errors — return shaped error so callers can render
            const errors = error.response?.data?.errors ?? {};
            error.validation = errors;
        }

        if (status >= 500) {
            window.dispatchEvent(new CustomEvent('api:server-error', {
                detail: error.response?.data?.message ?? 'Server error',
            }));
        }

        return Promise.reject(error);
    },
);

export default api;
```

**Rules:**

- Pin **axios ≥ 1.20.0** (XSRF boolean check, absolute-URL / `data:` / size / NO_PROXY / redirect headers).
- `withCredentials: true` is MANDATORY — without it, session cookie is dropped.
- `withXSRFToken: true` is MANDATORY and **must be the boolean `true`** — never
  `1`, `"true"`, or a polluted prototype value (CVE-2026-42042 leaks the token
  cross-origin when the flag is merely truthy).
- `allowAbsoluteUrls: false` is MANDATORY — a caller-controlled absolute URL
  must not override `baseURL` and walk cookies/headers off-origin
  (CVE-2025-27152). Paths stay relative (`/api/users`).
- The `csrfReady` cache avoids hitting `/sanctum/csrf-cookie` on every POST.
  Reset it on any 401/419 so the next mutation re-primes.
- 419 retry is bounded by `_csrfRetry` on `error.config` — one attempt only.
- 401 → redirect, 403 → toast, 422 → return for inline form errors,
  5xx → toast. NEVER swallow errors silently.
- TanStack Query: `queryFn: ({ signal }) => api.get(url, { signal })`.

## Auth Helpers — `resources/js/lib/auth.js`

```js
import api from './api';

export async function login(email, password) {
    await api.get('/sanctum/csrf-cookie');
    const { data } = await api.post('/login', { email, password });
    return data;
}

export async function logout() {
    await api.post('/logout');
}

export async function fetchCurrentUser() {
    const { data } = await api.get('/api/user');
    return data;
}
```

## Page Pattern — Shell + Skeleton + Async Fetch

```tsx
// resources/js/Pages/Users/Index.tsx
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import UsersTable from './_components/UsersTable';
import UsersTableSkeleton from './_components/UsersTableSkeleton';
import ErrorState from '@/Components/ErrorState';

const STYLES = {
    page: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8',
    heading: 'text-2xl font-bold text-foreground mb-6',
} as const;

const LABELS = {
    title: 'Users',
} as const;

export default function UsersIndexPage() {
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    const load = async () => {
        try {
            setError(null);
            setLoading(true);
            const res = await api.get('/api/users', { params: { per_page: 25 } });
            setData(res.data);
        } catch (e) {
            setError(e.response?.data?.message ?? 'Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    return (
        <div className={STYLES.page}>
            <h1 className={STYLES.heading}>{LABELS.title}</h1>

            {error && <ErrorState error={error} onRetry={load} />}
            {!error && loading && !data && <UsersTableSkeleton />}
            {!error && data && <UsersTable users={data.data} meta={data.meta} />}
        </div>
    );
}
```

**Critical:** the page renders the heading + layout IMMEDIATELY. The skeleton
shows only inside the data area while Axios fetches. NEVER block the entire
page render on the API call.

## Production-Grade: TanStack Query (Recommended for Lists)

```tsx
// resources/js/lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 30_000,
            gcTime: 5 * 60_000,
            retry: (failureCount, error: any) => {
                const status = error?.response?.status;
                if (status === 401 || status === 403 || status === 422) return false;
                return failureCount < 2;
            },
            refetchOnWindowFocus: false,
        },
    },
});

// resources/js/Pages/Users/Index.tsx
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

const fetchUsers = async (page: number, signal?: AbortSignal) => {
    const { data } = await api.get('/api/users', {
        params: { page, per_page: 25 },
        signal,
    });
    return data;
};

export default function UsersIndexPage() {
    const [page, setPage] = useState(1);
    const { data, error, isPending, refetch } = useQuery({
        queryKey: ['users', page],
        queryFn: ({ signal }) => fetchUsers(page, signal),
    });

    if (error) return <ErrorState error={error} onRetry={refetch} />;
    if (isPending && !data) return <UsersTableSkeleton />;
    return <UsersTable users={data.data} meta={data.meta} onPageChange={setPage} />;
}
```

**Rules:**

- Use TanStack Query for any list/detail page that benefits from cache,
  refetch, or shared state across components.
- `retry` MUST exclude 4xx auth/validation errors (no point retrying).
- `refetchOnWindowFocus: false` prevents unwanted refetches in admin panels.

## Form Submissions — Surface 422 Validation Errors Inline

```tsx
import { useState } from 'react';
import api from '@/lib/api';

const STYLES = {
    form: 'space-y-4 max-w-md',
    field: 'block text-sm font-medium text-foreground mb-1',
    input: 'w-full h-10 px-3 rounded-md border border-border bg-background',
    error: 'mt-1 text-sm text-destructive',
    btn: 'px-4 py-2 bg-primary text-primary-foreground rounded-lg disabled:opacity-50',
} as const;

export default function CreateUser({ onCreated }: { onCreated: () => void }) {
    const [form, setForm] = useState({ name: '', email: '' });
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [submitting, setSubmitting] = useState(false);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});
        setSubmitting(true);
        try {
            await api.post('/api/users', form);
            onCreated();
        } catch (err: any) {
            if (err.validation) {
                setErrors(err.validation);
            } else {
                setErrors({ _: ['Unexpected error. Try again.'] });
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form className={STYLES.form} onSubmit={submit}>
            <div>
                <label className={STYLES.field}>Name</label>
                <input
                    className={STYLES.input}
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
                {errors.name?.[0] && <p className={STYLES.error}>{errors.name[0]}</p>}
            </div>
            <div>
                <label className={STYLES.field}>Email</label>
                <input
                    type="email"
                    className={STYLES.input}
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
                {errors.email?.[0] && <p className={STYLES.error}>{errors.email[0]}</p>}
            </div>
            <button type="submit" disabled={submitting} className={STYLES.btn}>
                {submitting ? 'Saving...' : 'Save'}
            </button>
        </form>
    );
}
```

**Rule:** Laravel's `FormRequest` → on failure returns `422 + { message, errors:
{ field: [msg] } }`. The interceptor exposes this as `error.validation`. Render
inline under each field. NEVER use a global toast for field-level errors.

## Vite Configuration (Same-Origin)

```js
// vite.config.js
import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.jsx'],
            refresh: true,
        }),
        react(),
    ],
    server: {
        host: 'localhost',
        port: 5173,
        hmr: { host: 'localhost' },
    },
});
```

## React Router Catch-All Setup

```php
// routes/web.php — single shell route, React owns all paths
Route::get('/{any?}', fn () => view('app'))->where('any', '^(?!api|sanctum|login|logout|register).*$');
```

```blade
{{-- resources/views/app.blade.php --}}
<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{{ config('app.name') }}</title>
    @viteReactRefresh
    @vite(['resources/css/app.css', 'resources/js/app.jsx'])
</head>
<body>
    <div id="app"></div>
</body>
</html>
```

```jsx
// resources/js/app.jsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import App from './App';

createRoot(document.getElementById('app')).render(
    <React.StrictMode>
        <QueryClientProvider client={queryClient}>
            <BrowserRouter>
                <App />
            </BrowserRouter>
        </QueryClientProvider>
    </React.StrictMode>,
);
```

## Environment Variables

```bash
# .env (Laravel)
APP_URL=http://localhost:8000
SESSION_DRIVER=cookie
SESSION_DOMAIN=localhost
SESSION_SAME_SITE=lax
SESSION_SECURE_COOKIE=false   # true in production (HTTPS only)
SANCTUM_STATEFUL_DOMAINS=localhost,localhost:5173,127.0.0.1,127.0.0.1:8000

# Production:
# SESSION_DOMAIN=.example.com
# SESSION_SECURE_COOKIE=true
# SESSION_SAME_SITE=lax
# SANCTUM_STATEFUL_DOMAINS=app.example.com
```

```bash
# .env (Vite — only PUBLIC variables prefixed VITE_)
VITE_API_URL=/                # same-origin → leave as "/"
# VITE_API_URL=https://api.example.com   # cross-origin
```

## Checklist — Before Shipping the Client

- [ ] axios ≥ 1.20.0; `allowAbsoluteUrls: false`; relative paths only
- [ ] `withCredentials: true` and `withXSRFToken: true` (booleans) on the instance
- [ ] CSRF cookie primed before any POST/PUT/PATCH/DELETE
- [ ] 401 interceptor redirects to `/login` (with `?redirect=...`)
- [ ] 419 interceptor re-primes CSRF and retries ONCE
- [ ] 422 interceptor exposes `error.validation` for inline form errors
- [ ] No raw `axios.get` in components — always via `api` instance
- [ ] No tokens or session data in `localStorage` (cookie only)
- [ ] `VITE_*` env vars are PUBLIC — never put secrets here
- [ ] Pages render shell + skeleton instantly; data arrives async

## FORBIDDEN

| Action | Reason |
|--------|--------|
| A page loaded with `api.get` on first paint | A page is `Inertia::render` (`inertia-react`) |
| `localStorage.setItem('token', ...)` | XSS-readable; use HttpOnly session cookie |
| `axios.get(...)` directly in component | Bypasses interceptors — always use `api` |
| Hitting `/sanctum/csrf-cookie` on every POST | Wasteful — cache the priming |
| Catching errors silently | Always surface 401/403/422/5xx to user |
| Skipping `withCredentials: true` | Cookie is dropped → 401 forever |
| `withCredentials` + `Access-Control-Allow-Origin: *` | Browser rejects — must be a specific origin |
| Storing tokens in `VITE_*` env vars | They're embedded in the bundle — public |
| Blocking page render on first fetch | Defeats the purpose of skeleton-first SPA |
| `axios.defaults.baseURL = absolute-prod-url` in dev | Use `import.meta.env.VITE_API_URL` |
| `withXSRFToken: 1` / `"true"` / omitted after proto pollution | Literal boolean `true` (CVE-2026-42042) |
| `api.get('https://…')` or user-controlled absolute URL | Relative path + `allowAbsoluteUrls: false` |
| 419 retry without a per-config flag | Set `error.config._csrfRetry` — one hop |
| axios `< 1.20.0` | Pin ≥ 1.20.0 (XSRF, SSRF, `data:`, size, NO_PROXY) |

## See Also

- `laravel-api-architecture` — backend pipeline (Controller → FormRequest → Policy → Service → Resource)
- `react-api-standards` — the JSON client. A page is `inertia-react`
- `react-patterns` — generic axios contract (Vite / Next client)
- `api-security` — Sanctum config, CORS, rate limiting, brute-force protection
- `security-baseline/cve-watchlist.md` — named axios / React floors (lockfile hit)
