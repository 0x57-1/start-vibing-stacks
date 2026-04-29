---
name: quality-gate
version: 1.0.0
---

# Quality Gate — Verification System

**ALWAYS invoke BEFORE any commit.**

## Purpose

Runs stack-specific quality checks in sequence. Blocks commits that don't pass.

## How to Run

Read `.claude/config/active-project.json` for stack, then execute gates in order.

### PHP Gates
```bash
vendor/bin/phpstan analyse --level=6    # Static analysis
vendor/bin/phpunit                       # Tests
vendor/bin/php-cs-fixer fix --dry-run    # Code style
```

### Node.js Gates
```bash
bun run typecheck    # TypeScript errors
bun run lint         # ESLint
bun run test         # Vitest
bun run build        # Build verification
```

## Gate Results

| Result | Action |
|---|---|
| ✅ All pass | Proceed to commit |
| ❌ Any required gate fails | FIX before commit — do NOT skip |
| ⚠️ Optional gate fails | Warn but allow commit |

## Rules

1. **RUN ALL REQUIRED GATES** — no shortcuts
2. **FIX ERRORS, DON'T SKIP** — never use `--no-verify`
3. **ORDER MATTERS** — run in defined order (cheapest first)
4. **REPORT RESULTS** — show pass/fail for each gate
