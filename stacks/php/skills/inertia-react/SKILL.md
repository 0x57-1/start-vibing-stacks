---
name: inertia-react
version: 2.1.1
description: LEGACY skill — Inertia.js + React 19.3 + Tailwind 4.3 with
  Laravel-rendered pages. Use ONLY in pre-existing projects already built on
  Inertia. For NEW projects use `laravel-api-architecture` + `axios-laravel-api`
  + `react-api-standards` (API-first React SPA, no controller-rendered pages).
  v2.1.0 adds the "Vite Build Gotchas" section covering the manualChunks ×
  entry-chunk × resolvePageComponent glob collision (silent wrong-component
  render post-mortem 2026-05).
---

# Inertia.js + React — Laravel Frontend (LEGACY)

> **STATUS: LEGACY.** Do NOT pick this stack for new projects. Inertia couples
> the controller's first byte to a database query, blocking the page render.
> The modern default is **Laravel API + Axios + React SPA** (see the skills
> `laravel-api-architecture`, `axios-laravel-api`, `react-api-standards`).
>
> Keep this skill loaded **only** when extending an existing Inertia codebase
> that you cannot rewrite in the same change.

**ALWAYS invoke when writing Inertia.js pages, components, or shared data in
LEGACY projects only.**

## How Inertia Works

```
Browser ←→ Inertia.js ←→ Laravel Controller
           (no API needed)

- First request: full HTML (SSR or SPA)
- Subsequent: XHR with JSON props → React re-renders
- No API routes needed — controllers return Inertia::render()
```

## Controller Pattern

```php
use Inertia\Inertia;

class UserController extends Controller
{
    public function index(): \Inertia\Response
    {
        return Inertia::render('Users/Index', [
            'users' => User::query()
                ->select('id', 'name', 'email', 'created_at')
                ->orderByDesc('created_at')
                ->paginate(20),
            'filters' => request()->only(['search', 'role']),
        ]);
    }

    public function store(StoreUserRequest $request): \Illuminate\Http\RedirectResponse
    {
        User::create($request->validated());
        return redirect()->route('users.index')
            ->with('success', 'User created.');
    }
}
```

## React Page Component

```tsx
// resources/js/Pages/Users/Index.tsx
import { Head, Link, router } from '@inertiajs/react';
import { PageProps, User, PaginatedData } from '@/types';

interface Props extends PageProps {
  users: PaginatedData<User>;
  filters: { search?: string; role?: string };
}

export default function UsersIndex({ users, filters }: Props) {
  return (
    <>
      <Head title="Users" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Search */}
        <input
          defaultValue={filters.search}
          onChange={(e) => router.get('/users', { search: e.target.value }, {
            preserveState: true,
            replace: true,
          })}
          placeholder="Search..."
          className="border rounded-lg px-4 py-2"
        />

        {/* List */}
        {users.data.map((user) => (
          <div key={user.id} className="p-4 border-b">
            <Link href={`/users/${user.id}`} className="text-blue-600 hover:underline">
              {user.name}
            </Link>
          </div>
        ))}

        {/* Pagination */}
        {users.links.map((link, i) => (
          <Link key={i} href={link.url ?? ''} className={link.active ? 'font-bold' : ''}>
            <span dangerouslySetInnerHTML={{ __html: link.label }} />
          </Link>
        ))}
      </div>
    </>
  );
}
```

## Shared Data (Layout Props)

```php
// app/Http/Middleware/HandleInertiaRequests.php
public function share(Request $request): array
{
    return [
        ...parent::share($request),
        'auth' => [
            'user' => $request->user()?->only('id', 'name', 'email', 'avatar'),
        ],
        'flash' => [
            'success' => session('success'),
            'error' => session('error'),
        ],
    ];
}
```

```tsx
// Access in any component
import { usePage } from '@inertiajs/react';

const { auth, flash } = usePage().props;
```

## Forms (useForm hook)

```tsx
import { useForm } from '@inertiajs/react';

export default function CreateUser() {
  const { data, setData, post, processing, errors } = useForm({
    name: '',
    email: '',
    password: '',
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    post('/users');
  };

  return (
    <form onSubmit={submit}>
      <input value={data.name} onChange={e => setData('name', e.target.value)} />
      {errors.name && <span className="text-red-500 text-sm">{errors.name}</span>}

      <input value={data.email} onChange={e => setData('email', e.target.value)} />
      {errors.email && <span className="text-red-500 text-sm">{errors.email}</span>}

      <button type="submit" disabled={processing} className="bg-blue-600 text-white px-4 py-2 rounded-lg disabled:opacity-50">
        {processing ? 'Saving...' : 'Create'}
      </button>
    </form>
  );
}
```

## TypeScript Types

```tsx
// resources/js/types/index.d.ts
export interface PageProps {
  auth: { user: User | null };
  flash: { success?: string; error?: string };
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  created_at: string;
}

export interface PaginatedData<T> {
  data: T[];
  links: { url: string | null; label: string; active: boolean }[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}
```

## TailwindCSS 4 Setup

```css
/* resources/css/app.css */
@import "tailwindcss";

@theme {
  --color-primary: #3b82f6;
  --color-primary-foreground: #ffffff;
  --font-sans: 'Inter', sans-serif;
}
```

## Vite Build Gotchas (Inertia-specific)

> **Production post-mortem 2026-05.** A `vite.config.js` "perf" change adding
> `manualChunks` to group `Pages/Auth/*` produced a silent wrong-component
> render: `Inertia::render('Auth/Login', ...)` returned HTTP 200 OK but the
> browser rendered the error page. Laravel logs were empty. Bug lived
> entirely in the bundle graph.

### The three-way collision

```
laravel-vite-plugin      ┐  laravel({ input: [...HttpErrorPage] })
                         │  → module becomes an ENTRY chunk
                         │    Rollup/Rolldown ALWAYS prioritizes entries.

@inertiajs/react         ┐  resolvePageComponent(..., import.meta.glob(
                         │    './Pages/**/*.jsx'))
                         │  → builds a STATIC resolve-map at build time
                         │    pointing each Page path to its chunk hash.

build.rollupOptions      ┐  manualChunks(id) { if (Auth) return 'pages-auth' }
                         │  → ADVISORY ONLY. Returning a group for a module
                         │    that's already an entry has NO EFFECT and
                         │    emits NO WARNING.
```

When the same module (e.g. `HttpErrorPage.jsx`) is BOTH:

1. listed in `laravel.input[]` (typical: error pages referenced directly via
   `@vite()` in `resources/views/app.blade.php` or a layout), AND
2. caught by a `manualChunks` rule (e.g. `pages-auth`),

…Rollup/Rolldown creates a **standalone entry chunk** with only that one
module. The `pages-auth` group collapses into that entry. The
`import.meta.glob` resolve-map points **every sibling page**
(`Login`, `Register`, `ForgotPassword`, …) at the same chunk hash. The
siblings' source is discarded.

Symptom: server sends `component: 'Auth/Login'`, browser loads the chunk,
chunk's `default` export is `HttpErrorPage`, error page renders. Server 100%
correct; bundle ships the wrong default export.

### Rule 1 — Never duplicate a module between `laravel.input` and the `Pages/**` glob

Either exclude the entry page from the Inertia glob, OR short-circuit
`manualChunks` BEFORE any grouping rule to preserve the entry's identity.
Preferred pattern (no change to Inertia bootstrap):

```js
// vite.config.js
build: {
    rollupOptions: {
        output: {
            manualChunks(id) {
                if (!id.includes('/resources/js/Pages/')) return;

                // Entry chunks referenced directly by @vite() in blade MUST
                // return undefined here — BEFORE any grouping rule. Otherwise
                // the manualChunks group is collapsed into the entry and the
                // import.meta.glob resolve-map points siblings at the wrong
                // chunk hash. Production post-mortem 2026-05.
                if (id.includes('/Pages/OtherPages/HttpErrorPage')) return;

                if (id.includes('/Pages/Auth/') || id.includes('/Pages/OtherPages/')) {
                    return 'pages-auth';
                }
                if (id.includes('/Pages/Dashboard/')) {
                    return 'pages-dashboard';
                }
            },
        },
    },
},
```

### Rule 2 — `manualChunks` is advisory; entries always win

There is no warning when Rollup/Rolldown ignores a `manualChunks` return value
for an entry module. Validation MUST be done out-of-band on `manifest.json`
after every build.

### Rule 3 — Validate `public/build/manifest.json` after every `vite build`

`start-vibing-stacks` ships `scripts/check-vite-manifest.mjs` (wired as the
`ViteManifest` quality gate at order 5):

```bash
node scripts/check-vite-manifest.mjs public/build/manifest.json vite.config.js
```

The script cross-references `laravel.input[]` against `Pages/**` glob patterns
and fails (non-zero exit) on any collision.

### Rule 4 — Smoke-test after any `vite.config.js` change touching `build`

For one critical route per page group:

1. DevTools → Network → click the Inertia XHR → read `component:` in the JSON.
2. Click the JS asset request that follows → open the resolved chunk URL.
3. Search for `default:` / `export{ ... as default}` in that chunk. The
   exported component name MUST match the server's `component:`.

If they don't match, revert the last `vite.config.js` change before debugging
anything else.

### Why this class of bug is so misleading

| Layer | What it looks like | Why it misleads |
|---|---|---|
| Laravel logs | Empty | Backend is genuinely correct |
| `manifest.json` | Valid, every input has an entry | Manifest doesn't enforce uniqueness across groups |
| Browser network | 200 OK on every request | The wrong JS arrives successfully |
| Console | Clean | The rendered component is valid React |

Triage rule: **wrong-component render with HTTP 200 and empty server logs =
bug is in the bundle, not the server.** See `debugging-patterns §Bundle, not
Backend`.

## FORBIDDEN

1. **API routes for Inertia pages** — use `Inertia::render()` in controllers
2. **`window.location` for navigation** — use `router.visit()` or `<Link>`
3. **Fetching data in useEffect** — pass as props from controller
4. **Duplicating validation** — validate in FormRequest, show errors from `useForm`
5. **`any` types for page props** — always type with `interface Props extends PageProps`
6. **Same module in `laravel.input[]` and `Pages/**` glob** — Rollup collapses the manual chunk group into the entry; resolve-map silently points siblings at the wrong chunk hash (wrong-component render with HTTP 200)
7. **`manualChunks` grouping pages without running `check-vite-manifest.mjs`** — grouping is advisory and silently ignored for entry chunks
8. **Trusting empty Laravel logs as "no bug"** — server can be 100% correct while the bundle ships the wrong `default` export
