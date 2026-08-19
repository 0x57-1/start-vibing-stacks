#!/usr/bin/env node
// @sv-version: 1.12.0
/**
 * Stop Validator Hook — Start Vibing Stacks (Universal)
 *
 * Reads active-project.json to determine stack-specific validations.
 * Blocks task completion if:
 * 1. Branch != main (work must be merged)
 * 2. Git tree not clean — SCOPED TO THIS SESSION'S filesTouched when available
 *    (multi-instance safe: peer N's dirty files do not block instance M's Stop)
 * 3. CLAUDE.md not updated this session after source edits (finalize chain)
 * 4. CLAUDE.md missing required sections — accepts `## Last Change` OR `## Recent Changes`
 * 5. CLAUDE.md exceeds 40k chars
 * 6. Secret pattern detected in committed/staged files (uses gitleaks if present, fallback to regex)
 * 7. Domain `_index.json#last_commit` stale vs HEAD after source edits (documenter skipped).
 *    Docs-only HEAD (C2) may still stamp the parent code SHA (C1) — that is OK.
 *
 * v1.12.0: finalize hint — HEREDOC commit, background spawn, --push after C2.
 * v1.11.0: last_commit may equal HEAD~1 when HEAD is docs-only (no restamp spawn).
 * v1.10.0: record `lastStopKind` for UPS COMMIT-FIRST / FINALIZE-NOW / COMPACT-NOW;
 * finalize anti-thrash (soft-pass after 2 identical hard-blocks); warn when
 * CLAUDE.md > 36k (soft cap) before hard 40k block.
 *
 * v1.9.1: finalize only counts in-project filesTouched (ignore Claude scratchpads).
 * v1.9.0: status-turn finalize soft-pass.
 * v1.8.2: Grok observe-only Stop skip; stopHookActive camelCase.
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import {
  ACTIVE_MS,
  ageMs,
  archiveSession,
  clearInbox,
  filterProjectPaths,
  heartbeat,
  rehydrateSessionTouches,
  unarchiveSession,
  ensureStateDirs,
  formatPeer,
  getStateDir,
  listPeerSessions,
  nowIso,
  readSession,
  type StopKind,
} from './_state.js';
import { appendJournalEntry } from './_brain.js';

const PROJECT_DIR = process.env['CLAUDE_PROJECT_DIR'] || process.cwd();
const CLAUDE_MD = join(PROJECT_DIR, 'CLAUDE.md');
const ACTIVE_PROJECT = join(PROJECT_DIR, '.claude', 'config', 'active-project.json');
const MAX_CHARS = 40000;
/** Soft cap — UPS/Stop warn + compact before domain-updater prepends more. */
const SOFT_CHARS = 36000;
/** After this many consecutive finalize hard-blocks, soft-pass (anti-thrash). */
const FINALIZE_THRASH_LIMIT = 2;

// Load stack info
let stackId = 'unknown';
try {
  if (existsSync(ACTIVE_PROJECT)) {
    const config = JSON.parse(readFileSync(ACTIVE_PROJECT, 'utf8'));
    stackId = config.stack || 'unknown';
  }
} catch {}

// Source extensions per stack
const STACK_EXTENSIONS: Record<string, Set<string>> = {
  php: new Set(['.php', '.blade.php', '.twig']),
  nodejs: new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs']),
  python: new Set(['.py']),
  go: new Set(['.go']),
  rust: new Set(['.rs']),
};

const sourceExtensions = STACK_EXTENSIONS[stackId] || new Set(['.ts', '.js', '.php', '.py']);

/** Broad source set for finalize-chain (all stacks). */
const FINALIZE_SOURCE_RE =
  /\.(ts|tsx|js|jsx|mjs|cjs|php|py|go|rs|vue|svelte|blade\.php)$/i;

function finalizeHint(): string {
  const target = (process.env['SVS_TARGET'] || '').toLowerCase();
  const prefix =
    `\n\nFINALIZE CHAIN (required — skill svs-finalize; same order as Claude):\n` +
    `0. If code still uncommitted: commit-manager → scope.ts commit HEREDOC (never git add -A; no --push yet)\n`;
  if (target === 'grok') {
    return (
      prefix +
      `1. spawn_subagent(subagent_type="documenter", background=true, isolation=none)  (or Read .grok/agents/documenter.md)\n` +
      `2. spawn_subagent(subagent_type="domain-updater", background=true)  (PREPEND CLAUDE.md ## Recent Changes)\n` +
      `3. scope.ts commit HEREDOC "docs: …" --push on main if docs dirty\n` +
      `4. Continue until Stop approves (do not claim done while blocked or ahead of origin)`
    );
  }
  if (target === 'kimi') {
    return (
      prefix +
      `1. Read + execute .claude/agents/documenter.md\n` +
      `2. Read + execute .claude/agents/domain-updater.md (PREPEND ## Recent Changes)\n` +
      `3. scope.ts commit HEREDOC "docs: …" --push on main if docs dirty\n` +
      `4. Continue until Stop approves (do not claim done while blocked or ahead of origin)`
    );
  }
  return (
    prefix +
    `1. Run documenter agent (Task / spawn)\n` +
    `2. Run domain-updater (PREPEND CLAUDE.md ## Recent Changes)\n` +
    `3. scope.ts commit "docs: …" if docs dirty\n` +
    `4. Re-run Stop`
  );
}

interface HookResult {
  continue: boolean;
  decision: 'approve' | 'block';
  reason: string;
}

function cmd(command: string): string {
  try {
    return execSync(command, { cwd: PROJECT_DIR, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
  } catch {
    return '';
  }
}

/** True when stamp matches HEAD, or HEAD is a docs-only commit on top of the stamp (C2). */
function indexLastCommitOk(last: string, head: string, headShort: string): boolean {
  if (last === head || last === headShort || head.startsWith(last)) return true;
  const parentShort = cmd('git rev-parse --short HEAD~1');
  if (!parentShort) return false;
  const parentMatch =
    last === parentShort || last.startsWith(parentShort) || parentShort.startsWith(last);
  if (!parentMatch) return false;
  const names = cmd('git diff-tree --no-commit-id --name-only -r HEAD')
    .split('\n')
    .filter(Boolean);
  if (names.length === 0) return false;
  return names.every(
    (f) =>
      /\.md$/i.test(f) ||
      f.includes('codebase-knowledge/') ||
      /^CHANGELOG/i.test(f)
  );
}

function getBranch(): string {
  return cmd('git rev-parse --abbrev-ref HEAD') || 'unknown';
}

function getModifiedFiles(): string[] {
  const staged = cmd('git diff --name-only --cached').split('\n').filter(Boolean);
  const unstaged = cmd('git diff --name-only').split('\n').filter(Boolean);
  const untracked = cmd('git ls-files --others --exclude-standard').split('\n').filter(Boolean);
  return [...new Set([...staged, ...unstaged, ...untracked])];
}

/**
 * Per-instance scoping: if a session id is provided AND state has filesTouched,
 * return only the dirty files THIS session edited. Otherwise return the full
 * dirty list (backward compatible). Falls back gracefully on any error.
 */
function getScopedDirtyFiles(sessionId: string | undefined): {
  scoped: string[];
  perInstance: boolean;
  totalDirty: number;
} {
  const allDirty = getModifiedFiles();
  if (!sessionId) {
    // Cannot resolve session — do NOT block on dirty files (would mix peer work).
    // Surface a warning instead (handled by caller).
    return { scoped: [], perInstance: false, totalDirty: allDirty.length };
  }
  try {
    const stateDir = getStateDir(PROJECT_DIR);
    if (!readSession(stateDir, sessionId)) unarchiveSession(stateDir, sessionId);
    let sess = readSession(stateDir, sessionId);
    if (!sess?.filesTouched?.length) {
      const hydrated = rehydrateSessionTouches(stateDir, sessionId, sess);
      if (hydrated.filesTouched.length > 0) {
        sess = heartbeat(stateDir, sessionId, 'Stop:rehydrate', {
          filesTouched: hydrated.filesTouched,
          startedAt: hydrated.startedAt,
        });
      }
    }
    if (!sess || !Array.isArray(sess.filesTouched) || sess.filesTouched.length === 0) {
      // No reliable session record — do NOT block on dirty files.
      return { scoped: [], perInstance: false, totalDirty: allDirty.length };
    }
    const set = new Set(sess.filesTouched);
    return { scoped: allDirty.filter(f => set.has(f)), perInstance: true, totalDirty: allDirty.length };
  } catch {
    // On any error resolving session state, fail open (no block).
    return { scoped: [], perInstance: false, totalDirty: allDirty.length };
  }
}

/**
 * Run a command capturing stdout, stderr and exit code without throwing.
 */
function runCapture(command: string): { code: number; stdout: string; stderr: string } {
  try {
    const stdout = execSync(command, {
      cwd: PROJECT_DIR,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return { code: 0, stdout: stdout.toString(), stderr: '' };
  } catch (err: any) {
    return {
      code: typeof err?.status === 'number' ? err.status : 1,
      stdout: err?.stdout?.toString?.() ?? '',
      stderr: err?.stderr?.toString?.() ?? '',
    };
  }
}

/**
 * Scan staged + unstaged diff for secret patterns.
 * Uses gitleaks when installed; otherwise applies a high-signal regex sweep.
 * Returns a list of findings (empty = clean).
 */
function scanSecrets(): string[] {
  const findings: string[] = [];

  const hasGitleaks = cmd('command -v gitleaks').length > 0;
  if (hasGitleaks) {
    const { code, stdout, stderr } = runCapture(
      'gitleaks detect --no-banner --redact --exit-code 1 --log-level=error'
    );
    if (code !== 0) {
      const out = stdout + '\n' + stderr;
      const lines = out
        .split('\n')
        .filter(l => l.includes('Finding:') || l.includes('File:') || l.includes('Secret:'));
      if (lines.length > 0) findings.push(...lines.slice(0, 20));
      else findings.push('gitleaks reported leaks (run `gitleaks detect --redact -v` for details)');
    }
    return findings;
  }

  // Fallback: high-signal regex sweep over staged + unstaged diff
  const SECRET_RE = /(?:api[_-]?key|secret|token|bearer|password|aws_(?:access|secret)_key|private_key)\s*[:=]\s*["'][A-Za-z0-9/+=_\-.]{16,}["']/i;
  const PUBLIC_LEAK_RE = /(?:NEXT_PUBLIC|VITE|REACT_APP)_[A-Z_]*(?:SECRET|TOKEN|PRIVATE|PASSWORD|CREDENTIAL)/;
  const PLACEHOLDER_RE = /<\s*your[_\- ]|YOUR_[A-Z_]+|placeholder|example\.com|sk_test_|sk_xxx|xxxxxxxx/i;

  const diff = cmd('git diff --cached -U0') + '\n' + cmd('git diff -U0');
  if (!diff.trim()) return findings;

  const lines = diff.split('\n');
  for (const line of lines) {
    if (!line.startsWith('+') || line.startsWith('+++')) continue;
    if (PLACEHOLDER_RE.test(line)) continue;
    if (SECRET_RE.test(line) || PUBLIC_LEAK_RE.test(line)) {
      const masked = line.replace(/(["']).{8,}\1/, '$1[REDACTED]$1').slice(0, 160);
      findings.push(masked);
      if (findings.length >= 5) break;
    }
  }
  return findings;
}

function validate(sessionId: string | undefined): HookResult {
  const branch = getBranch();
  const isMain = branch === 'main' || branch === 'master';
  const { scoped: modified, perInstance, totalDirty } = getScopedDirtyFiles(sessionId);
  const isClean = modified.length === 0;
  const scopeNote = perInstance
    ? ` (this-session-scoped: ${modified.length}/${totalDirty} dirty; peer files ignored)`
    : '';

  // 1. Must be on main with clean tree (scoped to THIS session when possible).
  //    Recommendation uses `/commit-mine` rather than `git add -A`, which would
  //    pull in peer-session changes (see CLAUDE.md NRY "Instance N's commit bundling...").
  const commitGuide = perInstance
    ? `\n\nRecommended workflow (multi-instance safe):\n1. npx tsx "$CLAUDE_PROJECT_DIR/.claude/hooks/scope.ts" status\n2. npx tsx "$CLAUDE_PROJECT_DIR/.claude/hooks/scope.ts" stage\n3. git commit -m "type: description"\n4. git checkout main && git merge ${branch} && git push origin main && git branch -d ${branch}`
    : `\n\nComplete git workflow (scoped — never git add -A):\n1. npx tsx "$CLAUDE_PROJECT_DIR/.claude/hooks/scope.ts" status\n2. npx tsx "$CLAUDE_PROJECT_DIR/.claude/hooks/scope.ts" commit "type: description"\n   (if exit 1: peers.ts list → scope commit --session <id>)\n3. git checkout main && git merge ${branch} && git push origin main && git branch -d ${branch}`;

  if (!isMain && modified.length > 0) {
    return {
      continue: true,
      decision: 'block',
      reason: `BLOCKED: On branch '${branch}' with ${modified.length} modified files${scopeNote}.${commitGuide}`,
    };
  }

  if (!isMain) {
    return {
      continue: true,
      decision: 'block',
      reason: `BLOCKED: On branch '${branch}'. Switch to main:\n1. git checkout main\n2. git merge ${branch}\n3. git push origin main`,
    };
  }

  if (!isClean) {
    const stageHint = perInstance
      ? `\n\nCOMMIT-FIRST (do this before answering further):\n  npx tsx "$CLAUDE_PROJECT_DIR/.claude/hooks/scope.ts" commit "<type>: <summary>"\nThen re-Stop. Do NOT narrate — run the commit.`
      : `\n\nCOMMIT-FIRST: commit or stash before completing.`;
    return {
      continue: true,
      decision: 'block',
      reason: `BLOCKED: ${modified.length} uncommitted files${scopeNote}:\n${modified.slice(0, 10).map(f => `  - ${f}`).join('\n')}${stageHint}`,
    };
  }

  // 2. CLAUDE.md must exist
  if (!existsSync(CLAUDE_MD)) {
    return {
      continue: true,
      decision: 'block',
      reason: 'BLOCKED: CLAUDE.md not found. Create it with required sections.',
    };
  }

  const content = readFileSync(CLAUDE_MD, 'utf8');

  // 3. Size check (hard 40k; soft 36k warn on approve)
  if (content.length > MAX_CHARS) {
    return {
      continue: true,
      decision: 'block',
      reason:
        `BLOCKED: CLAUDE.md is ${content.length} chars (max ${MAX_CHARS}). ` +
        `COMPACT-NOW: run claude-md-compactor agent (drop oldest Recent Changes; keep ≤ ${SOFT_CHARS}).`,
    };
  }
  const sizeWarn =
    content.length > SOFT_CHARS
      ? `\n\nWARN: CLAUDE.md is ${content.length} chars (soft cap ${SOFT_CHARS}). ` +
        `Run claude-md-compactor BEFORE domain-updater prepends another Recent Changes entry.`
      : '';

  // 4. Required sections — `## Last Change` (single, overwritten) OR `## Recent Changes`
  //    (append-only LIFO, multi-instance safe) both satisfy the changelog slot.
  const required = [
    { pattern: /^# .+/m, name: 'Project Title (H1)' },
    { pattern: /^## (Last Change|Recent Changes)/m, name: 'Last Change OR Recent Changes' },
    { pattern: /^## Stack/m, name: 'Stack' },
  ];

  const missing = required.filter(r => !r.pattern.test(content)).map(r => r.name);
  if (missing.length > 0) {
    return {
      continue: true,
      decision: 'block',
      reason: `BLOCKED: CLAUDE.md missing sections: ${missing.join(', ')}`,
    };
  }

  // 5. Secret scan (gitleaks or regex fallback)
  const secrets = scanSecrets();
  if (secrets.length > 0) {
    return {
      continue: true,
      decision: 'block',
      reason: `BLOCKED: Potential secrets detected in diff:\n${secrets.map(s => `  - ${s}`).join('\n')}\n\nRotate the credential, remove from diff, and re-run.`,
    };
  }

  // 6. Finalize chain — source edits this session require docs (Kimi/Grok skip Task).
  //    Soft-pass: status turns OR finalize thrash (≥ FINALIZE_THRASH_LIMIT hard blocks).
  const finalizeBlock = checkFinalizeChain(sessionId, content);
  const thrashSoft = Boolean(finalizeBlock) && shouldSoftPassFinalize(sessionId);
  if (finalizeBlock) {
    if (isStatusPromptTurn(sessionId) || thrashSoft) {
      // Fall through to approve with a warning.
    } else {
      return finalizeBlock;
    }
  }
  let finalizeWarn = '';
  if (finalizeBlock && isStatusPromptTurn(sessionId)) {
    finalizeWarn =
      `\n\nWARN (status turn — finalize soft-pass): ${finalizeBlock.reason.split('\n')[0]}\n` +
      `Finish documenter → domain-updater on the next work/ship turn.`;
  } else if (finalizeBlock && thrashSoft) {
    finalizeWarn =
      `\n\nWARN (finalize anti-thrash — soft-pass after ${FINALIZE_THRASH_LIMIT} blocks): ` +
      `${finalizeBlock.reason.split('\n')[0]}\n` +
      `Do NOT claim the task fully done. NEXT turn MUST run documenter → domain-updater.`;
  }

  // All good. If per-instance scoping hid orphan dirty files (dirty, but not in
  // THIS session's filesTouched), surface them — they may be your own Bash/codegen
  // changes that post-tool-use could not attribute. We do NOT block on them.
  let orphanNote = '';
  if (perInstance && totalDirty > modified.length) {
    const orphans = getModifiedFiles().filter(f => !modified.includes(f));
    orphanNote =
      `\n\nNOTE: ${orphans.length} dirty file(s) are NOT attributed to this session ` +
      `(e.g. changed via Bash, a formatter, or codegen):\n` +
      orphans.slice(0, 10).map(f => `  ? ${f}`).join('\n') +
      `\nIf any are yours, commit them with \`scope.ts commit\` (only your files). ` +
      `If they belong to a peer, leave them. Do not \`git add -A\`.`;
  }

  return {
    continue: false,
    decision: 'approve',
    reason:
      `ALL CHECKS PASSED ✅\nStack: ${stackId}\nBranch: ${branch}\nTree: Clean (this-session scope)\nSecrets: clean\nFinalize: docs current` +
      sizeWarn +
      finalizeWarn +
      orphanNote,
  };
}

function shouldSoftPassFinalize(sessionId: string | undefined): boolean {
  if (!sessionId) return false;
  try {
    const n = readSession(getStateDir(PROJECT_DIR), sessionId)?.finalizeBlockCount || 0;
    return n >= FINALIZE_THRASH_LIMIT;
  } catch {
    return false;
  }
}

function classifyStopKind(result: HookResult): StopKind {
  if (result.decision === 'approve') {
    if (/finalize anti-thrash|finalize soft-pass/i.test(result.reason)) return 'finalize';
    return 'ok';
  }
  const r = result.reason;
  if (/uncommitted files/i.test(r)) return 'dirty';
  if (/CLAUDE\.md is \d+ chars/i.test(r)) return 'size';
  if (/was not updated|documenter skipped|_index\.json last_commit/i.test(r)) return 'finalize';
  if (/On branch/i.test(r)) return 'branch';
  if (/secrets detected/i.test(r)) return 'secrets';
  if (/CLAUDE\.md not found|missing sections/i.test(r)) return 'missing';
  return 'other';
}

function recordStopOutcome(sessionId: string | undefined, result: HookResult): void {
  if (!sessionId) return;
  try {
    const stateDir = getStateDir(PROJECT_DIR);
    ensureStateDirs(stateDir);
    const kind = classifyStopKind(result);
    const prev = readSession(stateDir, sessionId);
    let finalizeBlockCount = prev?.finalizeBlockCount || 0;
    if (result.decision === 'block' && kind === 'finalize') {
      finalizeBlockCount += 1;
    } else if (result.decision === 'approve' && kind === 'ok') {
      finalizeBlockCount = 0;
    }
    // Soft-pass finalize (status/thrash) keeps debt visible to UPS via lastStopKind.
    heartbeat(stateDir, sessionId, `Stop:${kind}`, {
      lastStopKind: kind,
      finalizeBlockCount,
      lastSeenAt: nowIso(),
    });
  } catch {
    /* fail-open */
  }
}

function isStatusPromptTurn(sessionId: string | undefined): boolean {
  if (!sessionId) return false;
  try {
    const sess = readSession(getStateDir(PROJECT_DIR), sessionId);
    return sess?.lastPromptKind === 'status';
  } catch {
    return false;
  }
}

function isFinalizeSourcePath(file: string): boolean {
  if (FINALIZE_SOURCE_RE.test(file)) return true;
  for (const ext of sourceExtensions) {
    if (file.endsWith(ext)) return true;
  }
  return false;
}

/** Parse first `### YYYY-MM-DD` under ## Recent Changes (or Last Change date line). */
function topChangelogDate(claudeMd: string): Date | null {
  const rc = claudeMd.match(/^## Recent Changes\s*\n([\s\S]*?)(?=\n## |\n# |$)/m);
  if (rc) {
    const m = rc[1]!.match(/###\s+(\d{4}-\d{2}-\d{2})\b/);
    if (m) {
      const d = Date.parse(`${m[1]}T00:00:00.000Z`);
      if (!Number.isNaN(d)) return new Date(d);
    }
  }
  const lc = claudeMd.match(/^## Last Change\s*\n[\s\S]*?\*\*Date:\*\*\s*(\d{4}-\d{2}-\d{2})/m);
  if (lc) {
    const d = Date.parse(`${lc[1]}T00:00:00.000Z`);
    if (!Number.isNaN(d)) return new Date(d);
  }
  return null;
}

function checkFinalizeChain(sessionId: string | undefined, claudeMd: string): HookResult | null {
  if (!sessionId) return null;
  let sess;
  try {
    const stateDir = getStateDir(PROJECT_DIR);
    if (!readSession(stateDir, sessionId)) unarchiveSession(stateDir, sessionId);
    sess = readSession(stateDir, sessionId);
    if (!sess?.filesTouched?.length) {
      const hydrated = rehydrateSessionTouches(stateDir, sessionId, sess);
      if (hydrated.filesTouched.length > 0) {
        sess = heartbeat(stateDir, sessionId, 'Stop:rehydrate', {
          filesTouched: hydrated.filesTouched,
          startedAt: hydrated.startedAt,
        });
      }
    }
  } catch {
    return null;
  }
  if (!sess?.filesTouched?.length || !sess.startedAt) return null;

  // Scratchpads / ~/.claude edits must not trigger finalize (v1.9.1).
  const inProject = filterProjectPaths(sess.filesTouched, PROJECT_DIR);
  const sourceTouched = inProject.filter(isFinalizeSourcePath);
  if (sourceTouched.length === 0) return null;

  const startedMs = Date.parse(sess.startedAt);
  if (Number.isNaN(startedMs)) return null;

  // CLAUDE.md must be touched in git after session start, OR top RC date >= session day (UTC).
  const claudeGitDate = cmd('git log -1 --format=%cI -- CLAUDE.md');
  const claudeGitMs = claudeGitDate ? Date.parse(claudeGitDate) : NaN;
  const topRc = topChangelogDate(claudeMd);
  const sessionDayStart = Date.parse(new Date(startedMs).toISOString().slice(0, 10) + 'T00:00:00.000Z');
  const claudeOk =
    (!Number.isNaN(claudeGitMs) && claudeGitMs >= startedMs - 60_000) ||
    (topRc !== null && topRc.getTime() >= sessionDayStart);

  if (!claudeOk) {
    return {
      continue: true,
      decision: 'block',
      reason:
        `BLOCKED: Source files edited this session but CLAUDE.md was not updated ` +
        `(no Recent Changes / git date since session start ${sess.startedAt}).` +
        `\nSource samples: ${sourceTouched.slice(0, 8).join(', ')}` +
        finalizeHint(),
    };
  }

  // documenter: when memory layer exists, _index.json last_commit must match HEAD
  const indexPath = join(
    PROJECT_DIR,
    '.claude',
    'skills',
    'codebase-knowledge',
    '_index.json'
  );
  if (existsSync(indexPath)) {
    try {
      const idx = JSON.parse(readFileSync(indexPath, 'utf8')) as { last_commit?: string };
      const head = cmd('git rev-parse HEAD');
      const headShort = cmd('git rev-parse --short HEAD');
      const last = (idx.last_commit || '').trim();
      if (last && head && !indexLastCommitOk(last, head, headShort)) {
        return {
          continue: true,
          decision: 'block',
          reason:
            `BLOCKED: codebase-knowledge _index.json last_commit=${last} ≠ HEAD=${headShort} ` +
            `(documenter skipped after source edits).` +
            finalizeHint(),
        };
      }
    } catch {
      /* fail-open on corrupt index */
    }
  }

  return null;
}

async function main(): Promise<void> {
  // Read stdin (hook input)
  let hookInput: any = {};
  try {
    const chunks: string[] = [];
    process.stdin.setEncoding('utf8');
    const timeout = setTimeout(() => process.stdin.destroy(), 1000);
    for await (const chunk of process.stdin) {
      chunks.push(chunk);
    }
    clearTimeout(timeout);
    hookInput = JSON.parse(chunks.join('') || '{}');
  } catch {}

  // Prevent loop (Claude snake_case + Grok Build 1.0 camelCase)
  const stopHookActive = Boolean(hookInput.stop_hook_active || hookInput.stopHookActive);
  if (stopHookActive) {
    console.log(JSON.stringify({ continue: false, decision: 'approve', reason: 'Cycle detected' }));
    process.exit(0);
  }

  const sessionId: string | undefined =
    hookInput.session_id || hookInput.sessionId || hookInput.id;
  const eventName: string = hookInput.hook_event_name || hookInput.hookEventName || '';
  const stopReason = String(hookInput.reason || hookInput.source || '');
  // Grok fires an extra observe-only Stop at session end — do not run gates.
  if (
    /Stop/i.test(eventName) &&
    (stopReason === 'channel_closed' || stopReason === 'shutdown')
  ) {
    console.log(
      JSON.stringify({
        continue: false,
        decision: 'approve',
        reason: `Stop observe-only (${stopReason}) — skipped validate`,
      })
    );
    process.exit(0);
  }
  const isSessionEnd = /SessionEnd/i.test(eventName);

  // SessionEnd = move registry JSON → _archive (Claude / Kimi / Grok). No validate.
  if (isSessionEnd) {
    try {
      const stateDir = getStateDir(PROJECT_DIR);
      ensureStateDirs(stateDir);
      if (sessionId) {
        const rec = readSession(stateDir, sessionId);
        appendJournalEntry(PROJECT_DIR, {
          target: process.env['SVS_TARGET'] || rec?.target,
          sessionId,
          branch: rec?.gitBranch,
          filesTouched: rec?.filesTouched,
          startedAt: rec?.startedAt,
        });
        archiveSession(stateDir, sessionId);
        clearInbox(stateDir, sessionId);
      }
    } catch {
      /* fail-open */
    }
    console.log(
      JSON.stringify({
        continue: false,
        decision: 'approve',
        reason: 'SessionEnd — archived to .claude/state/sessions/_archive/',
      })
    );
    process.exit(0);
  }

  const result = validate(sessionId);
  recordStopOutcome(sessionId, result);

  try {
    const stateDir = getStateDir(PROJECT_DIR);
    ensureStateDirs(stateDir);

    if (result.decision === 'approve' && sessionId) {
      const peers = listPeerSessions(stateDir, sessionId);
      const activePeers = peers.filter(p => ageMs(p.lastSeenAt) < ACTIVE_MS);
      if (activePeers.length > 0) {
        const lines = activePeers.map(p => `  - ${formatPeer(p)}`).join('\n');
        result.reason +=
          `\n\nNOTE: ${activePeers.length} peer instance(s) still active in this project:\n${lines}\n` +
          `If you committed and pushed, your work is now visible to them.`;
      }
    }
  } catch {}

  console.log(JSON.stringify(result));
  process.exit(0);
}

main().catch(() => {
  console.log(JSON.stringify({ continue: false, decision: 'approve', reason: 'Hook error' }));
  process.exit(0);
});
