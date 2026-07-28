#!/usr/bin/env node
// @sv-version: 1.0.0
/**
 * PreCompact — stamp project brain before transcript compaction.
 * Fail-open: never block compaction.
 */

import {
  ensureStateDirs,
  getGitBranch,
  getProjectDir,
  getStateDir,
  heartbeat,
  readStdinJson,
} from './_state.js';
import { stampTaskBeforeCompact } from './_brain.js';

async function main(): Promise<void> {
  const input = await readStdinJson(1500);
  const sessionId: string | undefined = input.session_id || input.sessionId;
  const projectDir = getProjectDir();
  const target =
    process.env['SVS_TARGET'] ||
    (typeof input.svs_target === 'string' ? input.svs_target : undefined);

  try {
    if (sessionId) {
      const stateDir = getStateDir(projectDir);
      ensureStateDirs(stateDir);
      heartbeat(stateDir, sessionId, 'PreCompact', {});
    }
    const branch = getGitBranch(projectDir);
    stampTaskBeforeCompact(projectDir, {
      branch,
      target,
      sessionId,
      note: 'Post-compact: re-read Next step + domain index; do not re-explore from scratch.',
    });
  } catch {
    /* fail-open */
  }

  console.log(JSON.stringify({ continue: true }));
}

main().catch(() => {
  console.log(JSON.stringify({ continue: true }));
});
