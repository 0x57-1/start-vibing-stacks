#!/usr/bin/env node
// @sv-version: 1.1.0
/**
 * PostToolUse Hook — Multi-Instance Coordination
 *
 * Wired with matcher `Edit|Write|MultiEdit|NotebookEdit`. Runs AFTER a write
 * succeeds. Responsibilities:
 *  1. Append a `FileTouch` record to `.claude/state/file-touches.jsonl`.
 *  2. Update the session's heartbeat + `filesTouched` (capped, deduped).
 *  3. Prune legacy out-of-project paths from filesTouched (scratchpads).
 *
 * On any internal error the hook exits silently — coordination must NEVER
 * disturb Claude after a successful tool call.
 *
 * v1.1.0: never record / keep paths outside the project; prune polluted lists.
 */

import {
  FILES_TOUCHED_CAP,
  ensureStateDirs,
  extractTargetFiles,
  filterProjectPaths,
  getProjectDir,
  getStateDir,
  heartbeat,
  nowIso,
  readSession,
  readStdinJson,
  recordFileTouch,
} from './_state.js';

async function main(): Promise<void> {
  const input = await readStdinJson(1500);
  const sessionId: string | undefined = input.session_id || input.sessionId;
  const toolName: string = input.tool_name || input.toolName || '';
  const toolInput: any = input.tool_input || input.toolInput || {};
  const toolResponse: any = input.tool_response || input.toolResponse;

  if (!sessionId || !/^(Edit|Write|MultiEdit|NotebookEdit)$/.test(toolName)) {
    console.log(JSON.stringify({ continue: true }));
    return;
  }

  // Some tool responses surface a `success: false` — do not record those.
  if (toolResponse && typeof toolResponse === 'object' && toolResponse.success === false) {
    console.log(JSON.stringify({ continue: true }));
    return;
  }

  const projectDir = getProjectDir();
  const stateDir = getStateDir(projectDir);
  ensureStateDirs(stateDir);

  const targets = extractTargetFiles(toolName, toolInput, projectDir);
  const ts = nowIso();
  for (const file of targets) {
    recordFileTouch(stateDir, { ts, sessionId, tool: toolName, file });
  }

  const session = readSession(stateDir, sessionId);
  // Always prune outsides even when this Write was a scratchpad (targets=[]).
  const previous = filterProjectPaths(session?.filesTouched, projectDir);
  const merged = dedupeKeepLast([...previous, ...targets], FILES_TOUCHED_CAP);
  heartbeat(stateDir, sessionId, `PostToolUse:${toolName}`, { filesTouched: merged });

  console.log(JSON.stringify({ continue: true }));
}

function dedupeKeepLast(items: string[], cap: number): string[] {
  const seen = new Set<string>();
  const reversed: string[] = [];
  for (let i = items.length - 1; i >= 0; i--) {
    const x = items[i]!;
    if (seen.has(x)) continue;
    seen.add(x);
    reversed.push(x);
    if (reversed.length >= cap) break;
  }
  return reversed.reverse();
}

main().catch(() => {
  console.log(JSON.stringify({ continue: true }));
  process.exit(0);
});
