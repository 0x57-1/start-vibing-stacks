---
name: hook-development
version: 2.0.0
description: "Claude Code hook development for 2026. Covers all 9 supported events (UserPromptSubmit, PreToolUse, PostToolUse, Notification, Stop, SubagentStop, SessionStart, SessionEnd, PreCompact), stdin/stdout JSON contract, decision/continue/systemMessage outputs, matchers (tool patterns), exit-code semantics, cycle detection (stop_hook_active), settings.json registration, run-hook.sh dispatcher (bun → tsx → node fallback). Invoke when creating or modifying any .claude/hooks/* file or settings.json hook entry."
---

# Hook Development — Claude Code Hooks (2026)

**ALWAYS invoke when creating or modifying Claude Code hooks.**

> Hooks are user-controlled deterministic gates around the model. Anything you want **enforced**, not asked nicely — put in a hook. The agent cannot disable a hook from inside the conversation.

## 1. Supported events (Claude Code, 2026)

| Event | Fires | Common use |
|---|---|---|
| `SessionStart` | When a session begins (new chat or resume) | Inject onboarding context, restore state |
| `SessionEnd` | When a session ends cleanly | Flush logs, persist state, run cleanup |
| `UserPromptSubmit` | After user submits, before model receives | Inject workflow rules, block forbidden phrases |
| `PreToolUse` | Before any tool is invoked | Approve / block / rewrite tool calls (security gate) |
| `PostToolUse` | After tool completes | Log, validate output, react to specific tool results |
| `Notification` | When the agent is idle and notifies (e.g. waiting for input) | Desktop notifications, status forwarding |
| `Stop` | Before the agent ends its turn | Validate completion (clean tree, tests pass, docs updated) |
| `SubagentStop` | When a Task() subagent finishes | Validate subagent output, persist artifacts |
| `PreCompact` | Before transcript compaction is triggered | Snapshot/export full transcript first |

`Stop` and `Subagent` events are the most commonly customized. `PreToolUse` is the security workhorse.

## 2. File layout

```
.claude/
├── hooks/
│   ├── run-hook.sh           # Entry point: bun → tsx → node fallback
│   ├── session-start.ts
│   ├── session-end.ts
│   ├── user-prompt-submit.ts
│   ├── pre-tool-use.ts
│   ├── post-tool-use.ts
│   ├── stop-validator.ts
│   ├── subagent-stop.ts
│   ├── pre-compact.ts
│   └── lib/                  # shared helpers (cmd(), readStdin(), etc.)
└── settings.json             # registers hooks
```

## 3. Stdin contract (per event)

All hook input arrives as **a single JSON object on stdin**. Read with a timeout — never hang.

```typescript
// Common envelope (most events)
interface HookInput {
  session_id: string;
  cwd: string;
  transcript_path?: string;
  hook_event_name: string;        // e.g. "Stop"
}

interface UserPromptSubmitInput extends HookInput {
  user_prompt: string;
}

interface PreToolUseInput extends HookInput {
  tool_name: string;              // "Bash" | "Edit" | "Write" | ...
  tool_input: Record<string, unknown>;
}

interface PostToolUseInput extends PreToolUseInput {
  tool_response: unknown;
  tool_error?: string;
}

interface StopInput extends HookInput {
  stop_hook_active?: boolean;     // TRUE if a previous Stop hook already blocked — don't loop
}

interface SubagentStopInput extends StopInput {
  subagent_id: string;
}

interface PreCompactInput extends HookInput {
  trigger: "manual" | "auto";
}
```

## 4. Stdout contract (per event)

Output a **single JSON object on stdout**. Anything else (or invalid JSON) is treated as advisory only.

```typescript
// Universal fields
interface HookOutput {
  continue?: boolean;             // false = stop the agent now (Stop family)
  decision?: "approve" | "block"; // gate verdict
  reason?: string;                // shown to user / logged
  systemMessage?: string;         // injected as system message (UserPromptSubmit, SessionStart)
  hookSpecificOutput?: Record<string, unknown>;
}
```

PreToolUse — block / approve / rewrite a tool call:
```json
{ "decision": "approve", "reason": "Edit on src/ allowed" }
{ "decision": "block",   "reason": "Write outside src/ rejected" }
```

Stop — block prevents finalization until issues are fixed:
```json
{ "continue": true, "decision": "block", "reason": "Uncommitted files" }
```

SessionStart — inject context:
```json
{ "systemMessage": "ROUTINE: research → plan → implement → test → commit" }
```

## 5. Exit-code semantics

| Exit | Meaning |
|---|---|
| `0` | Success — JSON output applied if present |
| `2` | **Blocking** — message printed to stderr is shown to the user (alternative to `decision: "block"`) |
| anything else | Non-blocking error — logged, agent continues |

**Never** exit non-zero on a transient error (e.g. network) unless you intend to block. Hooks must be deterministic.

## 6. `settings.json` registration

```json
{
  "hooks": {
    "SessionStart": [
      {
        "hooks": [{
          "type": "command",
          "command": "bash \"$CLAUDE_PROJECT_DIR/.claude/hooks/run-hook.sh\" session-start",
          "timeout": 10
        }]
      }
    ],
    "UserPromptSubmit": [
      {
        "matcher": "",
        "hooks": [{
          "type": "command",
          "command": "bash \"$CLAUDE_PROJECT_DIR/.claude/hooks/run-hook.sh\" user-prompt-submit",
          "timeout": 10
        }]
      }
    ],
    "PreToolUse": [
      {
        "matcher": "Bash|Write|Edit",
        "hooks": [{
          "type": "command",
          "command": "bash \"$CLAUDE_PROJECT_DIR/.claude/hooks/run-hook.sh\" pre-tool-use",
          "timeout": 10
        }]
      }
    ],
    "Stop": [
      {
        "hooks": [{
          "type": "command",
          "command": "bash \"$CLAUDE_PROJECT_DIR/.claude/hooks/run-hook.sh\" stop-validator",
          "timeout": 30
        }]
      }
    ]
  }
}
```

`matcher` is a regex against `tool_name` (PreToolUse / PostToolUse) or empty for "all". Multiple entries per event are run in registration order.

## 7. `run-hook.sh` dispatcher

Survives whichever runtime the user has installed. Always-zero exit so hook errors don't kill the session.

```bash
#!/usr/bin/env bash
# .claude/hooks/run-hook.sh
set -uo pipefail
HOOK_NAME="${1:?missing hook name}"
HOOK_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HOOK_FILE="$HOOK_DIR/${HOOK_NAME}.ts"

[[ -f "$HOOK_FILE" ]] || { echo '{"continue":true}'; exit 0; }

if   command -v bun >/dev/null 2>&1; then bun  "$HOOK_FILE"
elif command -v tsx >/dev/null 2>&1; then tsx  "$HOOK_FILE"
elif command -v node >/dev/null 2>&1; then npx --yes tsx "$HOOK_FILE"
else echo '{"continue":true}'; exit 0
fi
```

## 8. Stop validator template (gate-aware, with cycle detection)

Use `execFileSync` (not `execSync` with shell strings) — passes args as an array, immune to shell injection.

```typescript
#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';

function git(...args: string[]): string {
  try { return execFileSync('git', args, { encoding: 'utf8' }).trim(); } catch { return ''; }
}

const input = JSON.parse(readFileSync(0, 'utf8'));      // stdin

// Cycle detection — if we already blocked once, approve to avoid infinite loop
if (input.stop_hook_active) {
  console.log(JSON.stringify({ continue: false, decision: 'approve' }));
  process.exit(0);
}

const dirty   = git('status', '--porcelain');
const issues: string[] = [];

if (dirty)                                                    issues.push(`GIT_TREE_NOT_CLEAN: ${dirty.split('\n').length} file(s)`);
if (existsSync('CLAUDE.md') &&
    !/^## (Last Change|Recent Changes)/m.test(readFileSync('CLAUDE.md', 'utf8'))) {
  // Accepts the legacy `## Last Change` (single, overwritten) OR `## Recent Changes`
  // (append-only LIFO, multi-instance safe — see claude-md-compactor §6.1).
  issues.push('CLAUDE_MD_NOT_UPDATED');
}

const result = issues.length === 0
  ? { continue: false, decision: 'approve', reason: 'All checks passed' }
  : { continue: true,  decision: 'block',   reason: issues.join(' | ') };

console.log(JSON.stringify(result));
process.exit(0);
```

## 9. Performance & safety rules

1. **Timeouts:** 10s for `UserPromptSubmit` / `PreToolUse` / `SessionStart`; 30s for `Stop` / `SubagentStop`.
2. **Always exit 0** unless intentionally blocking with exit 2 — non-zero kills the session.
3. **Read stdin with timeout** — `readFileSync(0, 'utf8')` is fine (it returns immediately when EOF).
4. **Output valid JSON** — invalid JSON is treated as advisory and silently dropped.
5. **Cycle detection** — check `stop_hook_active` in `Stop` / `SubagentStop`. Without this, a buggy hook can lock the agent in an infinite block-fix-block loop.
6. **No network calls** in hot-path hooks (`PreToolUse`, `UserPromptSubmit`) — they fire on every tool call / prompt.
7. **Idempotent** — hooks may be invoked twice (retries, restarts). Don't write to immutable state without a guard.
8. **Use `execFileSync`, never `execSync` with a shell string** — the latter is shell-injection-prone if any input ever flows in.

## 10. Common patterns

| Goal | Event | Pattern |
|---|---|---|
| "Inject the current routine on every prompt" | `UserPromptSubmit` | `{ continue: true, systemMessage: "ROUTINE: ..." }` |
| "Block writes outside `src/`" | `PreToolUse` | match `Write\|Edit`, inspect `tool_input.path`, `decision: "block"` if outside |
| "Run quality gate before finishing" | `Stop` | run typecheck/lint/tests, `decision: "block"` if any fail |
| "Persist subagent output to disk" | `SubagentStop` | parse `tool_response`, write to `.claude/subagent-outputs/{id}.json` |
| "Snapshot transcript before compaction" | `PreCompact` | copy `transcript_path` to `.claude/transcripts/{session_id}.jsonl` |

## FORBIDDEN

| Pattern | Why |
|---|---|
| `process.exit(1)` on transient error | Kills the session |
| Hook output not valid JSON | Dropped silently — no enforcement |
| Network call in `PreToolUse` | Adds latency to every tool call |
| Forgetting `stop_hook_active` check | Infinite block loop |
| Writing to `CLAUDE.md` from `Stop` hook | Triggers another `Stop` cycle |
| Hardcoded user paths (`~/Users/me/...`) | Won't run on other machines |
| Shell-string `execSync` for git/fs commands | Shell-injection surface |

## See Also

- `quality-gate` — the Stop validator's typical payload
- `git-workflow` — branch / dirty-tree checks
- `commit-manager` — pairs with Stop validator (validator detects, commit-manager fixes)
