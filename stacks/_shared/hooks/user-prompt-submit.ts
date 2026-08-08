#!/usr/bin/env node
// @sv-version: 1.8.1
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
 * v1.8.1: peer coordination points at /svs-peers (Claude native /peers = ListAgents).
 * v1.8.0: THEME PARITY nudge for React UI projects (memory react-theme-parity)
 * when prompt/session involves .jsx/.tsx — discover theme or sibling CSS; validate
 * before done (long-session design drift).
 * v1.7.0: when filesTouched includes source, inject FINALIZE CHAIN (svs-finalize)
 * so Kimi/Grok cannot “forget” documenter → domain-updater.
 * v1.6.0: re-tag `target` + native session paths on heartbeat (Kimi/Grok parity).
 * v1.5.0: Cursor Opened-changes / Save-file prompts = IDE buffer sync (memory
 * cursor-ide-edit-sync); optional settings.local.example for acceptEdits/bypass.
 * v1.4.0: after commit/push, verify GitHub Actions (gh run list/watch) before
 * claiming deploy success — memory post-push-ci-verification + commit-manager 5.5.
 * v1.3.0: workflow adds dead-code hygiene step (skill `dead-code-hygiene`) between
 * WORK and quality gates — remove inert legacy paths before commit.
 * v1.2.0: workflow guidance now points at `## Recent Changes` (append-only LIFO)
 * instead of `## Last Change` (overwritten). Aligned with `commit-manager` v3.0.0
 * and `domain-updater` v3.0.0 — multi-instance safe.
 */

import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
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
  const target = detectSvsTarget({ session_id: sessionId, sessionId });
  const native = resolveNativeSessionMeta(PROJECT_DIR, sessionId, target);
  const titleNeeded = !existing || !existing.title || existing.title === '(untitled)';
  const title = titleNeeded
    ? native.title || extractTitle(existing?.transcriptPath || native.transcriptPath, prompt)
    : existing!.title;

  const branch = existing?.gitBranch ?? getGitBranch(PROJECT_DIR);

  heartbeat(stateDir, sessionId, 'UserPromptSubmit', {
    title,
    cwd: PROJECT_DIR,
    gitBranch: branch,
    target: existing?.target || target,
    nativeSessionDir: existing?.nativeSessionDir || native.nativeSessionDir,
    transcriptPath: existing?.transcriptPath || native.transcriptPath,
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
          'Use `/svs-peers` → peers.ts notify (Claude native /peers is ListAgents/SendMessage).'
      );
    }
  }

  if (inbox.length > 0) {
    parts.push('');
    parts.push(`INBOX (${inbox.length} message${inbox.length === 1 ? '' : 's'} from peers — surface to the user):`);
    for (const m of inbox) parts.push(formatInbox(m));
  }

  const touched = readSession(stateDir, sessionId)?.filesTouched || existing?.filesTouched || [];
  const hasSource = touched.some((f) =>
    /\.(ts|tsx|js|jsx|mjs|cjs|php|py|go|rs|vue|svelte)$/i.test(f)
  );
  if (hasSource) {
    parts.push('');
    parts.push('FINALIZE CHAIN REQUIRED (source edits in this session — skill svs-finalize):');
    parts.push('  Before claiming done: documenter → domain-updater (CLAUDE.md Recent Changes) → scope commit.');
    parts.push('  Kimi/Grok: Read .grok/agents/<name>.md (or .claude/agents/) and execute steps inline — no Task auto-invoke.');
    parts.push('  FORBIDDEN: code-only push without docs. Stop will BLOCK if CLAUDE/_index.json are stale.');
  }

  return parts.join('\n');
}

const UI_PROMPT_RE =
  /\b(page|pages|layout|component|ui|ux|theme|tailwind|css|jsx|tsx|inertia|react|frontend|modal|sidebar|dashboard|STYLES|dark\s*mode|preline|shadcn)\b/i;
const REACT_UI_FILE_RE = /\.(jsx|tsx)$/i;

function projectHasReactUi(projectDir: string): boolean {
  const markers = [
    join(projectDir, 'resources', 'js'),
    join(projectDir, 'resources', 'css', 'themes'),
    join(projectDir, 'resources', 'css', 'app.css'),
  ];
  if (markers.some((p) => existsSync(p))) return true;
  try {
    const pkgPath = join(projectDir, 'package.json');
    if (!existsSync(pkgPath)) return false;
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    const hasReact = Boolean(deps['react']);
    const hasUiStack = Boolean(
      deps['@inertiajs/react'] ||
        deps['@inertiajs/vue3'] ||
        deps['vite'] ||
        deps['next'] ||
        deps['tailwindcss']
    );
    return hasReact && hasUiStack;
  } catch {
    return false;
  }
}

function buildThemeParityBlock(
  projectDir: string,
  prompt: string,
  touched: string[]
): string {
  if (!projectHasReactUi(projectDir)) return '';
  const touchedUi = touched.some((f) => REACT_UI_FILE_RE.test(f));
  const promptUi = UI_PROMPT_RE.test(prompt);
  if (!touchedUi && !promptUi) return '';

  const themeHint = existsSync(join(projectDir, 'resources', 'css', 'themes'))
    ? 'Read `resources/css/themes/*` + `app.css` first.'
    : 'No themes/ folder — copy CSS/class patterns from 1–2 sibling pages in the same area.';

  return (
    `\n\nTHEME PARITY REQUIRED (memory: react-theme-parity) — long sessions drift off the house UI:\n` +
    `  1. BEFORE UI edits: discover theme tokens OR sibling-page class patterns. ${themeHint}\n` +
    `  2. Same layout shell + STYLES const (or feature styles.js); no new UI lib (shadcn/MUI) unless already in package.json.\n` +
    `  3. Prefer semantic tokens (bg-primary, text-foreground, …) when the project has them; do not mix with random gray-/dark: soup.\n` +
    `  4. BEFORE done: run the checklist in \`.claude/memories/react-theme-parity.md\` (buttons, forms, Common/*, dark/token flip).\n` +
    `  5. Re-read theme + one sibling page before each new UI chunk in this session.`
  );
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
  let touchedFiles: string[] = [];
  const sessionId: string | undefined = hookInput.session_id || hookInput.sessionId;
  if (sessionId) {
    const stateDir = getStateDir(PROJECT_DIR);
    try {
      peersBlock = buildPeersBlock(stateDir, sessionId, prompt);
      touchedFiles = readSession(stateDir, sessionId)?.filesTouched || [];
    } catch {
      peersBlock = '';
    }
  }

  let themeParityBlock = '';
  try {
    themeParityBlock = buildThemeParityBlock(PROJECT_DIR, prompt, touchedFiles);
  } catch {
    themeParityBlock = '';
  }

  const systemMessage = `TASK WORKFLOW (Stack: ${stackName}):

0. READ both CLAUDE.md and .claude/config/active-project.json before changes.

1. CREATE a detailed todo-list breaking down the request.
   Include "Update CLAUDE.md" as final task.

2. WORK through each item sequentially.

3. DEAD-CODE HYGIENE — after replacements/refactors, delete unused legacy/inert paths
   in the same change (skill: dead-code-hygiene). Evidence via grep + typecheck/tests;
   do not leave // LEGACY stubs. On /fix: only code made unreachable by this fix.

4. Run quality gates: ${qualityCmd}

5. COMMIT using conventional commits via commit-manager agent (v3.2.0+: stages only THIS session's files via scope.ts when .claude/state/ exists — peers' uncommitted files are never bundled). After push, VERIFY GitHub Actions for the SHA (gh run list/watch) — do not claim deploy success without checking (memory: post-push-ci-verification).

5b. IDE SYNC — if Cursor shows "Opened changes / Save file to continue" during edits, that is buffer sync (not Bypass failure). Ask user to save or allow-all once; re-Read; see memory cursor-ide-edit-sync + .claude/settings.local.example.json.

6. UPDATE CLAUDE.md:
   a. PREPEND a new entry under "## Recent Changes" — heading exactly:
      "### ${today} · <branch> · <version-or-tag>" followed by 1-4 plain-text lines.
      Append-only LIFO; cap 10 (drop ONLY the oldest if exceeded). Multi-instance safe.
      Triggered automatically by domain-updater v3.0.0; do it manually only if running outside the chain.
   b. Update ALL affected rule/flow sections (Critical Rules, FORBIDDEN, NRY) when the change
      modifies how the project works.

7. Run stop-validator before finishing.${standardsContext}${peersBlock}${themeParityBlock}`;

  console.log(JSON.stringify({ continue: true, systemMessage }));
  process.exit(0);
}

main().catch(() => {
  console.log(JSON.stringify({ continue: true }));
  process.exit(0);
});

void truncate;
