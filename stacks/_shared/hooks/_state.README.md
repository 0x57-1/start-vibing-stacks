---
version: 1.4.0
---

# `.claude/state/` — Multi-Instance Coordination

> This directory is **gitignored** and managed automatically by hooks. Safe to delete; it will be recreated by the next Claude / Kimi / Grok session (via SVS hooks).

**Claude Code ≥ 2.1.224** also has **native** cross-session messaging (`ListAgents` / `SendMessage`; slash `/list-agents` or Claude’s `/peers`). That is separate from this bus. SVS slash command: **`/svs-peers`**. See memory `claude-cross-session-messaging`.

When two or more agent CLIs run in the same project folder, the hooks under `.claude/hooks/` use this directory to:

1. announce themselves to each other (`sessions/<id>.json`) — **Claude, Kimi, and Grok**
2. record file edits as they happen (`file-touches.jsonl`)
3. prevent simultaneous writes to the same file (PreToolUse hook reads the touch log)
4. exchange messages (`inbox/<id>.jsonl` — drained at next prompt; slower than native SendMessage)

## Layout

```
.claude/state/
  sessions/
    <session-id>.json          one record per active instance (heartbeat-tracked)
    _archive/                  SessionEnd or stale (>30min idle)
  inbox/
    <session-id>.jsonl         queued messages for that session
  file-touches.jsonl           append-only Edit/Write log (rotates every 1000 lines)
  file-touches/_archive/       rotated logs
```

### Session JSON (all targets)

Written on **SessionStart** (and refreshed on UserPromptSubmit / tool hooks):

| Field | Notes |
|-------|--------|
| `sessionId` | Claude UUID, Kimi `session_<uuid>`, or Grok UUID |
| `target` | `claude` \| `kimi` \| `grok` (from `SVS_TARGET` / bridge) |
| `nativeSessionDir` | Kimi `~/.kimi-code/sessions/…` or Grok `~/.grok/sessions/…` |
| `transcriptPath` | Claude JSONL, Kimi `wire.jsonl`, or Grok `updates.jsonl` when found |
| `title`, `cwd`, `gitBranch`, `filesTouched`, heartbeats | same for all |

**Archive:** `SessionEnd` hook moves the file to `sessions/_archive/` (no quality validate on teardown). Idle sweep also archives after 30 minutes.

Kimi/Grok join via `svs-bridge.mjs` + hooks export (`migrate --apply`). There is **no** `.kimi/state` or `.grok/state`.

## Heartbeat thresholds

| Last activity | State    | Effect                                                                      |
| ------------- | -------- | --------------------------------------------------------------------------- |
| < 180s        | active   | Counts for collision detection. PreToolUse may **block** Edit/Write.        |
| 180s – 30min  | idle     | Surfaced as a warning in `systemMessage`. Edits are **not** blocked.        |
| > 30min       | stale    | Auto-archived on the next sweep.                                            |
| > 24h         | removed  | Deleted entirely.                                                           |

## Viewing peers (SVS bus)

```
/svs-peers
```

or:

```
npx tsx .claude/hooks/peers.ts list
npx tsx .claude/hooks/peers.ts notify <id-prefix> "message"
npx tsx .claude/hooks/peers.ts locks --minutes 10
npx tsx .claude/hooks/peers.ts cleanup
```

Claude↔Claude mid-turn text: native `/list-agents` + `SendMessage` (not this inbox).

## Safety

- All state writes are atomic (`.tmp` + `rename`).
- All reads are tolerant of corruption — hooks never block on a malformed file.
- This is a single-host coordination layer. It does **not** replace git; it only prevents two live sessions from stepping on the same uncommitted edit.
