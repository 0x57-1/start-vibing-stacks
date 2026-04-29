# Start Vibing Stacks

Multi-stack AI workflow for Claude Code & Cursor. One command installs agents, skills, hooks, and quality gates tailored to your stack.

```bash
npx start-vibing-stacks
```

## What It Installs

| Layer | Count | Purpose |
|---|---|---|
| Agents | 7 universal | research-web, documenter, domain-updater, commit-manager, tester, claude-md-compactor, **security-auditor** (VETO) |
| Skills | 13 shared + 5–13 stack-specific + 7–9 frontend | Versioned (`version:` frontmatter), upgradable via `migrate` |
| Hooks | `stop-validator`, `final-check`, `user-prompt-submit` | Block completion on git/docs/secrets/code-quality issues |
| Commands | `/feature`, `/fix`, `/research`, `/validate` | Slash commands |
| Workflows | `ci.yml` + `security.yml` per stack | Copied to `.github/workflows/` when target is empty |

## Supported Stacks

| Stack | Frameworks | Databases | Frontend |
|---|---|---|---|
| 🐘 **PHP 8.3+** | Laravel 12 + Octane, Laravel 12 | MariaDB/MySQL, PostgreSQL, SQLite | Inertia + React, Blade, Livewire, API only |
| 📦 **Node.js / TS** | Next.js, Nuxt, Astro, Express, Fastify, Vanilla | MongoDB, Postgres, MariaDB/MySQL, SQLite/Turso, Redis, None | React + Tailwind, Vue, Svelte, API only |
| 🐍 **Python 3.12+** | FastAPI, Django 5, Flask, Local Scripts | MariaDB/MySQL, Postgres, SQLite, MongoDB, None | React, HTMX + Jinja2, API/CLI only |

## Universal Skills (shared across stacks)

| Skill | Topic |
|---|---|
| `security-baseline` | OWASP Top 10 with stack-aware examples |
| `secrets-management` | `.env` hygiene, gitleaks, rotation playbook |
| `observability` | Structured logs, OpenTelemetry, Sentry, PII redaction |
| `error-handling` | Result types, error taxonomy, retry/backoff, circuit breaker |
| `database-migrations` | Parallel change, lock timeouts, chunked backfills |
| `accessibility-wcag22` | WCAG 2.2 AA + axe-core/Playwright |
| `ci-pipelines` | GitHub Actions discipline + ready-to-use templates |
| `quality-gate` · `final-check` · `git-workflow` · `docker-patterns` · `debugging-patterns` · `performance-patterns` · `playwright-automation` · `test-coverage` · `ui-ux-audit` · `codebase-knowledge` · `docs-tracker` · `research-cache` · `hook-development` | Workflow & tooling |

Plus stack-specific: `api-security-node`, `api-security-python`, `api-security` (PHP), `typescript-strict`, `nextjs-app-router`, `trpc-api`, `bun-runtime`, `mongoose-patterns`, `pydantic-validation`, `pytest-testing`, `python-patterns`, `python-performance`, `async-patterns`, `fastapi-patterns`, `django-patterns`, `scripting-automation`, `laravel-patterns`, `laravel-octane`, `phpstan-analysis`, `phpunit-testing`, `composer-workflow`, `mariadb-octane`, `external-api-patterns`, `inertia-react`, `laravel-inertia-i18n`, `security-scan-php`, `api-design`, `php-patterns`.

## Layout in Your Project

```
your-project/
├── CLAUDE.md                       # AI memory: architecture, rules, FORBIDDEN
├── .claude/
│   ├── agents/                     # 7 universal agents
│   ├── skills/                     # versioned skill set (stack + shared + frontend)
│   ├── hooks/                      # stop-validator, final-check, prompt-submit
│   ├── commands/                   # /feature, /fix, /research, /validate
│   └── config/                     # active-project, security-rules, ...
└── .github/workflows/              # ci.yml + security.yml (if dir was empty)
```

## CLI

```bash
npx start-vibing-stacks                # setup or resume current project
npx start-vibing-stacks migrate        # show outdated/missing skills
npx start-vibing-stacks migrate --apply  # update outdated skills/agents

# flags: --force --no-claude --no-mcp --no-install --help --version
```

Global install: `npm i -g start-vibing-stacks` → `svs` (alias).

## Hooks (block completion)

| Hook | Blocks when |
|---|---|
| `stop-validator` | not on main, uncommitted changes, CLAUDE.md missing/stale, **secret pattern in diff** (gitleaks or regex) |
| `final-check` | hardcoded secret, `eval`, SQL string concat, `.skip`/`.only`, `any`, `console.log`, `var_dump` |
| `user-prompt-submit` | injects workflow + standards context |

## Workflow per Task

```
1. BRANCH       feature/ | fix/ | refactor/ | test/
2. RESEARCH     research-web agent (new features)
3. IMPLEMENT    stack rules + strict types + security
4. TEST         tester agent (Vitest / pytest / PHPUnit / Playwright)
5. SECURITY     security-auditor agent — VETO on findings
6. DOCUMENT     documenter agent
7. UPDATE       CLAUDE.md "Last Change" section
8. QUALITY      typecheck → lint → test → build
9. COMMIT       conventional commit, merge to main
```

## Security Features

- **Environment isolation**: scanner blocks `NEXT_PUBLIC_*SECRET|*TOKEN|*PRIVATE` patterns; teaches Route Handler / Server Action proxy patterns.
- **OWASP Top 10**: stack-aware skills cover A01–A10 (broken access control, injection, SSRF, etc.).
- **Secret scanning** in `stop-validator` — gitleaks if installed, regex fallback otherwise.
- **`security-auditor` agent** with VETO — runs after tester, before commit, blocks insecure code.
- **CI templates**: gitleaks, `npm audit` / `pip-audit` / `composer audit`, CodeQL/Bandit, weekly cron.

## Standards Review

CLI scans existing config (cursorrules, composer.json, tsconfig, eslint, phpstan, `.env*`, lockfiles) and asks **"adapt to your standards or use defaults?"** Imported standards are written to `standards-review.json` and injected into every prompt.

## Migrate Existing Projects

```bash
npx start-vibing-stacks migrate         # report drift
npx start-vibing-stacks migrate --apply # apply updates
```

Compares `version:` in your installed `SKILL.md` files against the bundled package. Missing → install. Outdated → upgrade. Ahead (you customized) → kept. Unversioned → flagged for manual review.

## Requirements

| Stack | Required |
|---|---|
| PHP | PHP ≥ 8.3, Composer ≥ 2.0, Node.js ≥ 18 |
| Node.js | Node.js ≥ 18 (Bun optional) |
| Python | Python ≥ 3.12, pip ≥ 23 |

Missing dependencies are auto-installed via Homebrew on macOS.

## Releases

GitHub Release → npm publish (workflow `publish.yml`).
Version bump in `package.json` on `main` → auto-creates the GitHub Release (workflow `auto-release.yml`). Add `[skip release]` to the commit to opt out.

## Credits

Inspired by [start-vibing](https://www.npmjs.com/package/start-vibing). Built by [FantasyLake](https://github.com/f1sc4ll-ai).

## License

MIT
