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
bun run typecheck                          # TypeScript errors
bun run lint                               # ESLint
bun run test                               # Vitest
node scripts/check-route-slugs.mjs         # Next.js — only run if framework=nextjs
node scripts/check-build-scripts.mjs       # No dev-only tools in deploy scripts
bun run build                              # Build verification (must come AFTER both checks)
```

> **Next.js note.** `next build` does NOT validate dynamic-segment slug
> consistency (e.g. `[id]` and `[userId]` under the same parent). The
> `check-route-slugs.mjs` script must run **before** `build` to catch this
> statically — see `nextjs-app-router` skill, section "Dynamic Route Slug
> Consistency".

> **Vercel/Docker deploy note.** Build environments strip `devDependencies`
> (`NODE_ENV=production` → `npm install --omit=dev`). Any binary called
> from `scripts.build` / `prebuild` / `postinstall` that's only in
> `devDependencies` (e.g. `tsx`, `ts-node`, `vitest`) will crash the
> deploy with `command not found / exit 127`. `check-build-scripts.mjs`
> catches this statically — see `nextjs-app-router` skill, section
> "Build Script Hygiene".

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
