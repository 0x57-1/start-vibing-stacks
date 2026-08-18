# start-vibing-stacks

CLI that installs a **shared AI engineering setup** into a repo: agents, skills, hooks, memories, and quality gates for **Claude Code**, **Kimi Code**, **Grok** (Build 1.0+), and **Cursor** — parametrized by stack (PHP / Node / Python).

```bash
npx start-vibing-stacks@latest
```

Latest: **v2.88.0** — `migrate --apply` installs MOP with `--with-memory-optimization` and opens the launcher (TTY).

---

## What it does

| Job | How |
|-----|-----|
| Scaffold / upgrade project AI config | `npx start-vibing-stacks` then `migrate --apply` |
| Keep Claude · Kimi · Grok · Cursor in sync | Side-cars: `AGENTS.md`, MCP export, `.kimi-code/`, `.grok/`, `.cursor/` |
| Enforce finish hygiene | Stop hooks block dirty tree, skipped docs, stale domain index |
| Same finish chain on all targets | **Commit (scoped) → documenter → domain-updater → docs commit** |
| Multi-instance safety | `.claude/state/` locks + `/svs-peers`; Claude ≥2.1.224 also has native `SendMessage` |
| Theme-aware React UI | Preline moon corpus + `react-theme-apply` + `react-theme-parity` + `check-theme-tokens.mjs` |

**Not** a framework or app generator. It wires agents/skills/hooks around *your* codebase.

---

## Quick start

```bash
cd your-project
npx start-vibing-stacks@latest          # setup or resume (Launch auto-migrates if outdated)
npx start-vibing-stacks@latest migrate --apply   # upgrade skills/hooks/memories/targets
```

Prefer `@latest` — plain `npx start-vibing-stacks` can stick on an old cache.

---

## Targets

| Target | Instructions | Skills / agents | Hooks |
|--------|--------------|-----------------|-------|
| **Claude Code** | `CLAUDE.md` + `.claude/memories/` | `.claude/skills`, `.claude/agents` | `.claude/settings.json` |
| **Kimi** | root `AGENTS.md` | Project `.claude/*` via `extra_*_dirs` in `.kimi-code/local.toml` | `svs-bridge` in local.toml / user config |
| **Grok** | `AGENTS.md` + curated `.grok/skills/` | Adapted `.grok/agents/` (`compat.claude.skills=false` by default — no `~/.claude/skills` dump) | `.grok/hooks/svs.json` + bridge; trust with `/hooks-trust` or `grok --trust` |
| **Cursor** | `AGENTS.md` + `.cursor/rules/svs-policy.mdc` | (reads project files) | — |

Grok does **not** load the full `~/.claude/skills` tree by default (slow boot). Project skills (including `preline-moon`) are installed under `.claude/skills/` and mirrored into `.grok/skills/` when curated.

---

## Development flow (Claude = Kimi = Grok)

Same order on every target. Claude may auto-`Task` agents; **Kimi/Grok must Read/spawn agents** (skill `svs-finalize` / `svs-dev-process`).

```
1. Branch          feature/ | fix/ | refactor/
2. Research        research-web (new features)
3. Implement       stack skills + theme parity (React)
4. Quality         typecheck / lint / test as configured
5. Commit code     commit-manager → scope.ts commit  (never git add -A)
6. Document        documenter → domains + _index.json
7. Wisdom          domain-updater → CLAUDE.md ## Recent Changes (PREPEND)
8. Commit docs     scope.ts commit "docs: …" if dirty
9. Stop            stop-validator must pass (bridge: Grok decision:block / Kimi exit 2)
```

| Skip | Result |
|------|--------|
| documenter / domain-updater after source edits | Stop **blocks**; next session loses memory |
| `git add -A` | Can bundle peer sessions’ files |
| Code-only “done” | Forbidden — finalize required |

```bash
npx tsx "$CLAUDE_PROJECT_DIR/.claude/hooks/scope.ts" commit "<type>: <summary>"
```

On Grok Build 1.0+, SessionEnd archives session state; SessionStart **rehydrates** `filesTouched` so `scope.ts` / Stop stay scoped after resume.

---

## What gets installed

| Layer | Contents |
|-------|----------|
| **Agents** | `research-web` · `documenter` · `domain-updater` · `commit-manager` · `tester` · `security-auditor` · `claude-md-compactor` (+ others) |
| **Skills** | Universal + stack (PHP/Node/Python) + frontend (React: Preline, Tailwind, …) |
| **Hooks** | SessionStart · UserPromptSubmit · Pre/PostToolUse · Stop · SessionEnd (+ plan-gate) |
| **Commands** | `/feature` · `/fix` · `/research` · `/validate` · `/svs-peers` · `/commit-mine` |
| **Memories** | Ads/funnel, checkout, security posture, theme parity, cross-session messaging, MCP discovery, … |
| **CI** | Optional `ci.yml` + `security.yml` when `.github/workflows/` is empty |

### Frontend (React)

| Skill | Role |
|-------|------|
| **`preline-moon`** | Source of truth — offline moon theme corpus (INDEX, 87 schemes, 800+ examples, tokens) |
| **`preline-ui`** | Short summary — install, CSS order, `HSStaticMethods.autoInit()` |
| **`react-theme-apply`** | CSS-first token apply + `scripts/check-theme-tokens.mjs` (memory `react-theme-parity`) |
| Others | `tailwind-patterns`, `react-standards`, `shadcn-ui`, … |

Shipped for `react` / `react-api` / `react-inertia` (`frontendBaseSkillsDir`). After migrate: `.claude/skills/preline-moon/`.

Layout:

```
your-project/
├── CLAUDE.md                 # rules + Recent Changes
├── AGENTS.md                 # Kimi / Grok / Cursor twin
├── .claude/                  # agents, skills, hooks, memories, state/
├── .kimi-code/               # local.toml + mcp.json (migrate)
├── .grok/                    # skills, agents, hooks, config.toml (migrate)
└── .cursor/rules/            # svs-policy.mdc (migrate)
```

---

## Stacks

| Stack | Typical frameworks |
|-------|-------------------|
| **PHP ≥ 8.3** | Laravel (+ Octane), React API-first or Inertia/Blade |
| **Node ≥ 20** | Next.js, Nuxt, Fastify, Express, … |
| **Python ≥ 3.12** | FastAPI, Django, Flask, scripts |

Frontend add-ons: `react` · `react-api` (default for new API stacks) · `react-inertia` (legacy; inherits React base skills).

---

## Multi-instance

Shared bus: `.claude/state/` (gitignored).

- **Locks** — PreToolUse blocks Edit/Write on files an active peer just touched  
- **SVS notify** — `/svs-peers` → `peers.ts notify` (Claude · Kimi · Grok; next prompt)  
- **Claude native** (≥2.1.224) — `ListAgents` / `SendMessage` for Claude↔Claude mid-turn (not Kimi/Grok)

Heartbeat: **active &lt; 180s** (block) · idle → 30min (warn) · then archive. See memory `claude-cross-session-messaging`.

---

## CLI

```bash
npx start-vibing-stacks@latest                 # setup / resume (+ Launch auto-migrate)
npx start-vibing-stacks@latest migrate         # dry-run drift
npx start-vibing-stacks@latest migrate --apply # update, then open launcher (TTY)
npx start-vibing-stacks@latest migrate --apply --with-memory-optimization
npx start-vibing-stacks@latest migrate --apply --no-launch   # CI: update and exit
npx start-vibing-stacks@latest migrate --apply --force-legacy   # heal unversioned hooks/commands
npx start-vibing-stacks@latest migrate --target kimi|grok|cursor|claude|all --apply
```

Flags: `--force` · `--skip-update` · `--no-claude` · `--no-mcp` · `--no-install` · `--with-memory-optimization` · `--no-launch` · `--help` · `--version`

`migrate` upgrades versioned skills/agents/hooks/commands/memories (including `frontendBaseSkillsDir`), patches hook wiring, refreshes target side-cars, and is idempotent.

---

## Notable memories (always-on via Claude `memory_files`)

Ads/funnel · checkout · security · owned infra · `owned-wordpress-plugin-ops` · `verify-before-claim` · `execute-ship-ops` · `multi-instance-main-only` · `quality-gate-before-push` · `cdn-asset-deploy-verify` · `oauth-integration-preflight` · `remove-ai-watermarks` · `react-theme-parity` (CSS-first + token guard) · `multi-target-mcp-discovery`. Full list under `stacks/_shared/memories/`.

Hard limits stay: no phishing/impersonation; memories do **not** bypass Anthropic cyber API gates.

---

## Requirements

| Stack | Need |
|-------|------|
| PHP | PHP ≥ 8.3 · Composer ≥ 2 · Node ≥ 20 |
| Node | Node ≥ 20 |
| Python | Python ≥ 3.12 |

Grok CLI: Build **1.0+** recommended (`grok --version`). Project hooks need folder trust (`/hooks-trust` or Launch `--trust`).

---

## Releases

Bump `package.json` on `main` → `auto-release.yml` tags, GitHub Release, `npm publish`. Opt out with `[skip release]` in the commit body.

---

## License

MIT · Inspired by [start-vibing](https://www.npmjs.com/package/start-vibing) · [FantasyLake](https://github.com/f1sc4ll-ai)
