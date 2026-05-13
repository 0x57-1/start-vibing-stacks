---
name: validate
description: Run the full quality gate (typecheck → lint → test → build) using the stack's commands from active-project.json.
version: 1.0.0
---

# /validate — Run Full Validation

Read the quality gates from `.claude/config/active-project.json#qualityGates` and run them in order. Stop at the first failure.

```bash
jq -r '.qualityGates' .claude/config/active-project.json
```

Execution order (each step blocks the next):

| # | Gate | Typical commands |
|---|---|---|
| 1 | **Typecheck** | `npx tsc --noEmit` · `mypy .` · `vendor/bin/phpstan analyse` |
| 2 | **Lint** | `npx eslint .` · `ruff check .` · `vendor/bin/pint --test` |
| 3 | **Unit tests** | `npx vitest run` · `pytest` · `vendor/bin/phpunit` |
| 4 | **E2E** (only if configured) | `npx playwright test` |
| 5 | **Build** | `npm run build` · `composer dump-autoload --optimize` |

Output format (one line per gate):

```
typecheck: PASS  (1.4s)
lint:      PASS  (0.8s)
tests:     PASS  (45/45 in 6.2s)
e2e:       SKIP  (not configured)
build:     PASS  (3.1s)

✅ All gates passed — safe to invoke commit-manager
```

If any gate fails, print the failure output and exit non-zero. `commit-manager` will refuse to commit while validation is failing.
