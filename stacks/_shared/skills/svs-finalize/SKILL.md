---
name: svs-finalize
version: 1.5.0
description: >
  Mandatory finalize for Kimi/Grok (and Claude when Task is skipped): after source
  edits — scope commit (code) → documenter → domain-updater → docs commit. Same
  order as Claude. Verify stamps before claiming done. Stop blocks on stale docs
  (Grok decision:block / Kimi exit 2). FORBIDDEN: skip, reverse order, touch-theatre.
---

# SVS finalize chain (do not skip)

Claude Code may auto-`Task` agents. **Kimi and Grok must run the agents** (spawn or
Read+execute). **Grok:** spawn `subagent_type: "documenter"` / `"domain-updater"`
(`capability_mode: all`, `reasoning_effort: "low"`) with a short prompt — the
native agent **is** the child. Do not paste the file. Skipping
documenter / domain-updater leaves the next session blind. Stop feeds the block reason back until fixed.

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
3. commit-manager steps → scope.ts commit (code) — never git add -A
4. documenter (Grok spawn_subagent OR Read agent md)
5. domain-updater (PREPEND ## Recent Changes + wisdom into domains/)
6. If docs dirty → scope.ts commit "docs: …" (or include in follow-up)
7. Only then claim done / allow Stop approve
```

```bash
npx tsx "$CLAUDE_PROJECT_DIR/.claude/hooks/scope.ts" status
npx tsx "$CLAUDE_PROJECT_DIR/.claude/hooks/scope.ts" commit "<type>: <summary>"
```

## Verify — do not trust the agent's own report

A spawned documenter/domain-updater can return "done" without writing. After step 5:

```bash
jq -r '.last_commit // "MISSING"' .claude/skills/codebase-knowledge/_index.json
git rev-parse --short HEAD
rg -m1 -A3 '^## Recent Changes' CLAUDE.md
npx tsx "$CLAUDE_PROJECT_DIR/.claude/hooks/scope.ts" status
```

If `_index.json` has no `last_commit`, that is a gap — not a green light. Domains +
today’s Recent Changes entry are the real proof.

Sanctioned order when the index gate compares to HEAD:

```
1. scope commit "<type>: <code>"     → C1
2. documenter stamps last_commit=C1
3. domain-updater → domains + CLAUDE Recent Changes
4. scope commit "docs: …"            → C2
```

After C2, stamp may still say C1 — expected. Do **not** hand-edit `last_commit` or
create a third stamp-only commit.

## How to run agents

### Grok (custom type + low effort — parent stays thin)

Prefer `subagent_type: "documenter"` / `"domain-updater"` so the Grok-native
agent is the child's system prompt (full tools via `capability_mode: all`).
A parent on `xhigh` otherwise hands that effort to every child.

```
spawn_subagent({
  subagent_type: "documenter",
  isolation: "none",
  capability_mode: "all",
  reasoning_effort: "low",
  description: "SVS documenter",
  prompt: "HEAD=… filesTouched=… what shipped=… Execute the agent. Return files written."
})
# Same pattern for domain-updater (sequential — do not resume_from / do not parallel writers)
# Parent verifies on disk (jq last_commit + rg Recent Changes)
```

If the type is unknown: `general-purpose` + `Read .grok/agents/<name>.md FIRST`.
If `reasoning_effort` is rejected: retry without that key. Tiny
`.grok/personas/<name>.toml` also pin `low` (no `instructions_file`).
Skip spawn for `scope.ts commit` (one parent shell). One finalize child at a time.
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
| Code commit + push without documenter | Domains / `_index.json` go stale |
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
