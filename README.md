# Start Vibing Stacks

**Multi-stack AI-powered development workflow for Claude Code & Cursor.**

One command to set up agents, skills, hooks, security rules, and quality gates — tailored to your stack.

```bash
npx start-vibing-stacks
```

## What It Does

Start Vibing Stacks transforms Claude Code into a stack-aware AI partner. Instead of a generic assistant, you get an AI that understands your framework, enforces your coding standards, and blocks insecure patterns — all before a single line of code is written.

```
You run the CLI
    ↓
Detects your stack (PHP/Node.js) from project files
    ↓
Scans existing standards (.cursorrules, composer.json, tsconfig, eslint, .env)
    ↓
Asks: adapt to YOUR standards or use defaults?
    ↓
Copies 6 agents + 25-40 skills + hooks + security rules
    ↓
Generates CLAUDE.md with architecture, rules, FORBIDDEN patterns
    ↓
Launches Claude Code — fully configured
```

## Supported Stacks

### PHP 8.3+

| Option | Choices |
|--------|---------|
| **Frameworks** | Laravel 12 + Octane (RoadRunner) + Inertia.js, Laravel 12 (standard) |
| **Databases** | MySQL / MariaDB, PostgreSQL, SQLite |
| **Frontend** | React 19 + Inertia.js + TailwindCSS 4, Blade + TailwindCSS, Livewire + Alpine.js, API only |
| **Skills** | 13 PHP-specific (Octane, PHPStan, PHPUnit, Eloquent, API Security, Inertia i18n, ...) |

### Node.js / TypeScript

| Option | Choices |
|--------|---------|
| **Frameworks** | Next.js (App Router), Nuxt, Astro, Express, Fastify, Vanilla Node.js |
| **Databases** | MongoDB, PostgreSQL, MySQL, SQLite/Turso, Redis (Upstash), None |
| **Frontend** | React 19 + TailwindCSS 4, Vue.js / Nuxt, Svelte / SvelteKit, API only |
| **Skills** | 5 Node-specific (TypeScript strict, Next.js App Router, tRPC, Bun, Mongoose) + 9 frontend skills |

### Python (Coming Soon)

Django, FastAPI, Flask support is planned.

## What Gets Installed

```
your-project/
├── CLAUDE.md                    # AI memory — architecture, rules, FORBIDDEN patterns
└── .claude/
    ├── agents/                  # 6 universal agents
    │   ├── research-web.md      # Researches best practices before new features
    │   ├── documenter.md        # Maps files to domains, tracks changes
    │   ├── domain-updater.md    # Records problems, solutions, learnings
    │   ├── commit-manager.md    # Conventional commits, merge workflow
    │   ├── tester.md            # Creates tests (Vitest/PHPUnit/Playwright)
    │   └── claude-md-compactor.md  # Compacts CLAUDE.md when > 40k chars
    ├── skills/                  # 25-40 skills (stack + shared + frontend)
    │   ├── quality-gate/        # Typecheck, lint, test validation
    │   ├── security-scan/       # OWASP checks per language
    │   ├── git-workflow/        # Branch management, conventional commits
    │   ├── codebase-knowledge/  # Domain documentation system
    │   └── ...                  # Stack-specific skills
    ├── hooks/
    │   ├── stop-validator.ts    # Blocks incomplete tasks (branch, git, docs)
    │   └── user-prompt-submit.ts  # Injects workflow + standards context
    ├── commands/                # /feature, /fix, /research, /validate
    ├── config/
    │   ├── active-project.json  # Stack, framework, database, skills
    │   ├── security-rules.json  # OWASP checks + env exposure rules
    │   ├── standards-review.json  # Imported project standards
    │   └── ...                  # Quality gates, testing, domain mapping
    └── settings.json            # Claude Code permissions & model config
```

## Security Features

### Environment Variable Protection (Node.js)

The tool enforces strict separation of server and client environment variables:

- **Scanner**: Detects `NEXT_PUBLIC_` with sensitive words (SECRET, TOKEN, API_KEY) in `.env*` files
- **CLAUDE.md**: FORBIDDEN rules prevent AI from exposing secrets in browser bundles
- **Skills**: Teach API proxy patterns — external API calls must go through Route Handlers
- **security-rules.json**: Automated detection patterns for security audits

### PHP Security

- OWASP Top 10 adapted for Laravel + Octane
- Octane-safe patterns (no static state, no globals)
- `env()` restriction (config files only)
- Frontend secret isolation (Inertia props)
- Rate limiting, CORS, CSP, encryption at rest

## Standards Review

Before modifying anything, the CLI scans your project for existing patterns:

```
Scans:  .cursorrules, composer.json, package.json, tsconfig.json,
        eslint config, phpstan.neon, .env files, framework configs,
        lockfiles, deploy configs, quality tool configs

Detects: 50+ npm packages, 17+ Composer packages, TypeScript strict mode,
         path aliases, ESLint config, PHPStan level, package manager,
         deploy targets, exposed secrets in NEXT_PUBLIC_*

Result:  "Adapt to your standards" or "Use plugin defaults"
         → Saved in standards-review.json
         → Injected into every Claude prompt via hook
```

## CLI Options

```bash
npx start-vibing-stacks [options]

--force           Overwrite existing configuration
--no-claude       Skip Claude Code launch
--no-install      Skip dependency installation
--help, -h        Show help
--version, -v     Show version
```

Or install globally:

```bash
npm install -g start-vibing-stacks
svs  # shortcut alias
```

## How the Workflow Works

Once configured, Claude Code follows this workflow on every task:

```
0. TODO LIST      → Creates detailed task breakdown
1. BRANCH         → Creates feature/ | fix/ | refactor/ | test/
2. RESEARCH       → Runs research-web agent for new features
3. IMPLEMENT      → Follows stack rules + strict types + security
4. TEST           → Runs tester agent (PHPUnit / Vitest / Playwright)
5. DOCUMENT       → Runs documenter agent for modified files
6. UPDATE         → Updates CLAUDE.md with changes
7. QUALITY        → Runs quality gates (typecheck, lint, test, build)
8. COMMIT         → Conventional commits, merge to main
```

The **stop-validator hook** blocks task completion if:
- Not on `main` branch (work must be merged)
- Uncommitted changes exist
- CLAUDE.md wasn't updated
- Source files lack documentation

## Cursor IDE Support

If `.cursorrules` is detected, the rules are automatically imported into the Claude configuration. Both AI tools work with the same context.

## Requirements

| Stack | Requirements |
|-------|-------------|
| **PHP** | PHP >= 8.3, Composer >= 2.0, Node.js >= 18 |
| **Node.js** | Node.js >= 18 (Bun optional) |

Missing dependencies are auto-installed via Homebrew on macOS.

## Credits

Inspired by [start-vibing](https://www.npmjs.com/package/start-vibing).
Built by [FantasyLake](https://github.com/f1sc4ll-ai).

## License

MIT
