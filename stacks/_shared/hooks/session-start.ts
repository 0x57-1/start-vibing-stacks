#!/usr/bin/env node
// @sv-version: 1.2.0
/**
 * SessionStart Hook — Multi-Instance Coordination + project brain brief
 *
 * Runs once per session start (startup | resume | compact). Responsibilities:
 *  1. Register this session in `.claude/state/sessions/<id>.json` (Claude, Kimi, Grok).
 *  2. Tag `target` + resolve native session dir / transcript when available.
 *  3. Inject a capped PROJECT BRAIN brief (branch, Recent Change, Next step).
 *  4. Extract title from transcript / product state when present.
 *  5. Scan peers; drain inbox.
 */

import {
  ACTIVE_MS,
  ageMs,
  detectSvsTarget,
  drainInbox,
  ensureStateDirs,
  extractTitle,
  formatPeer,
  getGitBranch,
  getProjectDir,
  getStateDir,
  heartbeat,
  listPeerSessions,
  readSession,
  readStdinJson,
  resolveNativeSessionMeta,
  shortId,
  type InboxMessage,
} from './_state.js';
import { buildResumeBrief } from './_brain.js';

async function main(): Promise<void> {
  const input = await readStdinJson(1500);
  const sessionId: string | undefined =
    input.session_id || input.sessionId || input.id || input.session?.id;
  const transcriptPathIn: string | undefined = input.transcript_path || input.transcriptPath;
  const source: string =
    (typeof input.source === 'string' && input.source) ||
    (typeof input.hook_event_name === 'string' ? 'startup' : 'startup');
  const projectDir = getProjectDir();
  const stateDir = getStateDir(projectDir);
  const target = detectSvsTarget(input);

  if (!sessionId) {
    console.log(JSON.stringify({ continue: true }));
    return;
  }

  ensureStateDirs(stateDir);

  const native = resolveNativeSessionMeta(projectDir, sessionId, target);
  const transcriptPath = transcriptPathIn || native.transcriptPath;

  const existing = readSession(stateDir, sessionId);
  const title =
    existing?.title && existing.title !== '(untitled)'
      ? existing.title
      : native.title || extractTitle(transcriptPath);

  const branch = getGitBranch(projectDir);

  heartbeat(stateDir, sessionId, 'SessionStart', {
    transcriptPath,
    nativeSessionDir: native.nativeSessionDir,
    title,
    cwd: projectDir,
    gitBranch: branch,
    target,
  });

  const peers = listPeerSessions(stateDir, sessionId);
  const inbox = drainInbox(stateDir, sessionId);

  const messageParts: string[] = [];

  // Brain brief first on resume/compact (what was lost is task context, not peers).
  const src = String(source).toLowerCase();
  try {
    messageParts.push(
      buildResumeBrief(projectDir, {
        source: src,
        branch,
        target,
        sessionShort: shortId(sessionId),
      })
    );
    messageParts.push('');
  } catch {
    /* fail-open */
  }

  messageParts.push(
    `MULTI-INSTANCE COORDINATION ACTIVE — session ${shortId(sessionId)} ("${title}")` +
      ` · target=${target}` +
      `. State at .claude/state/sessions/ (archive on SessionEnd or >30min idle).`
  );

  if (peers.length > 0) {
    messageParts.push('');
    messageParts.push(`PEERS DETECTED in this project (${peers.length}):`);
    for (const p of peers) messageParts.push(`  - ${formatPeer(p)}`);
    const anyActive = peers.some((p) => ageMs(p.lastSeenAt) < ACTIVE_MS);
    if (anyActive) {
      messageParts.push('');
      messageParts.push(
        'WARNING: at least one peer is ACTIVE. Edit/Write of a file a peer just ' +
          'touched will be BLOCKED. Coordinate via peers notify before shared files.'
      );
    } else {
      messageParts.push('');
      messageParts.push(
        'Peers are idle (>3min). Edits allowed; you may see a notice on recent peer files.'
      );
    }
  }

  if (inbox.length > 0) {
    messageParts.push('');
    messageParts.push(`INBOX (${inbox.length} message${inbox.length === 1 ? '' : 's'} from peers):`);
    for (const m of inbox) messageParts.push(formatInbox(m));
  }

  console.log(JSON.stringify({ continue: true, systemMessage: messageParts.join('\n') }));
}

function formatInbox(m: InboxMessage): string {
  const from = m.fromTitle
    ? `${shortId(m.fromSessionId)} "${m.fromTitle}"`
    : shortId(m.fromSessionId);
  return `  [${m.ts}] from ${from}: ${m.message}`;
}

main().catch(() => {
  console.log(JSON.stringify({ continue: true }));
});
