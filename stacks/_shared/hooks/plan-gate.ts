#!/usr/bin/env node
// @sv-version: 1.1.0
/**
 * PreToolUse Hook — Plan Gate (high-reasoning nudge)
 *
 * Wired with matcher `Edit|Write|MultiEdit|NotebookEdit`, alongside pre-tool-use.ts.
 * When a SINGLE session is about to touch MORE THAN the threshold (default 4)
 * DISTINCT **in-project** files, it fires ONCE per session: returns
 * `permissionDecision: "ask"` so Claude Code prompts the USER, recommending they
 * cancel, run `/effort` and select `ultracode`, then confirm a short plan before
 * the large change proceeds.
 *
 * v1.1.0: count only project-relative paths (scratchpads under /tmp/claude-* and
 * ~/.claude edits no longer inflate the distinct-file counter).
 *
 * WHY ONLY A RECOMMENDATION (hard limitation, confirmed in the hooks docs):
 *   "Command hooks communicate through stdout, stderr, and exit codes only. They
 *    cannot trigger `/` commands or tool calls."
 *   Effort level (`ultracode`) is also read-only metadata to hooks and is not
 *   persistable in settings.json. So switching to ultracode is necessarily a user
 *   keystroke — this hook just makes the moment impossible to miss. The
 *   `permissions.defaultMode: "plan"` setting handles the "plan first" half.
 *
 * Distinct-file count = union(session.filesTouched, files this Edit will touch).
 * The one-shot marker (`SessionRecord.planGateNotifiedAt`) prevents re-prompting on
 * every subsequent edit in the same large task.
 *
 * Config (env):
 *   PLAN_GATE_DISABLED=1        — turn the gate off entirely
 *   PLAN_GATE_THRESHOLD=<n>     — fire when distinct files exceed <n> (default 4)
 *
 * Hook input:
 *   { session_id, tool_name, tool_input, hook_event_name, ... }
 *
 * Output schema (JSON):
 *   { continue: true, hookSpecificOutput?: { hookEventName, permissionDecision, permissionDecisionReason } }
 *
 * Fail-open: any error → approve silently. A nudge must NEVER break editing.
 */

import {
  extractTargetFiles,
  filterProjectPaths,
  getProjectDir,
  getStateDir,
  nowIso,
  readSession,
  readStdinJson,
  writeSession,
} from './_state.js';

const DEFAULT_THRESHOLD = 4;

function approve(): void {
  console.log(JSON.stringify({ continue: true }));
}

function parseThreshold(raw: string | undefined): number {
  if (!raw) return DEFAULT_THRESHOLD;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n >= 1 ? n : DEFAULT_THRESHOLD;
}

async function main(): Promise<void> {
  if (process.env['PLAN_GATE_DISABLED'] === '1') {
    approve();
    return;
  }

  const input = await readStdinJson(1500);
  const sessionId: string | undefined = input.session_id || input.sessionId;
  const toolName: string = input.tool_name || input.toolName || '';
  const toolInput: any = input.tool_input || input.toolInput || {};

  if (!/^(Edit|Write|MultiEdit|NotebookEdit)$/.test(toolName)) {
    approve();
    return;
  }

  // Without a session we can neither count distinct files reliably nor record the
  // one-shot marker — stay out of the way.
  if (!sessionId) {
    approve();
    return;
  }

  const projectDir = getProjectDir();
  const stateDir = getStateDir(projectDir);
  const session = readSession(stateDir, sessionId);

  // session-start.ts hasn't registered yet (or state is unavailable): do nothing.
  if (!session) {
    approve();
    return;
  }

  // Already nudged this session — never nag again.
  if (session.planGateNotifiedAt) {
    approve();
    return;
  }

  const threshold = parseThreshold(process.env['PLAN_GATE_THRESHOLD']);
  const distinct = new Set(filterProjectPaths(session.filesTouched, projectDir));
  for (const f of extractTargetFiles(toolName, toolInput, projectDir)) distinct.add(f);

  if (distinct.size <= threshold) {
    approve();
    return;
  }

  // Fire once: set the marker BEFORE returning so it never re-prompts regardless
  // of whether the user approves or cancels this particular edit.
  try {
    writeSession(stateDir, { ...session, planGateNotifiedAt: nowIso() });
  } catch {}

  const reason =
    `This task is now touching ${distinct.size} distinct files (> ${threshold}). ` +
    `For a change this size, consider switching to maximum reasoning before continuing:\n` +
    `  1. Press ESC to cancel this edit.\n` +
    `  2. Run /effort and select "ultracode".\n` +
    `  3. Ask Claude for a short plan, confirm it, then implement.\n\n` +
    `Hooks cannot run /effort for you (effort is read-only to hooks), so this is a ` +
    `one-time nudge per session. Approve to continue WITHOUT switching.`;

  console.log(
    JSON.stringify({
      continue: true,
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'ask',
        permissionDecisionReason: reason,
      },
    })
  );
}

main().catch(() => {
  // A high-reasoning nudge must never block Claude on its own bug.
  console.log(JSON.stringify({ continue: true }));
  process.exit(0);
});
