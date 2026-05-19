#!/usr/bin/env node
// @sv-version: 1.0.0
/**
 * `peers` — CLI for the multi-instance coordination layer.
 *
 * Usage:
 *   peers list                                List active + idle peer sessions.
 *   peers notify <id-prefix-or-substring> "msg"
 *                                             Queue a message for that peer.
 *   peers locks [--minutes 10]                Show files touched in the window.
 *   peers cleanup                             Remove stale sessions (>1h idle).
 *
 * Exit codes:
 *   0  success (and at least one peer for `list`)
 *   1  argument / state error
 *   2  no peers found (for `list`)
 *
 * Run:
 *   npx tsx .claude/hooks/peers.ts <command>
 */

import { existsSync, readdirSync, readFileSync, renameSync, rmSync, statSync } from 'fs';
import { join, basename } from 'path';
import {
  ACTIVE_MS,
  IDLE_MS,
  STALE_MS,
  ageMs,
  appendInbox,
  classifyAge,
  ensureStateDirs,
  formatPeer,
  getProjectDir,
  getStateDir,
  listSessionFiles,
  nowIso,
  readJsonSafe,
  shortId,
  tailFileTouches,
  type SessionRecord,
} from './_state.js';

function parseFlag(args: string[], flag: string, fallback?: string): string | undefined {
  const i = args.indexOf(flag);
  if (i === -1) return fallback;
  return args[i + 1];
}

function loadSessions(stateDir: string): SessionRecord[] {
  const out: SessionRecord[] = [];
  for (const file of listSessionFiles(stateDir)) {
    const rec = readJsonSafe<SessionRecord>(file);
    if (rec) out.push(rec);
  }
  return out;
}

function findCurrentSessionId(stateDir: string): string | null {
  const fromEnv = process.env['CLAUDE_SESSION_ID'];
  if (fromEnv) return fromEnv;
  const sessions = loadSessions(stateDir).filter(s => ageMs(s.lastSeenAt) < ACTIVE_MS);
  if (sessions.length === 1) return sessions[0]!.sessionId;
  return null;
}

function cmdList(stateDir: string): number {
  const all = loadSessions(stateDir);
  const fresh = all.filter(s => ageMs(s.lastSeenAt) < IDLE_MS);
  if (fresh.length === 0) {
    console.log('No peer sessions in this project.');
    return 2;
  }
  fresh.sort((a, b) => ageMs(a.lastSeenAt) - ageMs(b.lastSeenAt));
  console.log(`Sessions registered for ${getProjectDir()}:`);
  for (const s of fresh) console.log(`  ${formatPeer(s)}`);
  return 0;
}

function cmdNotify(stateDir: string, args: string[]): number {
  if (args.length < 2) {
    console.error('Usage: peers notify <id-prefix-or-title-substring> "<message>"');
    return 1;
  }
  const target = args[0]!;
  const message = args.slice(1).join(' ');
  if (!message.trim()) {
    console.error('Empty message — nothing to send.');
    return 1;
  }

  const all = loadSessions(stateDir).filter(s => ageMs(s.lastSeenAt) < STALE_MS);
  const matches = all.filter(s => {
    if (s.sessionId.startsWith(target)) return true;
    if (s.title && s.title.toLowerCase().includes(target.toLowerCase())) return true;
    return false;
  });

  if (matches.length === 0) {
    console.error(`No peer session matches "${target}". Run \`peers list\`.`);
    return 1;
  }

  if (matches.length > 1) {
    console.error(`Ambiguous target "${target}" — ${matches.length} matches:`);
    for (const m of matches) console.error(`  - ${formatPeer(m)}`);
    console.error('Use a longer id prefix to disambiguate.');
    return 1;
  }

  const target_ = matches[0]!;
  const fromSessionId = findCurrentSessionId(stateDir) || 'cli';
  const fromTitle = loadSessions(stateDir).find(s => s.sessionId === fromSessionId)?.title;

  appendInbox(stateDir, target_.sessionId, {
    ts: nowIso(),
    fromSessionId,
    fromTitle,
    message,
  });
  console.log(`Queued message for ${shortId(target_.sessionId)} "${target_.title}".`);
  return 0;
}

function cmdLocks(stateDir: string, args: string[]): number {
  const minutes = Number(parseFlag(args, '--minutes', '10') || '10');
  if (!Number.isFinite(minutes) || minutes <= 0) {
    console.error('--minutes must be a positive number.');
    return 1;
  }
  const windowMs = minutes * 60 * 1000;
  const touches = tailFileTouches(stateDir, 1000).filter(t => ageMs(t.ts) <= windowMs);
  if (touches.length === 0) {
    console.log(`No file touches in the last ${minutes}min.`);
    return 0;
  }

  const sessions = loadSessions(stateDir);
  const sessById = new Map(sessions.map(s => [s.sessionId, s]));

  type Row = { file: string; sessionId: string; ts: string; tool: string };
  const byFile = new Map<string, Row>();
  for (const t of touches) {
    const prev = byFile.get(t.file);
    if (!prev || Date.parse(t.ts) > Date.parse(prev.ts)) {
      byFile.set(t.file, { file: t.file, sessionId: t.sessionId, ts: t.ts, tool: t.tool });
    }
  }

  const rows = [...byFile.values()].sort(
    (a, b) => Date.parse(b.ts) - Date.parse(a.ts)
  );

  console.log(`File touches in the last ${minutes}min (most-recent first):`);
  for (const r of rows) {
    const sess = sessById.get(r.sessionId);
    const klass = sess ? classifyAge(ageMs(sess.lastSeenAt)) : 'gone';
    const who = sess ? `${shortId(sess.sessionId)} "${sess.title}"` : `${shortId(r.sessionId)}(gone)`;
    const ageSec = Math.round(ageMs(r.ts) / 1000);
    console.log(`  ${r.file}  <-  ${who} [${klass}] via ${r.tool}, ${ageSec}s ago`);
  }
  return 0;
}

function cmdCleanup(stateDir: string): number {
  ensureStateDirs(stateDir);
  let archived = 0;
  let removed = 0;
  for (const file of listSessionFiles(stateDir)) {
    const rec = readJsonSafe<SessionRecord>(file);
    if (!rec) continue;
    const age = ageMs(rec.lastSeenAt);
    if (age > STALE_MS) {
      try {
        rmSync(file);
        removed++;
      } catch {}
    } else if (age > IDLE_MS) {
      try {
        const dest = join(stateDir, 'sessions', '_archive', basename(file));
        renameSync(file, dest);
        archived++;
      } catch {}
    }
  }

  // Drop empty inbox files older than 7 days.
  const inboxDir = join(stateDir, 'inbox');
  if (existsSync(inboxDir)) {
    try {
      for (const f of readdirSync(inboxDir)) {
        const p = join(inboxDir, f);
        try {
          const s = statSync(p);
          if (s.size === 0 && Date.now() - s.mtimeMs > 7 * 24 * 60 * 60 * 1000) {
            rmSync(p);
          } else if (s.size > 0) {
            const lines = readFileSync(p, 'utf8').split('\n').filter(Boolean);
            if (lines.length === 0) rmSync(p);
          }
        } catch {}
      }
    } catch {}
  }

  console.log(`Cleanup done. Archived: ${archived}. Removed: ${removed}.`);
  return 0;
}

function usage(): void {
  console.log(`peers — multi-instance coordination CLI

Commands:
  peers list
  peers notify <id-prefix-or-title-substring> "<message>"
  peers locks [--minutes 10]
  peers cleanup
`);
}

function main(): void {
  const [, , cmd, ...rest] = process.argv;
  const stateDir = getStateDir();

  switch (cmd) {
    case 'list':
      process.exit(cmdList(stateDir));
      break;
    case 'notify':
      process.exit(cmdNotify(stateDir, rest));
      break;
    case 'locks':
      process.exit(cmdLocks(stateDir, rest));
      break;
    case 'cleanup':
      process.exit(cmdCleanup(stateDir));
      break;
    case 'help':
    case '--help':
    case '-h':
    case undefined:
      usage();
      process.exit(0);
      break;
    default:
      console.error(`Unknown command: ${cmd}`);
      usage();
      process.exit(1);
  }
}

main();
