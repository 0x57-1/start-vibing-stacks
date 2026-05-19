#!/usr/bin/env node
// @sv-version: 1.2.0
/**
 * UserPromptSubmit Hook — Start Vibing Stacks
 *
 * Two responsibilities:
 *  1. Inject the per-stack workflow + project-standards context block.
 *  2. Multi-instance coordination: heartbeat the session, capture the title
 *     from the first prompt (matches `claude --resume`), drain the inbox so
 *     peer messages reach the user before this turn runs, and warn if active
 *     peers exist.
 *
 * v1.2.0: workflow guidance now points at `## Recent Changes` (append-only LIFO)
 * instead of `## Last Change` (overwritten). Aligned with `commit-manager` v3.0.0
 * and `domain-updater` v3.0.0 — multi-instance safe.
 */

import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import {
  ACTIVE_MS,
  ageMs,
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
  shortId,
  truncate,
  type InboxMessage,
  type SessionRecord,
} from './_state.js';

const PROJECT_DIR = getProjectDir();
const ACTIVE_PROJECT = join(PROJECT_DIR, '.claude', 'config', 'active-project.json');
const STANDARDS_REVIEW = join(PROJECT_DIR, '.claude', 'config', 'standards-review.json');

let stackName = 'Unknown';
let qualityCmd = 'Run quality gates';
try {
  if (existsSync(ACTIVE_PROJECT)) {
    const config = JSON.parse(readFileSync(ACTIVE_PROJECT, 'utf8'));
    stackName = config.stack || 'Unknown';
    const stackConfig = join(PROJECT_DIR, '.claude', 'config', 'quality-gates.json');
    if (existsSync(stackConfig)) {
      const gates = JSON.parse(readFileSync(stackConfig, 'utf8'));
      qualityCmd = gates.runAll || qualityCmd;
    }
  }
} catch {}

interface ReviewFile {
  status: string;
  sources?: string[];
  patterns?: { category: string; name: string }[];
}

let standardsContext = '';
try {
  if (!existsSync(STANDARDS_REVIEW)) {
    standardsContext =
      `\n\nSTANDARDS REVIEW NEEDED: No standards-review.json found. ` +
      `This project may have existing coding standards (.cursorrules, composer.json configs). ` +
      `Ask the user: "I noticed this project hasn't been scanned for existing standards. ` +
      `Would you like me to review your codebase patterns and adapt my behavior, ` +
      `or should I use the default standards?"`;
  } else {
    const review: ReviewFile = JSON.parse(readFileSync(STANDARDS_REVIEW, 'utf8'));
    if (review.status === 'adapted' && review.patterns && review.patterns.length > 0) {
      const patternList = review.patterns.map(p => `- [${p.category}] ${p.name}`).join('\n');
      standardsContext =
        `\n\nPROJECT STANDARDS (scanned from ${(review.sources || []).join(', ')}):\n${patternList}\n` +
        `Follow these project-specific patterns. They take priority over generic defaults.`;
    }
  }
} catch {}

function formatInbox(m: InboxMessage): string {
  const from = m.fromTitle ? `${shortId(m.fromSessionId)} "${m.fromTitle}"` : shortId(m.fromSessionId);
  return `  [${m.ts}] from ${from}: ${m.message}`;
}

function buildPeersBlock(stateDir: string, sessionId: string, prompt: string): string {
  ensureStateDirs(stateDir);

  // Heartbeat + capture title on first prompt of the session.
  const existing = readSession(stateDir, sessionId);
  const titleNeeded = !existing || !existing.title || existing.title === '(untitled)';
  const title = titleNeeded
    ? extractTitle(existing?.transcriptPath, prompt)
    : existing!.title;

  const branch = existing?.gitBranch ?? getGitBranch(PROJECT_DIR);

  heartbeat(stateDir, sessionId, 'UserPromptSubmit', {
    title,
    cwd: PROJECT_DIR,
    gitBranch: branch,
  });

  const peers: SessionRecord[] = listPeerSessions(stateDir, sessionId);
  const inbox = drainInbox(stateDir, sessionId);

  const parts: string[] = [];
  if (peers.length > 0) {
    const activeCount = peers.filter(p => ageMs(p.lastSeenAt) < ACTIVE_MS).length;
    parts.push('');
    parts.push(`PEER INSTANCES IN THIS PROJECT (${peers.length}, ${activeCount} active):`);
    for (const p of peers) parts.push(`  - ${formatPeer(p)}`);
    if (activeCount > 0) {
      parts.push(
        '  ! Edit/Write of files an active peer just touched will be BLOCKED. ' +
          'Use `/peers notify <id> "message"` to coordinate.'
      );
    }
  }

  if (inbox.length > 0) {
    parts.push('');
    parts.push(`INBOX (${inbox.length} message${inbox.length === 1 ? '' : 's'} from peers — surface to the user):`);
    for (const m of inbox) parts.push(formatInbox(m));
  }

  return parts.join('\n');
}

async function main(): Promise<void> {
  const hookInput = await readStdinJson(1500);
  const prompt: string =
    hookInput.user_prompt || hookInput.prompt || hookInput.userPrompt || '';
  if (!prompt.trim()) {
    console.log(JSON.stringify({ continue: true }));
    process.exit(0);
  }

  const today = new Date().toISOString().split('T')[0];

  let peersBlock = '';
  const sessionId: string | undefined = hookInput.session_id || hookInput.sessionId;
  if (sessionId) {
    const stateDir = getStateDir(PROJECT_DIR);
    try {
      peersBlock = buildPeersBlock(stateDir, sessionId, prompt);
    } catch {
      peersBlock = '';
    }
  }

  const systemMessage = `TASK WORKFLOW (Stack: ${stackName}):

0. READ both CLAUDE.md and .claude/config/active-project.json before changes.

1. CREATE a detailed todo-list breaking down the request.
   Include "Update CLAUDE.md" as final task.

2. WORK through each item sequentially.

3. Run quality gates: ${qualityCmd}

4. COMMIT using conventional commits via commit-manager agent (v3.0.0+: stages only THIS session's files via scope.ts when .claude/state/ exists — peers' uncommitted files are never bundled).

5. UPDATE CLAUDE.md:
   a. PREPEND a new entry under "## Recent Changes" — heading exactly:
      "### ${today} · <branch> · <version-or-tag>" followed by 1-4 plain-text lines.
      Append-only LIFO; cap 10 (drop ONLY the oldest if exceeded). Multi-instance safe.
      Triggered automatically by domain-updater v3.0.0; do it manually only if running outside the chain.
   b. Update ALL affected rule/flow sections (Critical Rules, FORBIDDEN, NRY) when the change
      modifies how the project works.

6. Run stop-validator before finishing.${standardsContext}${peersBlock}`;

  console.log(JSON.stringify({ continue: true, systemMessage }));
  process.exit(0);
}

main().catch(() => {
  console.log(JSON.stringify({ continue: true }));
  process.exit(0);
});

void truncate;
