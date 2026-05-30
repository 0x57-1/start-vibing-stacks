---
name: multi-instance-coordination
version: 1.0.0
description: Coordination protocol when multiple Claude Code instances run in the same project folder. State layout under `.claude/state/`, peer detection, file-edit collision avoidance (hybrid block/warn), and the `/peers` CLI for cross-instance messaging. Use when the user mentions another Claude instance, parallel work, concurrent sessions, the word "peers", or asks about /resume titles, file-touches.jsonl, or `.claude/state/`.
---

# Multi-Instance Coordination

When two or more Claude Code instances are running in the same project folder, they auto-discover each other through `.claude/state/` and refuse to overwrite each other's uncommitted work.

## Mental model

```
.claude/state/
  sessions/<id>.json        registry  (heartbeat = lastSeenAt)
  sessions/_archive/        sessions ended or gone idle >30min
  inbox/<id>.jsonl          messages queued FOR that session
  file-touches.jsonl        append-only log of every Edit/Write
  file-touches/_archive/    rotated logs (every 1000 lines)
```

Every hook updates `lastSeenAt` (heartbeat). Thresholds:

| Age of last activity | State    | Effect                                                                 |
| -------------------- | -------- | ---------------------------------------------------------------------- |
| < 180s               | active   | Counts for collision detection; PreToolUse may BLOCK Edit/Write.       |
| 180s – 30min         | idle     | Surfaced as a warning; edits NOT blocked.                              |
| > 30min              | stale    | Auto-archived on the next sweep.                                       |
| > 24h                | removed  | Deleted entirely.                                                      |

## How a Claude session announces itself

1. `SessionStart` runs once. It registers the session, extracts a `title` from the transcript (this is the same title that appears in `claude --resume`), lists peers, and drains the inbox.
2. `UserPromptSubmit` keeps the heartbeat fresh on every user turn. It re-drains the inbox so messages arrive between turns, not stuck waiting for a SessionStart.
3. `PreToolUse` (matcher `Edit|Write|MultiEdit|NotebookEdit`) checks `file-touches.jsonl` against the target file BEFORE the edit runs.
4. `PostToolUse` (same matcher) records the touch AFTER a successful edit.
5. `Stop` / `SessionEnd` archives the session and clears its inbox.

## PreToolUse decision matrix

| Peer who touched the same file last | Peer's heartbeat | Touch age | Decision |
| ----------------------------------- | ---------------- | --------- | --------------------------------------------- |
| any                                 | active (<180s)   | < 5min    | **BLOCK** with a recovery hint                |
| any                                 | idle (180s–30min)| < 5min    | APPROVE + warning in `systemMessage`          |
| any                                 | stale or gone    | any       | APPROVE silently                              |
| no peer touched the file            | n/a              | n/a       | APPROVE silently                              |

Override path: wait until the active peer's heartbeat goes idle (180s of no activity), then retry — the hook will downgrade to a warning. If the user explicitly tells you to override, ask them to run `peers notify <id> "I'm taking over <file>"` first so the other instance gets the heads-up.

## Talking to a peer

Always use the `peers` CLI. NEVER write to `.claude/state/inbox/` by hand.

```bash
# See who is around
npx tsx "$CLAUDE_PROJECT_DIR/.claude/hooks/peers.ts" list

# Send a message (id-prefix is the 8-char short id from `list`)
npx tsx "$CLAUDE_PROJECT_DIR/.claude/hooks/peers.ts" notify a1b2c3d4 "I just committed auth changes"

# See recent file edits across instances
npx tsx "$CLAUDE_PROJECT_DIR/.claude/hooks/peers.ts" locks --minutes 10

# Cleanup zombie sessions (>1h idle)
npx tsx "$CLAUDE_PROJECT_DIR/.claude/hooks/peers.ts" cleanup
```

The `/peers` slash command wraps these.

## Guardrails

- The coordination layer is **single-host**. It does not replace `git pull` or PR review across machines.
- All state writes are atomic (`.tmp` + `rename`); reads are tolerant of corruption — hooks never block Claude on a broken state file.
- `.claude/state/` MUST stay gitignored. Committing it would leak per-host PIDs and transcript paths.
- `peers` is the user-facing surface; the hooks are internal plumbing. Do not invoke `_state.ts` directly.

## Failure modes (and what to do)

| Symptom                                                  | Cause                                | Fix                                                    |
| -------------------------------------------------------- | ------------------------------------ | ------------------------------------------------------ |
| `peers list` shows a phantom session                     | Crashed instance left a record       | `peers cleanup` (archives idle, removes >24h)          |
| Edit blocked but the other instance is gone              | Stale heartbeat, peer never archived | Wait 30min, or run `peers cleanup`                     |
| Inbox messages didn't arrive                             | Peer is paused / no `UserPromptSubmit` | They will appear on the next prompt the peer submits   |
| Two edits hit the same file in the same second           | Race condition (rare)                | The append-only log captures both; review with `git diff` |

## See Also

- `git-workflow` — branch and commit hygiene; the coordination layer is an in-flight collision shield, not a replacement for branches.
- `_state.ts` — shared TypeScript helpers used by every hook.
- `.claude/state/` README at `.claude/hooks/_state.README.md`.
