---
name: svs-finalize
version: 1.1.0
description: >
  Mandatory finalize chain for Kimi/Grok (and Claude when Task is skipped): after
  source edits, run documenter → domain-updater → CLAUDE.md Recent Changes →
  scoped commit. Use before claiming done, before Stop approve, or when
  stop-validator blocks on stale docs (Grok decision:block / Kimi exit 2 via
  svs-bridge). FORBIDDEN to skip after code changes. Grok: spawn_subagent
  documenter then domain-updater.
---

# SVS finalize chain (do not skip)

Claude Code may auto-`Task` agents. **Kimi and Grok must run the agents** (spawn or
Read+execute). Skipping documenter / domain-updater leaves the next session blind
(code shipped, zero domain/CLAUDE updates). Stop feeds the block reason back until fixed.

## When this is mandatory

Any session that touched **source** files (`.ts`, `.tsx`, `.js`, `.php`, `.py`, …)
via Edit/Write (recorded in `.claude/state/sessions/<id>.json#filesTouched`).

**Skip only when** the session changed only docs/CI/config with no product code.

## Ordered checklist (hard)

```
1. Quality / security as needed (tester, security-auditor)
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

## How to run agents

### Grok (preferred)

```
spawn_subagent(subagent_type="documenter", prompt="Map this session's edits → domains; update _index.json")
spawn_subagent(subagent_type="domain-updater", prompt="PREPEND CLAUDE.md Recent Changes; sync domains")
```

Fallback: Read `.grok/agents/<name>.md` and execute every step inline.

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

Fix: run this skill’s checklist, then re-Stop.

## FORBIDDEN

| Action | Why |
|--------|-----|
| Code commit + push without documenter | Domains / `_index.json` go stale |
| Skip domain-updater / Recent Changes | Next session loses “what changed” |
| `git add -A` / `git add .` | Bundles peer files |
| Claim “done” while Stop would block | Lies to the user |

## See also

- `svs-dev-process` — full Kimi/Grok workflow
- `docs-tracker` / `codebase-knowledge` — what documenter writes
- Agents `commit-manager`, `documenter`, `domain-updater`
