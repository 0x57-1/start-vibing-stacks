# start-vibing-stacks

**One setup for every coding agent on the repo.**  
Agents, skills, hooks, and finish rules for Claude Code, Kimi, Grok, and Cursor — fitted to the stack you already ship.

[![npm](https://img.shields.io/npm/v/start-vibing-stacks?style=flat-square&logo=npm&label=npm)](https://www.npmjs.com/package/start-vibing-stacks)
[![node](https://img.shields.io/node/v/start-vibing-stacks?style=flat-square&logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![license](https://img.shields.io/npm/l/start-vibing-stacks?style=flat-square)](https://www.npmjs.com/package/start-vibing-stacks)

```bash
npx --yes start-vibing-stacks@latest
```

No global install. Run it in the project root. The first run detects the stack, writes the config, and opens a launcher. The next run resumes and applies anything the package has shipped since.

| | |
|---|---|
| **Stacks** | PHP · Node.js · Python · React Native / Expo |
| **Agents** | Claude Code · Kimi Code · Grok · Cursor |
| **Keeps** | Your app code, your design system, your env |

---

## Install

```bash
cd your-project
npx --yes start-vibing-stacks@latest
```

Already configured, and you want the skills and memories from the current package:

```bash
npx --yes start-vibing-stacks@latest migrate --apply
```

That is the whole first flow. Setup copies the pipeline, the memories, and the side-cars. `migrate --apply` refreshes them in place and is safe to run again.

---

## What you get

It sits beside your framework and keeps the four agents on the same rules.

| You stop doing | The package does |
|---|---|
| Re-explaining the repo to every new session | Project rules in `CLAUDE.md`, `AGENTS.md`, and always-on memories |
| One-off prompts per tool | The same skills and finish order on Claude, Kimi, Grok, and Cursor |
| “It’s done” with a dirty tree | A stop check for docs, domain notes, and uncommitted work |
| `git add -A` across parallel chats | A scoped commit of the files this session actually touched |
| Drifting UI tokens | A protected `design-system` skill and a theme-token check |

A React Native repo with no `app.json` can be seeded (tabs, auth panel, or blank). Every other stack only writes the AI config.

```
your-project/
├── CLAUDE.md              # rules + Recent Changes
├── AGENTS.md              # the same rules for Kimi, Grok, and Cursor
├── .claude/               # agents, skills, hooks, memories, state/
├── .kimi-code/            # skills, local.toml, mcp.json
├── .grok/                 # skills, agents, hooks, config.toml
└── .cursor/rules/         # svs-policy.mdc
```

| Layer | What lands |
|---|---|
| **Agents** | research, docs, domain notes, commits, tests, security audit, `CLAUDE.md` size |
| **Skills** | Shared, plus the stack you picked, plus the frontend if the app has one |
| **Hooks** | Session start and end, prompt submit, tool use, stop |
| **Commands** | `/feature` · `/fix` · `/research` · `/validate` · `/svs-peers` · `/commit-mine` |
| **Memories** | The rules Claude loads on every turn. Kimi and Grok get an index that points at the same files |
| **CI** | `ci.yml` and `security.yml` only when `.github/workflows/` is empty |

---

## Stacks

| Stack | What setup expects | Typical app |
|---|---|---|
| **PHP ≥ 8.3** | Composer ≥ 2, Node ≥ 22 | Laravel 13, Octane, React or Inertia |
| **Node ≥ 22** | 24 LTS for a new app | Next.js, Nuxt, Fastify, Express |
| **Python ≥ 3.12** | — | FastAPI, Django, Flask |
| **React Native** | Node ≥ 22, Expo SDK 57 | Expo Router. Jest first, then one simulator or Expo Go |

Frontend add-ons, when the app has a web UI: `react`, `react-api`, `react-inertia`.

| UI skill | Role |
|---|---|
| `design-system` | The look this repo already chose. Seeded once. Never overwritten, never deleted |
| `project-ui-standard` | Read the guides that exist, then seed `design-system` |
| `react-theme-apply` | Tokens, then recipes, then components. `scripts/check-theme-tokens.mjs` guards the drift |
| `preline-moon` | Only if the app uses Preline. A pointer to `~/.claude/skills/preline-moon`. Not shipped inside the tarball |

---

## One project, four agents

| Agent | Where it reads | Where its skills live |
|---|---|---|
| **Claude Code** | `CLAUDE.md` + `.claude/memories/` | `.claude/skills`, `.claude/agents` |
| **Kimi** | `AGENTS.md` | `.kimi-code/skills/`, plus stack skills from `.claude/skills` |
| **Grok** | `AGENTS.md` | `.grok/skills/` and `.grok/agents/` only. Project skills, not the global Claude skill dump |
| **Cursor** | `AGENTS.md` + `.cursor/rules/svs-policy.mdc` | The project files |

Memory files stay in `.claude/memories/`. Grok and Kimi read them through `svs-memory-index`, which lists every memory the stack loads, including the React Native set. PHP, Node, and Python load the shared set.

Live sessions share `.claude/state/sessions/`. Before an edit, the agent reads the live session files in that folder in one pass and opens a transcript only when it touches the same files.

---

## Day to day

**First time.** `npx --yes start-vibing-stacks@latest` in the repo. Answer the stack questions. The Memory Optimization Pipeline is copied into `.claude/memory-optimization/` as part of that run.

**Come back later.** Run the same command. If the project is already configured, the launcher resumes and applies pending updates.

**Pull a newer package into an existing repo.**

```bash
npx --yes start-vibing-stacks@latest migrate --apply
```

| Command | When |
|---|---|
| `migrate` | Show what would change. Writes nothing |
| `migrate --apply` | Write the updates, then open the launcher |
| `migrate --apply --no-launch` | Write the updates and exit. Use this in CI |
| `migrate --apply --force-legacy` | Replace hooks and commands that predate version stamps. Each file gets a `.bak` |
| `migrate --target kimi\|grok\|cursor\|claude\|all --apply` | Refresh one side-car. Default is all |

Other flags: `--force` · `--skip-update` · `--no-claude` · `--no-mcp` · `--no-install` · `--help` · `--version`

`--with-memory-optimization` is still accepted and ignored. The pipeline directory is always installed. `memory optimize --apply` waits for an explicit yes and writes a review copy beside the original.

`migrate --apply` is idempotent. Run it after you pull a new release, or when a second machine is behind.

### When `npx` serves an old build

`npx …@latest` can keep an old extract under `~/.npm/_npx`, because that cache key is the string `@latest`, not the version it resolved to. This CLI checks the registry and, when the published version is newer, runs `npx --yes start-vibing-stacks@<version>` with `prefer-online`. The pinned version is a new cache key. Leave the rest of the npm cache in place.

Right after a publish, the tarball can 404 for a few minutes while the registry CDN warms. Wait and run the same command. Deleting the local cache does not clear that 404.

---

## How a task finishes

The same order on Claude, Kimi, and Grok.

```
1. Branch          feature/  |  fix/  |  refactor/
2. Research        new features go through research first
3. Implement       stack skills, and the theme rules when the UI changes
4. Quality         typecheck, lint, and test, as the stack defines them
5. Commit code     this session’s files only
6. Document        domain map for what changed
7. Recent Changes  prepend one block in CLAUDE.md
8. Commit docs     a second commit, only if the docs are dirty
9. Stop            the stop check has to pass
```

```bash
npx tsx "$CLAUDE_PROJECT_DIR/.claude/hooks/scope.ts" commit "<type>: <summary>"
```

Use the scoped commit above. A full `git add -A` can stage files another session still has open.

| If you skip | What happens |
|---|---|
| Docs after a source change | The stop check blocks. The next session has no record |
| A commit of the whole worktree | Another session’s edits ride along |
| “Done” after the code commit | The domain notes and Recent Changes never land |

On Grok, the launcher starts `grok --always-approve --trust` so project hooks and MCP load. Build 1.0.4 or newer.

---

## Several sessions at once

`.claude/state/` is gitignored and shared.

| Piece | Behavior |
|---|---|
| **File locks** | An edit is blocked when another live session just touched that file |
| **Notify** | `/svs-peers` delivers a note to the next prompt on Claude, Kimi, or Grok |
| **Claude to Claude** | Claude Code 2.1.224 and newer can message mid-turn. Kimi and Grok stay on the shared bus |
| **Heartbeat** | Active under 180 seconds blocks. Idle sessions warn, then archive after 30 minutes |

---

## Requirements

The CLI itself runs on Node ≥ 20. The stack you generate may ask for more.

| Stack | Tooling |
|---|---|
| PHP | PHP ≥ 8.3 (8.4 recommended) · Composer ≥ 2 · Node ≥ 22 |
| Node | Node ≥ 22, 24 LTS for a new app |
| Python | Python ≥ 3.12 |
| React Native | Node ≥ 22 · Expo SDK 57 · Xcode or an Android emulator only if you ask to boot one |

---

## Boundaries

The installed rules refuse impersonation and scans of systems you do not own. They do not turn off a model provider’s own checks.

---

## For maintainers

A version bump in `package.json` on `main` tags a GitHub Release and publishes to npm. Put `[skip release]` in the commit body to push without publishing.

```bash
npm test
npm run build
```

---

## License

MIT · Inspired by [start-vibing](https://www.npmjs.com/package/start-vibing) · [FantasyLake](https://github.com/f1sc4ll-ai)
