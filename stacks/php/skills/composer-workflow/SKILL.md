---
name: composer-workflow
version: 2.0.0
description: "Composer 2.8+ (Oct 2024) workflow for Laravel / PHP 8.3-8.5 projects. Covers composer.json structure, PSR-4 layout, scripts orchestration, audit command (--abandoned, --ignore-severity, exit codes 1=vulns/2=abandoned/3=both), --patch-only updates, --ignore-scripts for supply-chain hardening, allow-missing-requirements, lockfile hygiene, optimized autoloader for prod, sort-packages, plugin allowlist. Invoke when initializing a project, adding dependencies, debugging install/update conflicts, or wiring CI quality scripts."
---

# Composer Workflow (2.8+)

**Invoke when initializing a Composer project, adding deps, debugging install/update, or wiring CI scripts.**

## Requirements

- **Composer ≥ 2.8** (released Oct 2, 2024) — earlier versions miss audit/security features below
- **PHP ≥ 8.3** in `require` (8.4 recommended for new projects — see `php-patterns`)
- **`composer.lock` MUST be committed** for both apps and libraries

## Essential Commands

```bash
composer install                     # From lock — used in CI/deploy
composer install --no-dev --optimize-autoloader --classmap-authoritative  # Production
composer update                      # Refresh lock — dev only, never CI
composer update --patch-only         # 2.8+: only patch versions (safe weekly)
composer update vendor/pkg --with-all-dependencies   # Update one + its deps

composer require vendor/pkg          # Add runtime
composer require --dev vendor/pkg    # Add dev-time
composer remove vendor/pkg

composer audit                       # Security scan — MUST be in CI
composer audit --abandoned=fail      # 2.8+: also fail on abandoned packages
composer audit --ignore-severity=low # 2.8+: skip noisy lows in CI

composer outdated                    # List packages with newer releases
composer outdated --direct           # Only top-level deps
composer outdated --major-only       # Only majors (planning sessions)

composer dump-autoload --optimize    # Regenerate, optimized
composer validate --strict           # composer.json sanity check
composer why vendor/pkg              # Who pulled this in?
composer why-not vendor/pkg "^2.0"   # Why can't I install this version?
```

## composer.json — production-grade baseline

```json
{
    "name": "vendor/project",
    "type": "project",
    "license": "proprietary",
    "require": {
        "php": "^8.3",
        "ext-mbstring": "*",
        "ext-pdo": "*"
    },
    "require-dev": {
        "phpunit/phpunit": "^12.0",
        "pestphp/pest": "^4.0",
        "phpstan/phpstan": "^2.0",
        "phpstan/phpstan-deprecation-rules": "^2.0",
        "friendsofphp/php-cs-fixer": "^3.0",
        "roave/security-advisories": "dev-latest"
    },
    "autoload": {
        "psr-4": { "App\\": "src/" }
    },
    "autoload-dev": {
        "psr-4": { "Tests\\": "tests/" }
    },
    "scripts": {
        "test":    "phpunit",
        "test:cov":"XDEBUG_MODE=coverage phpunit --coverage-text --coverage-clover=coverage.xml",
        "lint":    "phpstan analyse --memory-limit=1G",
        "fix":     "php-cs-fixer fix",
        "fix:check":"php-cs-fixer fix --dry-run --diff",
        "audit":   "composer audit --abandoned=fail",
        "check":   ["@lint", "@fix:check", "@audit", "@test"]
    },
    "scripts-descriptions": {
        "check": "Run full quality gate locally — mirrors CI"
    },
    "config": {
        "sort-packages": true,
        "optimize-autoloader": true,
        "preferred-install": "dist",
        "allow-plugins": {
            "pestphp/pest-plugin": true
        }
    },
    "minimum-stability": "stable",
    "prefer-stable": true
}
```

## Audit — exit codes (2.8+, use in CI)

| Exit | Meaning |
|---|---|
| `0` | Clean |
| `1` | Vulnerabilities found |
| `2` | Abandoned packages found (with `--abandoned=fail`) |
| `3` | Both |

```yaml
# .github/workflows/ci.yml — fail PR on vulns OR abandoned packages
- name: Composer audit
  run: composer audit --abandoned=fail --ignore-severity=low
```

The `--ignore-severity` flag is critical for CI ergonomics — without it a single LOW advisory blocks every PR.

## Supply-Chain Hardening (links to security-baseline 2025-A03)

```bash
# Production install — never run third-party scripts on the build server
composer install --no-dev --no-scripts --optimize-autoloader --classmap-authoritative
```

`config.allow-plugins` is a strict allowlist as of 2.x — Composer prompts/refuses unknown plugins. Keep the list minimal:

```json
"config": {
  "allow-plugins": {
    "pestphp/pest-plugin": true,
    "php-http/discovery": false
  }
}
```

Pin **Roave Security Advisories** as a `dev` dep — it makes Composer **refuse to install** any version with a known CVE:

```bash
composer require --dev roave/security-advisories:dev-latest
```

## PSR-4 Autoloading

```
src/
├── Controllers/
│   └── UserController.php    → App\Controllers\UserController
├── Services/
│   └── UserService.php       → App\Services\UserService
├── Models/
│   └── User.php              → App\Models\User
└── Middleware/
    └── AuthMiddleware.php    → App\Middleware\AuthMiddleware
```

For Laravel projects use `App\\` → `app/` (Laravel default), not `src/`.

## Lockfile Hygiene

- **Always commit** `composer.lock`
- After `composer require/remove/update`, run `composer validate --strict` and commit the lock with the same commit
- CI uses `composer install` (deterministic) — never `composer update`
- Dependabot/Renovate watches `composer.json`; configure auto-merge for `--patch-only` after CI green

## Rules

1. **`composer.lock` is mandatory in git** — apps and libraries
2. **Production = `--no-dev --no-scripts --optimize-autoloader --classmap-authoritative`** (supply-chain + perf)
3. **CI runs `composer audit --abandoned=fail`** — failing the build on vulns or abandons
4. **Never edit `vendor/`** — patch via `cweagans/composer-patches` if absolutely required
5. **Pin `php` constraint** to your runtime (`^8.3` or `^8.4`); upgrade deliberately
6. **Roave Security Advisories** as a dev dep on every project
7. **Allow-plugins allowlist** kept minimal and reviewed
