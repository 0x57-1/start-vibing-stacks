// @sv-version: 1.2.1
/**
 * Multi-Instance Coordination — Shared State Library
 *
 * Used by session-start.ts, user-prompt-submit.ts, pre-tool-use.ts,
 * post-tool-use.ts, stop-validator.ts, plan-gate.ts and peers.ts.
 *
 * Layout (project-local, gitignored):
 *   .claude/state/
 *     sessions/<id>.json        one record per active Claude instance
 *     sessions/_archive/        sessions ended or stale
 *     inbox/<id>.jsonl          messages queued for that session
 *     file-touches.jsonl        append-only edit log
 *     file-touches/_archive/    rotated logs
 *
 * Design rules:
 * - All writes are atomic (.tmp + rename) where the file is read by peers.
 * - Every read tolerates corruption (try/catch) — hooks must NEVER block Claude.
 * - Heartbeat thresholds: <180s active, 180s-30min idle, >30min stale, >24h removed.
 *
 * v1.1.0: ACTIVE window 60s→180s (agent think/generate time between tool calls
 * routinely exceeds 60s — a 60s window mis-classifies busy peers as IDLE);
 * FILES_TOUCHED_CAP 50→200 (large sessions were dropping early edits, which then
 * showed up as orphaned dirty files a peer could not attribute); path
 * normalization in extractTargetFiles is now repo-root-stable.
 *
 * v1.2.0: added optional `planGateNotifiedAt` to SessionRecord — a one-shot
 * marker so plan-gate.ts nudges the user toward `/effort ultracode` only once
 * per session when a change crosses the distinct-file threshold.
 */

import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  readdirSync,
  renameSync,
  rmSync,
  statSync,
  appendFileSync,
  openSync,
  readSync,
  closeSync,
} from 'fs';
import { join, basename, resolve, relative, isAbsolute } from 'path';
import { randomBytes } from 'crypto';
import { spawnSync } from 'child_process';

export const ACTIVE_MS = 180 * 1000;
export const IDLE_MS = 30 * 60 * 1000;
export const STALE_MS = 24 * 60 * 60 * 1000;
export const COLLISION_WINDOW_MS = 5 * 60 * 1000;

export const TOUCHES_ROTATE_THRESHOLD = 1000;
export const TOUCHES_TAIL_LINES = 200;
export const FILES_TOUCHED_CAP = 200;

export interface SessionRecord {
  sessionId: string;
  transcriptPath?: string;
  title: string;
  cwd: string;
  ppid: number;
  gitBranch?: string;
  startedAt: string;
  lastSeenAt: string;
  lastActivity: string;
  filesTouched: string[];
  /** ISO timestamp set once when plan-gate fired its high-reasoning nudge. */
  planGateNotifiedAt?: string;
}

export interface FileTouch {
  ts: string;
  sessionId: string;
  tool: string;
  file: string;
}

export interface InboxMessage {
  ts: string;
  fromSessionId: string;
  fromTitle?: string;
  message: string;
}

export function getProjectDir(): string {
  return process.env['CLAUDE_PROJECT_DIR'] || process.cwd();
}

export function getStateDir(projectDir: string = getProjectDir()): string {
  return join(projectDir, '.claude', 'state');
}

export function ensureStateDirs(stateDir: string = getStateDir()): void {
  mkdirSync(join(stateDir, 'sessions', '_archive'), { recursive: true });
  mkdirSync(join(stateDir, 'inbox'), { recursive: true });
  mkdirSync(join(stateDir, 'file-touches', '_archive'), { recursive: true });
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function ageMs(iso: string): number {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return Number.POSITIVE_INFINITY;
  return Date.now() - t;
}

/** Atomic write: tmp + rename. Survives concurrent writers; the last rename wins. */
export function writeFileAtomic(target: string, contents: string): void {
  const tmp = `${target}.${process.pid}.${randomBytes(4).toString('hex')}.tmp`;
  writeFileSync(tmp, contents);
  renameSync(tmp, target);
}

/** Read JSON; returns null on any error. */
export function readJsonSafe<T>(path: string): T | null {
  try {
    if (!existsSync(path)) return null;
    return JSON.parse(readFileSync(path, 'utf8')) as T;
  } catch {
    return null;
  }
}

export function getSessionPath(stateDir: string, sessionId: string): string {
  return join(stateDir, 'sessions', `${sessionId}.json`);
}

export function readSession(stateDir: string, sessionId: string): SessionRecord | null {
  return readJsonSafe<SessionRecord>(getSessionPath(stateDir, sessionId));
}

export function writeSession(stateDir: string, session: SessionRecord): void {
  ensureStateDirs(stateDir);
  writeFileAtomic(getSessionPath(stateDir, session.sessionId), JSON.stringify(session, null, 2));
}

export function listSessionFiles(stateDir: string): string[] {
  const dir = join(stateDir, 'sessions');
  if (!existsSync(dir)) return [];
  try {
    return readdirSync(dir)
      .filter(f => f.endsWith('.json'))
      .map(f => join(dir, f));
  } catch {
    return [];
  }
}

/**
 * List sessions excluding the caller's own. Auto-archives stale (>30min) and
 * removes very old (>24h) records as a side effect.
 */
export function listPeerSessions(
  stateDir: string,
  currentSessionId: string | null
): SessionRecord[] {
  const peers: SessionRecord[] = [];
  for (const file of listSessionFiles(stateDir)) {
    const rec = readJsonSafe<SessionRecord>(file);
    if (!rec) continue;
    if (rec.sessionId === currentSessionId) continue;

    const age = ageMs(rec.lastSeenAt);
    if (age > STALE_MS) {
      try {
        rmSync(file);
      } catch {}
      continue;
    }
    if (age > IDLE_MS) {
      archiveSessionFile(stateDir, file);
      continue;
    }
    peers.push(rec);
  }
  return peers;
}

export function archiveSessionFile(stateDir: string, sessionFile: string): void {
  try {
    const dest = join(stateDir, 'sessions', '_archive', basename(sessionFile));
    renameSync(sessionFile, dest);
  } catch {}
}

export function archiveSession(stateDir: string, sessionId: string): void {
  const file = getSessionPath(stateDir, sessionId);
  if (existsSync(file)) archiveSessionFile(stateDir, file);
}

/** Update lastSeenAt + lastActivity for the current session. Idempotent. */
export function heartbeat(
  stateDir: string,
  sessionId: string,
  activity: string,
  patch: Partial<SessionRecord> = {}
): SessionRecord {
  const existing = readSession(stateDir, sessionId);
  const now = nowIso();
  const merged: SessionRecord = existing
    ? { ...existing, ...patch, lastSeenAt: now, lastActivity: activity }
    : {
        sessionId,
        title: patch.title || '(untitled)',
        cwd: patch.cwd || getProjectDir(),
        ppid: patch.ppid ?? process.ppid ?? 0,
        gitBranch: patch.gitBranch,
        transcriptPath: patch.transcriptPath,
        startedAt: now,
        lastSeenAt: now,
        lastActivity: activity,
        filesTouched: patch.filesTouched || [],
      };
  writeSession(stateDir, merged);
  return merged;
}

export function recordFileTouch(stateDir: string, touch: FileTouch): void {
  ensureStateDirs(stateDir);
  const path = join(stateDir, 'file-touches.jsonl');
  try {
    appendFileSync(path, JSON.stringify(touch) + '\n');
    rotateFileTouchesIfNeeded(stateDir);
  } catch {}
}

export function rotateFileTouchesIfNeeded(stateDir: string): void {
  const path = join(stateDir, 'file-touches.jsonl');
  if (!existsSync(path)) return;
  try {
    const size = statSync(path).size;
    if (size < 200_000) return;
    const lines = readFileSync(path, 'utf8').split('\n').filter(Boolean);
    if (lines.length < TOUCHES_ROTATE_THRESHOLD) return;
    const archiveName = `file-touches-${Date.now()}.jsonl`;
    const archivePath = join(stateDir, 'file-touches', '_archive', archiveName);
    writeFileSync(archivePath, lines.slice(0, lines.length - TOUCHES_TAIL_LINES).join('\n') + '\n');
    writeFileSync(path, lines.slice(-TOUCHES_TAIL_LINES).join('\n') + '\n');
  } catch {}
}

/** Read the last N lines of file-touches.jsonl (cheap tail, no full read). */
export function tailFileTouches(stateDir: string, lines = TOUCHES_TAIL_LINES): FileTouch[] {
  const path = join(stateDir, 'file-touches.jsonl');
  if (!existsSync(path)) return [];
  try {
    const size = statSync(path).size;
    // 512KB tail comfortably holds ≳1000 touch records; collision decisions read
    // up to 1000 lines (see callers), so the byte window must not truncate them.
    const readBytes = Math.min(size, 512 * 1024);
    const fd = openSync(path, 'r');
    const buf = Buffer.alloc(readBytes);
    readSync(fd, buf, 0, readBytes, size - readBytes);
    closeSync(fd);
    const text = buf.toString('utf8');
    const all = text.split('\n').filter(Boolean);
    const slice = all.slice(-lines);
    const out: FileTouch[] = [];
    for (const line of slice) {
      try {
        out.push(JSON.parse(line));
      } catch {}
    }
    return out;
  } catch {
    return [];
  }
}

export function getInboxPath(stateDir: string, sessionId: string): string {
  return join(stateDir, 'inbox', `${sessionId}.jsonl`);
}

export function appendInbox(
  stateDir: string,
  targetSessionId: string,
  msg: InboxMessage
): void {
  ensureStateDirs(stateDir);
  try {
    appendFileSync(getInboxPath(stateDir, targetSessionId), JSON.stringify(msg) + '\n');
  } catch {}
}

/** Read all queued messages and remove the inbox file. */
export function drainInbox(stateDir: string, sessionId: string): InboxMessage[] {
  const path = getInboxPath(stateDir, sessionId);
  if (!existsSync(path)) return [];
  try {
    const lines = readFileSync(path, 'utf8').split('\n').filter(Boolean);
    rmSync(path);
    const out: InboxMessage[] = [];
    for (const line of lines) {
      try {
        out.push(JSON.parse(line));
      } catch {}
    }
    return out;
  } catch {
    return [];
  }
}

export function clearInbox(stateDir: string, sessionId: string): void {
  const path = getInboxPath(stateDir, sessionId);
  if (existsSync(path)) {
    try {
      rmSync(path);
    } catch {}
  }
}

/** Read up to ~8KB of the transcript and extract a human title. */
export function extractTitle(transcriptPath?: string, fallbackPrompt?: string): string {
  if (transcriptPath && existsSync(transcriptPath)) {
    try {
      const fd = openSync(transcriptPath, 'r');
      const buf = Buffer.alloc(8192);
      const bytes = readSync(fd, buf, 0, buf.length, 0);
      closeSync(fd);
      const text = buf.subarray(0, bytes).toString('utf8');
      for (const line of text.split('\n')) {
        if (!line.trim()) continue;
        try {
          const rec = JSON.parse(line);
          if (typeof rec.summary === 'string' && rec.summary.trim()) {
            return truncate(rec.summary.trim(), 80);
          }
          if (rec.type === 'user' && rec.message) {
            const content =
              typeof rec.message === 'string'
                ? rec.message
                : typeof rec.message?.content === 'string'
                  ? rec.message.content
                  : Array.isArray(rec.message?.content)
                    ? rec.message.content
                        .filter((c: any) => c.type === 'text')
                        .map((c: any) => c.text)
                        .join(' ')
                    : '';
            if (content) return truncate(content.replace(/\s+/g, ' ').trim(), 80);
          }
        } catch {}
      }
    } catch {}
  }
  if (fallbackPrompt) return truncate(fallbackPrompt.replace(/\s+/g, ' ').trim(), 80);
  return '(untitled)';
}

export function truncate(s: string, n: number): string {
  if (s.length <= n) return s;
  return s.slice(0, n - 1) + '…';
}

export function shortId(sessionId: string): string {
  return sessionId.slice(0, 8);
}

export function classifyAge(ageMsec: number): 'active' | 'idle' | 'stale' {
  if (ageMsec < ACTIVE_MS) return 'active';
  if (ageMsec < IDLE_MS) return 'idle';
  return 'stale';
}

/**
 * Inspect tool input and return a list of file paths that will be touched.
 * Returns paths relative to projectDir when possible, else absolute.
 */
export function extractTargetFiles(toolName: string, toolInput: any, projectDir: string): string[] {
  if (!toolInput || typeof toolInput !== 'object') return [];
  const out: string[] = [];
  // Normalize every path to the SAME shape `git status --porcelain` emits:
  // forward-slash, relative to the project (≈ repo) root. Tools may hand us an
  // absolute path, a path relative to a subdirectory cwd, or already-relative.
  // A mismatch here is the #1 cause of "I edited this file but scope.ts says it
  // is NOT MINE" — the string simply fails to equal the git porcelain path.
  const push = (p: any) => {
    if (typeof p !== 'string' || !p) return;
    const abs = isAbsolute(p) ? p : resolve(projectDir, p);
    let rel = relative(projectDir, abs);
    // Outside the project tree (rare): keep the original so we never crash; it
    // simply will not match a git path, which is the correct, safe outcome.
    if (!rel || rel.startsWith('..')) rel = p;
    out.push(rel.split('\\').join('/'));
  };
  // Claude + Kimi + Grok (post bridge alias) edit-class tools
  if (
    toolName === 'Edit' ||
    toolName === 'Write' ||
    toolName === 'MultiEdit' ||
    toolName === 'WriteFile' ||
    toolName === 'StrReplaceFile' ||
    toolName === 'StrReplace'
  ) {
    push(toolInput.file_path || toolInput.path || toolInput.target_file || toolInput.filePath);
  } else if (toolName === 'NotebookEdit') {
    push(toolInput.notebook_path || toolInput.target_notebook || toolInput.notebookPath);
  }
  return out;
}

/** Read JSON from stdin with a timeout fallback. */
export async function readStdinJson(timeoutMs = 1500): Promise<any> {
  return new Promise(resolve => {
    let data = '';
    const timer = setTimeout(() => {
      try {
        process.stdin.destroy();
      } catch {}
      try {
        resolve(JSON.parse(data || '{}'));
      } catch {
        resolve({});
      }
    }, timeoutMs);
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', c => {
      data += c;
    });
    process.stdin.on('end', () => {
      clearTimeout(timer);
      try {
        resolve(JSON.parse(data || '{}'));
      } catch {
        resolve({});
      }
    });
    process.stdin.on('error', () => {
      clearTimeout(timer);
      resolve({});
    });
  });
}

/** Resolve current git branch via spawnSync (no shell, no injection). */
export function getGitBranch(projectDir: string): string | undefined {
  try {
    const r = spawnSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], {
      cwd: projectDir,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 2000,
    });
    if (r.status !== 0) return undefined;
    const out = (r.stdout || '').toString().trim();
    return out || undefined;
  } catch {
    return undefined;
  }
}

/**
 * Format a peer session for systemMessage embedding.
 */
export function formatPeer(peer: SessionRecord): string {
  const idle = ageMs(peer.lastSeenAt);
  const klass = classifyAge(idle);
  const idleSec = Math.round(idle / 1000);
  const idleStr =
    idleSec < 90
      ? `${idleSec}s`
      : idleSec < 60 * 60
        ? `${Math.round(idleSec / 60)}min`
        : `${Math.round(idleSec / 3600)}h`;
  const branch = peer.gitBranch ? ` @${peer.gitBranch}` : '';
  return `[${klass}] ${shortId(peer.sessionId)} "${peer.title}"${branch} idle=${idleStr}`;
}
