#!/usr/bin/env node
// @sv-version: 1.22.0
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
 * v1.22.0: Grok finalize — no svs-document first Read; background:true;
 * HEREDOC commit body; --push after C2 (not C1).
 * v1.21.0: Grok writer roles pin low (4.6 floor). Child Reads svs-document.
 * v1.20.0: Grok spawn — do not pass reasoning_effort (schema omit). Role pin + type hook.
 * v1.19.0: Grok spawn custom type + reasoning_effort low; richer native agents.
 * v1.18.0: Grok-native lean agents; no restamp spawn after docs commit.
 * v1.17.0: Grok spawn — short prompt, child Reads `.grok/agents/<name>.md`
 * (`general-purpose`, isolation none; no explore writer; do not paste the file).
 * v1.16.0: THEME APPLY (memory react-theme-parity 1.1 + skill react-theme-apply)
 * — CSS-first, check-theme-tokens, both modes; style-guide path if present.
 * v1.15.0: WP plugin ops nudge (memory owned-wordpress-plugin-ops) — search +
 * neutralize on owned sites; refuse cracked/nulled keys.
 * v1.14.0: Always refresh gitBranch from live HEAD; MAIN-ONLY ship nudge when
 * peers active or off main (memory multi-instance-main-only). SHIP NOW requires main.
 * v1.13.0: WATERMARK HYGIENE step + CONTENT nudge (memory remove-ai-watermarks;
 * skill remove-ai-marks) — inspect/clean Layer A when shipping user-facing prose.
 * v1.12.0: SHIP NOW = SAFE SHIP (push+deploy) vs ATTENTION GATE (ask before
 * commit); workflow auth lasts until loop closes; full artifact inventory.
 * v1.11.0: STOP-RECOVERY nudges from lastStopKind (COMMIT-FIRST / FINALIZE-NOW /
 * COMPACT-NOW); CLAUDE.md soft-cap 36k warn; memories quality-gate-before-push,
 * cdn-asset-deploy-verify, oauth-integration-preflight.
 * v1.10.1: FINALIZE nudge only when in-project source was touched.
 * v1.10.0: Prompt kind `status`|`ship`|`work` + SHIP NOW.
 * v1.9.0: VERIFY-EVIDENCE + MULTI-PART EXECUTE nudges (memory verify-before-claim)
 * when prompt asks for review/security/audit or lists multiple || parts — block
 * memory-only answers and “which first?” evasion.
 * v1.8.2: FINALIZE order = scope commit → documenter → domain-updater → docs commit
 * (was inverted; matches Claude + skill svs-finalize).
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
  filterProjectPaths,
  heartbeat,
  listPeerSessions,
  readSession,
  readStdinJson,
  resolveNativeSessionMeta,
  shortId,
  truncate,
  type InboxMessage,
  type PromptKind,
  type SessionRecord,
  type StopKind,
} from './_state.js';

const CLAUDE_MD_SOFT = 36000;

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

function buildPeersBlock(
  stateDir: string,
  sessionId: string,
  prompt: string,
  promptKind: PromptKind
): string {
  ensureStateDirs(stateDir);

  // Heartbeat + capture title on first prompt of the session.
  const existing = readSession(stateDir, sessionId);
  const target = detectSvsTarget({ session_id: sessionId, sessionId });
  const native = resolveNativeSessionMeta(PROJECT_DIR, sessionId, target);
  const titleNeeded = !existing || !existing.title || existing.title === '(untitled)';
  const title = titleNeeded
    ? native.title || extractTitle(existing?.transcriptPath || native.transcriptPath, prompt)
    : existing!.title;

  // Always refresh from live HEAD — cached gitBranch goes stale after peer checkout -b.
  const branch = getGitBranch(PROJECT_DIR) || existing?.gitBranch;

  heartbeat(stateDir, sessionId, 'UserPromptSubmit', {
    title,
    cwd: PROJECT_DIR,
    gitBranch: branch,
    target: existing?.target || target,
    nativeSessionDir: existing?.nativeSessionDir || native.nativeSessionDir,
    transcriptPath: existing?.transcriptPath || native.transcriptPath,
    lastPromptKind: promptKind,
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
      parts.push(
        '  ! SHARED CWD = ONE HEAD (memory: multi-instance-main-only): do NOT `git checkout -b` — ' +
          'it moves every peer. Stay on main; commit+push versioned deploys from main only. ' +
          'Parallel long features → `git worktree add` (separate cwd).'
      );
    }
  }

  // Live branch gate (Stop already blocks off-main; ship must not push feature branches).
  {
    const live = getGitBranch(PROJECT_DIR);
    if (live && live !== 'main' && live !== 'master') {
      parts.push('');
      parts.push(`MAIN-ONLY SHIP (memory: multi-instance-main-only) — HEAD is '${live}', not main:`);
      parts.push('  - FORBIDDEN: git push / scope --push / deploy / republish from this branch.');
      parts.push('  - Fix: git checkout main (merge feature first if yours), then ship from main.');
      parts.push('  - scope --push hard-refuses non-main unless --allow-non-main-push.');
    }
  }

  if (inbox.length > 0) {
    parts.push('');
    parts.push(`INBOX (${inbox.length} message${inbox.length === 1 ? '' : 's'} from peers — surface to the user):`);
    for (const m of inbox) parts.push(formatInbox(m));
  }

  // Status checks must stay light — do not pile finalize onto "foi publicado?".
  if (promptKind === 'status') return parts.join('\n');

  const touched = filterProjectPaths(
    readSession(stateDir, sessionId)?.filesTouched || existing?.filesTouched || [],
    PROJECT_DIR
  );
  const hasSource = touched.some((f) =>
    /\.(ts|tsx|js|jsx|mjs|cjs|php|py|go|rs|vue|svelte)$/i.test(f)
  );
  if (hasSource) {
    parts.push('');
    parts.push('FINALIZE CHAIN REQUIRED (source edits — skill svs-finalize; same order as Claude):');
    parts.push('  1. commit-manager → scope.ts commit HEREDOC "<type>: <code>"  (never git add -A; no --push yet)');
    parts.push('  2. documenter → domains + _index.json');
    parts.push('  3. domain-updater → PREPEND CLAUDE.md ## Recent Changes');
    parts.push('  4. If docs dirty → scope.ts commit HEREDOC "docs: …" --push on main');
    parts.push('  Grok: spawn subagent_type documenter|domain-updater, capability_mode all, background true, isolation none. Do NOT pass reasoning_effort. Writer roles pin low. SHORT prompt (HEAD+files+what shipped). Do not paste. Do not tell child to Read svs-document/AGENTS.md first. Do not poll in the same turn if the user has a next question. Do not restamp after docs:. Not explore/plan as documenter.');
    parts.push('  Kimi: Read .claude/agents/<name>.md and execute inline.');
    parts.push('  FORBIDDEN: push C1 before documenter; subject-only git message when why is non-obvious; claim done while ahead of origin; skip domain-updater; trust child “done” without jq/rg verify. Stop BLOCKS if stale.');
  }

  return parts.join('\n');
}

const UI_PROMPT_RE =
  /\b(page|pages|layout|component|ui|ux|theme|tema|moon|tailwind|css|jsx|tsx|inertia|react|frontend|modal|sidebar|dashboard|STYLES|dark\s*mode|preline|shadcn|tabela|contraste|hover|style\s*guide)\b/i;
const REACT_UI_FILE_RE = /\.(jsx|tsx)$/i;
const THEME_CSS_FILE_RE = /(?:themes\/.+\.css|\.css)$/i;

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
  const touchedUi = touched.some((f) => REACT_UI_FILE_RE.test(f) || THEME_CSS_FILE_RE.test(f));
  const promptUi = UI_PROMPT_RE.test(prompt);
  if (!touchedUi && !promptUi) return '';

  const hasThemes = existsSync(join(projectDir, 'resources', 'css', 'themes'));
  const hasGuide = existsSync(join(projectDir, 'docs', 'design', 'style-guide'));
  const themeHint = hasThemes
    ? 'CSS-FIRST: patch theme.css + moon (or active theme) BOTH blocks + @theme inline before any JSX token migrate.'
    : 'No themes/ folder — copy class patterns from 1–2 sibling pages. Do not invent a palette.';
  const guideHint = hasGuide
    ? '\n  Style guide present: follow `docs/design/style-guide/` recipes (guide wins; grep wins on counts).'
    : '';

  return (
    `\n\nTHEME APPLY (memory: react-theme-parity 1.1 + skill react-theme-apply):\n` +
    `  1. ${themeHint}${guideHint}\n` +
    `  2. Order: CSS truth → Common/shell → pages → shared JS. Same layout + STYLES. No new UI lib.\n` +
    `  3. LAWS: no dark: on semantic tokens; no text-white on bg-primary; no invented tokens;\n` +
    `     hover must differ from parent surface; tables opaque; extract JS ⇒ rg every old ident.\n` +
    `  4. BEFORE done: \`node scripts/check-theme-tokens.mjs\` (and DesignSystemGuard if the project has it).\n` +
    `  5. Prove LIGHT and DARK (toggle or computed style). curl UA must be a browser (CF 520 ≠ down).`
  );
}

/** Review / audit / “is it correct?” — must re-open code this turn. */
const VERIFY_PROMPT_RE =
  /\b(revis[aã]o|revisar|review|audit|auditoria|verif(?:y|ique|icar)|adversarial|seguran[cç]a|security|owasp|deep\s*dive|an[aá]lise\s+profunda|est[aá]\s+tudo\s+correto|n[aã]o\s+passar\s+nada|confirme|validate)\b/i;

/** Multi-part user asks — execute all; do not pick one and ask which first. */
const MULTI_PART_RE =
  /\|\||outra\s+coisa|e\s+tamb[eé]m|fa[cç]a\s+o\s+que\s+pedi|voc[eê]\s+(s[oó]\s+)?ignorou|al[eé]m\s+diss[oa]/i;

const CHANGE_VERB_RE =
  /\b(renomear|rename|mudar|alterar|implementar|ligar|ativar|criar|remover|fix|deploy)\b/i;

/** Status / CI / “was it published?” — keep UPS light. */
const STATUS_PROMPT_RE =
  /\b(veja\s+se|foi\s+publicado|was\s+it\s+(published|deployed)|check\s+(if|whether|deploy|ci|prod|status)|est[aá]\s+(no|em|na)\s+(prod|produção|cdn|origin)|acompanhe|watch\s+(ci|deploy|actions)|gh\s+run|j[aá]\s+(subi|publicou|deploy)|ainda\s+n[aã]o\s+(subiu|publicou)|local\s+vs\s+origin)\b/i;

/** Urgent ship / push / republish — execute, do not wait. */
const SHIP_PROMPT_RE =
  /\b(git\s+push|push\s+origin|publique|publicar|urgente|produ[cç][aã]o|republish|republique|deploy\s+agora|ship\s+it|mande\s+(pro|para)\s+(prod|main)|commite,?\s+acompanhe|problema\s+urgente)\b/i;

function classifyPrompt(prompt: string): PromptKind {
  if (SHIP_PROMPT_RE.test(prompt)) return 'ship';
  if (STATUS_PROMPT_RE.test(prompt) && !CHANGE_VERB_RE.test(prompt)) return 'status';
  if (STATUS_PROMPT_RE.test(prompt) && prompt.trim().length < 100) return 'status';
  return 'work';
}

/** User-facing content / watermark hygiene prompts. */
const CONTENT_WATERMARK_RE =
  /\b(artigo|article|landing|funil|funnel|copy|html|markdown|\.md\b|\.html\b|watermark|marca\s*d[\'']?\s*agua|claude\s*marks|c2pa|synthid|remove-ai-marks|publique\s+o\s+(artigo|texto)|escreva\s+(o\s+)?(artigo|texto|landing))\b/i;

/** Owned WordPress plugin search / crash recovery. */
const WP_PLUGIN_OPS_RE =
  /\b(wordpress|wp-cli|wp-content|wp-admin|mu-plugin|plugin\s+(fatal|quebr|whitescreen|wsod)|desativ[ae].*plugin|plugin.*desativ|freemius|wp_die|critical\s+error)\b/i;

function buildWpPluginOpsBlock(prompt: string): string {
  if (!WP_PLUGIN_OPS_RE.test(prompt)) return '';
  return (
    `\n\nWP PLUGIN OPS (memory: owned-wordpress-plugin-ops + skill owned-wordpress-plugin-ops):\n` +
    `  Owned site only. Search wp-content/plugins; stabilize (wp plugin deactivate / mu-plugin kill).\n` +
    `  Neutralize = crash-guard / unhook / early-return — site must load. Prove front + wp-admin.\n` +
    `  FORBIDDEN: stolen license keys, fake license servers, “nulled” plugin packs.\n` +
    `  If user said “nullar” as crack: refuse the crack; still recover the site.`
  );
}

function buildWatermarkHygieneBlock(prompt: string): string {
  if (!CONTENT_WATERMARK_RE.test(prompt)) return '';
  return (
    `\n\nWATERMARK HYGIENE (memory: remove-ai-watermarks + skill remove-ai-marks):\n` +
    `  Before done: python3 "$CLAUDE_PROJECT_DIR/.claude/skills/remove-ai-marks/scripts/inspect_file.py" --json <artifact>\n` +
    `  If suspicious_total > 0 or real C2PA/AI file metadata → clean_file/clean_text, re-inspect, report counts.\n` +
    `  Ignore WordPress data-ai-* / ai-check-block ad-plugin false positives.\n` +
    `  Offer Layer B rewrite for prose (non-origin model). Never claim “proves human-written”.`
  );
}

function buildShipNowBlock(prompt: string): string {
  if (!SHIP_PROMPT_RE.test(prompt)) return '';
  return (
    `\n\nSHIP NOW (memory: execute-ship-ops v1.3) — classify then act:\n` +
    `  SAFE SHIP (on main/master, scoped, no secrets, tests OK, deploy targets known, matches user ask):\n` +
    `    1. Commit via scope.ts → \`git push origin main\` immediately — FORBIDDEN: “push is your job” / re-asking.\n` +
    `    2. \`gh run list/watch\` (post-push-ci-verification).\n` +
    `    3. Run EVERY republish op for touched/named artifacts (launchers AND separate ones e.g. pw.js).\n` +
    `    4. Live curl/marker proof (cdn-asset-deploy-verify). Workflow auth lasts until this loop closes.\n` +
    `  ATTENTION GATE (off main, secrets, destructive migration, peer file conflict, tests red, unclear blast, incomplete deploy inventory):\n` +
    `    Do NOT commit/push. Ask the user with: Risk / Evidence / Options (proceed | fix first | abort).\n` +
    `    Off main / peer created a feature branch in shared cwd → checkout main first (memory multi-instance-main-only).\n` +
    `    FORBIDDEN: fake Attention for generic caution or multi-instance lore without a real conflict.`
  );
}

function buildStatusOnlyMessage(peersBlock: string, recoveryBlock: string): string {
  return (
    `STATUS CHECK (memory: execute-ship-ops) — light turn:\n` +
    `  - Answer with git/gh/curl only. Do NOT start finalize, CLAUDE.md updates, UI agents, or Playwright.\n` +
    `  - If local is ahead of origin, say so with SHAs — do not invent “waiting for you” when the user asked to ship.\n` +
    `  - Stop soft-passes finalize debt on status turns; finish documenter later on a work/ship turn.` +
    recoveryBlock +
    peersBlock
  );
}

function buildStopRecoveryBlock(
  lastStopKind: StopKind | undefined,
  claudeChars: number
): string {
  const parts: string[] = [];
  if (lastStopKind === 'dirty') {
    parts.push(
      '',
      'STOP-RECOVERY — COMMIT-FIRST (memory: execute-ship-ops):',
      '  Last Stop BLOCKED on uncommitted session files. BEFORE anything else:',
      '  1. npx tsx "$CLAUDE_PROJECT_DIR/.claude/hooks/scope.ts" status',
      '  2. npx tsx "$CLAUDE_PROJECT_DIR/.claude/hooks/scope.ts" commit "<type>: <summary>"',
      '  3. Re-Stop. FORBIDDEN: answering the user while session files stay dirty.'
    );
  } else if (lastStopKind === 'finalize') {
    parts.push(
      '',
      'STOP-RECOVERY — FINALIZE-NOW (skill: svs-finalize):',
      '  Last Stop found source edits without documenter → domain-updater.',
      '  Run that chain THIS turn (or after commit if still dirty). Do not re-Stop hoping it passes.'
    );
  } else if (lastStopKind === 'size' || claudeChars > CLAUDE_MD_SOFT) {
    parts.push(
      '',
      `STOP-RECOVERY — COMPACT-NOW: CLAUDE.md is ${claudeChars || '?'} chars (soft ${CLAUDE_MD_SOFT} / hard 40000).`,
      '  Run claude-md-compactor BEFORE domain-updater prepends another Recent Changes entry.'
    );
  } else if (lastStopKind === 'branch') {
    parts.push(
      '',
      'STOP-RECOVERY — merge feature branch to main, then push (never leave Stop blocked on branch).'
    );
  }
  return parts.join('\n');
}

function claudeMdCharCount(projectDir: string): number {
  try {
    const p = join(projectDir, 'CLAUDE.md');
    if (!existsSync(p)) return 0;
    return readFileSync(p, 'utf8').length;
  } catch {
    return 0;
  }
}

function buildVerifyEvidenceBlock(prompt: string): string {
  if (!VERIFY_PROMPT_RE.test(prompt)) return '';

  const securityAsked =
    /\b(seguran[cç]a|security|adversarial|owasp|n[aã]o\s+passar\s+nada)\b/i.test(prompt);

  const lines = [
    '',
    'VERIFY-EVIDENCE REQUIRED (memory: verify-before-claim) — do NOT answer from prior-turn memory:',
    '  1. BEFORE any ✅/❌ table: fresh Read/Grep/Bash on the LIVE tree for each claim.',
    '  2. Cite file paths (line ranges when useful). No open this turn → no ✅ for that step.',
    '  3. FORBIDDEN: memory-only reviews, “sólido” without paths, skipping tools to save tokens.',
  ];
  if (securityAsked) {
    lines.push(
      '  4. SECURITY/ADVERSARIAL: walk trust boundaries (tenant, authz, artifact create/update/DELETE/orphan,',
      '     injection, secret exposure). Severity + fix. Load defensive-security-review + security-assessment-ops.',
      '     Do NOT soft-pass with a short “sólido” paragraph.'
    );
  }
  return lines.join('\n');
}

function buildMultiPartExecuteBlock(prompt: string): string {
  const hasPipeParts = /\|\|/.test(prompt);
  const hasMultiSignal = MULTI_PART_RE.test(prompt);
  if (!hasPipeParts && !hasMultiSignal) return '';

  const changeHint = CHANGE_VERB_RE.test(prompt)
    ? `\n  - Analysis-only is incomplete when the user also asked to rename/change/implement.`
    : '';

  return (
    `\n\nMULTI-PART EXECUTE (memory: verify-before-claim):\n` +
    `  - Parse EVERY part of this prompt into todos (analysis AND change verbs).\n` +
    `  - Execute all parts this session — FORBIDDEN: “renderer first or rename?” when both were ordered.` +
    changeHint
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
  const promptKind = classifyPrompt(prompt);
  const claudeChars = claudeMdCharCount(PROJECT_DIR);

  let peersBlock = '';
  let touchedFiles: string[] = [];
  let lastStopKind: StopKind | undefined;
  const sessionId: string | undefined = hookInput.session_id || hookInput.sessionId;
  if (sessionId) {
    const stateDir = getStateDir(PROJECT_DIR);
    try {
      peersBlock = buildPeersBlock(stateDir, sessionId, prompt, promptKind);
      const sess = readSession(stateDir, sessionId);
      touchedFiles = sess?.filesTouched || [];
      lastStopKind = sess?.lastStopKind;
    } catch {
      peersBlock = '';
    }
  }

  const recoveryBlock = buildStopRecoveryBlock(lastStopKind, claudeChars);

  // Dirty recovery wins even on status prompts — commit before CI narration.
  if (promptKind === 'status' && lastStopKind !== 'dirty') {
    console.log(
      JSON.stringify({
        continue: true,
        systemMessage: buildStatusOnlyMessage(peersBlock, recoveryBlock),
      })
    );
    process.exit(0);
  }

  let themeParityBlock = '';
  try {
    themeParityBlock = buildThemeParityBlock(PROJECT_DIR, prompt, touchedFiles);
  } catch {
    themeParityBlock = '';
  }

  let verifyBlock = '';
  let multiPartBlock = '';
  let shipBlock = '';
  let watermarkBlock = '';
  let wpPluginBlock = '';
  try {
    verifyBlock = buildVerifyEvidenceBlock(prompt);
    multiPartBlock = buildMultiPartExecuteBlock(prompt);
    shipBlock = buildShipNowBlock(prompt);
    watermarkBlock = buildWatermarkHygieneBlock(prompt);
    wpPluginBlock = buildWpPluginOpsBlock(prompt);
  } catch {
    verifyBlock = '';
    multiPartBlock = '';
    shipBlock = '';
    watermarkBlock = '';
    wpPluginBlock = '';
  }

  const systemMessage = `TASK WORKFLOW (Stack: ${stackName}):

0. READ both CLAUDE.md and .claude/config/active-project.json before changes.

1. CREATE a detailed todo-list breaking down the request.
   Include "Update CLAUDE.md" as final task.

2. WORK through each item sequentially.

3. DEAD-CODE HYGIENE — after replacements/refactors, delete unused legacy/inert paths
   in the same change (skill: dead-code-hygiene). Evidence via grep + typecheck/tests;
   do not leave // LEGACY stubs. On /fix: only code made unreachable by this fix.

3b. AI WATERMARK HYGIENE — after writing/editing user-facing prose, articles, landings,
   .md/.html (or when shipping AI-authored copy): run skill remove-ai-marks inspect;
   if Layer A / real C2PA hits → clean before done (memory: remove-ai-watermarks).
   Skip pure code-only changes. Ignore WordPress data-ai-* ad-plugin false positives.

4. Run quality gates: ${qualityCmd}

5. COMMIT via commit-manager (v3.4.0+: scope.ts; tests before push — veto if red). Classify SAFE SHIP vs ATTENTION GATE (execute-ship-ops v1.3 + multi-instance-main-only): SAFE only on main/master → push+watch+every deploy artifact; ATTENTION if off main / peer checkout risk / other risks. scope --push refuses non-main. After push: post-push-ci-verification + cdn-asset-deploy-verify.

5b. IDE SYNC — if Cursor shows "Opened changes / Save file to continue" during edits, that is buffer sync (not Bypass failure). Ask user to save or allow-all once; re-Read; see memory cursor-ide-edit-sync + .claude/settings.local.example.json.

5c. OAuth / third-party redirect setup — verify redirect_uri + client secrets against the live console BEFORE claiming the plan is ready (memory: oauth-integration-preflight).

6. UPDATE CLAUDE.md:
   a. PREPEND a new entry under "## Recent Changes" — heading exactly:
      "### ${today} · <branch> · <version-or-tag>" followed by 1-4 plain-text lines.
      Append-only LIFO; cap 10 (drop ONLY the oldest if exceeded). Multi-instance safe.
      If CLAUDE.md > ${CLAUDE_MD_SOFT} chars, run claude-md-compactor FIRST.
   b. Update ALL affected rule/flow sections (Critical Rules, FORBIDDEN, NRY) when the change
      modifies how the project works.

7. Run stop-validator before finishing.${recoveryBlock}${standardsContext}${peersBlock}${themeParityBlock}${verifyBlock}${multiPartBlock}${shipBlock}${watermarkBlock}${wpPluginBlock}`;

  console.log(JSON.stringify({ continue: true, systemMessage }));
  process.exit(0);
}

main().catch(() => {
  console.log(JSON.stringify({ continue: true }));
  process.exit(0);
});

void truncate;
