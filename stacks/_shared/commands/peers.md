---
name: peers
description: Inspect or talk to other Claude Code instances running in this same project (multi-instance coordination layer).
version: 1.0.0
---

# /peers — Multi-Instance Coordination

Use this when the user asks something like:

- "is there another Claude running in this folder?"
- "tell the other instance I finished the auth work"
- "who touched `src/x.ts` recently?"
- "clean up dead sessions"

Run the `peers` CLI via Bash. The script lives at `.claude/hooks/peers.ts` and is installed by `start-vibing-stacks`.

## Usage

| Goal | Command |
|---|---|
| List active + idle peer sessions | `npx tsx "$CLAUDE_PROJECT_DIR/.claude/hooks/peers.ts" list` |
| Notify another instance | `npx tsx "$CLAUDE_PROJECT_DIR/.claude/hooks/peers.ts" notify <id-prefix> "message"` |
| See who touched what file recently | `npx tsx "$CLAUDE_PROJECT_DIR/.claude/hooks/peers.ts" locks --minutes 10` |
| Remove stale sessions | `npx tsx "$CLAUDE_PROJECT_DIR/.claude/hooks/peers.ts" cleanup` |

The `<id-prefix>` is the 8-character short id printed by `peers list`, or any substring of the peer's title.

## Output rules

- Always quote the short id (first 8 chars), the title, and the idle time when reporting peers to the user.
- If `peers notify` succeeds, tell the user the message will surface in the OTHER instance at the start of its next prompt (drained by `user-prompt-submit.ts`).
- If `peers list` says "No peer sessions", confirm that to the user and DO NOT suggest workarounds.

## Background

State lives in `.claude/state/` (gitignored). Hooks `session-start.ts`, `user-prompt-submit.ts`, `pre-tool-use.ts`, `post-tool-use.ts` and `stop-validator.ts` keep it in sync. See `multi-instance-coordination` skill for the full protocol.
