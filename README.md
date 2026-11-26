# start-vibing-stacks

One setup for Claude Code, Kimi, Grok, and Cursor. Agents, skills, hooks, and finish rules fitted to the stack you already ship: PHP, Node.js, Python, or React Native.

[![npm](https://img.shields.io/npm/v/start-vibing-stacks?style=flat-square&logo=npm&label=npm)](https://www.npmjs.com/package/start-vibing-stacks)
[![node](https://img.shields.io/node/v/start-vibing-stacks?style=flat-square&logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![license](https://img.shields.io/npm/l/start-vibing-stacks?style=flat-square)](https://www.npmjs.com/package/start-vibing-stacks)

```bash
npx --yes start-vibing-stacks@latest
```

Run it in the project root. No global install. The first run detects the stack and writes the config. A later run resumes and applies what the package has shipped since.

Your app code and env stay. An existing design system is seeded once and is not overwritten.

---

## What it writes

```
your-project/
├── CLAUDE.md                 # project rules
├── AGENTS.md                 # the same rules for Kimi, Grok, and Cursor
├── .claude/                  # agents, skills, hooks, memories
├── .kimi-code/               # Kimi skills and MCP
├── .grok/                    # Grok skills, agents, and hooks
└── .cursor/rules/            # Cursor policy
```

| Layer | What lands |
|---|---|
| Agents | Research, docs, domain notes, commits, tests, security review |
| Skills | Shared set, plus the stack you picked and the frontend if the app has one |
| Hooks | Session start and end, prompt submit, tool use, stop |
| Commands | `/feature` · `/fix` · `/research` · `/validate` · `/svs-peers` · `/commit-mine` |
| Memories | Rules Claude loads every turn. Kimi and Grok use an index of the same files |
| CI | `ci.yml` and `security.yml` only when `.github/workflows/` is empty |

A React Native repo with no `app.json` can be seeded. Every other stack writes only the agent config.

---

## Stacks

| Stack | Tooling | Typical app |
|---|---|---|
| PHP ≥ 8.3 | Composer ≥ 2, Node ≥ 22 | Laravel, Octane, React or Inertia |
| Node ≥ 22 | 24 LTS for a new app | Next.js, Nuxt, Fastify, Express |
| Python ≥ 3.12 | — | FastAPI, Django, Flask |
| React Native | Node ≥ 22, Expo SDK 57 | Expo Router. Jest first, then one simulator or Expo Go when you ask |

Web UI add-ons, when the app has one: `react`, `react-api`, `react-inertia`.

---

## Agents

| Agent | Reads | Skills |
|---|---|---|
| Claude Code | `CLAUDE.md` and `.claude/memories/` | `.claude/skills` |
| Kimi | `AGENTS.md` | `.kimi-code/skills/` |
| Grok | `AGENTS.md` | `.grok/skills/` and `.grok/agents/` |
| Cursor | `AGENTS.md` and `.cursor/rules/` | The project files |

Memory files stay in `.claude/memories/`. Live sessions share `.claude/state/sessions/`.

Commit through the scoped command. `git add -A` can stage files another session still has open.

```bash
npx tsx "$CLAUDE_PROJECT_DIR/.claude/hooks/scope.ts" commit "<type>: <summary>"
```

---

## Update an existing repo

```bash
npx --yes start-vibing-stacks@latest migrate --apply
```

| Command | Effect |
|---|---|
| `migrate` | Show the diff. Writes nothing |
| `migrate --apply` | Write the updates, then open the launcher |
| `migrate --apply --no-launch` | Write the updates and exit |
| `migrate --target claude\|kimi\|grok\|cursor\|all --apply` | Refresh one side-car. Default is all |
| `migrate --apply --force-legacy` | Replace hooks and commands that predate version stamps. Each file gets a `.bak` |

Other flags: `--force` · `--skip-update` · `--no-claude` · `--no-mcp` · `--no-install` · `--help` · `--version`

`migrate --apply` is safe to run again.

---

## Requirements

The CLI runs on Node ≥ 20. The stack you generate may ask for the versions in the table above. Xcode or an Android emulator is used only when you ask to boot a device.

The installed rules refuse impersonation and scans of systems you do not own. They do not turn off a model provider’s own checks.

---

## Maintainers

A version bump in `package.json` on `main` tags a release and publishes to npm. Put `[skip release]` in the commit body to push without publishing.

```bash
npm test
npm run build
```

---

## License

MIT · Inspired by [start-vibing](https://www.npmjs.com/package/start-vibing)
