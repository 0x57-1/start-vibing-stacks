---
name: ci-pipelines
version: 1.0.0
description: GitHub Actions pipelines for typecheck, lint, test, security scan, build, and release. Stack-aware templates live in stacks/<stack>/workflows/.
---

# CI Pipelines

**ALWAYS invoke when setting up CI, modifying `.github/workflows/`, or wiring quality gates.**

> CI is the only enforcement that survives human pressure. Anything not in CI will eventually be skipped.

## Pipeline Stages (Required Order)

```
1. checkout + setup
2. install deps (cache locked)
3. typecheck / static analysis        — fail fast, cheapest
4. lint
5. unit tests
6. integration tests (with services)
7. security audit (npm/pip/composer audit + gitleaks)
8. build
9. e2e (only on main / PRs to main)
10. publish artifacts (only on tag)
```

**Order matters**: cheaper gates first. A typo found by typecheck in 30s saves 10 minutes of e2e runtime.

## Required Workflows per Repo

| File | Triggers | Purpose |
|---|---|---|
| `ci.yml` | `pull_request`, `push` to main | Main pipeline |
| `security.yml` | weekly cron + push | Audits, gitleaks, CodeQL |
| `release.yml` | `release: published` | Publish to npm / PyPI / Docker / etc. |

## Universal Best Practices

### Concurrency (cancel stale runs)
```yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true
```

### Permissions (least privilege)
```yaml
permissions:
  contents: read           # default; bump only what each job needs
```

Bump per job:
```yaml
jobs:
  release:
    permissions:
      contents: write       # to create tags
      id-token: write       # to use OIDC for npm provenance
```

### Pin actions by SHA in production
```yaml
- uses: actions/checkout@b4ffde65f46336ab88eb53be808477a3936bae11   # v4.1.1
```

`Dependabot` will keep them updated. Tags can be re-pointed; SHAs cannot.

### Secrets

- Never `echo "$SECRET"` — masking is best-effort.
- Pass to runtime via env, not CLI args (CLI shows in logs on some setups).
- Use **OIDC** for cloud deploys (AWS / GCP / Vercel) — no long-lived keys in repo secrets.

### Caching

| Stack | Cache key |
|---|---|
| Node.js | `package-lock.json` / `bun.lock` / `pnpm-lock.yaml` |
| Python | `requirements*.txt` / `uv.lock` / `poetry.lock` |
| PHP | `composer.lock` |

`actions/setup-node` / `setup-python` provide `cache:` parameter — use it.

### Matrix builds for multi-version coverage
```yaml
strategy:
  matrix:
    node: [20, 22]
  fail-fast: false           # see all failures, don't bail on first
```

## Branch Protection (mandatory)

Configure on GitHub: Settings → Branches → main:
- Require PRs (no direct push to main)
- Require status checks: `ci / typecheck`, `ci / test`, `ci / security`
- Require linear history (no merge commits, only squash/rebase)
- Require signed commits (optional but recommended)
- Require up-to-date branch before merge

## Templates Per Stack

Templates ship in `stacks/<stack>/workflows/`. Run `npx start-vibing` (or copy manually) to install them into the project's `.github/workflows/`.

| Stack | Template files |
|---|---|
| `nodejs` | `ci.yml`, `security.yml` |
| `python` | `ci.yml`, `security.yml` |
| `php` | `ci.yml`, `security.yml` |

## Release / Publish

For npm packages:
```yaml
# .github/workflows/release.yml
on:
  release:
    types: [published]
permissions:
  contents: read
  id-token: write          # OIDC for provenance
jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          registry-url: https://registry.npmjs.org
      - run: npm ci
      - run: npm run build
      - run: npm publish --access public --provenance
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

`--provenance` is the 2024+ default — gives users SLSA-attested supply chain.

## Pre-Commit Checklist for CI Changes

- [ ] `concurrency` group set
- [ ] `permissions: contents: read` at top, bump per job
- [ ] Secrets via `${{ secrets.X }}`, never inline
- [ ] Actions pinned by SHA (or at least major+minor for non-critical)
- [ ] Quality gates ordered cheapest → most expensive
- [ ] Caching configured for the package manager
- [ ] Branch protection rules applied to main on GitHub

## FORBIDDEN

| Pattern | Reason |
|---|---|
| `if: always()` on the final reporter that swallows failures | CI green when tests fail |
| `continue-on-error: true` outside of allowed-fail matrix | Hides regressions |
| `--no-verify` in CI git operations | Bypasses other guardrails |
| Plain text secrets in env files committed to repo | See `secrets-management` |
| Workflow with `permissions: write-all` | Overly broad, supply chain risk |
| Long-lived cloud creds in repo secrets | Use OIDC instead |

## See Also

- `secrets-management` — repo secrets & OIDC patterns
- `quality-gate` — local quality gates that mirror CI
- `git-workflow` — branch + commit conventions CI relies on
