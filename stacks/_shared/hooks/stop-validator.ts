#!/usr/bin/env node
// @sv-version: 1.4.0
/**
 * Stop Validator Hook — Start Vibing Stacks (Universal)
 *
 * Reads active-project.json to determine stack-specific validations.
 * Blocks task completion if:
 * 1. Branch != main (work must be merged)
 * 2. Git tree not clean — SCOPED TO THIS SESSION'S filesTouched when available
 *    (multi-instance safe: peer N's dirty files do not block instance M's Stop)
 * 3. CLAUDE.md not updated
 * 4. CLAUDE.md missing required sections — accepts `## Last Change` OR `## Recent Changes`
 * 5. CLAUDE.md exceeds 40k chars
 * 6. Secret pattern detected in committed/staged files (uses gitleaks if present, fallback to regex)
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
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import {
  ACTIVE_MS,
  ageMs,
  archiveSession,
  clearInbox,
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
    const sess = readSession(stateDir, sessionId);
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
    : `\n\nComplete git workflow:\n1. git add -A\n2. git commit -m "type: description"\n3. git checkout main\n4. git merge ${branch}\n5. git push origin main\n6. git branch -d ${branch}`;

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
    reason: `ALL CHECKS PASSED ✅\nStack: ${stackId}\nBranch: ${branch}\nTree: Clean (this-session scope)\nSecrets: clean${orphanNote}`,
  };
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

  // Prevent loop
  if (hookInput.stop_hook_active) {
    console.log(JSON.stringify({ continue: false, decision: 'approve', reason: 'Cycle detected' }));
    process.exit(0);
  }

  // Multi-instance coordination side effects.
  const sessionId: string | undefined = hookInput.session_id || hookInput.sessionId;

  const result = validate(sessionId);
  const eventName: string = hookInput.hook_event_name || hookInput.hookEventName || '';
  const isSessionEnd = /SessionEnd/i.test(eventName);

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

    // Journal once on SessionEnd (Stop may also fire — avoid duplicate digests).
    if (isSessionEnd && sessionId) {
      const rec = readSession(stateDir, sessionId);
      appendJournalEntry(PROJECT_DIR, {
        target: process.env['SVS_TARGET'],
        sessionId,
        branch: rec?.gitBranch,
        filesTouched: rec?.filesTouched,
        startedAt: rec?.startedAt,
      });
      archiveSession(stateDir, sessionId);
      clearInbox(stateDir, sessionId);
    }
  } catch {}

  console.log(JSON.stringify(result));
  process.exit(0);
}

main().catch(() => {
  console.log(JSON.stringify({ continue: false, decision: 'approve', reason: 'Hook error' }));
  process.exit(0);
});
