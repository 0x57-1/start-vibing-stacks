---
name: phpstan-analysis
version: 1.0.0
---

# PHPStan Static Analysis

## Setup

```bash
composer require --dev phpstan/phpstan
```

## Configuration (phpstan.neon)

```neon
parameters:
    level: 6
    paths:
        - src
        - app
    excludePaths:
        - vendor
        - storage
        - bootstrap/cache
    checkMissingIterableValueType: false
```

## Levels

| Level | What it checks |
|-------|---------------|
| 0 | Basic checks (unknown classes, functions) |
| 1 | Possibly undefined variables, return types |
| 2 | Unknown methods on all expressions |
| 3 | Return types, property types |
| 4 | Dead code, always true/false |
| 5 | Argument types |
| **6** | **MINIMUM for this project** — strict types |
| 7 | Union types |
| 8 | Nullable types everywhere |
| 9 | Mixed type restrictions |

## Running

```bash
vendor/bin/phpstan analyse                    # Default config
vendor/bin/phpstan analyse --level=6 src/     # Specific level & path
vendor/bin/phpstan analyse --generate-baseline # Generate baseline for legacy code
```

## Common Fixes

```php
// ❌ PHPStan error: Parameter $data has no type hint
function process($data) {}

// ✅ Fixed
function process(array $data): void {}

// ❌ PHPStan error: Method returns mixed
function getData() { return $this->db->query(); }

// ✅ Fixed
/** @return array<string, mixed> */
function getData(): array { return $this->db->query(); }
```

## Rules

1. **Level 6 minimum** — no exceptions
2. **Fix errors, don't ignore** — use baseline only for legacy code
3. **Run before commit** — part of quality gates
