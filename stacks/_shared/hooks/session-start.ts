#!/usr/bin/env node
/**
 * SessionStart Hook — Multi-Instance Coordination
 *
 * Runs once per Claude session start. Responsibilities:
 *  1. Register this session in `.claude/state/sessions/<id>.json`.
 *  2. Extract a human title from the transcript (matches what `claude --resume` shows).
 *  3. Scan for peer sessions in the same project; warn if any are active.
 *  4. Drain the inbox so messages from peers are surfaced in the first prompt.
 *
 * Hook input (JSON via stdin):
 *   { session_id, transcript_path, cwd, hook_event_name, source }
 *
 * Output (JSON to stdout):
 *   { continue: true, systemMessage?: string }
 */

import {
  ageMs,
  appendInbox,
  drainInbox,
  ensureStateDirs,
  extractTitle,
  formatPeer,
  getGitBranch,
  getProjectDir,
  getStateDir,
  heartbeat,
  listPeerSessions,
  nowIso,
  readSession,
  readStdinJson,
  shortId,
  type InboxMessage,
} from './_state.js';

async function main(): Promise<void> {
  const input = await readStdinJson(1500);
  const sessionId: string | undefined = input.session_id || input.sessionId;
  const transcriptPath: string | undefined = input.transcript_path || input.transcriptPath;
  const projectDir = getProjectDir();
  const stateDir = getStateDir(projectDir);

  if (!sessionId) {
    console.log(JSON.stringify({ continue: true }));
    return;
  }

  ensureStateDirs(stateDir);

  // Resolve title: prefer the existing record (so we don't lose a real title
  // captured by user-prompt-submit when the SessionStart event also fires for
  // a `/resume` flow that already had a title).
  const existing = readSession(stateDir, sessionId);
  const title = existing?.title && existing.title !== '(untitled)'
    ? existing.title
    : extractTitle(transcriptPath);

  const branch = getGitBranch(projectDir);

  heartbeat(stateDir, sessionId, 'SessionStart', {
    transcriptPath,
    title,
    cwd: projectDir,
    gitBranch: branch,
  });

  // Discover peers (active or idle within 30min).
  const peers = listPeerSessions(stateDir, sessionId);

  // Drain inbox messages addressed to this session.
  const inbox = drainInbox(stateDir, sessionId);

  const messageParts: string[] = [];
  messageParts.push(
    `MULTI-INSTANCE COORDINATION ACTIVE — this Claude session is registered as ${shortId(sessionId)} ("${title}"). State at .claude/state/.`
  );

  if (peers.length > 0) {
    messageParts.push('');
    messageParts.push(`PEERS DETECTED in this project (${peers.length}):`);
    for (const p of peers) messageParts.push(`  - ${formatPeer(p)}`);
    const anyActive = peers.some(p => ageMs(p.lastSeenAt) < 60 * 1000);
    if (anyActive) {
      messageParts.push('');
      messageParts.push(
        'WARNING: at least one peer is ACTIVE right now. Edit/Write of a file ' +
          'a peer just touched will be BLOCKED by the PreToolUse hook to prevent ' +
          'overwriting their uncommitted work. Coordinate via `/peers notify <id> "msg"` ' +
          'before touching shared files.'
      );
    } else {
      messageParts.push('');
      messageParts.push(
        'Peers are idle (>60s). Edits will be allowed but you will see a notice if ' +
          'you touch files they recently modified.'
      );
    }
  }

  if (inbox.length > 0) {
    messageParts.push('');
    messageParts.push(`INBOX (${inbox.length} message${inbox.length === 1 ? '' : 's'} from peers):`);
    for (const m of inbox) messageParts.push(formatInbox(m));
  }

  const systemMessage = messageParts.join('\n');

  console.log(JSON.stringify({ continue: true, systemMessage }));
}

function formatInbox(m: InboxMessage): string {
  const from = m.fromTitle ? `${shortId(m.fromSessionId)} "${m.fromTitle}"` : shortId(m.fromSessionId);
  return `  [${m.ts}] from ${from}: ${m.message}`;
}

main().catch(() => {
  console.log(JSON.stringify({ continue: true }));
  process.exit(0);
});

// Silence unused-import warning when type-only imports are tree-shaken
void nowIso;
void appendInbox;
