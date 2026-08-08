---
name: svs-peers
description: >
  SVS multi-instance bus — list/notify/locks/cleanup for Claude·Kimi·Grok sharing
  a project via .claude/state/. Not Claude Code's native /peers (ListAgents/SendMessage).
version: 1.0.0
---

# /svs-peers — SVS Multi-Instance Bus

> **Name collision:** Claude Code ≥ **2.1.224** ships native `/peers` (= `/list-agents`) for
> cross-session `SendMessage`. This command is **`/svs-peers`** — the Start Vibing Stacks
> file-lock + inbox bus (Claude **and** Kimi/Grok). See memory `claude-cross-session-messaging`.

Use when the user asks:

- "is there another Claude / Kimi / Grok in this folder?"
- "who touched `src/x.ts`?"
- "tell the other instance I finished auth" (**Kimi/Grok**, or Claude when you need the SVS inbox)
- "clean up dead sessions"

For **Claude ↔ Claude text mid-turn**, prefer native messaging (`ListAgents` / `SendMessage` / `/list-agents`).

## Usage

Run via Bash:

| Goal | Command |
|------|---------|
| List active + idle sessions | `npx tsx "$CLAUDE_PROJECT_DIR/.claude/hooks/peers.ts" list` |
| Notify (SVS inbox → next prompt) | `npx tsx "$CLAUDE_PROJECT_DIR/.claude/hooks/peers.ts" notify <id-prefix> "message"` |
| Recent file touches | `npx tsx "$CLAUDE_PROJECT_DIR/.claude/hooks/peers.ts" locks --minutes 10` |
| Remove stale sessions | `npx tsx "$CLAUDE_PROJECT_DIR/.claude/hooks/peers.ts" cleanup` |

`<id-prefix>` = 8-char short id from `list`, or a title substring.

## Output rules

- Quote short id, title, idle time, and `target` (claude/kimi/grok) when reporting.
- After `notify`: message surfaces on the **other** instance at its next UserPromptSubmit (not mid-tool like native SendMessage).
- If `list` says "No peer sessions", confirm that — do not invent workarounds.

## Background

State: `.claude/state/` (gitignored). Skill: `multi-instance-coordination`. Memory: `claude-cross-session-messaging`.
