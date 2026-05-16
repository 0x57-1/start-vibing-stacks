---
name: inertia-react
version: 2.1.0
description: LEGACY skill — Inertia.js + React frontend integration with
  Laravel-rendered pages. Use ONLY in pre-existing Inertia projects. For NEW
  projects use the `react-api` frontend stack (`axios-laravel-api` +
  `react-api-standards`) which decouples render from data fetching. v2.1.0 adds
  the "Vite Build Gotchas" section covering the `manualChunks` × entry-chunk
  × `resolvePageComponent` glob interaction that produces silent
  wrong-component renders (production post-mortem 2026-05).
---

# Inertia.js + React Integration (LEGACY)

> **STATUS: LEGACY.** New projects use the **React API SPA** stack — Laravel
> serves a Vite shell, React owns routing client-side, and data is fetched via
> Axios with Sanctum cookie auth. See `axios-laravel-api` and
> `react-api-standards`.

## Architecture Overview

Inertia.js acts as a bridge between Laravel (backend) and React (frontend). There is NO separate API layer — controllers return Inertia responses that render React page components with server-side data as props.

```
Request Flow:
Browser → Laravel Router → Controller → Inertia::render('Page', $props)
                                              ↓
                                    HandleInertiaRequests (middleware)
                                              ↓
                                    InertiaShare (shared props: auth, translations, menu)
                                              ↓
                                    React Page Component (receives all props)
```

## Backend: Middleware

### HandleInertiaRequests

The Inertia middleware merges shared props (auth, translations, flash messages) into every response:

```php
namespace App\Http\Middleware;

use Inertia\Middleware;
use App\Support\InertiaShare;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    public function share(Request $request): array
    {
        return array_merge(
            parent::share($request),
            InertiaShare::getProps($request),
        );
    }
}
```

**Rules:**
- Keep `share()` lean — delegate to `InertiaShare` helper
- `parent::share()` provides validation errors automatically
- `version()` triggers full page reload on asset changes

### InertiaShare Support Class

Centralize all shared props in `App\Support\InertiaShare`:

```php
namespace App\Support;

class InertiaShare
{
    public static function getProps(Request $request): array
    {
        $locale = App::getLocale();

        return [
            'auth' => [
                'user' => $request->user() ? [
                    'id' => $request->user()->id,
                    'name' => $request->user()->name,
                    'role' => $request->user()->role,
                    'email' => $request->user()->email,
                    'timezone' => $request->user()->timezone,
                ] : null,
            ],
            'locale' => $locale,
            'translations' => static::getTranslations(
                $locale,
                $request->route()->uri,
            ),
            'flash' => $request->hasSession() ? [
                'success' => Session::get('success'),
                'error' => Session::get('error'),
            ] : [],
        ];
    }
}
```

**Rules:**
- Auth data: expose only necessary fields (never passwords, tokens)
- Translations loaded on-demand per page (not all at once)
- Flash messages via Laravel session
- Menu structure loaded from DB, filtered by permissions, cached per user

## Backend: Controllers with Inertia

Controllers render React page components via `Inertia::render()`:

```php
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class DashboardController extends Controller
{
    public function __construct(
        private readonly DashboardService $service,
    ) {}

    public function index(Request $request): InertiaResponse
    {
        return Inertia::render('Dashboard/Index', [
            'stats' => $this->service->getStats($request->user()),
            'recentOrders' => fn () => OrderResource::collection(
                $request->user()->orders()->latest()->limit(10)->get()
            ),
        ]);
    }

    public function show(Order $order): InertiaResponse
    {
        return Inertia::render('Orders/Show', [
            'order' => OrderResource::make($order->load('items')),
        ]);
    }
}
```

**Rules:**
- Return type: `Inertia\Response` (not `JsonResponse`)
- Page component path maps to: `resources/js/Pages/{path}`
- Use lazy props with `fn ()` for data not needed on first render
- Use API Resources to format complex data before passing as props
- Keep controller thin — delegate to services

### Inertia Redirects

```php
// After mutations, redirect (Inertia handles SPA navigation)
public function store(StoreOrderRequest $request): RedirectResponse
{
    $order = $this->service->create($request->validated());

    return redirect()
        ->route('orders.show', $order)
        ->with('success', __('orders.created'));
}

public function destroy(Order $order): RedirectResponse
{
    $this->service->delete($order);

    return redirect()
        ->route('orders.index')
        ->with('success', __('orders.deleted'));
}
```

**Rule:** POST/PUT/DELETE actions return `redirect()` with flash messages, never `Inertia::render()`.

## Backend: Translations On-Demand

Translations are loaded per-page via a config file that maps routes to translation files:

```php
// config/translations_inertia.php
return [
    'global' => ['common', 'errors', 'validation'],

    'pages' => [
        'dashboard' => ['dashboard'],
        'orders/*' => ['orders', 'products'],
        'settings/*' => ['settings'],
    ],
];
```

The `InertiaShare::getTranslations()` method:
1. Loads global translation files (always sent)
2. Loads page-specific files based on route URI
3. Merges PHP files (`lang/{locale}/*.php`) + JSON file (`lang/{locale}.json`)
4. Caches result per locale + page combination

**Rules:**
- Global files: `common`, `errors`, `validation` (always loaded)
- Page files: only load what the page needs
- Cache invalidation: clear on deploy (`php artisan cache:clear`)
- Store translations in `lang/en/*.php` and `lang/pt/*.php`

## Frontend: Translation Helper

The `__()` function resolves translation keys from Inertia shared props:

```js
// resources/js/Utils/translate.js
import { usePage } from '@inertiajs/react';

export default function __(key, replacements = {}, pageProps = null) {
    const propsSource = pageProps ? { props: pageProps } : usePage();
    const translations = propsSource.props.translations || {};

    let translation = key.split('.').reduce((obj, part) => {
        return obj && typeof obj[part] !== 'undefined' ? obj[part] : null;
    }, translations);

    if (translation === null) {
        return key;
    }

    if (typeof translation === 'string' && Object.keys(replacements).length > 0) {
        Object.keys(replacements).forEach((placeholder) => {
            translation = translation.replace(
                new RegExp(`:${placeholder}`, 'g'),
                replacements[placeholder],
            );
        });
    }

    return translation;
}
```

### Usage in React Components

```tsx
import __ from '@/Utils/translate';

// CORRECT: Define translations as CONST before hooks
const LABELS = {
    title: __('dashboard.title'),
    welcome: __('dashboard.welcome', { name: 'User' }),
    save: __('common.save'),
};

export default function Dashboard({ stats }) {
    const [loading, setLoading] = useState(false);

    return (
        <div>
            <h1>{LABELS.title}</h1>
            <p>{LABELS.welcome}</p>
        </div>
    );
}

// WRONG: Calling __() inside JSX (React Hook violation)
return <h1>{__('dashboard.title')}</h1>; // NEVER
```

**Rules:**
- ALWAYS define translations as `CONST` at the top of the component, BEFORE hooks
- NEVER call `__()` inside JSX or render methods
- New strings must be added to both `lang/en/*.php` and `lang/pt/*.php`
- Error strings centralized in `lang/*/errors.php`
- Use replacements for dynamic values: `__('greeting', { name: userName })`

## Frontend: Page Component Structure

```
resources/js/
├── Pages/
│   ├── Dashboard/
│   │   └── Index.jsx
│   ├── Orders/
│   │   ├── Index.jsx
│   │   ├── Show.jsx
│   │   └── _components/      # Page-specific components
│   │       ├── OrderTable.jsx
│   │       └── OrderFilters.jsx
│   ├── Auth/
│   │   ├── Login.jsx
│   │   └── Register.jsx
│   └── Users/
│       └── Admin/
│           └── Dashboard.jsx
├── Components/
│   ├── UI/                    # Reusable UI primitives
│   ├── Layout/                # Header, Sidebar, Footer
│   └── Shared/                # Cross-feature components
├── Icons/
│   ├── index.js               # Barrel export
│   ├── CheckIcon.svg
│   └── AlertIcon.svg
├── Layouts/
│   ├── AuthenticatedLayout.jsx
│   └── GuestLayout.jsx
└── Utils/
    └── translate.js           # __() helper
```

**Rules:**
- Pages map 1:1 to `Inertia::render('Path/Component')`
- Page-specific components in `_components/` folder
- Shared components in `Components/`
- Icons as separate `.svg` files, imported with `?react` suffix

## Frontend: Inertia Hooks

```tsx
import { usePage, useForm, router, Link } from '@inertiajs/react';

// Access shared props
const { auth, flash, locale } = usePage().props;

// Form handling with Inertia
const { data, setData, post, processing, errors } = useForm({
    name: '',
    email: '',
});

const handleSubmit = (e) => {
    e.preventDefault();
    post(route('users.store'));
};

// Programmatic navigation
router.visit(route('dashboard'));
router.reload({ only: ['stats'] }); // Partial reload

// Links (SPA navigation, no full page reload)
<Link href={route('orders.index')}>Orders</Link>
```

**Rules:**
- Use `useForm` for all form submissions (handles CSRF, errors, loading state)
- Use `router.reload({ only: [...] })` for partial page updates
- Use `<Link>` instead of `<a>` for SPA navigation
- Access shared props via `usePage().props`
- `processing` boolean from `useForm` for button loading states

## Vite Build Gotchas (Inertia-specific)

> **Production post-mortem 2026-05.** Reverting/rebuilding `vite.config.js`
> chunking in an Inertia + Laravel project can produce a **silent wrong-component
> render** (Login renders HttpErrorPage with HTTP 200, no console errors, empty
> Laravel logs). The bug lives in the bundle graph, not the server.

### The three-way collision

```
laravel-vite-plugin       ┐
  laravel({ input: [      │  Anything here becomes an ENTRY chunk.
    '.../HttpErrorPage'   │  Rollup/Rolldown ALWAYS prioritizes entries.
  ]})                     ┘

@inertiajs/react          ┐
  resolvePageComponent(   │  Builds a STATIC resolve-map at build time
    `./Pages/${name}.jsx`,│  via import.meta.glob. The map points each
    import.meta.glob(     │  Page path to whatever chunk hash Rollup
      './Pages/**/*.jsx') │  ended up putting that module in.
  )                       ┘

build.rollupOptions       ┐
  .manualChunks(id) {     │  This is ADVISORY. Returning 'pages-auth' for
    if (/Auth\//.test(id))│  a module that is ALSO an entry has NO EFFECT.
      return 'pages-auth' │  The grouping is silently dropped — no warning.
  }                       ┘
```

When the same module (e.g. `HttpErrorPage.jsx`) is:

1. listed in `laravel.input[]` (because `app.blade.php` has a direct
   `@vite('resources/js/Pages/.../HttpErrorPage.jsx')` for the error layout), AND
2. caught by `manualChunks` returning `'pages-auth'`,

…Rollup/Rolldown creates a **standalone entry chunk** containing ONLY
`HttpErrorPage`. The `pages-auth` group is reduced to that one module, and the
`import.meta.glob` resolve-map points **every sibling** (`Login`, `Register`,
`ForgotPassword`, …) at that same chunk hash. The siblings' code is discarded.

Symptom: `Inertia::render('Auth/Login', …)` returns 200 OK with a valid Inertia
payload. The browser fetches the chunk listed in the resolve-map. That chunk's
`default` export is `HttpErrorPage`. The error page is rendered. Backend is
perfect; frontend lies.

### Rule 1 — Never duplicate a module between `laravel.input` and the glob

If a page MUST be referenced directly by `@vite()` in a blade file (typical
cases: error pages, mail templates rendered server-side, OG/share-image
renderers), it becomes an entry chunk. You have two options:

- **A. Exclude it from the glob** — change `resolvePageComponent`'s glob to
  ignore that path, OR
- **B. Short-circuit `manualChunks` BEFORE any grouping rule** so the entry
  chunk's identity is preserved without polluting a group.

Pattern B (preferred — works without touching the Inertia bootstrap):

```js
// vite.config.js
build: {
    rollupOptions: {
        output: {
            manualChunks(id) {
                if (!id.includes('/resources/js/Pages/')) return;

                // Entry chunks referenced directly by @vite() in blade MUST
                // return undefined here — BEFORE any grouping rule.
                // Otherwise the group is collapsed into the entry and the
                // import.meta.glob resolve-map points siblings at the wrong
                // chunk hash. See "Vite Build Gotchas" in inertia-react skill.
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
for an entry module. The validation MUST be done out-of-band on `manifest.json`
after every build (see `scripts/check-vite-manifest.mjs` shipped by
`start-vibing-stacks`).

### Rule 3 — Validate `public/build/manifest.json` after every `vite build`

```bash
# 1. Quick eyeball
cat public/build/manifest.json | jq 'keys'

# 2. Automated (shipped script)
node scripts/check-vite-manifest.mjs public/build/manifest.json vite.config.js
```

The script cross-references `laravel.input[]` against the `Pages/**` glob and
fails (non-zero exit) on any collision.

### Rule 4 — Smoke-test after any `vite.config.js` change touching `build`

Three-step browser check for one critical route per page group:

1. DevTools → Network → click the Inertia XHR → read the `component:` field
   in the JSON response.
2. Click the JS asset request that followed → open the resolved chunk URL.
3. Search for `default:` / `export{ ... as default}` in that chunk. The
   component name MUST match the server's `component:`.

If they don't match, the bug is in the chunk graph. Revert the last
`vite.config.js` change before debugging anything else.

### Why Sonnet (and humans) get stuck on this class of bug

| Layer | What it looks like | Why it misleads |
|---|---|---|
| Laravel logs | Empty | Backend is genuinely correct |
| `manifest.json` | Valid, every input has an entry | Manifest doesn't enforce uniqueness across groups |
| Browser network tab | 200 OK on every request | The wrong JS arrives successfully |
| Console | Clean | The rendered component is valid React |

Triage rule of thumb: **when wrong-component render happens with HTTP 200 and
empty server logs, the bug is in the bundle. Start from the chunk graph, not
from Laravel.** This is captured as the "Bundle, not Backend" pattern in
`debugging-patterns`.

## Forbidden Patterns

| Pattern | Reason | Use Instead |
|---------|--------|-------------|
| `fetch()` / `axios` for page data | Bypasses Inertia | `Inertia::render()` with props |
| `__()` inside JSX | React Hook violation | CONST at top of component |
| Inline SVGs in JSX | Bloats components | SVG files with `?react` import |
| `<a href>` for internal links | Full page reload | `<Link href>` |
| `window.location` for navigation | Full page reload | `router.visit()` |
| `Inertia::render()` after POST | Breaks Inertia protocol | `redirect()->route()` |
| Loading all translations globally | Performance waste | On-demand per page route |
| Same module in `laravel.input[]` AND `Pages/**` glob | Rollup collapses the manual chunk group into the entry; resolve-map points siblings at the wrong chunk (silent wrong-component render) | Short-circuit `manualChunks` with early `return undefined` for entry pages |
| `manualChunks` grouping pages without running `check-vite-manifest.mjs` | Grouping is advisory and silently ignored for entry chunks | Always run the validator after touching `build.rollupOptions` |
| Trusting empty Laravel logs as "no bug" | Server can be 100% correct while the bundle ships the wrong default export | Use the "Bundle, not Backend" triage in `debugging-patterns` |
