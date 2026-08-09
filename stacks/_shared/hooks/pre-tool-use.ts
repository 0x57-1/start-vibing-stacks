#!/usr/bin/env node
// @sv-version: 1.2.0
/**
 * PreToolUse Hook — Multi-Instance Coordination
 *
 * Wired with matcher `Edit|Write|MultiEdit|NotebookEdit`. Reads the file-touches
 * log + active peer sessions and decides:
 *
 *  - BLOCK if a peer is currently ACTIVE (heartbeat < 180s) AND touched the same
 *    file within the last 5 minutes. The reason explains how to recover.
 *  - WARN (approve + systemMessage) if a peer touched the file recently but is
 *    only IDLE (180s — 5min).
 *  - APPROVE silently otherwise.
 *
 * Hook input:
 *   { session_id, tool_name, tool_input, hook_event_name, ... }
 *
 * Output schema (JSON):
 *   { decision?: 'block', reason?: string, continue: true, systemMessage?: string }
 *
 * On any internal error, the hook approves silently — coordination must NEVER
 * break Claude.
 *
 * v1.2.0: ignore out-of-project targets (scratchpads) — no collision checks there.
 */

import {
  ACTIVE_MS,
  COLLISION_WINDOW_MS,
  ageMs,
  classifyAge,
  ensureStateDirs,
  extractTargetFiles,
  getProjectDir,
  getStateDir,
  heartbeat,
  listPeerSessions,
  readSession,
  readStdinJson,
  shortId,
  tailFileTouches,
  type FileTouch,
  type SessionRecord,
} from './_state.js';

interface Verdict {
  block: boolean;
  reason?: string;
  warning?: string;
}

function evaluate(
  targetFiles: string[],
  peers: SessionRecord[],
  touches: FileTouch[],
  selfSessionId: string,
  selfSession: SessionRecord | null
): Verdict {
  if (targetFiles.length === 0) return { block: false };

  const peerById = new Map<string, SessionRecord>();
  for (const p of peers) peerById.set(p.sessionId, p);

  // Files this session has already claimed (from its own record)
  const selfClaimed = new Set(selfSession?.filesTouched || []);

  // Most-recent peer touch per (file) — but only if we have NOT already claimed it.
  const recent = new Map<string, FileTouch>();
  for (const t of touches) {
    if (t.sessionId === selfSessionId) continue;
    if (!targetFiles.includes(t.file)) continue;
    if (selfClaimed.has(t.file)) continue; // We already own this file — ignore peer touch
    if (ageMs(t.ts) > COLLISION_WINDOW_MS) continue;
    const prev = recent.get(t.file);
    if (!prev || Date.parse(t.ts) > Date.parse(prev.ts)) recent.set(t.file, t);
  }

  if (recent.size === 0) return { block: false };

  const blockers: string[] = [];
  const warns: string[] = [];

  for (const [file, touch] of recent) {
    const peer = peerById.get(touch.sessionId);
    const peerActive = peer && ageMs(peer.lastSeenAt) < ACTIVE_MS;
    const touchAgeSec = Math.round(ageMs(touch.ts) / 1000);
    const peerLabel = peer
      ? `${shortId(peer.sessionId)} "${peer.title}"${peer.gitBranch ? ` @${peer.gitBranch}` : ''}`
      : `${shortId(touch.sessionId)} (session record gone)`;

    if (peerActive) {
      blockers.push(
        `  - ${file}\n    last touched ${touchAgeSec}s ago by peer ${peerLabel} (HEARTBEAT ACTIVE)`
      );
    } else {
      const klass = peer ? classifyAge(ageMs(peer.lastSeenAt)) : 'stale';
      warns.push(
        `  - ${file}: peer ${peerLabel} (${klass}) touched it ${touchAgeSec}s ago`
      );
    }
  }

  if (blockers.length > 0) {
    const reason =
      `BLOCKED by multi-instance coordination — another active Claude session is editing the same file.\n` +
      `Active collision(s):\n${blockers.join('\n')}\n\n` +
      `Recommended actions:\n` +
      `  1. Run \`npx tsx .claude/hooks/peers.ts list\` to see who is active.\n` +
      `  2. Notify them: \`npx tsx .claude/hooks/peers.ts notify <id-prefix> "I need to edit <file>, can you commit/stash?"\`\n` +
      `  3. Wait for them to commit, then retry — or have them call \`peers.ts cleanup\` if you confirm they are no longer editing.\n` +
      `  4. If you must override: re-run the same Edit after 180s of peer inactivity (their heartbeat will go IDLE and the hook will downgrade to a warning).`;
    return { block: true, reason };
  }

  if (warns.length > 0) {
    const warning =
      `MULTI-INSTANCE WARNING — files you are about to edit were recently touched by an idle peer:\n${warns.join('\n')}\n` +
      `Edit is allowed (peer is not actively typing). Consider rebasing on their work after they commit.`;
    return { block: false, warning };
  }

  return { block: false };
}

async function main(): Promise<void> {
  const input = await readStdinJson(1500);
  const sessionId: string | undefined = input.session_id || input.sessionId;
  const toolName: string = input.tool_name || input.toolName || '';
  const toolInput: any = input.tool_input || input.toolInput || {};

  // Defensive: only act on edit-class tools (Claude + Kimi + Grok aliases).
  if (
    !/^(Edit|Write|MultiEdit|NotebookEdit|WriteFile|StrReplaceFile|StrReplace)$/.test(toolName)
  ) {
    console.log(JSON.stringify({ continue: true }));
    return;
  }

  const projectDir = getProjectDir();
  const stateDir = getStateDir(projectDir);
  ensureStateDirs(stateDir);

  if (sessionId) {
    heartbeat(stateDir, sessionId, `PreToolUse:${toolName}`);
  }

  const targetFiles = extractTargetFiles(toolName, toolInput, projectDir);
  if (targetFiles.length === 0) {
    console.log(JSON.stringify({ continue: true }));
    return;
  }

  const peers = listPeerSessions(stateDir, sessionId || null);
  // Read a wide tail so a peer's collision touch is not missed under heavy load.
  const touches = tailFileTouches(stateDir, 1000);

  const selfSession = sessionId ? readSession(stateDir, sessionId) : null;
  const verdict = evaluate(targetFiles, peers, touches, sessionId || '', selfSession);

  if (verdict.block) {
    console.log(
      JSON.stringify({
        continue: true,
        decision: 'block',
        reason: verdict.reason,
      })
    );
    return;
  }

  if (verdict.warning) {
    console.log(
      JSON.stringify({
        continue: true,
        systemMessage: verdict.warning,
      })
    );
    return;
  }

  console.log(JSON.stringify({ continue: true }));
}

main().catch(() => {
  // Coordination must never block Claude on its own bug.
  console.log(JSON.stringify({ continue: true }));
  process.exit(0);
});
