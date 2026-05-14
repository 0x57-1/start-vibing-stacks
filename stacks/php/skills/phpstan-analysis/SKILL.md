---
name: phpstan-analysis
version: 2.0.0
description: "PHPStan 2.x (released Nov 11, 2024) static analysis for PHP 8.3-8.5 / Laravel 12. Covers Level 10 (strict mixed even from inferred types — new in 2.0), the list<T> array type for sequential int-keyed arrays, baseline workflow for legacy code, generics + array shapes annotations, larastan extension for Laravel-specific rules (Eloquent magic, facades, container resolution), 50-70% memory reduction in 2.0, CI integration with --error-format. Invoke when configuring PHPStan, raising the level, fixing reported issues, or onboarding a legacy codebase."
---

# PHPStan Static Analysis (2.x, Nov 2024)

**Invoke when configuring PHPStan, raising the level, fixing reports, or wiring it into CI.**

> PHPStan 2.0 (Nov 11, 2024) added **Level 10** and the **`list<T>`** type, dropped 50-70% memory usage, and tightened reference-parameter analysis. It's a transparent upgrade from 1.x — same config keys, stricter inferences. Update as part of any project refresh.

## Setup

```bash
composer require --dev phpstan/phpstan "^2.0"

# Laravel projects — add Larastan for framework awareness
composer require --dev larastan/larastan "^3.0"
```

## Configuration (`phpstan.neon` / `phpstan.neon.dist`)

```neon
# Plain PHP project
parameters:
    level: 8                       # Target. Raise toward 10.
    paths:
        - src
        - tests
    excludePaths:
        - vendor
        - storage
        - bootstrap/cache
    treatPhpDocTypesAsCertain: false   # Pragmatic for first month at high level
    reportUnmatchedIgnoredErrors: true
    parallel:
        maximumNumberOfProcesses: 4

# Laravel project (Larastan)
includes:
    - vendor/larastan/larastan/extension.neon
parameters:
    level: 8
    paths:
        - app
        - bootstrap
        - config
        - database
        - routes
    excludePaths:
        - storage
        - bootstrap/cache
```

## Levels — what each one adds

| Level | Catches |
|---|---|
| 0 | Unknown classes / functions / methods on `$this` |
| 1 | Possibly undefined variables, undefined params on `$this`, unreachable code |
| 2 | Unknown methods on **all** expressions (not just `$this`) |
| 3 | Return types, property types |
| 4 | Dead code, always-true/always-false branches |
| 5 | Argument types in function/method calls |
| 6 | Missing typehints (params + returns) |
| 7 | Partially-wrong union types |
| 8 | Calling methods / accessing props on nullable types |
| 9 | `mixed` is treated strictly when **explicitly typed** |
| **10 (NEW in 2.0)** | `mixed` strict even when **implicitly inferred** (any unknown type) |

**Recommended target:** Level 8 for new projects (achievable with Larastan + readonly DTOs); raise to 9 once stable; 10 only after eliminating all `mixed` from your own code.

## `list<T>` — the new sequential array type *(2.0)*

Use when you have a 0-indexed contiguous array. PHPStan can then narrow types far more precisely than with `array<int, T>`.

```php
/**
 * @param list<int> $ids   sequential 0,1,2,... no gaps
 * @return list<User>      same shape on the way out
 */
public function findManyById(array $ids): array
{
    return User::whereIn('id', $ids)->get()->all();
}
```

Other useful array types:

| PHPDoc | Meaning |
|---|---|
| `array<int>` | Any-shape array of ints |
| `list<int>` | Sequential, 0-indexed, no gaps |
| `non-empty-array<string, int>` | At least one entry; string keys, int values |
| `non-empty-list<User>` | Sequential AND non-empty |
| `array{name: string, age: int}` | Array shape (object-like) |
| `array{name: string, age?: int}` | Optional key |

## Running

```bash
vendor/bin/phpstan analyse                     # Use config
vendor/bin/phpstan analyse --level=8 src/      # Override level + path
vendor/bin/phpstan analyse --memory-limit=1G   # Bigger projects (still ~50% less than 1.x)
vendor/bin/phpstan analyse --generate-baseline # Snapshot legacy errors → unblocks CI
vendor/bin/phpstan analyse --error-format=github  # CI annotations on PRs
```

## Baseline workflow (legacy adoption)

```bash
# Day 1: ratchet to a level that's mostly clean, baseline the rest
vendor/bin/phpstan analyse --level=6 --generate-baseline

# Day 2+: every new file/edit cannot ADD baseline entries
# Periodically: chip away at the baseline (delete entries, fix code)
vendor/bin/phpstan analyse --level=6                # must pass
vendor/bin/phpstan analyse --level=6 --error-format=github
```

`reportUnmatchedIgnoredErrors: true` ensures the baseline shrinks (or fails CI) instead of growing silently.

## Common Fixes

```php
// ❌ Parameter $data has no type hint
function process($data) {}

// ✅
function process(array $data): void {}


// ❌ Method returns mixed
function getData() { return $this->db->query(); }

// ✅ — PHPDoc + native return type
/** @return list<array<string, mixed>> */
function getData(): array { return $this->db->query(); }


// ❌ "Cannot access property $name on User|null"
echo $request->user()->name;

// ✅ — assert or null-coalesce
echo $request->user()?->name ?? 'guest';


// ❌ "Property User::$email is never written, only read"
class User {
    public function __construct(public readonly string $email) {}
    // PHPStan now reports if you typo-shadow the property elsewhere
}
```

## CI integration

```yaml
# .github/workflows/ci.yml
- name: PHPStan
  run: vendor/bin/phpstan analyse --error-format=github --memory-limit=1G
```

GitHub annotations show inline diff comments on the PR — much higher signal than the textual report.

## Rules

1. **Target level 8 minimum** for new code; raise to 9/10 incrementally
2. **Larastan is mandatory** on Laravel projects (Eloquent magic methods, facades, container)
3. **Baseline only legacy code** — new files must be clean
4. **Run before every commit** — wired into the quality gate
5. **`reportUnmatchedIgnoredErrors: true`** — baseline shrinks, never grows silently
6. **No `@phpstan-ignore` without a comment** explaining why and a link to the issue if upstream

## See Also

- `quality-gate` — typecheck step ordering
- `composer-workflow` — `--memory-limit` and CI script wiring
- `phpunit-testing` — Pest 4 + PHPUnit 12 typing patterns that benefit from PHPStan
