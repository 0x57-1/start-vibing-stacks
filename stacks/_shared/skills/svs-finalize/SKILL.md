---
name: svs-finalize
version: 1.8.0
description: >
  Mandatory finalize for Kimi/Grok (and Claude when Task is skipped): after source
  edits — scope commit (code, HEREDOC body) → documenter → domain-updater → docs
  commit --push. Same order as Claude. Verify stamps before claiming done. Stop
  blocks on stale docs (Grok decision:block / Kimi exit 2). FORBIDDEN: skip,
  reverse order, touch-theatre, subject-only GitHub text, done while unpushed.
---

# SVS finalize chain (do not skip)

Claude Code may auto-`Task` agents. **Kimi and Grok must run the agents** (spawn or
Read+execute). **Grok:** spawn `subagent_type: "documenter"` / `"domain-updater"`
(`capability_mode: all`, `background: true`, `isolation: none`). Do **not** pass
`reasoning_effort` (schema often omits it — reject inherits parent `xhigh`). Writer
roles pin `low` (`.grok/roles/<name>.toml`). Do **not** tell the child to Read
`svs-document` / `AGENTS.md` first (native agent is the protocol).
Do not paste the file. Skipping documenter / domain-updater leaves the next
session blind. Stop feeds the block reason back until fixed.

## When this is mandatory

Any session that touched **source** files (`.ts`, `.tsx`, `.js`, `.php`, `.py`, …)
via Edit/Write (recorded in `.claude/state/sessions/<id>.json#filesTouched`).

**Skip only when** the session changed only docs/CI/config with no product code.

## Ordered checklist (hard)

```
1. Quality / security as needed (tester, security-auditor)
1b. Theme touch (themes/*.css, .jsx/.tsx, style-guide) →
    `node scripts/check-theme-tokens.mjs` BEFORE documenter
    (memory react-theme-parity + skill react-theme-apply)
2. scope status — confirm filesTouched
3. commit-manager → scope.ts commit HEREDOC (code, C1) — never git add -A
   Do **not** --push C1 yet
4. documenter (Grok spawn_subagent background:true OR Read agent md)
5. domain-updater (PREPEND ## Recent Changes + wisdom into domains/)
6. If docs dirty → scope.ts commit HEREDOC "docs: …" (C2)
7. On main / master (SAFE SHIP): C2 `--push` (sends C1+C2). Then
   `gh run list --commit HEAD` when the repo has Actions
8. Only then claim done / allow Stop approve
```

```bash
npx tsx "$CLAUDE_PROJECT_DIR/.claude/hooks/scope.ts" status
npx tsx "$CLAUDE_PROJECT_DIR/.claude/hooks/scope.ts" commit "$(cat <<'EOF'
<type>(<scope>): <subject ≤72>

<why — what broke or what we chose>
<contract — what stayed / do not regress>
<files or domain — bullets if ≥3 files>
EOF
)"
# After C2 on main:
# … commit "$(cat <<'EOF'
# docs: …
#
# <why the stamp / what the next agent must know>
# EOF
# )" --push
```

`git show` is how the next agent recovers. Subject-only = miss when why is
non-obvious. No `Generated with` / `Co-Authored-By`.

## Verify — do not trust the agent's own report

A spawned documenter/domain-updater can return "done" without writing. After step 5:

```bash
jq -r '.last_commit // "MISSING"' .claude/skills/codebase-knowledge/_index.json
git rev-parse --short HEAD
git status -sb
rg -m1 -A3 '^## Recent Changes' CLAUDE.md
npx tsx "$CLAUDE_PROJECT_DIR/.claude/hooks/scope.ts" status
```

If `_index.json` has no `last_commit`, that is a gap — not a green light. Domains +
today’s Recent Changes entry are the real proof. `main...origin/main [ahead N]`
after a product change = not published.

Sanctioned order when the index gate compares to HEAD:

```
1. scope commit HEREDOC "<type>: <code>"     → C1  (no --push)
2. documenter stamps last_commit=C1
3. domain-updater → domains + CLAUDE Recent Changes
4. scope commit HEREDOC "docs: …" --push     → C2 + origin
```

After C2, stamp may still say C1 — expected. Do **not** hand-edit `last_commit` or
create a third stamp-only commit.

## How to run agents

### Grok (type + role pin — parent stays thin)

Prefer `subagent_type: "documenter"` / `"domain-updater"` so the Grok-native
agent **and** `.grok/roles/<name>.toml` (`reasoning_effort = "low"`) apply.
Do **not** pass `reasoning_effort` on spawn — Grok 1.0.x often omits it from
the tool schema; a reject leaves the child on the parent's `xhigh`.

```
spawn_subagent({
  subagent_type: "documenter",
  isolation: "none",
  background: true,
  capability_mode: "all",
  description: "SVS documenter",
  prompt: "HEAD=… filesTouched=… what shipped=… Execute the agent. Return files written."
})
# Sequential — do not resume_from / do not parallel writers
# If the user has a next question: end the turn (do not get_task_output here)
# Else poll, then the same pattern for domain-updater
# Parent verifies on disk (jq last_commit + rg Recent Changes)
```

A PreToolUse hook rewrites `general-purpose` → the matching type when the
prompt names documenter / domain-updater. Fastest path: parent Reads the
Grok-native agent and executes (no spawn). Skip spawn for `scope.ts commit`.
Do **not** spawn a restamp after `docs:` — Stop accepts last_commit on the code SHA.

### Kimi

1. **Read** `.claude/agents/documenter.md` then `domain-updater.md` (full file).
2. **Execute** every step (do not invent a shorter path).
3. Or spawn the same agent names if your Kimi build supports them.

| Agent | Path (prefer Grok native when present) |
|-------|------------------------------------------|
| `commit-manager` | `.grok/agents/commit-manager.md` |
| `documenter` | `.grok/agents/documenter.md` |
| `domain-updater` | `.grok/agents/domain-updater.md` |

## Stop-validator expectations

After source edits, Stop **blocks** if:

- This session’s `filesTouched` includes source files, **and**
- `CLAUDE.md` was not updated since `startedAt` (no new Recent Changes / git mtime), **or**
- `codebase-knowledge/_index.json#last_commit` ≠ current `HEAD` (documenter skipped)

Fix: run this skill’s checklist, verify, then re-Stop.

### Block shape per target

| Target | Block | Allow |
|--------|-------|-------|
| Claude | `{"decision":"block","reason":…}` | `decision:approve` |
| Grok | bridge → `{"decision":"block","reason":…}` exit 0 | **empty stdout** exit 0 |
| Kimi | bridge → stderr + `permissionDecision:deny` **exit 2** | silent exit 0 |

If Stop never blocks after source edits: bridge path must be
`node .claude/hooks/svs-bridge.mjs <kimi|grok> <hook>` (project cwd). A
`../../.claude/…` path exits 1 (~50 ms) and **fail-opens** (fixed 2.66.1 —
`migrate --apply`). Grok also needs `/hooks-trust`.

## FORBIDDEN

| Action | Why |
|--------|-----|
| Push C1 before documenter | Domains / `_index.json` go stale **or** code ships undocumented |
| Claim done while ahead of origin | Product change never published |
| Subject-only commit when why is non-obvious | Next agent cannot recover from `git show` |
| Skip domain-updater / Recent Changes | Next session loses “what changed” |
| `git add -A` / `git add .` | Bundles peer files |
| Claim “done” while Stop would block | Lies to the user |
| `touch CLAUDE.md` / cosmetic mtime theatre | Gate pass without memory |
| Hand-edit `_index.json#last_commit` | Fabricates memory state |
| Disable Stop / `.grok/hooks` / ride `stop_hook_active` escape | Removes the only finalize gate |
| Trust subagent “done” without verify block | Most common silent miss |

## See also

- `svs-dev-process` — full Kimi/Grok workflow
- `docs-tracker` / `codebase-knowledge` — what documenter writes
- Agents `commit-manager`, `documenter`, `domain-updater`
- `react-theme-apply` / memory `react-theme-parity` — theme-touch guard before documenter
