# start-vibing-stacks

> **SIZE LIMIT**: Target ≤ 20 KB / ~280 lines (Anthropic May-2026 best practice — see `stacks/_shared/agents/claude-md-compactor.md`). Validate with `wc -c -l CLAUDE.md` before commit.

---

## Last Change

**Branch:** main
**Date:** 2026-05-13
**Summary:** v2.10.0 — `stacks/_shared/agents/claude-md-compactor.md` rewritten
to **v2.0.0** grounded 100% in Anthropic's May-2026 official docs
(`docs.anthropic.com/en/docs/claude-code/memory` + `/skills`). New trigger
model is **per-file thresholds in tokens/KB** instead of the previous single
40 KB char limit: project `CLAUDE.md` > 20 KB (50% reduction from baseline)
OR nested `CLAUDE.md` > 16 KB (stricter — they do **not** survive `/compact`)
OR `MEMORY.md` > 25 KB / 200 lines (Anthropic hard cap) OR any `SKILL.md` >
20 KB (~5k tokens — post-`/compact` per-skill cap) OR aggregate persistent
boot instructions > 64 KB OR `/doctor` reports skill listing budget overflow.
Adds a **Hierarchy of Offload** table ranking mechanisms by boot cost (hook =
0 → skill with `paths:` = 0-until-glob → skill auto = ~description-only →
rule with `paths:` = 0-until-file-opened → CLAUDE.md = full → HTML comment =
stripped/free), with explicit routing rules for each content type ("always
run X" → hook, multi-step manual workflow → skill with
`disable-model-invocation: true`, scoped convention → rule with `paths:`,
verbose explanation → `<!-- ... -->`). New procedures: mandatory
`.claude/memory/archive/CLAUDE.md.<date>.bak` backup before any write,
promotion of fragile nested `CLAUDE.md` to `paths:`-scoped rules (so they
survive `/compact`), conflict scan across user/project/rules sources,
`claudeMdExcludes` for monorepos, `skillOverrides` /
`skillListingBudgetFraction` / `maxSkillDescriptionChars` knobs for skill
budget management, optional `InstructionsLoaded` hook for permanent load
visibility, and `CLAUDE_CODE_NEW_INIT=1 /init` bail-out for irrecoverable
cases. Anti-mythology call-outs: `@import` does NOT save context (loads full
at launch), CLAUDE.md is delivered as user message AFTER system prompt (no
strict compliance — use hooks for hard enforcement). Backup of v1.0.0 kept
at `stacks/_shared/agents/.archive/claude-md-compactor.v1.0.0.md`.
Earlier: v2.9.0 — PHP stack repositioned as **API-first by default** with
new default frontend `react-api` (Vite + Axios + Sanctum SPA cookie),
Inertia.js demoted to LEGACY, new skills `laravel-api-architecture` +
`axios-laravel-api` + `react-api-standards`. v2.8.0 — added `openapi-design`,
`postgres-patterns`, `fastify-api`. v2.7.4 — fixed generated hook commands
to use `$CLAUDE_PROJECT_DIR`.

---

## 30 Seconds Overview

CLI tool published to npm as `start-vibing-stacks`. Generates a complete `.claude/` setup (agents, skills, hooks, commands, configs) and `CLAUDE.md` for a target project, parametrized by stack (PHP / Node.js / Python). Auto-detects existing project standards (lint configs, lockfiles, env shapes) and either adapts to them or seeds defaults. Also ships a `migrate` subcommand that diffs installed skill versions against the bundled package and upgrades outdated ones.

Run via `npx start-vibing-stacks` — no install required.

---

## Stack

| Component | Technology |
|---|---|
| Runtime | Node.js ≥ 18 (also runs on Bun) |
| Language | TypeScript **strict mode** |
| Build | `tsc` → `dist/` (ESM) |
| Distribution | npm package; `bin: dist/index.js` |
| CLI deps | `chalk`, `inquirer`, `ora`, `semver` |
| Test | (none yet — manual `npx tsx src/index.ts` against fixture dirs) |
| Release | GitHub Actions: `auto-release.yml` (push to main with `package.json` bump → tag + release + `npm publish`) |

---

## Architecture

```
start-vibing-stacks/
├── CLAUDE.md                           # THIS FILE — project rules (40k char max)
├── README.md                           # Public-facing docs
├── package.json                        # version drives auto-release.yml
├── tsconfig.json
├── src/
│   ├── index.ts                        # CLI entry — arg parsing, top-level flow
│   ├── detector.ts                     # Detects existing stack from project files
│   ├── scanner.ts                      # Reads existing standards (env, lint, lockfiles)
│   ├── installer.ts                    # Optional dep auto-install (Homebrew)
│   ├── setup.ts                        # **Core**: writes .claude/, CLAUDE.md, settings.json
│   ├── migrate.ts                      # `migrate` subcommand — diff/upgrade installed skills
│   ├── mcp.ts                          # MCP server config wiring
│   ├── ui.ts                           # spinner / log helpers
│   └── types.ts                        # ProjectConfig, StackConfig
├── dist/                               # tsc output, gitignored, shipped to npm
├── stacks/
│   ├── _shared/                        # universal — copied to every project
│   │   ├── agents/                     # 7 agents (research-web, documenter, ...)
│   │   ├── commands/                   # /feature, /fix, /research, /validate
│   │   ├── config/                     # mcp-servers.json + base configs
│   │   ├── hooks/                      # run-hook.sh, stop-validator.ts, final-check.ts,
│   │   │                                  user-prompt-submit.ts (THE generated hooks)
│   │   └── skills/                     # 20 universal skills (security-baseline,
│   │                                      database-migrations, openapi-design,
│   │                                      postgres-patterns, etc.)
│   ├── frontend/
│   │   ├── react/skills/               # 7 React+Tailwind+shadcn skills
│   │   └── react-inertia/skills/       # 2 Inertia-specific skills
│   ├── nodejs/
│   │   ├── stack.json                  # frameworks/databases/skills declaration
│   │   ├── skills/                     # 7 skills: nextjs-app-router, fastify-api,
│   │   │                                  trpc-api, mongoose-patterns, typescript-strict,
│   │   │                                  bun-runtime, api-security-node
│   │   └── workflows/                  # ci.yml + security.yml templates
│   ├── python/
│   │   ├── stack.json
│   │   ├── skills/                     # 9 Python skills (FastAPI, Django, Pydantic, ...)
│   │   └── workflows/
│   └── php/
│       ├── stack.json
│       ├── skills/                     # 12 PHP/Laravel skills
│       └── workflows/
├── templates/                          # CLAUDE-{php,nodejs,python,default}.md
└── .github/workflows/
    ├── auto-release.yml                # version bump on main → tag + release + publish
    └── publish.yml                     # manual / GitHub Release → npm publish
```

---

## How `setup.ts` Decides What to Copy

```
1. mkdir .claude/{agents,skills,hooks,config,commands}
2. copy stacks/_shared/agents/*       → .claude/agents/
3. copy stacks/_shared/skills/*       → .claude/skills/      (universal — every project gets these)
4. copy stacks/_shared/hooks/*        → .claude/hooks/
5. copy stacks/_shared/config/*       → .claude/config/
6. copy stacks/{stack}/skills/*       → .claude/skills/      (stack-specific)
7. copy stacks/{stack}/config/*       → .claude/config/      (if exists)
8. copy stacks/frontend/{fe}/skills/* → .claude/skills/      (frontend-specific)
9. copy stacks/{stack}/workflows/*    → .github/workflows/   (if dir is empty)
10. copy stacks/_shared/commands/*    → .claude/commands/
11. write .claude/settings.json       (hooks, MCP, agents, workflow, rules, quality_gates)
12. write CLAUDE.md from templates/CLAUDE-{stack}.md (if missing)
```

**Rule:** the `frameworks[].skills` and `databases[].skills` arrays in `stack.json` are **declarative metadata** for discovery (UI, agent reasoning) — they do **not** drive `setup.ts` filtering. Setup copies the whole stack folder. Per-skill scoping is enforced at runtime by the `description:` frontmatter in each `SKILL.md` (Claude only auto-loads when the description matches the task).

---

## Critical Rules

### Generated hook commands MUST use `$CLAUDE_PROJECT_DIR`

```ts
// CORRECT — works regardless of Claude's CWD
command: 'npx tsx "$CLAUDE_PROJECT_DIR/.claude/hooks/stop-validator.ts"'

// WRONG — breaks when CWD is a subfolder of the project
command: 'npx tsx .claude/hooks/stop-validator.ts'
```

This is enforced in `src/setup.ts` (lines ~263, 274). Any new hook added to the generated `settings.json` must follow the same pattern. The anti-pattern is documented globally as "Relative paths in permission patterns" (CLAUDE.md NRY).

### Skill placement decides scope

| Folder | Loads in |
|---|---|
| `stacks/_shared/skills/` | Every generated project (Node, Python, PHP) |
| `stacks/{stack}/skills/` | Every project for that stack |
| `stacks/frontend/{fe}/skills/` | Every project that picks that frontend |

Polyglot skills in `_shared/` MUST show examples in multiple languages (mirror `database-migrations/SKILL.md` pattern: SQL + Node + Python + PHP). Stack-specific skills MAY assume the stack's language.

### Skill `description:` frontmatter is the auto-load trigger

Narrow descriptions prevent memory pollution. Example of correct narrowness:

```yaml
description: PostgreSQL SQL-level design and tuning — JSONB, partial/expression
indexes, partitioning, EXPLAIN, isolation levels, connection pooling. Use when
designing Postgres schemas or debugging Postgres query performance. Complements
the per-stack ORM skill and database-migrations.
```

Wrong (too broad):
```yaml
description: PostgreSQL patterns
```

### No content duplication across skills

When a topic is owned by an existing skill, the new one **cross-references** it via "See Also". Example: `postgres-patterns §12` (SQL injection PG-specifics) explicitly defers generic SQL-injection rules to `security-baseline §A03`.

### Versioned skills

Every `SKILL.md` MUST have `version:` in frontmatter. The `migrate` subcommand uses `semver` to detect drift between installed and bundled skills. Bumping a skill's `version:` is a breaking change for existing projects (they get the upgrade notice).

---

## Release Process

1. Edit `src/`, `stacks/`, `templates/` as needed.
2. Bump `package.json` `version` (semver: feat=minor, fix=patch, breaking=major).
3. Single commit titled `<type>: <summary> — vX.Y.Z`. The auto-release workflow uses the title as the GitHub Release title.
4. `git push origin main`.
5. `auto-release.yml` detects the version change, builds via `npm ci && npm run build`, creates the tag/release, and runs `npm publish`. Total runtime ~17–25s.
6. Verify via `npm view start-vibing-stacks version` (may take a moment to propagate the local cache; `curl https://registry.npmjs.org/start-vibing-stacks/latest` is authoritative).

`dist/` is **gitignored** but **shipped to npm** via `package.json#files: ["dist/", ...]` and the `prepublishOnly` build hook. Do not commit it.

To opt out of release on a commit (e.g., docs-only): include `[skip release]` in the commit body. To skip if version unchanged: handled automatically.

---

## Quality Gates

Currently no test suite. Validation is by:

```bash
npm run build          # tsc — MUST pass (no errors)
node -e "JSON.parse(require('fs').readFileSync('stacks/<stack>/stack.json','utf8'))"  # JSON valid
```

Manual smoke test before release:
```bash
mkdir /tmp/svs-test && cd /tmp/svs-test && npm init -y
node /Users/f1sc4/GDrive/Documentos/GitHub/start-vibing-stacks/dist/index.js
```

When tests are added, this section gets the standard typecheck/lint/test/build matrix.

---

## FORBIDDEN

| Action | Reason |
|---|---|
| Relative paths in generated hook commands | Breaks when Claude's CWD is a subfolder (cost us a v2.7.4 patch) |
| Editing `dist/` by hand | Gets clobbered by next `npm run build` |
| Committing `dist/` | gitignored; CI builds fresh on release |
| Adding a `_shared/` skill that duplicates topic of existing one | Memory bloat; agents see two sources, pick wrong one |
| Skipping `version:` in a new `SKILL.md` | `migrate` subcommand can't track drift |
| Stack-specific code in `_shared/skills/` | Polyglot only; show multi-language examples |
| Bumping major without checking `migrate` impact on existing users | Forces full re-setup |
| `git push --force` on `main` | Breaks the auto-release flow if a tag was created |
| Hardcoding absolute paths to `/Users/...` in shipped code | Won't work on other machines / CI |
| Verbose comments narrating obvious code | Same rule as everywhere — comments explain *why*, not *what* |

---

## Configuration

- `package.json` — version source of truth; `files` allowlist for npm
- `tsconfig.json` — strict mode, ESM, `dist/` outDir
- `.npmignore` — defense in depth against shipping source/secrets
- `stacks/{stack}/stack.json` — declares frameworks, databases, skills, qualityGates, requirements per stack
- `stacks/_shared/config/mcp-servers.json` — base MCP server set (context7, sequential-thinking, memory, etc.)

---

## NRY (Never Repeat Yourself)

- **Relative paths in hook commands** — fixed in v2.7.4. Always `$CLAUDE_PROJECT_DIR` for project hooks, `$HOME` for user-global hooks.
- **Skipping the build before publish** — `prepublishOnly` runs `npm run build`; do not bypass.
- **Manually creating GitHub Releases** — `auto-release.yml` handles it from a `package.json` bump.
- **Forgetting to bump `version:` in modified skills** — `migrate` won't surface the change to users.
- **Adding hooks to generated `settings.json` without testing from a subfolder CWD** — see v2.7.4 fix; smoke-test by running the hook from a temp subdir.

---

## Setup Notes (this repo's own dev environment)

This repo intentionally does **not** install its own generated `.claude/` (would be circular). The `.claude/settings.local.json` exists for local plugin enablement only. The project relies on the **user-global** `~/.claude/` for AI assistance during development of the package itself.
