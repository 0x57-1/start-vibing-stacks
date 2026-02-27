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
| Database | {{DATABASE}} |
| Package Manager | Composer |
| Static Analysis | PHPStan (level 6) |
| Testing | PHPUnit |
| Code Style | PHP-CS-Fixer (PSR-12) |

## Architecture

```
project/
├── src/              # Application source (PSR-4: App\)
├── public/           # Web root (index.php)
├── config/           # Configuration files
├── tests/
│   ├── Unit/         # PHPUnit unit tests
│   └── Feature/      # Feature/integration tests
├── storage/          # Logs, cache, uploads
├── .claude/          # AI agent configuration
├── composer.json     # Dependencies
├── phpstan.neon      # Static analysis config
└── CLAUDE.md         # This file
```

## Critical Rules

- **PHP >= 8.3** — use modern features (readonly, enums, typed constants)
- **`declare(strict_types=1)`** in EVERY PHP file
- **PSR-4 autoloading** — no manual includes
- **Prepared statements** — NEVER concatenate SQL
- **Type everything** — properties, params, returns
- **htmlspecialchars()** — all user output
- **password_hash/verify** — NEVER md5/sha1

## FORBIDDEN

| Action | Reason |
|--------|--------|
| `eval()` | Remote code execution risk |
| `mysql_*` functions | Deprecated, use PDO |
| `extract($_POST)` | Variable injection |
| `include $_GET[...]` | Local file inclusion |
| SQL without prepared statements | SQL injection |
| `echo $userInput` without escape | XSS |
| `md5($password)` | Weak hashing |
| PHP < 8.3 syntax | Version requirement |

## Quality Gates

```bash
vendor/bin/phpstan analyse --level=6   # Static analysis
vendor/bin/phpunit                      # Tests
vendor/bin/php-cs-fixer fix --dry-run   # Code style
```

## HTTP Requests

All database queries MUST use prepared statements:

```php
$stmt = $pdo->prepare("SELECT * FROM users WHERE id = :id");
$stmt->execute([':id' => $userId]);
```

## Workflow

1. Create feature branch
2. Implement with types, strict mode
3. Run PHPStan + PHPUnit
4. Update domains & CLAUDE.md
5. Commit → merge to main
