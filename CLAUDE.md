# start-vibing-stacks

> **SIZE LIMIT**: Target ≤ 20 KB / ~280 lines (Anthropic May-2026 best practice — see `stacks/_shared/agents/claude-md-compactor.md`). Validate with `wc -c -l CLAUDE.md` before commit.

---

## Recent Changes

<!-- APPEND-ONLY LIFO. Each Claude instance PREPENDS a new `### YYYY-MM-DD · branch · vX.Y.Z` heading
     + 1–4 lines below it. Drop only the OLDEST entry when count > 10. NEVER edit a peer's entry.
     Compactor (`claude-md-compactor.md` §5–§6) enforces the cap, not the prepend. -->

### 2026-05-19 · main · validator-alignment
Per-instance scoping extended into `stop-validator.ts` (local v1.1.0 → **v1.2.0** and global
`~/.claude/hooks/stop-validator.ts`). Both validators now (1) accept `## Last Change` OR
`## Recent Changes` for the changelog slot and (2) intersect `git status` with
`.claude/state/sessions/<id>.json#filesTouched` when a session id is resolvable — peer
N's dirty files no longer block instance M's Stop. Block messages now recommend
`scope.ts stage` instead of `git add -A` when in scoped mode. Global `searchInDocs()` now
also looks in project-root `CLAUDE.md` and `README.md` so documenting a file in the
architecture tree satisfies `SOURCE_FILES_NOT_DOCUMENTED`. Architecture tree above now
lists `scope.ts`, `_state.ts`, `peers.ts`, `post-tool-use.ts`, `commit-mine.md` explicitly.

### 2026-05-19 · main · docs+coordination
`Recent Changes` section now append-only LIFO (replaces overwriting `Last Change`) so parallel Claude
instances stop stomping each other's entries. New `/commit-mine` slash command + `scope.ts` hook stage
and commit ONLY files this session edited, using `.claude/state/sessions/<id>.json#filesTouched`
(maintained by `post-tool-use.ts`). Refuses files a peer touched in the last 5 min unless
`--include-conflicted`. Closes the "instance 2 commit bundles instance 1's files" pattern.
`claude-md-compactor.md` §5 budget + §6 forbidden list + new §6.1 multi-instance safety updated.

### 2026-05-19 · main · v2.25.2
Republish of v2.25.1: npm registry returned 404 on PUT despite v2.25.0 succeeding 10 min earlier
(same workflow, same token — transient registry hiccup, not a code regression). Bumped to a fresh
version to retry a clean publish path. Payload identical to v2.25.1.

### 2026-05-19 · main · v2.25.1
`/validate` unambiguously stack-aware: per-stack JSON reference, `active-project.json#qualityGates`
is canonical, fallback policy explicit.

### 2026-05-19 · main · v2.25.0
`--force-hooks` extended to cover legacy commands (alias `--force-legacy`).

### 2026-05-19 · main · v2.24.0
Smart migrate — versioned hooks/commands, idempotent `settings.json`, runtime dirs, `.gitignore`.

### 2026-05-19 · main · v2.23.0
Multi-instance coordination layer (`.claude/state/`, peer detection, hybrid block).

### 2026-05-19 · main · v2.22.0
Vite manualChunks silent-bug post-mortem.

### 2026-05-19 · main · v2.21.0
Node.js tsx/devDeps.

### 2026-05-19 · main · v2.20.0
Node.js slug consistency.

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
│   │   ├── agents/                     # 7 agents (research-web, documenter, claude-md-compactor, ...)
│   │   ├── commands/                   # /feature, /fix, /research, /validate, /peers, /commit-mine
│   │   ├── config/                     # mcp-servers.json + base configs
│   │   ├── hooks/                      # run-hook.sh, stop-validator.ts (per-instance scoped),
│   │   │                                  session-start.ts, pre-tool-use.ts, post-tool-use.ts,
│   │   │                                  user-prompt-submit.ts, peers.ts (CLI),
│   │   │                                  scope.ts (per-instance commit scoping CLI),
│   │   │                                  _state.ts (multi-instance state lib)
│   │   └── skills/                     # 20 universal skills (security-baseline,
│   │                                      database-migrations, openapi-design,
│   │                                      postgres-patterns, etc.)
│   ├── frontend/
│   │   ├── react/skills/               # 7 React+Tailwind+shadcn skills
│   │   └── react-inertia/skills/       # 2 Inertia-specific skills
│   ├── nodejs/
│   │   ├── stack.json                  # frameworks/databases/skills/qualityGates
│   │   ├── skills/                     # 7 skills: nextjs-app-router, fastify-api,
│   │   │                                  trpc-api, mongoose-patterns, typescript-strict,
│   │   │                                  bun-runtime, api-security-node
│   │   ├── scripts/                    # zero-dep helper scripts (e.g.
│   │   │                                  check-route-slugs.mjs,
│   │   │                                  check-build-scripts.mjs); installer
│   │   │                                  copies the dir → <project>/scripts/
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
10. copy stacks/{stack}/scripts/*     → <project>/scripts/   (non-destructive merge)
11. copy stacks/_shared/commands/*    → .claude/commands/
12. write .claude/settings.json       (hooks, MCP, agents, workflow, rules, quality_gates)
13. write CLAUDE.md from templates/CLAUDE-{stack}.md (if missing)
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
- **Trusting `manualChunks` / `splitChunks` / bundler grouping silently** — fixed in v2.22.0. Bundlers SILENTLY ignore your grouping for entry chunks. Every PHP stack ships `scripts/check-vite-manifest.mjs`; new stacks adding bundler grouping MUST ship an equivalent manifest cross-check validator.
- **Two Claude instances stomping the same uncommitted file** — fixed in v2.23.0. Coordination layer at `.claude/state/`. Hooks BLOCK Edit/Write only when a peer's heartbeat is active (<60s) AND touched the same file in the last 5 min; otherwise warn. New skills/hooks/files MUST keep the contract: writes atomic (`.tmp` + `rename`), reads tolerant of corruption, never block Claude on a coordination-layer bug. State dir is per-host runtime — never commit it. See `multi-instance-coordination` skill.
- **Instance N's commit bundling instance M's uncommitted files** — fixed in docs+coordination (2026-05-19). NEVER run `git add .` / `git add -A` / `git add -u` in a multi-instance project. ALWAYS commit via `/commit-mine` (or directly: `npx tsx "$CLAUDE_PROJECT_DIR/.claude/hooks/scope.ts" stage && git commit -m "<msg>"`). Source of truth for "what did THIS session edit?" is `.claude/state/sessions/<id>.json#filesTouched`, maintained by `post-tool-use.ts`. `scope.ts` runs `git reset` first (destructive to the index), then stages only this session's dirty files; refuses files a peer touched in the last 5 min unless `--include-conflicted`.
- **Stomping the `## Recent Changes` log** — same fix. The section is APPEND-ONLY LIFO with a cap of 10 (compactor enforces the cap, not the prepend). PREPEND a new `### YYYY-MM-DD · branch · vX.Y.Z` block; NEVER edit or delete a peer's entry. If you must compact, drop only the OLDEST entry. See `claude-md-compactor.md` §5 + §6 + §6.1.
- **`migrate` half-applying a release** — fixed in v2.24.0 / v2.25.0. Any new feature that ships hooks, commands, settings.json entries, runtime dirs, or `.gitignore` changes MUST be reachable through `migrate --apply` (not only via fresh `setup --force`). Hooks ship `// @sv-version: x.y.z`; commands ship frontmatter `version:`; `patchSettings()` and `ensureRuntimeArtefacts()` are the canonical place to wire everything else. Re-running `migrate --apply` MUST be idempotent. Legacy un-versioned files (hooks without `@sv-version`, commands without `version:` — i.e. anything installed before the versioning landed) are recovered via `--force-legacy` (alias `--force-hooks`) which overwrites with a timestamped `.bak`. Skills and agents stay manual-review (`modified-no-version`) because users customize them.

---

## Setup Notes (this repo's own dev environment)

This repo intentionally does **not** install its own generated `.claude/` (would be circular). The `.claude/settings.local.json` exists for local plugin enablement only. The project relies on the **user-global** `~/.claude/` for AI assistance during development of the package itself.
