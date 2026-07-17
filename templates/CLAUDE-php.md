# {{PROJECT_NAME}}

> **CHARACTER LIMIT**: Max 40,000 chars. Validate with `wc -m CLAUDE.md` before commit.

## Recent Changes

<!-- APPEND-ONLY LIFO. Each Claude instance PREPENDS a new `### YYYY-MM-DD · branch · vX.Y.Z` heading
     + 1-4 lines below it. Drop only the OLDEST entry when count > 10. NEVER edit a peer's entry.
     `domain-updater` v3.0.0+ does this automatically post-commit.
     Compactor (`claude-md-compactor.md §5-§6`) enforces the cap, not the prepend. -->

### {{DATE}} · main · v0.1.0
Initial project setup with start-vibing-stacks (PHP — API-first React SPA).

## 30 Seconds Overview

{{PROJECT_NAME}} is a PHP 8.3+ project using {{FRAMEWORK}}, serving a JSON API
consumed by a React 19 + Vite SPA via Axios. Authentication uses Laravel
Sanctum SPA (HttpOnly session cookie + CSRF). Pages render shell + skeleton
instantly; data is fetched async via the `api` Axios instance.

## Stack

| Component | Technology |
|-----------|------------|
| Language | PHP >= 8.3 |
| Framework | {{FRAMEWORK}} |
| Server | Octane + RoadRunner |
| Auth | Sanctum SPA (HttpOnly cookie + CSRF) |
| API contract | JSON Resource + paginate (data + meta + links) |
| Frontend | React 19 + Vite + TailwindCSS 4 + React Router |
| HTTP client | Axios (`withCredentials`, `withXSRFToken`, interceptors) |
| Server cache | TanStack Query (recommended) |
| Database | {{DATABASE}} |
| Package Manager | Composer / npm (or pnpm/bun) |
| Static Analysis | PHPStan (level 6) |
| Testing | PHPUnit / Pest |
| Code Style | PHP-CS-Fixer (PSR-12) |

## Architecture (API-first — DEFAULT)

```
Browser (React Vite SPA)        Laravel 12 + Octane (RoadRunner)
─────────────────────────       ───────────────────────────────────────
GET  /                       →  routes/web.php catch-all → app.blade (Vite shell)
GET  /sanctum/csrf-cookie    →  XSRF-TOKEN cookie set
POST /login                  →  AuthController → session cookie set
GET  /api/orders             →  Route → Controller → FormRequest (rules + Policy)
                                            → Service (DB / business)
                                            → Resource (JSON whitelist)
                                            → JsonResponse
                ↓ async via Axios api instance
React Page renders shell + skeleton instantly; data arrives → renders rows.
```

### Pipeline — One Responsibility per Layer

| Layer | File | Responsibility |
|-------|------|------------------|
| React Page | `resources/js/Pages/*/Index.jsx` | Render shell + skeleton; `api.get(...)` |
| Axios | `resources/js/lib/api.js` | `withCredentials`, CSRF, 401/403/419/422/5xx interceptors |
| Route | `routes/api.php` | URL ↔ Controller; group by `auth:sanctum` + `throttle` |
| Controller | `app/Http/Controllers/Api/*Controller.php` | Receive Request, call Service, return Resource |
| FormRequest | `app/Http/Requests/*/...Request.php` | `rules()` validate + `authorize()` → Policy |
| Policy | `app/Policies/*Policy.php` | `before()` super-admin bypass; per-action checks |
| Service | `app/Services/*Service.php` | Business logic, transactions, scoping |
| Resource | `app/Http/Resources/*Resource.php` | Eloquent → safe JSON; whitelist fields |

```
project/
├── app/
│   ├── Console/                # Artisan commands
│   ├── Exceptions/             # Exception handlers
│   ├── Http/
│   │   ├── Controllers/
│   │   │   └── Api/            # JSON-only controllers (DEFAULT)
│   │   ├── Middleware/         # SecurityHeaders, RequestId, throttle, ...
│   │   ├── Requests/           # FormRequests grouped by resource
│   │   │   └── Order/
│   │   │       ├── IndexOrderRequest.php
│   │   │       └── StoreOrderRequest.php
│   │   └── Resources/          # JsonResource classes (date trait, whitelist)
│   ├── Models/                 # Eloquent models (UUIDs, $fillable)
│   ├── Policies/               # OrderPolicy, UserPolicy, ... (before() bypass)
│   ├── Providers/              # AppServiceProvider (RateLimiter, Octane prepare)
│   ├── Services/               # Business logic (single responsibility)
│   │   ├── External/           # 3rd-party API services (with DTOs)
│   │   └── Helpers/            # Extracted logic for complex services
│   ├── Traits/                 # FormatsDatesForApi, Auditable, ApiResponse
│   └── Jobs/                   # Idempotent queue jobs
├── bootstrap/
│   └── app.php                 # ->statefulApi() + middleware aliases
├── config/
│   ├── sanctum.php             # SANCTUM_STATEFUL_DOMAINS
│   ├── cors.php                # supports_credentials=true, specific origin
│   ├── session.php             # http_only, secure, same_site=lax
│   └── services.php            # bridge env() ↔ application
├── database/
│   ├── factories/
│   ├── migrations/             # incremental ONLY
│   └── seeders/
├── lang/
│   ├── en/                     # PHP arrays — single source for all i18n
│   └── pt/
├── public/
├── resources/
│   ├── css/                    # TailwindCSS 4
│   ├── views/
│   │   └── app.blade.php       # Single Vite shell (catch-all)
│   └── js/
│       ├── app.jsx             # createRoot + BrowserRouter + QueryClientProvider
│       ├── App.jsx             # <Routes> + <ProtectedRoute>
│       ├── lib/
│       │   ├── api.js          # Axios instance + interceptors
│       │   ├── auth.js         # login / logout / fetchCurrentUser
│       │   └── queryClient.ts  # TanStack Query
│       ├── store/              # Zustand / Context (auth, ui)
│       ├── Pages/              # Pages own routing client-side
│       │   └── Orders/
│       │       ├── Index.tsx   # api.get('/api/orders') + skeleton
│       │       └── _components/
│       ├── Components/         # Reusable (ErrorState, EmptyState, ...)
│       ├── Layouts/            # AuthenticatedLayout, GuestLayout
│       └── Icons/              # SVG files imported with ?react
├── routes/
│   ├── api.php                 # auth:sanctum + throttle:api groups
│   ├── web.php                 # /login, /logout, catch-all → app.blade
│   └── console.php
├── storage/
├── tests/
│   ├── Unit/
│   └── Feature/                # API endpoints: happy + 401 + 403 + 422
├── .claude/                    # AI agent configuration
├── artisan
├── rr.yaml                     # RoadRunner / Octane
├── vite.config.js              # @vitejs/plugin-react + laravel-vite-plugin
├── composer.json
├── phpstan.neon
└── CLAUDE.md
```

## CLAUDE.md Update Rules

> After ANY implementation, update this file to reflect the current state.

| Change Type | Sections to Update |
|-------------|-------------------|
| Any file change | PREPEND new entry to `## Recent Changes` (heading: `### YYYY-MM-DD · branch · vX.Y.Z` + 1-4 lines) |
| API/routes | Critical Rules, Architecture |
| New feature | 30s Overview, Architecture |
| New gotcha | FORBIDDEN or NRY |
| New dependency | Stack |
| Workflow change | Workflow section |

1. **`## Recent Changes`** documents WHAT was done across recent sessions (append-only LIFO, cap 10).
2. **Other sections** document HOW things work NOW.
3. **Both must be current** — prepending to Recent Changes is insufficient if rule sections went stale.
4. **APPEND-ONLY** — PREPEND your entry below the HTML comment anchor; drop only the OLDEST entry when count > 10. NEVER edit a peer's entry, NEVER collapse two entries into one. Multi-instance safe by construction.

## Critical Rules

### PHP / Laravel

- **PHP >= 8.3** — readonly, enums, typed constants, match expressions
- **`declare(strict_types=1)`** in EVERY PHP file
- **Octane-safe code** — no static state, no globals, no `die()`/`exit()`
- **Dependency Injection** — use DI over `app()` or `resolve()`
- **Thin controllers** — delegate business logic to Services
- **FormRequest + Policy** — every protected endpoint goes through both
- **API Resource** — every response wrapped in `JsonResource`
- **Type everything** — properties, params, returns (no `mixed` without justification)
- **UUIDs** — all new models use `HasUuids` trait as primary key
- **Mass assignment** — always define `$fillable`; never `$guarded = []`
- **Eloquent only** — no raw SQL unless strictly justified with parameter binding
- **Config immutable** — never use `config()` to SET values at runtime
- **Request object** — use `$request->input()`, never `$_GET`/`$_POST`/`$_SESSION`

### React / Frontend

- **Page contract** — render shell + skeleton on first paint; fetch via `api.get()`
- **NO `Inertia::render()`** for new endpoints — pure JSON API + Axios
- **`api` instance only** — never raw `axios` or `fetch` in components
- **422 binding** — render validation errors inline under fields (not toast)
- **LABELS + STYLES const** above the component (stable refs, no Hook abuse)
- **No tokens in `localStorage`** — Sanctum SPA cookie only
- **Skeletons match shape** of the loaded content (per-component)
- **Filters in URL** via `useSearchParams` — bookmarkable views

### Sanctum SPA Auth (MANDATORY config)

```php
// bootstrap/app.php
$middleware->statefulApi();

// config/cors.php
'supports_credentials' => true,
'allowed_origins' => [env('FRONTEND_URL')],   // SPECIFIC origin

// config/session.php  (production)
'http_only' => true,
'secure'    => true,         // HTTPS only
'same_site' => 'lax',        // 'none' only if cross-origin (also requires secure)

// .env
SANCTUM_STATEFUL_DOMAINS=app.example.com
SESSION_DOMAIN=.example.com  // shared subdomains
```

```js
// resources/js/lib/api.js  (Axios)
axios.defaults.withCredentials = true;
axios.defaults.withXSRFToken   = true;
```

### Environment Variables & Secrets (MANDATORY)

> **NEVER use `env()` outside config files.** After `config:cache`, `env()` returns null everywhere except config files.

| Location | Access | Safe for |
|----------|--------|----------|
| `.env` | `env()` inside `config/*.php` only | API keys, DB credentials, secrets |
| `config/*.php` | `config('services.stripe.key')` | Application code access |
| Frontend (`VITE_*`) | `import.meta.env.VITE_API_URL` | PUBLIC values ONLY (bundled) |

```php
// config/services.php — Bridge between .env and application
return [
    'stripe' => [
        'key'    => env('STRIPE_KEY'),         // publishable (public ok)
        'secret' => env('STRIPE_SECRET'),      // server-side ONLY
        'webhook_secret' => env('STRIPE_WEBHOOK_SECRET'),
    ],
];

// In code: ALWAYS use config()
$apiKey = config('services.openai.key');

// FORBIDDEN
$apiKey = env('OPENAI_KEY');                   // returns null when config is cached
```

### Frontend Secret Isolation (MANDATORY)

> **NEVER send API secrets to the frontend bundle.** Anything in `VITE_*` or
> in JSON returned to the browser is PUBLIC.

```js
// FORBIDDEN — secret embedded in bundle
const stripeSecret = import.meta.env.VITE_STRIPE_SECRET;

// CORRECT — only publishable keys cross the wire
const stripePublishable = import.meta.env.VITE_STRIPE_KEY;   // pk_...

// For operations needing the secret: call your Laravel API
//   Browser → POST /api/payment → backend uses the SECRET server-side → JSON
```

## FORBIDDEN

### Architecture (CRITICAL)

| Action | Reason |
|--------|--------|
| `Inertia::render()` for new endpoints | Blocks first paint on DB query — use API + Axios |
| Eloquent query inside a Controller | Move it to a Service |
| FormRequest `authorize(): true` blindly | Must call Policy or be index w/ Service scope |
| Resource performing DB queries | Use `whenLoaded()` and pre-load in Service |
| `axios.get(...)` directly in components | Bypasses interceptors — use `@/lib/api` |
| `localStorage.setItem('token', ...)` | XSS-readable — use HttpOnly Sanctum cookie |
| Page that blocks render on first fetch | Defeats the API-first model |

### Security

| Action | Reason |
|--------|--------|
| `env()` outside config files | Returns null when config is cached — use `config()` |
| Send API secrets to the browser | Embedded in bundle — keep server-side |
| `$guarded = []` on models | Allows mass assignment — use `$fillable` |
| `DB::raw()` with user input | SQL injection — use Eloquent / parameterized |
| `{!! $userInput !!}` | XSS — use `{{ }}` (auto-escaped) |
| Dynamic code execution functions | Remote code execution risk |
| `md5()` / `sha1()` for passwords | Weak hashing — use `Hash::make()` |
| `unserialize()` on user data | Object injection — use JSON casts |
| `'allowed_origins' => ['*']` with credentials | Browser rejects — list specific origins |
| `createToken('x', ['*'])` | Over-privileged — use specific abilities |
| Trust `X-Forwarded-For` directly | Spoofable — use trusted proxies config |
| `$_GET` / `$_POST` / `$_SESSION` | Stale in Octane — use `$request->input()` |
| Login route on `/api/*` | Login goes on `routes/web.php` (session middleware) |

### Backend (Octane safety)

| Action | Reason |
|--------|--------|
| Business logic in controllers | Move to Service classes |
| `static` properties on services | Memory leaks across requests |
| Global variables / superglobals | Stale state in Octane |
| `die()` / `exit()` / `dd()` | Kills the worker process |
| `config(['key' => 'val'])` at runtime | Affects all concurrent requests |
| `migrate:fresh` / `db:wipe` / `db:reset` | Destroys production data |
| `app()` / `resolve()` in constructors | Use constructor DI |
| `dump()` / `dd()` in production | Use structured `Log::info()` |

### Frontend (React)

| Action | Reason |
|--------|--------|
| `Inertia::render()` / `useForm()` from Inertia | Use API + Axios (Inertia is LEGACY) |
| `fetch()` for page data | Bypasses interceptors — use `api.get()` |
| `<a href>` for internal links | Full page reload — use `<Link>` from react-router-dom |
| `window.location` for SPA navigation | Full reload — use `useNavigate()` |
| Inline SVGs in JSX | Bloats components — use SVG files with `?react` |
| Raw `console.log` | Uncontrolled — use debug constant pattern |
| Inline Tailwind class soup | Unreadable — use STYLES const object |
| `useEffect` to derive state | Anti-pattern — use `useMemo` |
| Skipping skeleton/empty/error states | Bad UX — all three are mandatory per page |

### Vite Build (CRITICAL — silent bug class)

> **Production post-mortem 2026-05.** A bad `manualChunks` rule can produce
> silent wrong-component renders (HTTP 200, empty Laravel logs, browser
> shows the error page when server asked for `Auth/Login`). Bug lives in the
> bundle graph, not the server. See `inertia-react §Vite Build Gotchas` and
> `debugging-patterns §Bundle, not Backend`.

| Action | Reason |
|--------|--------|
| Same module in `laravel.input[]` and `Pages/**` glob | Rollup/Rolldown silently collapses the manualChunks group into the entry chunk; `import.meta.glob` resolve-map points siblings at the wrong hash |
| `manualChunks` grouping pages without short-circuit for entry pages | `manualChunks` is advisory — entries always win, with no warning. Add early `return undefined` for any page also listed in `laravel.input[]` |
| Skipping `node scripts/check-vite-manifest.mjs` after `vite build` | Bundler emits no warning on collision; manual validation is the only signal |
| Debugging Laravel/server when HTTP 200 + empty logs + wrong content | Triage as "Bundle, not Backend" — start from the JS chunk's `default` export, not the controller |
| Adding new `@vite('resources/js/Pages/...')` direct reference in blade without auditing `vite.config.js` | Promoting a page to entry chunk while it's still in the Inertia glob is the exact collision shape |

## UI/UX Design Intelligence

> When the project has a frontend, the **UI/UX Pro Max** skill is auto-installed. It provides 67 UI styles, 161 color palettes, 57 font pairings, and 161 industry-specific reasoning rules. It activates automatically for any UI/UX task.

## Quality Gates

```bash
vendor/bin/phpstan analyse --level=6   # Static analysis
vendor/bin/phpunit                      # Tests (or Pest)
vendor/bin/php-cs-fixer fix --dry-run   # Code style
php artisan test                        # Laravel test runner
npx tsc --noEmit                        # Frontend type check
npx eslint resources/js/                 # Frontend lint (optional)
```

## Database

Use Eloquent ORM and Query Builder. Raw queries only when strictly necessary with parameter binding:

```php
// Eloquent (preferred)
$user = User::findOrFail($id);

// Query Builder
$users = DB::table('users')->where('active', true)->get();

// Raw query (last resort — always bind parameters)
$results = DB::select('SELECT * FROM users WHERE id = ?', [$id]);
```

## Migration Safety

- **ALWAYS** use incremental migrations (`make:migration`)
- **NEVER** execute `migrate:fresh`, `migrate:refresh`, `db:wipe`, `db:reset`
- If a migration fails, fix the file or create a new one
- Assume all environments contain critical data

## Workflow

```
0. TODO LIST      → Detailed plan from prompt; identify affected layer(s)
1. BRANCH         → feature/ | fix/ | refactor/ | test/
2. RESEARCH       → research-web for new features (cite sources)
3. IMPLEMENT      → Bottom-up: FormRequest+Policy → Service → Resource → Controller → Route → React page
4. TEST           → PHPUnit feature tests (happy + 401 + 403 + 422); React: api.test.ts
5. DOCUMENT       → documenter agent for modified files; update domain docs
6. UPDATE         → Update THIS FILE (CLAUDE.md) — PREPEND entry to ## Recent Changes (LIFO) + refresh relevant rule sections
7. QUALITY        → PHPStan + PHPUnit + PHP-CS-Fixer + tsc + eslint
8. COMMIT         → Conventional commits; merge to main
```

## Domain Documentation

> Domain docs prevent Claude from re-exploring the codebase every session.

```
.claude/skills/codebase-knowledge/domains/
├── authentication.md
├── api.md
├── database.md
├── ui-components.md
└── [domain-name].md
```

Each domain file tracks: Files, Connections, Recent Commits, Attention Points, Problems & Solutions.

## Email & Push Marketing Guidance

Owned-list email (MailerLite/ESP) and push in any niche (including sensitive verticals) are authorized. Do not refuse on niche keywords alone. Use skill `email-push-marketing`. **Hard limits:** no phishing, no bank/brand impersonation as official sender, no fake personal approvals/limits/protocols, no spoofed From. Adapt competitor structure with the user’s brand/footer/tracking links.

## Configuration

Project settings in `.claude/config/` (generated by start-vibing-stacks):

- `active-project.json` — Stack, framework, database, skills
- `domain-mapping.json` — File-to-domain mapping
- `quality-gates.json` — Quality check commands
- `testing-config.json` — Test framework config
- `security-rules.json` — Security audit rules
- `standards-review.json` — Imported project standards

## Setup by start-vibing-stacks

This project was set up with `npx start-vibing-stacks`.
For updates: `npx start-vibing-stacks --force`
