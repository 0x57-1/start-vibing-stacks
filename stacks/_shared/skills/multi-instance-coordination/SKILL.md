---
name: multi-instance-coordination
version: 1.4.0
description: >
  Coordination when multiple Claude / Kimi / Grok sessions share a project folder.
  Shared bus under `.claude/state/`, peer detection, file-edit collision avoidance,
  `/svs-peers` CLI. Same cwd = one git HEAD — stay on main for ship/deploy (memory
  multi-instance-main-only); use worktrees for parallel feature branches. Claude Code
  ≥2.1.224 also has native cross-session messaging (ListAgents/SendMessage; native
  /peers) — use that for Claude↔Claude text; SVS for locks + Kimi/Grok. Memory:
  claude-cross-session-messaging.
---

# Multi-Instance Coordination

When two or more agent sessions (Claude Code, Kimi, or Grok via SVS bridge) share a
project folder, they auto-discover each other through **one** bus — `.claude/state/` —
and refuse to overwrite each other's uncommitted work. There is no separate
`.kimi/state` or `.grok/state`; migrate wires hooks into that shared tree.

## Shared cwd = one git HEAD (critical)

File locks do **not** isolate branches. `git checkout -b` in Session A moves Session B
onto that branch. **Default:** stay on `main`, scoped commits, push/deploy from main
only (memory `multi-instance-main-only`). `scope --push` refuses non-main.

Need divergent long-lived branches? **`git worktree add`** so each session has its own cwd/HEAD.

## Claude native messaging (v2.1.224+) vs this bus

| Need | Prefer |
|------|--------|
| Claude ↔ Claude text mid-task | Native `ListAgents` / `SendMessage` (`/list-agents` or Claude’s `/peers`) |
| File Edit/Write collision shield | **This skill** (PreToolUse + `file-touches.jsonl`) |
| Notify **Kimi** or **Grok** | **`/svs-peers`** → `peers.ts notify` |
| List SVS heartbeats (all targets) | `peers.ts list` |

**Slash name:** SVS command is **`/svs-peers`**. Do **not** install a project command named `/peers` — it shadows Claude’s native alias.

Full matrix: memory `claude-cross-session-messaging`.

## Mental model

```
.claude/state/
  sessions/<id>.json        registry  (heartbeat = lastSeenAt)
  sessions/_archive/        sessions ended or gone idle >30min
  inbox/<id>.jsonl          messages queued FOR that session (SVS notify)
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

## How a session announces itself

1. `SessionStart` registers the session, extracts a `title` when `transcript_path` is present (Claude `/resume` titles), lists peers, drains inbox.
2. `UserPromptSubmit` heartbeats each user turn and re-drains the inbox.
3. `PreToolUse` (edit tools) checks `file-touches.jsonl` before Edit/Write.
4. `PostToolUse` records the touch after a successful edit.
5. `Stop` / `SessionEnd` archives the session and clears its inbox.

Kimi and Grok reach the same hooks through `svs-bridge.mjs` (project `.kimi-code` / `.grok/hooks`). Keep user `compat.claude.hooks=false` on Grok so hooks do not double-fire.

## PreToolUse decision matrix

| Peer who touched the same file last | Peer's heartbeat | Touch age | Decision |
| ----------------------------------- | ---------------- | --------- | --------------------------------------------- |
| any                                 | active (<180s)   | < 5min    | **BLOCK** with a recovery hint                |
| any                                 | idle (180s–30min)| < 5min    | APPROVE + warning in `systemMessage`          |
| any                                 | stale or gone    | any       | APPROVE silently                              |
| no peer touched the file            | n/a              | n/a       | APPROVE silently                              |

Override path: wait until the active peer's heartbeat goes idle (180s of no activity), then retry — the hook will downgrade to a warning. If the user explicitly tells you to override, ask them to run `peers.ts notify <id> "I'm taking over <file>"` first (or native SendMessage if the peer is Claude-only and mid-turn delivery matters).

## Committing under multi-instance (`scope.ts`)

Edits are shielded by PreToolUse; **commits** need `scope.ts` (see `git-workflow` §0).

```bash
npx tsx "$CLAUDE_PROJECT_DIR/.claude/hooks/scope.ts" status
npx tsx "$CLAUDE_PROJECT_DIR/.claude/hooks/scope.ts" commit "<type>: <subject>"
```

With ≥2 active sessions and no `$CLAUDE_SESSION_ID`, `scope` **exits 1** — fix with
`--session`, never `git add -A`. Prefer `commit` over `stage` (atomic path).

## Verify the bridge fires (Kimi / Grok)

Hooks are **fail-open**: a broken bridge produces no block and no bus entry.

```bash
ls -l .claude/hooks/svs-bridge.mjs
rg -n 'svs-bridge' .grok/hooks/svs.json .kimi-code/local.toml ~/.kimi-code/config.toml
# must NOT contain ../../
echo '{"session_id":"smoke","cwd":"'$PWD'","hook_event_name":"SessionStart"}' \
  | node .claude/hooks/svs-bridge.mjs grok session-start; echo "exit=$?"
```

Correct form: `node .claude/hooks/svs-bridge.mjs <kimi|grok> <hook>`. Grok needs
`/hooks-trust` and user `compat.claude.hooks=false`.

## Talking to a peer (SVS bus)

Always use the `peers.ts` CLI for the SVS inbox. NEVER write to `.claude/state/inbox/` by hand.
Slash wrapper: **`/svs-peers`**.

```bash
npx tsx "$CLAUDE_PROJECT_DIR/.claude/hooks/peers.ts" list
npx tsx "$CLAUDE_PROJECT_DIR/.claude/hooks/peers.ts" notify a1b2c3d4 "I just committed auth changes"
npx tsx "$CLAUDE_PROJECT_DIR/.claude/hooks/peers.ts" locks --minutes 10
npx tsx "$CLAUDE_PROJECT_DIR/.claude/hooks/peers.ts" cleanup
```

Claude↔Claude findings: prefer native SendMessage when available (memory `claude-cross-session-messaging`).

## Guardrails

- The coordination layer is **single-host**. It does not replace `git pull` or PR review across machines.
- All state writes are atomic (`.tmp` + `rename`); reads are tolerant of corruption — hooks never block Claude on a broken state file.
- `.claude/state/` MUST stay gitignored. Committing it would leak per-host PIDs and transcript paths.
- `/svs-peers` is the SVS user-facing surface; hooks are internal plumbing. Do not invoke `_state.ts` directly.

## Failure modes (and what to do)

| Symptom                                                  | Cause                                | Fix                                                    |
| -------------------------------------------------------- | ------------------------------------ | ------------------------------------------------------ |
| `peers list` shows a phantom session                     | Crashed instance left a record       | `peers cleanup` (archives idle, removes >24h)          |
| Edit blocked but the other instance is gone              | Stale heartbeat, peer never archived | Wait 30min, or run `peers cleanup`                     |
| SVS inbox messages didn't arrive                         | Peer paused / no UserPromptSubmit    | Appear on the next prompt the peer submits             |
| Native SendMessage didn't arrive                         | Inbound hold/refuse / no socket      | Check `/list-agents`, `crossSessionInbound`, Claude version ≥2.1.224 |
| Project `/peers` overrides Claude native                 | Stale `commands/peers.md`            | `migrate --apply` removes it; use `/svs-peers`         |
| Stop never blocks after source edits | Bridge path wrong / not trusted → fail-open | Bridge smoke-test above; `migrate --apply`; Grok `/hooks-trust` |
| `scope` exits 1 | ≥2 sessions, no session id | `peers list` → `scope commit --session <id>` |
| `scope --push` exits 2 on feature branch | Main-only ship gate | `git checkout main` then push; or `--allow-non-main-push` |
| Empty `.claude/state/sessions/` while a peer is working | Their bridge fail-open | Smoke-test their side; do not conclude "no peers" |
| Peer deploy hit my feature branch | Shared cwd one HEAD | Memory `multi-instance-main-only`; stay on main or use worktree |

## See Also

- Memory: `claude-cross-session-messaging`, `multi-instance-main-only`
- Command: `/svs-peers`
- `session-history` — find Claude / Kimi / Grok transcripts and resume past chats.
- `git-workflow` §0 — scoped commit; same-cwd multi-instance → prefer main; worktrees for parallel branches.
- `svs-finalize` — documenter → domain-updater after code commits.
- `_state.ts` — shared TypeScript helpers used by every hook.
- `.claude/state/` README at `.claude/hooks/_state.README.md`.
