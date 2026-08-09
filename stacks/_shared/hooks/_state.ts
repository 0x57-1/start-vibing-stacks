// @sv-version: 1.7.0
/**
 * Multi-Instance Coordination — Shared State Library
 *
 * Used by session-start.ts, user-prompt-submit.ts, pre-tool-use.ts,
 * post-tool-use.ts, stop-validator.ts, plan-gate.ts and peers.ts.
 *
 * Layout (project-local, gitignored):
 *   .claude/state/
 *     sessions/<id>.json        one record per active Claude/Kimi/Grok instance
 *     sessions/_archive/        sessions ended (SessionEnd) or stale (>30min)
 *     inbox/<id>.jsonl          messages queued for that session
 *     file-touches.jsonl        append-only edit log
 *     file-touches/_archive/    rotated logs
 *
 * Design rules:
 * - All writes are atomic (.tmp + rename) where the file is read by peers.
 * - Every read tolerates corruption (try/catch) — hooks must NEVER block Claude.
 * - Heartbeat thresholds: <180s active, 180s-30min idle, >30min stale, >24h removed.
 * - Kimi + Grok register via the same SessionStart→heartbeat path (svs-bridge
 *   sets SVS_TARGET). Native transcript dirs are optional metadata only.
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
 *
 * v1.3.0: `target` + `nativeSessionDir` on SessionRecord; resolve Kimi/Grok
 * on-disk session folders for transcriptPath/title enrichment.
 *
 * v1.4.0: SessionStart/resume rehydrates `filesTouched` (+ `startedAt`) from
 * `_archive/<id>.json` and/or `file-touches.jsonl`. Grok Build 1.0 often fires
 * SessionEnd then SessionStart on the same UUID — without rehydrate, scope.ts /
 * stop-validator / UPS finalize see an empty touch list and skip gates.
 *
 * v1.5.0: optional `lastPromptKind` (`status`|`ship`|`work`) — UPS classifies
 * the user prompt; Stop soft-passes finalize on status checks so deploy/CI
 * questions are not blocked by documenter debt.
 *
 * v1.6.0: `toProjectRelativePath` / `extractTargetFiles` DROP paths outside the
 * project (Claude scratchpads under `/private/tmp/claude-*`, `~/.claude/skills`,
 * other repos). Those were polluting filesTouched → false finalize + plan-gate.
 *
 * v1.7.0: `lastStopKind` + `finalizeBlockCount` — Stop records why it blocked;
 * UPS injects COMMIT-FIRST / FINALIZE-NOW / COMPACT-NOW; finalize soft-passes
 * after repeated identical blocks (anti-thrash).
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
import { homedir } from 'os';
import { randomBytes } from 'crypto';
import { spawnSync } from 'child_process';

export const ACTIVE_MS = 180 * 1000;
export const IDLE_MS = 30 * 60 * 1000;
export const STALE_MS = 24 * 60 * 60 * 1000;
export const COLLISION_WINDOW_MS = 5 * 60 * 1000;

export const TOUCHES_ROTATE_THRESHOLD = 1000;
export const TOUCHES_TAIL_LINES = 200;
export const FILES_TOUCHED_CAP = 200;

export type SvsTarget = 'claude' | 'kimi' | 'grok';

/** Last UserPromptSubmit classification (UPS → Stop soft-pass). */
export type PromptKind = 'status' | 'ship' | 'work';

/** Why Stop last blocked (UPS recovery nudges). */
export type StopKind =
  | 'ok'
  | 'dirty'
  | 'branch'
  | 'finalize'
  | 'size'
  | 'secrets'
  | 'missing'
  | 'other';

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
  /** Which CLI owns this heartbeat (set by svs-bridge / SessionStart). */
  target?: SvsTarget;
  /** Product session folder (Kimi sessionDir or Grok session dir). */
  nativeSessionDir?: string;
  /** Set by UPS each turn — Stop skips finalize hard-block when `status`. */
  lastPromptKind?: PromptKind;
  /** Set by Stop — UPS injects COMMIT-FIRST / FINALIZE-NOW / COMPACT-NOW. */
  lastStopKind?: StopKind;
  /** Consecutive finalize hard-blocks; ≥2 → soft-pass (anti-thrash). */
  finalizeBlockCount?: number;
}

export interface NativeSessionMeta {
  nativeSessionDir?: string;
  transcriptPath?: string;
  title?: string;
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

/** Safe filename stem — keep real sessionId inside the JSON body. */
export function safeSessionFileId(sessionId: string): string {
  return sessionId.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 200) || 'unknown';
}

export function getSessionPath(stateDir: string, sessionId: string): string {
  return join(stateDir, 'sessions', `${safeSessionFileId(sessionId)}.json`);
}

export function readSession(stateDir: string, sessionId: string): SessionRecord | null {
  return readJsonSafe<SessionRecord>(getSessionPath(stateDir, sessionId));
}

export function getArchivedSessionPath(stateDir: string, sessionId: string): string {
  return join(stateDir, 'sessions', '_archive', `${safeSessionFileId(sessionId)}.json`);
}

export function readArchivedSession(stateDir: string, sessionId: string): SessionRecord | null {
  return readJsonSafe<SessionRecord>(getArchivedSessionPath(stateDir, sessionId));
}

/**
 * Move `_archive/<id>.json` → `sessions/<id>.json` when active is missing.
 * No-op if active already exists or archive is absent. Returns the restored record.
 */
export function unarchiveSession(stateDir: string, sessionId: string): SessionRecord | null {
  const activePath = getSessionPath(stateDir, sessionId);
  if (existsSync(activePath)) return readSession(stateDir, sessionId);
  const archPath = getArchivedSessionPath(stateDir, sessionId);
  if (!existsSync(archPath)) return null;
  try {
    ensureStateDirs(stateDir);
    renameSync(archPath, activePath);
    return readSession(stateDir, sessionId);
  } catch {
    return readArchivedSession(stateDir, sessionId);
  }
}

function dedupeFilesTouched(files: string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const f of files) {
    if (!f || typeof f !== 'string') continue;
    const n = f.replace(/\\/g, '/').replace(/^\.\//, '');
    if (!n || seen.has(n)) continue;
    seen.add(n);
    out.push(n);
    if (out.length >= FILES_TOUCHED_CAP) break;
  }
  return out;
}

/**
 * Rebuild filesTouched for a sessionId from the append-only edit log (+ rotated tails).
 * Order: oldest→newest; cap keeps the newest FILES_TOUCHED_CAP paths.
 */
export function filesTouchedFromLog(stateDir: string, sessionId: string): string[] {
  const paths: string[] = [];
  const main = join(stateDir, 'file-touches.jsonl');
  if (existsSync(main)) paths.push(main);
  const archDir = join(stateDir, 'file-touches', '_archive');
  if (existsSync(archDir)) {
    try {
      const archived = readdirSync(archDir)
        .filter((f) => f.endsWith('.jsonl'))
        .sort()
        .map((f) => join(archDir, f));
      paths.unshift(...archived);
    } catch {
      /* ignore */
    }
  }

  const ordered: string[] = [];
  let firstTs: string | undefined;
  for (const path of paths) {
    let text = '';
    try {
      text = readFileSync(path, 'utf8');
    } catch {
      continue;
    }
    for (const line of text.split('\n')) {
      if (!line.includes(sessionId)) continue;
      try {
        const row = JSON.parse(line) as FileTouch;
        if (row.sessionId !== sessionId || !row.file) continue;
        if (!firstTs && row.ts) firstTs = row.ts;
        ordered.push(row.file);
      } catch {
        /* skip bad line */
      }
    }
  }
  // Keep newest paths within cap (log is chronological).
  const capped =
    ordered.length > FILES_TOUCHED_CAP ? ordered.slice(-FILES_TOUCHED_CAP) : ordered;
  return dedupeFilesTouched(capped);
}

export function firstTouchTsFromLog(stateDir: string, sessionId: string): string | undefined {
  const main = join(stateDir, 'file-touches.jsonl');
  const candidates = [main];
  const archDir = join(stateDir, 'file-touches', '_archive');
  if (existsSync(archDir)) {
    try {
      candidates.unshift(
        ...readdirSync(archDir)
          .filter((f) => f.endsWith('.jsonl'))
          .sort()
          .map((f) => join(archDir, f))
      );
    } catch {
      /* ignore */
    }
  }
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      for (const line of readFileSync(path, 'utf8').split('\n')) {
        if (!line.includes(sessionId)) continue;
        const row = JSON.parse(line) as FileTouch;
        if (row.sessionId === sessionId && row.ts) return row.ts;
      }
    } catch {
      /* continue */
    }
  }
  return undefined;
}

export type RehydrateSource = 'active' | 'archive' | 'log' | 'none';

export interface RehydrateResult {
  /** Patch fields to merge into SessionStart heartbeat (never wipe non-empty active). */
  filesTouched: string[];
  startedAt?: string;
  title?: string;
  target?: SvsTarget;
  source: RehydrateSource;
}

/**
 * Recover session touch list after SessionEnd archive / idle archive / empty resume.
 * Prefer active → archive → file-touches.jsonl. Does not write disk by itself
 * (caller may unarchiveSession first).
 */
export function rehydrateSessionTouches(
  stateDir: string,
  sessionId: string,
  active: SessionRecord | null = readSession(stateDir, sessionId)
): RehydrateResult {
  const archived = readArchivedSession(stateDir, sessionId);
  const fromLog = filesTouchedFromLog(stateDir, sessionId);
  const activeTouches = Array.isArray(active?.filesTouched) ? active!.filesTouched : [];
  const archTouches = Array.isArray(archived?.filesTouched) ? archived!.filesTouched : [];

  if (activeTouches.length > 0) {
    const merged = dedupeFilesTouched([...activeTouches, ...fromLog]);
    return {
      filesTouched: merged,
      startedAt: active?.startedAt,
      title: active?.title,
      target: active?.target,
      source: 'active',
    };
  }

  if (archTouches.length > 0 || archived) {
    const merged = dedupeFilesTouched([...archTouches, ...fromLog]);
    return {
      filesTouched: merged,
      startedAt: archived?.startedAt || firstTouchTsFromLog(stateDir, sessionId),
      title: archived?.title,
      target: archived?.target,
      source: archTouches.length || archived ? 'archive' : 'log',
    };
  }

  if (fromLog.length > 0) {
    return {
      filesTouched: fromLog,
      startedAt: firstTouchTsFromLog(stateDir, sessionId),
      source: 'log',
    };
  }

  return { filesTouched: [], source: 'none' };
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
  const mergeTouches = (prev: string[] | undefined, next: string[] | undefined): string[] => {
    if (!Array.isArray(next)) return prev || [];
    // Never clobber a non-empty list with [] (SessionStart resume race).
    if (next.length === 0 && prev && prev.length > 0) return prev;
    return next;
  };
  const merged: SessionRecord = existing
    ? {
        ...existing,
        ...patch,
        sessionId: existing.sessionId || sessionId,
        lastSeenAt: now,
        lastActivity: activity,
        // Never wipe known target / native dir with undefined patches.
        target: patch.target ?? existing.target,
        nativeSessionDir: patch.nativeSessionDir ?? existing.nativeSessionDir,
        transcriptPath: patch.transcriptPath ?? existing.transcriptPath,
        startedAt: patch.startedAt || existing.startedAt,
        filesTouched: mergeTouches(existing.filesTouched, patch.filesTouched),
      }
    : {
        sessionId,
        title: patch.title || '(untitled)',
        cwd: patch.cwd || getProjectDir(),
        ppid: patch.ppid ?? process.ppid ?? 0,
        gitBranch: patch.gitBranch,
        transcriptPath: patch.transcriptPath,
        target: patch.target,
        nativeSessionDir: patch.nativeSessionDir,
        startedAt: patch.startedAt || now,
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
/**
 * Detect CLI target for registry tagging.
 * Prefer SVS_TARGET (bridge); fall back to session id shape (`session_*` → kimi).
 */
export function detectSvsTarget(input: Record<string, unknown> = {}): SvsTarget {
  const env = (process.env['SVS_TARGET'] || '').toLowerCase();
  if (env === 'kimi' || env === 'grok' || env === 'claude') return env;
  const tagged = String(input['svs_target'] || input['svsTarget'] || '').toLowerCase();
  if (tagged === 'kimi' || tagged === 'grok' || tagged === 'claude') return tagged;
  const sid = String(input['session_id'] || input['sessionId'] || '');
  if (sid.startsWith('session_')) return 'kimi';
  return 'claude';
}

/**
 * Resolve product-native session folder + best transcript/title for Kimi/Grok.
 * Fail-open: returns {} when indexes or dirs are missing.
 */
export function resolveNativeSessionMeta(
  projectDir: string,
  sessionId: string,
  target: SvsTarget
): NativeSessionMeta {
  try {
    if (target === 'kimi') {
      return resolveKimiSessionMeta(projectDir, sessionId);
    }
    if (target === 'grok') {
      return resolveGrokSessionMeta(projectDir, sessionId);
    }
  } catch {
    /* fail-open */
  }
  return {};
}

function resolveKimiSessionMeta(projectDir: string, sessionId: string): NativeSessionMeta {
  const indexPath = join(homedir(), '.kimi-code', 'session_index.jsonl');
  let sessionDir: string | undefined;
  if (existsSync(indexPath)) {
    const lines = readFileSync(indexPath, 'utf8').split('\n');
    const root = resolve(projectDir);
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i]?.trim();
      if (!line) continue;
      try {
        const row = JSON.parse(line) as {
          sessionId?: string;
          sessionDir?: string;
          workDir?: string;
        };
        if (row.sessionId === sessionId && row.sessionDir) {
          sessionDir = row.sessionDir;
          break;
        }
        if (
          !sessionDir &&
          row.sessionDir &&
          row.workDir &&
          resolve(row.workDir) === root &&
          row.sessionId === sessionId
        ) {
          sessionDir = row.sessionDir;
          break;
        }
      } catch {
        /* skip bad line */
      }
    }
  }
  if (!sessionDir) {
    // Fallback: scan wd_* folders for this session id
    const sessionsRoot = join(homedir(), '.kimi-code', 'sessions');
    if (existsSync(sessionsRoot)) {
      for (const wd of readdirSync(sessionsRoot)) {
        const candidate = join(sessionsRoot, wd, sessionId);
        if (existsSync(candidate)) {
          sessionDir = candidate;
          break;
        }
      }
    }
  }
  if (!sessionDir || !existsSync(sessionDir)) return {};

  let title: string | undefined;
  const statePath = join(sessionDir, 'state.json');
  if (existsSync(statePath)) {
    try {
      const st = JSON.parse(readFileSync(statePath, 'utf8')) as { title?: string };
      if (st.title && st.title !== 'New Session') title = truncate(st.title, 80);
    } catch {
      /* ignore */
    }
  }
  const wire = join(sessionDir, 'agents', 'main', 'wire.jsonl');
  return {
    nativeSessionDir: sessionDir,
    transcriptPath: existsSync(wire) ? wire : undefined,
    title,
  };
}

function resolveGrokSessionMeta(projectDir: string, sessionId: string): NativeSessionMeta {
  const enc = encodeURIComponent(resolve(projectDir));
  const sessionDir = join(homedir(), '.grok', 'sessions', enc, sessionId);
  if (!existsSync(sessionDir)) return {};

  let title: string | undefined;
  const summaryPath = join(sessionDir, 'summary.json');
  if (existsSync(summaryPath)) {
    try {
      const sum = JSON.parse(readFileSync(summaryPath, 'utf8')) as {
        session_summary?: string;
        info?: { id?: string };
      };
      const t = (sum.session_summary || '').trim();
      if (t) title = truncate(t, 80);
    } catch {
      /* ignore */
    }
  }
  const updates = join(sessionDir, 'updates.jsonl');
  const chat = join(sessionDir, 'chat_history.jsonl');
  const transcriptPath = existsSync(updates) ? updates : existsSync(chat) ? chat : undefined;
  return { nativeSessionDir: sessionDir, transcriptPath, title };
}

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
  // Kimi ids are `session_<uuid>` — show uuid prefix, not the literal "session_".
  const bare = sessionId.startsWith('session_') ? sessionId.slice('session_'.length) : sessionId;
  return bare.slice(0, 8);
}

export function classifyAge(ageMsec: number): 'active' | 'idle' | 'stale' {
  if (ageMsec < ACTIVE_MS) return 'active';
  if (ageMsec < IDLE_MS) return 'idle';
  return 'stale';
}

/**
 * Normalize a path to repo-relative form, or `null` if it is outside `projectDir`.
 *
 * Claude routinely Write()s session scratchpads under `/private/tmp/claude-<uid>/…`
 * and edits `~/.claude/skills|projects/…`. Recording those into filesTouched made
 * plan-gate fire early and Stop finalize treat scratch `.js`/`.php` as “source
 * edits” — blocking the turn for CLAUDE.md debt that does not apply.
 */
export function toProjectRelativePath(p: string, projectDir: string): string | null {
  if (typeof p !== 'string' || !p.trim()) return null;
  const root = resolve(projectDir);
  const abs = isAbsolute(p) ? resolve(p) : resolve(root, p);
  const rel = relative(root, abs);
  if (!rel || rel.startsWith('..') || isAbsolute(rel)) return null;
  return rel.split('\\').join('/');
}

/** Keep only in-project paths (repo-relative). Drops absolute outsides as-is. */
export function filterProjectPaths(paths: string[] | undefined, projectDir: string): string[] {
  if (!Array.isArray(paths) || paths.length === 0) return [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const p of paths) {
    const rel = toProjectRelativePath(p, projectDir);
    if (!rel || seen.has(rel)) continue;
    seen.add(rel);
    out.push(rel);
  }
  return out;
}

/**
 * Inspect tool input and return project-relative paths that will be touched.
 * Paths outside the project are omitted (not recorded).
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
    const rel = toProjectRelativePath(p, projectDir);
    if (!rel) return; // outside project — ignore (scratchpads, ~/.claude, other repos)
    out.push(rel);
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
  const tgt = peer.target ? ` ·${peer.target}` : '';
  return `[${klass}] ${shortId(peer.sessionId)} "${peer.title}"${branch}${tgt} idle=${idleStr}`;
}
