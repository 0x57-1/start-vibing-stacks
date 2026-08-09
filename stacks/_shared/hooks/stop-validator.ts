#!/usr/bin/env node
// @sv-version: 1.9.0
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
 * 7. Domain `_index.json#last_commit` stale vs HEAD after source edits (documenter skipped)
 *
 * v1.2.0: per-instance scoping for the dirty-tree check + accept `## Recent Changes`
 * (append-only LIFO) as a valid changelog section. Source of truth for "what did
 * THIS session edit?" is `.claude/state/sessions/<id>.json#filesTouched`, maintained
 * by `post-tool-use.ts`.
 *
 * v1.3.0: on APPROVE, surface "orphan" dirty files — files dirty in the worktree
 * that are NOT in this session's filesTouched (e.g. changed via Bash, codegen, or
 * formatters, which post-tool-use cannot capture). These are scoped OUT of the
 * blocking check (so a peer's work never blocks you), but silently leaving them
 * behind is exactly what makes the NEXT instance "see files and hesitate to
 * deploy". We never block on them; we WARN so the agent can verify/own them.
 *
 * v1.5.0: SessionEnd is teardown-only (journal + archive + clearInbox) — skip
 * quality validate so Kimi/Grok closing a session cannot get blocked mid-exit.
 * Stop (end of turn) still runs the full validator.
 *
 * v1.6.0: after source filesTouched, require CLAUDE.md update since startedAt and
 * (when present) codebase-knowledge `_index.json` last_commit === HEAD — forces
 * Kimi/Grok documenter → domain-updater chain (skill svs-finalize).
 *
 * v1.7.0: FINALIZE_HINT is SVS_TARGET-aware (Grok spawn_subagent / Kimi Read agents).
 * Bridge v1.3.0 emits native Stop block for Grok/Kimi so the reason is fed back.
 *
 * v1.8.0: unscoped commitGuide no longer recommends `git add -A` — always scope.ts.
 *
 * v1.8.2: Grok Build 1.0 — honor stopHookActive camelCase; skip validate on
 * observe-only session-end Stop (`reason` channel_closed|shutdown).
 *
 * v1.9.0: when session `lastPromptKind === 'status'`, finalize-chain failures
 * become WARN (approve) — “foi publicado?” must not force documenter mid-check.
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import {
  ACTIVE_MS,
  ageMs,
  archiveSession,
  clearInbox,
  heartbeat,
  rehydrateSessionTouches,
  unarchiveSession,
  ensureStateDirs,
  formatPeer,
  getStateDir,
  listPeerSessions,
  readSession,
} from './_state.js';
import { appendJournalEntry } from './_brain.js';

const PROJECT_DIR = process.env['CLAUDE_PROJECT_DIR'] || process.cwd();
const CLAUDE_MD = join(PROJECT_DIR, 'CLAUDE.md');
const ACTIVE_PROJECT = join(PROJECT_DIR, '.claude', 'config', 'active-project.json');
const MAX_CHARS = 40000;

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
    `0. If code still uncommitted: commit-manager → scope.ts commit "<type>: <code>" (never git add -A)\n`;
  if (target === 'grok') {
    return (
      prefix +
      `1. spawn_subagent(subagent_type="documenter", …)  (or Read .grok/agents/documenter.md)\n` +
      `2. spawn_subagent(subagent_type="domain-updater", …)  (PREPEND CLAUDE.md ## Recent Changes)\n` +
      `3. scope.ts commit "docs: …" if docs dirty\n` +
      `4. Continue until Stop approves (do not claim done while blocked)`
    );
  }
  if (target === 'kimi') {
    return (
      prefix +
      `1. Read + execute .claude/agents/documenter.md\n` +
      `2. Read + execute .claude/agents/domain-updater.md (PREPEND ## Recent Changes)\n` +
      `3. scope.ts commit "docs: …" if docs dirty\n` +
      `4. Continue until Stop approves (do not claim done while blocked)`
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
      ? `\n\nThese files were edited by THIS session. Commit only your scope:\n  npx tsx "$CLAUDE_PROJECT_DIR/.claude/hooks/scope.ts" commit "<message>"`
      : `\n\nCommit or stash before completing.`;
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

  // 3. Size check
  if (content.length > MAX_CHARS) {
    return {
      continue: true,
      decision: 'block',
      reason: `BLOCKED: CLAUDE.md is ${content.length} chars (max ${MAX_CHARS}). Run claude-md-compactor agent.`,
    };
  }

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
  //    Status-check turns (UPS lastPromptKind=status) soft-pass so CI/deploy
  //    questions are not stuck behind documenter debt.
  const finalizeBlock = checkFinalizeChain(sessionId, content);
  if (finalizeBlock) {
    if (isStatusPromptTurn(sessionId)) {
      // Fall through to approve with a warning appended below.
    } else {
      return finalizeBlock;
    }
  }
  const finalizeWarn =
    finalizeBlock && isStatusPromptTurn(sessionId)
      ? `\n\nWARN (status turn — finalize soft-pass): ${finalizeBlock.reason.split('\n')[0]}\n` +
        `Finish documenter → domain-updater on the next work/ship turn.`
      : '';

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
      finalizeWarn +
      orphanNote,
  };
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

  const sourceTouched = sess.filesTouched.filter(isFinalizeSourcePath);
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
      if (last && head && last !== head && last !== headShort && !head.startsWith(last)) {
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
