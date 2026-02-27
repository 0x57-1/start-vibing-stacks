# Hook Development — Claude Code Hooks

**ALWAYS invoke when creating or modifying Claude Code hooks.**

## Hook Types

| Event | When | Use Case |
|-------|------|----------|
| `UserPromptSubmit` | Before prompt is sent | Inject workflow, validate input |
| `Stop` | Before task completion | Validate state, block if dirty |
| `PreToolUse` | Before tool execution | Approve/block dangerous tools |
| `PostToolUse` | After tool execution | Log, validate output |

## File Structure

```
.claude/hooks/
├── run-hook.sh              # Entry point (bash → bun/tsx fallback)
├── user-prompt-submit.ts    # Prompt injection
└── stop-validator.ts        # Task completion gate
```

## Hook Input (stdin JSON)

```typescript
// UserPromptSubmit
interface PromptInput {
  user_prompt: string;
  session_id: string;
}

// Stop
interface StopInput {
  stop_hook_active?: boolean;  // Cycle detection
  transcript?: string;
}
```

## Hook Output (stdout JSON)

```typescript
// UserPromptSubmit — inject system message
{ "continue": true, "systemMessage": "WORKFLOW: ..." }

// Stop — approve or block
{ "continue": false, "decision": "approve", "reason": "All checks passed" }
{ "continue": true, "decision": "block", "reason": "Uncommitted files" }
```

## Template: Stop Validator

```typescript
#!/usr/bin/env node
import { execSync } from 'child_process';

function cmd(c: string): string {
  try { return execSync(c, { encoding: 'utf8' }).trim(); } catch { return ''; }
}

const branch = cmd('git rev-parse --abbrev-ref HEAD');
const dirty = cmd('git status --porcelain');

const result = (!dirty && (branch === 'main' || branch === 'master'))
  ? { continue: false, decision: 'approve', reason: 'Clean main branch' }
  : { continue: true, decision: 'block', reason: `Branch: ${branch}, dirty: ${!!dirty}` };

console.log(JSON.stringify(result));
```

## settings.json Registration

```json
{
  "hooks": {
    "Stop": [{ "hooks": [{ "type": "command", "command": "bash .claude/hooks/run-hook.sh stop-validator", "timeout": 30 }] }],
    "UserPromptSubmit": [{ "matcher": "", "hooks": [{ "type": "command", "command": "bash .claude/hooks/run-hook.sh user-prompt-submit", "timeout": 10 }] }]
  }
}
```

## Rules

1. **Always use `run-hook.sh` as entry** — handles bun/tsx fallback
2. **Read stdin with timeout** — hooks must not hang
3. **Exit 0 always** — non-zero kills the session
4. **Output valid JSON to stdout** — Claude Code parses it
5. **Cycle detection** — check `stop_hook_active` flag in Stop hooks
6. **Keep hooks fast** — timeout applies (10s for prompt, 30s for stop)
