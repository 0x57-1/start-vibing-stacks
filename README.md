# 🎸 Start Vibing Stacks

**Multi-stack AI-powered development workflow for Claude Code.**

One command to set up agents, skills, hooks, and quality gates — tailored to your stack.

## 🚀 Quick Start

```bash
npx start-vibing-stacks
```

Or install globally:

```bash
npm install -g start-vibing-stacks
svs  # shortcut
```

## ✨ Features

- **🔍 Auto-detection** — Scans your project files to suggest the right stack
- **🐘 PHP 8.3+** — PHPStan, PHPUnit, Composer, Laravel/Octane
- **📦 Node.js/TS** — Vitest, TypeScript, Bun, Next.js, Express
- **🎯 Multi-framework** — Choose your framework, database, frontend, deploy target
- **🤖 6 Universal Agents** — research, documenter, domain-updater, commit-manager, tester, compactor
- **🛡️ Quality Gates** — Stack-specific validation before every commit
- **🔒 Security Skills** — OWASP checks adapted per language
- **📝 .cursorrules support** — Imports existing Cursor IDE rules
- **⚡ Auto-install** — Validates and installs missing deps (Homebrew on macOS)

## 📋 Supported Stacks

| Stack | Status | Frameworks |
|-------|--------|------------|
| 🐘 PHP 8.3+ | ✅ Ready | Laravel, Laravel+Octane |
| 📦 Node.js/TS | ✅ Ready | Next.js, Nuxt, Astro, Express, Fastify |
| 🐍 Python | 🔜 Soon | Django, FastAPI, Flask |
| 🦀 Rust | 🔜 Soon | Actix, Axum |
| 🐹 Go | 🔜 Soon | Gin, Echo |

## 🏗️ What It Creates

```
.claude/
├── agents/          # 6 universal agents (stack-aware)
├── skills/          # Stack-specific + shared skills
├── hooks/           # stop-validator + prompt-inject
├── config/          # Project config, quality gates, security rules
├── commands/        # /feature, /fix, /validate
└── settings.json    # Claude Code permissions
```

## 🔧 Options

```bash
npx start-vibing-stacks [options]

--force           Overwrite existing configuration
--no-claude       Skip Claude Code installation
--no-install      Skip dependency installation
--help, -h        Show help
--version, -v     Show version
```

## 🐘 PHP Requirements

When selecting the PHP stack, the tool validates and auto-installs:

- **PHP >= 8.3** (via `brew install php@8.3` on macOS)
- **Composer >= 2.0** (auto-installed using PHP if missing)
- **Node.js >= 18** (for frontend tooling)

### Laravel + Octane (RoadRunner)

Select "Laravel + Octane (RoadRunner)" in the framework menu for:
- RoadRunner server configuration
- Octane-specific skills and patterns
- High-performance deployment guides

## 📝 Cursor IDE Support

If `.cursorrules` is detected in your project, the rules are automatically imported into the Claude agent configuration. Both AI tools work with the same context.

## 🔄 How It Works

1. **Detect** — Scans project for `composer.json`, `package.json`, etc.
2. **Select** — You choose stack, framework, database, frontend, deploy
3. **Validate** — Checks system requirements, installs missing tools
4. **Configure** — Copies agents, skills, hooks tailored to your choices
5. **Launch** — Starts Claude Code with everything pre-configured

## 📄 License

MIT

## 🏠 Credits

Inspired by [start-vibing](https://www.npmjs.com/package/start-vibing).
Built by [FantasyLake](https://github.com/f1sc4ll-ai).
