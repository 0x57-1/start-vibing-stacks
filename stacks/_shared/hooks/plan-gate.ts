#!/usr/bin/env node
// @sv-version: 1.3.0
/**
 * PreToolUse Hook — Plan Gate
 *
 * Wired with matcher `Edit|Write|MultiEdit|NotebookEdit`, alongside pre-tool-use.ts.
 * When a SINGLE session is about to touch MORE THAN the threshold (default 4)
 * DISTINCT **in-project** files, it fires ONCE per session: returns
 * `permissionDecision: "ask"` so the user sees the model split before the
 * large edit continues. Ultracode is already on via settings.json. The waste
 * to avoid is a swarm of Opus agents for a lookup.
 *
 * v1.3.0: a read-only agent is Sonnet. Opus is the agent that edits.
 *          Every agent() call passes model. The advisor stays off.
 * v1.2.0: the prompt no longer asks the user to turn ultracode on.
 * v1.1.0: count only project-relative paths (scratchpads under /tmp/claude-* and
 * ~/.claude edits no longer inflate the distinct-file counter).
 *
 * Hooks cannot spawn agents or set their model. Memory `model-split` is what
 * the session follows. This nudge only makes the split visible once.
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
    `Ultracode is already on. The advisor stays off.\n` +
    `  - Every agent() that does not edit code passes model claude-sonnet-5-5 and effort low.\n` +
    `  - Omitting model inherits Opus 5.5. Do not omit it.\n` +
    `  - Opus 5.5 only for the agent that edits code.\n\n` +
    `One-time note for this session. Approve to continue.`;

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
