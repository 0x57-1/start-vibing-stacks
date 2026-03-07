# {{PROJECT_NAME}}

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

## FORBIDDEN

### Backend

| Action | Reason |
|--------|--------|
| Dynamic code execution functions | Remote code execution risk |
| `DB::raw()` with user input | SQL injection risk |
| `{!! $userInput !!}` | XSS — use `{{ }}` instead |
| Mass assignment without `$fillable` | Uncontrolled field injection |
| Business logic in controllers | Move to Service classes |
| `env()` outside config files | Returns null when config is cached |
| `static` properties on services | Memory leaks in Octane workers |
| Global variables / superglobals | Stale state in Octane |
| `die()` / `exit()` | Kills the Octane worker process |
| `config(['key' => 'val'])` at runtime | Affects all concurrent requests |
| `migrate:fresh` / `db:wipe` / `db:reset` | Destroys production data |
| `app()` / `resolve()` in constructors | Use constructor DI instead |
| `Inertia::render()` after POST/PUT/DELETE | Use `redirect()->route()` instead |

### Frontend (React)

| Action | Reason |
|--------|--------|
| `__()` inside JSX / render | Hook violation — define as CONST before hooks |
| `fetch()` / `axios` for page data | Bypasses Inertia — use props from controller |
| `<a href>` for internal links | Full page reload — use `<Link>` |
| `window.location` for navigation | Full reload — use `router.visit()` |
| Inline SVGs in JSX | Bloats components — use SVG files with `?react` |
| Raw `console.log` | Uncontrolled — use debug constant pattern |
| Inline Tailwind class soup | Unreadable — use STYLES const object |
| `axios.post()` for forms | No CSRF/errors — use `useForm().post()` |

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

1. Create feature branch
2. Implement with types, strict mode, Octane-safe patterns
3. Run PHPStan + PHPUnit
4. Update domains & CLAUDE.md
5. Commit → merge to main
