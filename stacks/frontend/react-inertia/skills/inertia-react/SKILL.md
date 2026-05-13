---
name: inertia-react
version: 2.0.0
description: LEGACY skill — Inertia.js + React frontend integration with
  Laravel-rendered pages. Use ONLY in pre-existing Inertia projects. For NEW
  projects use the `react-api` frontend stack (`axios-laravel-api` +
  `react-api-standards`) which decouples render from data fetching.
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
