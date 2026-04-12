# {{PROJECT_NAME}}

> **CHARACTER LIMIT**: Max 40,000 chars. Validate with `wc -m CLAUDE.md` before commit.

## Last Change

**Branch:** main
**Date:** {{DATE}}
**Summary:** Initial project setup with start-vibing-stacks (PHP)

## 30 Seconds Overview

{{PROJECT_NAME}} is a PHP 8.3+ project using {{FRAMEWORK}}.

## Stack

| Component | Technology |
|-----------|------------|
| Language | PHP >= 8.3 |
| Framework | {{FRAMEWORK}} |
| Server | Octane + RoadRunner |
| Frontend | ReactJS 19+ / Inertia.js / TailwindCSS 4+ |
| Database | {{DATABASE}} |
| Package Manager | Composer |
| Static Analysis | PHPStan (level 6) |
| Testing | PHPUnit |
| Code Style | PHP-CS-Fixer (PSR-12) |

## Architecture

```
project/
├── app/
│   ├── Console/         # Artisan commands
│   ├── Exceptions/      # Exception handlers
│   ├── Http/
│   │   ├── Controllers/ # Thin controllers (Inertia::render + Services)
│   │   ├── Middleware/  # HTTP middleware (HandleInertiaRequests)
│   │   └── Requests/   # Form request validation
│   ├── Models/          # Eloquent models (UUIDs, $fillable)
│   ├── Providers/       # Service providers
│   ├── Services/        # Business logic (single responsibility)
│   │   └── Helpers/     # Extracted logic for complex services
│   ├── Support/         # Helper classes (InertiaShare)
│   ├── Traits/          # Shared traits (Loggable, FormatsDatesForApi)
│   └── Jobs/            # Queue jobs (idempotent, chunked)
├── bootstrap/           # Framework bootstrap
├── config/              # Configuration (immutable at runtime)
│   └── translations_inertia.php  # Per-page translation mapping
├── database/
│   ├── factories/       # Model factories
│   ├── migrations/      # Incremental migrations ONLY
│   └── seeders/         # Database seeders
├── lang/
│   ├── en/              # English translations
│   └── pt/              # Portuguese translations
├── public/              # Web root (index.php)
├── resources/
│   ├── views/           # Blade root template (app.blade.php)
│   ├── css/             # Stylesheets (TailwindCSS)
│   └── js/
│       ├── Pages/       # React page components (mapped by Inertia)
│       ├── Components/  # Reusable React components
│       ├── Layouts/     # Page layouts (Authenticated, Guest)
│       ├── Icons/       # SVG icons (import with ?react)
│       └── Utils/
│           └── translate.js  # __() translation helper
├── routes/
│   ├── api.php          # API routes (RESTful + action endpoints)
│   └── web.php          # Web routes (Inertia pages)
├── storage/             # Logs, cache, uploads
├── tests/
│   ├── Unit/            # PHPUnit unit tests
│   └── Feature/         # Feature/integration tests
├── .claude/             # AI agent configuration
├── artisan              # CLI entry point
├── rr.yaml              # RoadRunner config (Octane)
├── composer.json        # Dependencies
├── phpstan.neon         # Static analysis config
└── CLAUDE.md            # This file
```

## CLAUDE.md Update Rules

> After ANY implementation, update this file to reflect the current state.

| Change Type | Sections to Update |
|-------------|-------------------|
| Any file change | Last Change (branch, date, summary) |
| API/routes | Critical Rules, Architecture |
| New feature | 30s Overview, Architecture |
| New gotcha | FORBIDDEN or NRY |
| New dependency | Stack |
| Workflow change | Workflow section |

1. **Last Change** documents WHAT was done
2. **Other sections** document HOW things work NOW
3. **Both must be current** — updating only Last Change is insufficient
4. Keep only the LATEST Last Change entry (no stacking)

## Critical Rules

- **PHP >= 8.3** — readonly, enums, typed constants, match expressions
- **`declare(strict_types=1)`** in EVERY PHP file
- **Octane-safe code** — no static state, no globals, no `die()`/`exit()`
- **Dependency Injection** — use DI over `app()` or `resolve()`
- **Thin controllers** — delegate business logic to Service classes
- **Form Requests** — validate input in dedicated request classes
- **Type everything** — properties, params, returns (no `mixed` without justification)
- **UUIDs** — all new models use `HasUuids` trait as primary key
- **Mass assignment** — always define `$fillable` on models
- **Auditing** — critical models use `Loggable` trait
- **Eloquent only** — no raw SQL unless strictly justified with parameter binding
- **Config immutable** — never use `config()` to SET values at runtime
- **Request object** — use `$request->input()`, never `$_GET`/`$_POST`/`$_SESSION`

### Environment Variables & Secrets (MANDATORY)

> **NEVER use `env()` outside config files.** After `config:cache`, `env()` returns null everywhere except config files.

| Location | Access | Safe for |
|----------|--------|----------|
| `.env` | `env()` inside `config/*.php` only | API keys, DB credentials, secrets |
| `config/*.php` | `config('services.stripe.key')` | Application code access |
| Frontend (Inertia) | `InertiaShare` or controller props | Public data ONLY |

```php
// config/services.php — Bridge between .env and application
return [
    'openai' => [
        'key' => env('OPENAI_KEY'),
    ],
    'stripe' => [
        'key' => env('STRIPE_KEY'),          // Publishable (sent to frontend)
        'secret' => env('STRIPE_SECRET'),    // NEVER send to frontend
        'webhook_secret' => env('STRIPE_WEBHOOK_SECRET'),
    ],
];

// In code: ALWAYS use config()
$apiKey = config('services.openai.key');

// FORBIDDEN:
$apiKey = env('OPENAI_KEY'); // Returns null when config is cached!
```

### Frontend Secret Isolation (MANDATORY)

> **NEVER send API keys, secrets, or tokens to the frontend via Inertia props or JavaScript.**

```php
// WRONG — secret exposed in page source / DevTools
return Inertia::render('Dashboard', [
    'stripeSecret' => config('services.stripe.secret'),
    'openaiKey' => config('services.openai.key'),
]);

// CORRECT — only public/publishable data to frontend
return Inertia::render('Dashboard', [
    'stripePublicKey' => config('services.stripe.key'), // pk_ only
]);

// For operations requiring secrets: use backend API routes
// Frontend calls /api/payment → backend uses secret server-side
```

## FORBIDDEN

### Security (CRITICAL)

| Action | Reason |
|--------|--------|
| `env()` outside config files | Returns null when config is cached — use `config()` |
| Send API keys/secrets via Inertia props | Exposed in page source — keep secrets server-side |
| `$guarded = []` on models | Allows mass assignment of any field — use `$fillable` |
| `DB::raw()` with user input | SQL injection — use Eloquent or parameterized queries |
| `{!! $userInput !!}` | XSS — use `{{ }}` (auto-escaped) |
| Dynamic code execution functions | Remote code execution risk |
| `md5()` / `sha1()` for passwords | Weak hashing — use `Hash::make()` |
| `unserialize()` on user data | Object injection — use JSON with model casts |
| CORS `allowed_origins: ['*']` | Open API — restrict to your domain |
| `createToken('x', ['*'])` | Over-privileged — use specific abilities |
| Trust `X-Forwarded-For` directly | Spoofable — use trusted proxies config |
| `$_GET` / `$_POST` / `$_SESSION` | Stale in Octane — use `$request->input()` |

### Backend

| Action | Reason |
|--------|--------|
| Business logic in controllers | Move to Service classes |
| `static` properties on services | Memory leaks in Octane workers |
| Global variables / superglobals | Stale state in Octane |
| `die()` / `exit()` | Kills the Octane worker process |
| `config(['key' => 'val'])` at runtime | Affects all concurrent requests |
| `migrate:fresh` / `db:wipe` / `db:reset` | Destroys production data |
| `app()` / `resolve()` in constructors | Use constructor DI instead |
| `Inertia::render()` after POST/PUT/DELETE | Use `redirect()->route()` instead |
| `dd()` / `dump()` in production code | Use structured `Log::info()` |

### Frontend (React)

| Action | Reason |
|--------|--------|
| Call external APIs with secrets from JS | Exposes tokens — route through Laravel API |
| `__()` inside JSX / render | Hook violation — define as CONST before hooks |
| `fetch()` / `axios` for page data | Bypasses Inertia — use props from controller |
| `<a href>` for internal links | Full page reload — use `<Link>` |
| `window.location` for navigation | Full reload — use `router.visit()` |
| Inline SVGs in JSX | Bloats components — use SVG files with `?react` |
| Raw `console.log` | Uncontrolled — use debug constant pattern |
| Inline Tailwind class soup | Unreadable — use STYLES const object |
| `axios.post()` for forms | No CSRF/errors — use `useForm().post()` |

## UI/UX Design Intelligence

> When the project has a frontend, the **UI/UX Pro Max** skill is auto-installed. It provides 67 UI styles, 161 color palettes, 57 font pairings, and 161 industry-specific reasoning rules. It activates automatically for any UI/UX task.

## Quality Gates

```bash
vendor/bin/phpstan analyse --level=6   # Static analysis
vendor/bin/phpunit                      # Tests
vendor/bin/php-cs-fixer fix --dry-run   # Code style
php artisan test                        # Laravel test runner
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
0. TODO LIST      → Create detailed todo list from prompt
1. BRANCH         → Create feature/ | fix/ | refactor/ | test/
2. RESEARCH       → Run research-web agent for NEW features
3. IMPLEMENT      → Types, strict mode, Octane-safe, DI
4. TEST           → Run PHPStan + PHPUnit
5. DOCUMENT       → Run documenter agent for modified files
6. UPDATE         → Update THIS FILE (CLAUDE.md) with changes
7. QUALITY        → PHPStan + PHPUnit + PHP-CS-Fixer
8. COMMIT         → Conventional commits, merge to main
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
