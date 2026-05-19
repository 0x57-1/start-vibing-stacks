#!/usr/bin/env node
// @sv-version: 1.0.0
/**
 * `scope` — Per-Instance Commit Scoping CLI
 *
 * Solves: in multi-instance Claude sessions, `git add .` / `git add -A` pulls
 * in changes from peer sessions, producing tangled commits where instance N
 * unintentionally ships instance M's uncommitted work.
 *
 * Source of truth for "what did THIS session edit?":
 *   `.claude/state/sessions/<id>.json#filesTouched`
 * which is maintained by `post-tool-use.ts` (capped at 50, dedup-keep-last).
 *
 * Usage:
 *   scope status                        Show this session's files vs peers' files vs untracked.
 *   scope stage [--include-conflicted]  `git reset`, then `git add` only this session's dirty files.
 *                                       Refuses files a peer touched in the last 5 min unless
 *                                       --include-conflicted.
 *   scope diff                          `git diff` for files this session touched.
 *   scope commit "<msg>" [--push]       stage + commit + optional push.
 *
 * Session discovery: --session <id>, else $CLAUDE_SESSION_ID, else single active session.
 *
 * Exit codes:
 *   0  ok
 *   1  argument / state error
 *   2  refused (collision detected; pass --include-conflicted to override)
 *
 * Run: npx tsx "$CLAUDE_PROJECT_DIR/.claude/hooks/scope.ts" <command>
 */

import { existsSync } from 'fs';
import { spawnSync } from 'child_process';
import { join } from 'path';
import {
  ACTIVE_MS,
  COLLISION_WINDOW_MS,
  ageMs,
  getProjectDir,
  getStateDir,
  listSessionFiles,
  readJsonSafe,
  readSession,
  shortId,
  tailFileTouches,
  type FileTouch,
  type SessionRecord,
} from './_state.js';

interface GitStatus {
  modified: Set<string>;
  staged: Set<string>;
  untracked: Set<string>;
}

interface ScopeReport {
  mine: string[];
  conflicted: { file: string; peer: SessionRecord | null; ageSec: number }[];
  otherDirty: string[];
}

function parseFlag(args: string[], flag: string): string | undefined {
  const i = args.indexOf(flag);
  if (i === -1) return undefined;
  return args[i + 1];
}

function hasFlag(args: string[], flag: string): boolean {
  return args.includes(flag);
}

function loadAllSessions(stateDir: string): SessionRecord[] {
  const out: SessionRecord[] = [];
  for (const file of listSessionFiles(stateDir)) {
    const rec = readJsonSafe<SessionRecord>(file);
    if (rec) out.push(rec);
  }
  return out;
}

function resolveSessionId(stateDir: string, explicit?: string): string | null {
  if (explicit) return explicit;
  const fromEnv = process.env['CLAUDE_SESSION_ID'];
  if (fromEnv) return fromEnv;
  const active = loadAllSessions(stateDir).filter(s => ageMs(s.lastSeenAt) < ACTIVE_MS);
  if (active.length === 1) return active[0]!.sessionId;
  return null;
}

function git(args: string[], cwd: string): { code: number; stdout: string; stderr: string } {
  const r = spawnSync('git', args, { cwd, encoding: 'utf8' });
  return { code: r.status ?? 1, stdout: r.stdout || '', stderr: r.stderr || '' };
}

function gitDirty(projectDir: string): GitStatus {
  const r = git(['status', '--porcelain=v1', '-z'], projectDir);
  const out: GitStatus = {
    modified: new Set<string>(),
    staged: new Set<string>(),
    untracked: new Set<string>(),
  };
  if (r.code !== 0) return out;
  // -z = NUL-terminated. Format: `XY<space>path\0` (renames add a second `\0orig`)
  // We deliberately treat the rename path as the new name only; orig is consumed.
  const parts = r.stdout.split('\0').filter(Boolean);
  for (let i = 0; i < parts.length; i++) {
    const entry = parts[i]!;
    if (entry.length < 4) continue;
    const xy = entry.slice(0, 2);
    const path = entry.slice(3);
    const X = xy[0]!;
    const Y = xy[1]!;
    if (X === 'R' || Y === 'R') {
      // Next NUL-token is the original path; skip it for our purposes.
      i++;
    }
    if (X !== ' ' && X !== '?') out.staged.add(path);
    if (Y !== ' ' && Y !== '?') out.modified.add(path);
    if (X === '?' && Y === '?') out.untracked.add(path);
  }
  return out;
}

function classify(stateDir: string, sessionId: string, projectDir: string): ScopeReport {
  const session = readSession(stateDir, sessionId);
  const tracked = new Set(session?.filesTouched || []);
  const status = gitDirty(projectDir);
  const dirty = new Set<string>([...status.modified, ...status.untracked]);

  const touches = tailFileTouches(stateDir);
  const peerById = new Map(loadAllSessions(stateDir).map(p => [p.sessionId, p]));
  const peerTouches = new Map<string, FileTouch>();
  for (const t of touches) {
    if (t.sessionId === sessionId) continue;
    if (ageMs(t.ts) > COLLISION_WINDOW_MS) continue;
    const prev = peerTouches.get(t.file);
    if (!prev || Date.parse(t.ts) > Date.parse(prev.ts)) peerTouches.set(t.file, t);
  }

  const mine: string[] = [];
  const conflicted: ScopeReport['conflicted'] = [];
  for (const file of tracked) {
    if (!dirty.has(file)) continue;
    const conflict = peerTouches.get(file);
    if (conflict) {
      conflicted.push({
        file,
        peer: peerById.get(conflict.sessionId) || null,
        ageSec: Math.round(ageMs(conflict.ts) / 1000),
      });
    } else {
      mine.push(file);
    }
  }

  const otherDirty: string[] = [];
  for (const f of dirty) {
    if (!tracked.has(f)) otherDirty.push(f);
  }

  return { mine, conflicted, otherDirty };
}

function cmdStatus(stateDir: string, projectDir: string, args: string[]): number {
  const sessionId = resolveSessionId(stateDir, parseFlag(args, '--session'));
  if (!sessionId) {
    console.error('Cannot resolve session ID. Set CLAUDE_SESSION_ID or pass --session <id>.');
    console.error('Tip: run `npx tsx "$CLAUDE_PROJECT_DIR/.claude/hooks/peers.ts" list`.');
    return 1;
  }
  const session = readSession(stateDir, sessionId);
  if (!session) {
    console.error(`Session ${shortId(sessionId)} not registered. Has the SessionStart hook run?`);
    return 1;
  }

  const { mine, conflicted, otherDirty } = classify(stateDir, sessionId, projectDir);
  const status = gitDirty(projectDir);

  console.log(
    `Session ${shortId(sessionId)} "${session.title}" (branch ${session.gitBranch || '?'})`
  );
  console.log(`Files in session.filesTouched: ${session.filesTouched.length} (cap 50, dedup)`);
  console.log();
  console.log(`SAFE TO STAGE (${mine.length}):`);
  if (mine.length === 0) {
    console.log('  (none)');
  } else {
    for (const f of mine) console.log(`  + ${f}`);
  }

  if (conflicted.length > 0) {
    console.log();
    console.log(`CONFLICTED — peer also touched in last 5 min (${conflicted.length}):`);
    for (const c of conflicted) {
      const who = c.peer
        ? `${shortId(c.peer.sessionId)} "${c.peer.title}"`
        : '(unknown peer)';
      console.log(`  ! ${c.file}  ←  ${who}, ${c.ageSec}s ago`);
    }
    console.log('  Coordinate via `/peers notify <id> "..."`, OR re-run with --include-conflicted.');
  }

  if (otherDirty.length > 0) {
    console.log();
    console.log(`NOT YOURS — dirty but not in filesTouched (${otherDirty.length}):`);
    for (const f of otherDirty) console.log(`  · ${f}`);
    console.log('  `scope stage` will LEAVE these alone (this is the whole point).');
  }

  if (status.staged.size > 0) {
    console.log();
    console.log(`CURRENTLY STAGED (${status.staged.size}):`);
    for (const f of status.staged) console.log(`  ✓ ${f}`);
    console.log('  `scope stage` runs `git reset` first — this state will be replaced.');
  }

  return 0;
}

function cmdStage(stateDir: string, projectDir: string, args: string[]): number {
  const sessionId = resolveSessionId(stateDir, parseFlag(args, '--session'));
  if (!sessionId) {
    console.error('Cannot resolve session ID. Set CLAUDE_SESSION_ID or pass --session <id>.');
    return 1;
  }
  const session = readSession(stateDir, sessionId);
  if (!session) {
    console.error(`Session ${shortId(sessionId)} not registered.`);
    return 1;
  }

  const { mine, conflicted } = classify(stateDir, sessionId, projectDir);
  const includeConflicted = hasFlag(args, '--include-conflicted');
  const conflictedFiles = conflicted.map(c => c.file);
  const toStage = includeConflicted ? [...mine, ...conflictedFiles] : mine;

  if (toStage.length === 0) {
    if (conflicted.length > 0) {
      console.error(
        `No safe files to stage. ${conflicted.length} conflicted file(s) — pass --include-conflicted to override.`
      );
      for (const c of conflicted) {
        const who = c.peer
          ? `${shortId(c.peer.sessionId)} "${c.peer.title}"`
          : '(unknown)';
        console.error(`  ! ${c.file}  ←  ${who}, ${c.ageSec}s ago`);
      }
      return 2;
    }
    console.error(
      'No files to stage (this session has no dirty files in filesTouched).'
    );
    return 1;
  }

  // The `git reset` here is intentional: scope semantics own the index.
  // Anything a peer staged previously will be unstaged; they will re-stage
  // their own files via `scope stage` when they commit.
  const resetR = git(['reset'], projectDir);
  if (resetR.code !== 0) {
    console.error(`git reset failed: ${resetR.stderr.trim()}`);
    return 1;
  }
  const addR = git(['add', '--', ...toStage], projectDir);
  if (addR.code !== 0) {
    console.error(`git add failed: ${addR.stderr.trim()}`);
    return 1;
  }

  console.log(`Staged ${toStage.length} file(s) from session ${shortId(sessionId)}:`);
  for (const f of toStage) console.log(`  + ${f}`);

  if (conflicted.length > 0 && !includeConflicted) {
    console.log();
    console.log(`Skipped ${conflicted.length} conflicted file(s):`);
    for (const c of conflicted) {
      const who = c.peer
        ? `${shortId(c.peer.sessionId)} "${c.peer.title}"`
        : '(unknown)';
      console.log(`  ! ${c.file}  ←  ${who}, ${c.ageSec}s ago`);
    }
    console.log('  Pass --include-conflicted to stage them anyway.');
    console.log('  Review with: git diff --cached --stat');
    return 2;
  }

  console.log();
  console.log('Review with: git diff --cached --stat');
  return 0;
}

function cmdDiff(stateDir: string, projectDir: string, args: string[]): number {
  const sessionId = resolveSessionId(stateDir, parseFlag(args, '--session'));
  if (!sessionId) {
    console.error('Cannot resolve session ID. Set CLAUDE_SESSION_ID or pass --session <id>.');
    return 1;
  }
  const session = readSession(stateDir, sessionId);
  if (!session) {
    console.error(`Session ${shortId(sessionId)} not registered.`);
    return 1;
  }

  const files = session.filesTouched.filter(f => existsSync(join(projectDir, f)));
  if (files.length === 0) {
    console.error('This session has no tracked files (or none exist on disk).');
    return 1;
  }
  const r = spawnSync('git', ['diff', '--', ...files], {
    cwd: projectDir,
    stdio: 'inherit',
  });
  return r.status ?? 1;
}

// Flags that take a value (the next token is consumed as the value, not as a positional).
const VALUE_FLAGS = new Set(['--session']);

function firstPositional(args: string[]): string | undefined {
  for (let i = 0; i < args.length; i++) {
    const a = args[i]!;
    if (a.startsWith('--')) continue;
    const prev = i > 0 ? args[i - 1]! : '';
    if (VALUE_FLAGS.has(prev)) continue;
    return a;
  }
  return undefined;
}

function cmdCommit(stateDir: string, projectDir: string, args: string[]): number {
  const message = firstPositional(args);
  if (!message) {
    console.error('Usage: scope commit "<message>" [--push] [--include-conflicted] [--session <id>]');
    return 1;
  }

  const stageCode = cmdStage(stateDir, projectDir, args);
  if (stageCode === 1) return 1;
  if (stageCode === 2 && !hasFlag(args, '--include-conflicted')) {
    console.error();
    console.error(
      'Refusing to commit while conflicted files were skipped. ' +
        'Resolve, OR re-run with --include-conflicted.'
    );
    return 2;
  }

  const commitR = git(['commit', '-m', message], projectDir);
  process.stdout.write(commitR.stdout);
  process.stderr.write(commitR.stderr);
  if (commitR.code !== 0) return 1;

  if (hasFlag(args, '--push')) {
    const pushR = spawnSync('git', ['push'], { cwd: projectDir, stdio: 'inherit' });
    return pushR.status ?? 1;
  }
  return 0;
}

function usage(): void {
  console.log(`scope — per-instance commit scoping CLI

Commands:
  scope status   [--session <id>]
  scope stage    [--session <id>] [--include-conflicted]
  scope diff     [--session <id>]
  scope commit   "<message>" [--session <id>] [--include-conflicted] [--push]

Stages and commits ONLY the files this Claude session edited (per
\`.claude/state/sessions/<id>.json#filesTouched\`). Refuses to stage
files a peer session touched in the last 5 min unless --include-conflicted.

Exit codes: 0=ok, 1=arg/state error, 2=conflict refusal.
`);
}

function main(): void {
  const [, , cmd, ...rest] = process.argv;
  const projectDir = getProjectDir();
  const stateDir = getStateDir(projectDir);

  switch (cmd) {
    case 'status':
      process.exit(cmdStatus(stateDir, projectDir, rest));
      break;
    case 'stage':
      process.exit(cmdStage(stateDir, projectDir, rest));
      break;
    case 'diff':
      process.exit(cmdDiff(stateDir, projectDir, rest));
      break;
    case 'commit':
      process.exit(cmdCommit(stateDir, projectDir, rest));
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
