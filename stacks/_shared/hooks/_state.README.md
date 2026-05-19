# `.claude/state/` — Multi-Instance Coordination

> This directory is **gitignored** and managed automatically by hooks. Safe to delete; it will be recreated by the next Claude session.

When two or more Claude Code instances run in the same project folder, the hooks under `.claude/hooks/` use this directory to:

1. announce themselves to each other (`sessions/<id>.json`)
2. record file edits as they happen (`file-touches.jsonl`)
3. prevent simultaneous writes to the same file (PreToolUse hook reads the touch log)
4. exchange messages (`inbox/<id>.jsonl` — drained at next prompt)

## Layout

```
.claude/state/
  sessions/
    <session-id>.json          one record per active instance (heartbeat-tracked)
    _archive/                  sessions ended or stale (>30min idle)
  inbox/
    <session-id>.jsonl         queued messages for that session
  file-touches.jsonl           append-only Edit/Write log (rotates every 1000 lines)
  file-touches/_archive/       rotated logs
```

## Heartbeat thresholds

| Last activity | State    | Effect                                                                      |
| ------------- | -------- | --------------------------------------------------------------------------- |
| < 60s         | active   | Counts for collision detection. PreToolUse may **block** Edit/Write.        |
| 60s – 30min   | idle     | Surfaced as a warning in `systemMessage`. Edits are **not** blocked.        |
| > 30min       | stale    | Auto-archived on the next sweep.                                            |
| > 24h         | removed  | Deleted entirely.                                                           |

## Viewing peers

From inside Claude or a terminal:

```
/peers
```

or directly:

```
npx tsx .claude/hooks/peers.ts list
npx tsx .claude/hooks/peers.ts notify <id-prefix> "message"
npx tsx .claude/hooks/peers.ts locks --minutes 10
npx tsx .claude/hooks/peers.ts cleanup
```

## Safety

- All state writes are atomic (`.tmp` + `rename`).
- All reads are tolerant of corruption — hooks never block Claude on a malformed file.
- This is a single-host coordination layer. It does **not** replace git; it only prevents two live sessions from stepping on the same uncommitted edit.
