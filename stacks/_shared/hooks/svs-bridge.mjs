#!/usr/bin/env node
// @sv-version: 1.1.0
/**
 * SVS hook bridge — normalize Kimi/Grok stdin → Claude hook shape, translate stdout.
 *
 * Usage (cwd = project root):
 *   node .claude/hooks/svs-bridge.mjs <kimi|grok> <hook-base>
 *
 * hook-base: session-start | user-prompt-submit | pre-tool-use | plan-gate |
 *            post-tool-use | stop-validator | pre-compact
 *
 * Sets SVS_TARGET=kimi|grok for brain journal / SessionRecord tagging.
 * Fail-open: any bridge/hook crash exits 0 (allow).
 */

import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const TOOL_ALIASES = {
  run_terminal_command: 'Bash',
  run_terminal_cmd: 'Bash',
  shell: 'Bash',
  bash: 'Bash',
  read_file: 'Read',
  read: 'Read',
  search_replace: 'Edit',
  strreplace: 'Edit',
  strreplacefile: 'Edit',
  write_file: 'Write',
  writefile: 'Write',
  write: 'Write',
  edit: 'Edit',
  multiedit: 'MultiEdit',
  multi_edit: 'MultiEdit',
  notebookedit: 'NotebookEdit',
  edit_notebook: 'NotebookEdit',
};

const EVENT_ALIASES = {
  pre_tool_use: 'PreToolUse',
  post_tool_use: 'PostToolUse',
  post_tool_use_failure: 'PostToolUseFailure',
  user_prompt_submit: 'UserPromptSubmit',
  session_start: 'SessionStart',
  session_end: 'SessionEnd',
  stop: 'Stop',
  stop_failure: 'StopFailure',
  notification: 'Notification',
  subagent_start: 'SubagentStart',
  subagent_stop: 'SubagentStop',
  pre_compact: 'PreCompact',
  post_compact: 'PostCompact',
};

function readStdin() {
  return new Promise((resolve) => {
    let data = '';
    const t = setTimeout(() => {
      try {
        process.stdin.destroy();
      } catch {
        /* ignore */
      }
      resolve(data || '{}');
    }, 2000);
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (c) => {
      data += c;
    });
    process.stdin.on('end', () => {
      clearTimeout(t);
      resolve(data || '{}');
    });
    process.stdin.on('error', () => {
      clearTimeout(t);
      resolve(data || '{}');
    });
    if (process.stdin.readableEnded) {
      clearTimeout(t);
      resolve(data || '{}');
    }
  });
}

function normalizeToolName(name) {
  if (!name || typeof name !== 'string') return '';
  const mapped = TOOL_ALIASES[name] || TOOL_ALIASES[name.toLowerCase()];
  if (mapped) return mapped;
  // Already Claude-style (Edit, Write, Bash, …)
  if (/^[A-Z]/.test(name)) return name;
  return name;
}

function normalizeEventName(name) {
  if (!name || typeof name !== 'string') return '';
  if (EVENT_ALIASES[name]) return EVENT_ALIASES[name];
  if (EVENT_ALIASES[name.toLowerCase()]) return EVENT_ALIASES[name.toLowerCase()];
  // PascalCase already
  if (/^[A-Z]/.test(name)) return name;
  return name;
}

function normalizeToolInput(input) {
  if (!input || typeof input !== 'object') return input || {};
  const out = { ...input };
  if (!out.file_path && (out.path || out.target_file || out.filePath || out.targetFile)) {
    out.file_path = out.path || out.target_file || out.filePath || out.targetFile;
  }
  if (!out.notebook_path && (out.target_notebook || out.notebookPath)) {
    out.notebook_path = out.target_notebook || out.notebookPath;
  }
  return out;
}

function toClaudePayload(raw, forcedEvent) {
  const toolName = normalizeToolName(raw.tool_name || raw.toolName || '');
  const event =
    normalizeEventName(raw.hook_event_name || raw.hookEventName || '') || forcedEvent || '';
  const cwd = raw.cwd || raw.workspaceRoot || raw.workspace_root || process.cwd();
  return {
    ...raw,
    session_id: raw.session_id || raw.sessionId || '',
    sessionId: raw.session_id || raw.sessionId || '',
    cwd,
    hook_event_name: event,
    hookEventName: event,
    tool_name: toolName,
    toolName,
    tool_input: normalizeToolInput(raw.tool_input || raw.toolInput || {}),
    toolInput: normalizeToolInput(raw.tool_input || raw.toolInput || {}),
    transcript_path: raw.transcript_path || raw.transcriptPath,
    prompt: raw.prompt || raw.user_prompt || raw.userPrompt,
    stop_hook_active: raw.stop_hook_active ?? raw.stopHookActive,
    source: raw.source,
  };
}

function parseHookJson(stdout) {
  const text = (stdout || '').trim();
  if (!text) return null;
  // Prefer last JSON object on stdout (hooks may print logs)
  const lines = text.split(/\n/).filter(Boolean);
  for (let i = lines.length - 1; i >= 0; i--) {
    try {
      return JSON.parse(lines[i]);
    } catch {
      /* try whole */
    }
  }
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function isBlock(result) {
  if (!result || typeof result !== 'object') return false;
  if (result.decision === 'block' || result.decision === 'deny') return true;
  const hso = result.hookSpecificOutput;
  if (hso && (hso.permissionDecision === 'deny' || hso.permissionDecision === 'block')) {
    return true;
  }
  return false;
}

function blockReason(result) {
  if (!result) return 'Blocked by SVS hook';
  return (
    result.reason ||
    result.permissionDecisionReason ||
    result.hookSpecificOutput?.permissionDecisionReason ||
    result.systemMessage ||
    'Blocked by SVS hook'
  );
}

function emitForTarget(target, result, eventName) {
  const event = normalizeEventName(eventName) || '';

  if (target === 'grok') {
    if (event === 'PreToolUse') {
      if (isBlock(result)) {
        process.stdout.write(
          JSON.stringify({ decision: 'deny', reason: blockReason(result) }) + '\n'
        );
        process.exit(2);
      }
      process.stdout.write(JSON.stringify({ decision: 'allow' }) + '\n');
      process.exit(0);
    }
    // Stop / others: Claude-compatible (decision block|approve)
    if (result) {
      process.stdout.write(JSON.stringify(result) + '\n');
    }
    process.exit(0);
  }

  // kimi
  if (event === 'PreToolUse' || event === 'Stop' || event === 'UserPromptSubmit') {
    if (isBlock(result)) {
      const reason = blockReason(result);
      process.stderr.write(reason + '\n');
      // Also emit Claude-style JSON (Kimi accepts hookSpecificOutput)
      process.stdout.write(
        JSON.stringify({
          hookSpecificOutput: {
            permissionDecision: 'deny',
            permissionDecisionReason: reason,
          },
        }) + '\n'
      );
      process.exit(2);
    }
  }

  if (result) {
    // Surface context appends (UserPromptSubmit / systemMessage)
    if (typeof result.systemMessage === 'string' && result.systemMessage && !result.decision) {
      process.stdout.write(result.systemMessage + '\n');
    } else {
      process.stdout.write(JSON.stringify(result) + '\n');
    }
  }
  process.exit(0);
}

async function main() {
  const target = (process.argv[2] || '').toLowerCase();
  const hookBase = process.argv[3] || '';
  if (!['kimi', 'grok'].includes(target) || !hookBase) {
    process.stderr.write('Usage: svs-bridge.mjs <kimi|grok> <hook-base>\n');
    process.exit(0);
  }

  const projectDir = process.env.CLAUDE_PROJECT_DIR || process.env.GROK_WORKSPACE_ROOT || process.cwd();
  process.env.CLAUDE_PROJECT_DIR = projectDir;

  const hookPath = join(__dirname, `${hookBase}.ts`);
  if (!existsSync(hookPath)) {
    // Fail-open if project missing this hook
    if (target === 'grok' && /pre-tool-use/i.test(hookBase)) {
      process.stdout.write(JSON.stringify({ decision: 'allow' }) + '\n');
    }
    process.exit(0);
  }

  const stdinRaw = await readStdin();
  let raw = {};
  try {
    raw = JSON.parse(stdinRaw || '{}');
  } catch {
    raw = {};
  }

  const forcedEvent =
    {
      'session-start': 'SessionStart',
      'user-prompt-submit': 'UserPromptSubmit',
      'pre-tool-use': 'PreToolUse',
      'plan-gate': 'PreToolUse',
      'post-tool-use': 'PostToolUse',
      'pre-compact': 'PreCompact',
      'stop-validator': raw.hook_event_name || raw.hookEventName || 'Stop',
    }[hookBase] || '';

  const payload = toClaudePayload(raw, forcedEvent);
  payload.svs_target = target;
  // stop-validator uses SessionEnd when that event fires
  if (hookBase === 'stop-validator') {
    const ev = normalizeEventName(raw.hook_event_name || raw.hookEventName || '');
    if (ev === 'SessionEnd') {
      payload.hook_event_name = 'SessionEnd';
      payload.hookEventName = 'SessionEnd';
    } else if (!payload.hook_event_name) {
      payload.hook_event_name = 'Stop';
      payload.hookEventName = 'Stop';
    }
  }

  const input = JSON.stringify(payload);
  const result = spawnSync('npx', ['tsx', hookPath], {
    cwd: projectDir,
    env: { ...process.env, CLAUDE_PROJECT_DIR: projectDir, SVS_TARGET: target },
    input,
    encoding: 'utf8',
    timeout: 55_000,
    maxBuffer: 4 * 1024 * 1024,
  });

  if (result.error || (result.status !== 0 && result.status !== null && !result.stdout)) {
    // Fail-open
    if (target === 'grok' && payload.hook_event_name === 'PreToolUse') {
      process.stdout.write(JSON.stringify({ decision: 'allow' }) + '\n');
    }
    process.exit(0);
  }

  const parsed = parseHookJson(result.stdout);
  emitForTarget(target, parsed, payload.hook_event_name);
}

main().catch(() => process.exit(0));
