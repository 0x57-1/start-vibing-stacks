/**
 * Start Vibing Stacks — Migrate (v2 — smart, idempotent, settings-aware)
 *
 * Compares installed vs bundled versions for skills, agents, hooks, commands AND memories.
 * Skills: copies the full skill folder (SKILL.md + reference/, TEMPLATE.md, …),
 * not only SKILL.md — missing companions mark the skill outdated.
 * Also reconciles runtime artefacts that earlier migrate versions ignored:
 *
 *  - hooks: parsed via `// @sv-version: x.y.z` header. Legacy installs (no tag)
 *    are skipped with a "needs-update-legacy" warning unless `--force-hooks` is
 *    passed (which makes a `.bak` copy before overwriting).
 *  - commands: same `version:` frontmatter contract as skills/agents.
 *  - memories: `.md` files in `stacks/_shared/memories/` with `version:` frontmatter;
 *    they are copied into `.claude/memories/` and auto-added to `settings.json#context.memory_files`.
 *  - .claude/settings.json — patched idempotently to ensure the bundled hook
 *    chain (SessionStart / UserPromptSubmit / PreToolUse / PostToolUse / Stop /
 *    SessionEnd) is wired, plus high-reasoning defaults `effortLevel: "xhigh"`
 *    and `permissions.defaultMode: "plan"` (only when MISSING — user choices are
 *    never clobbered). Existing entries are preserved; only missing entries
 *    are appended. Atomic write (.tmp + rename).
 *  - .claude/state/ — runtime layout for multi-instance coordination is
 *    auto-created and the `_state.README.md` is staged as `.claude/state/README.md`.
 *  - .gitignore — `.claude/state/` is appended if not already covered.
 */

import {
  existsSync,
  readFileSync,
  writeFileSync,
  copyFileSync,
  mkdirSync,
  statSync,
  readdirSync,
  renameSync,
} from 'fs';
import { join, relative, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { randomBytes } from 'crypto';
import * as semver from 'semver';
import * as ui from './ui.js';

const __m_filename = fileURLToPath(import.meta.url);
const __m_dirname = dirname(__m_filename);
const CLI_ROOT = resolve(__m_dirname, '..');

const FRONTMATTER_RE = /^---\s*\n([\s\S]*?)\n---/;
const VERSION_RE = /^version:\s*["']?([0-9]+\.[0-9]+\.[0-9]+(?:-[A-Za-z0-9.-]+)?)["']?\s*$/m;
// Hooks: // @sv-version (TS) or # @sv-version (shell)
const SV_VERSION_RE =
  /(?:\/\/|#)\s*@sv-version:\s*([0-9]+\.[0-9]+\.[0-9]+(?:-[A-Za-z0-9.-]+)?)/;

type Status =
  | 'missing'
  | 'outdated'
  | 'current'
  | 'ahead'
  | 'modified-no-version'
  | 'needs-update-legacy';

export interface MigrateItem {
  kind: 'skill' | 'agent' | 'hook' | 'command' | 'memory';
  name: string;
  source: string;
  target: string;
  bundledVersion: string;
  installedVersion: string | null;
  status: Status;
}

export interface MigrateOptions {
  apply: boolean;
  scope?: 'skills' | 'agents' | 'hooks' | 'commands' | 'memories' | 'all';
  forceHooks?: boolean;
  /** Multi-target: claude | kimi | grok | cursor | all (default all) */
  target?: 'claude' | 'kimi' | 'grok' | 'cursor' | 'all';
}

interface ProjectConfig {
  stack: string;
  frontendSkillsDir?: string;
}

function parseFrontmatterVersion(file: string): string | null {
  if (!existsSync(file)) return null;
  try {
    const content = readFileSync(file, 'utf8');
    const fm = FRONTMATTER_RE.exec(content);
    if (!fm) return null;
    const v = VERSION_RE.exec(fm[1] ?? '');
    return v?.[1] ?? null;
  } catch {
    return null;
  }
}

function parseHookVersion(file: string): string | null {
  if (!existsSync(file)) return null;
  try {
    const content = readFileSync(file, 'utf8').slice(0, 1024);
    const m = SV_VERSION_RE.exec(content);
    return m?.[1] ?? null;
  } catch {
    return null;
  }
}

function statusFromSemver(bundled: string, installed: string | null): Status {
  if (installed === null) return 'modified-no-version';
  const cmp = semver.compare(installed, bundled);
  if (cmp < 0) return 'outdated';
  if (cmp > 0) return 'ahead';
  return 'current';
}

/** Runtime / project-owned paths under a skill dir — never clobber on migrate. */
const SKILL_RUNTIME_DIRS = new Set(['domains', 'cache', 'node_modules', '.git']);
const SKILL_RUNTIME_FILES = new Set(['_index.json']);

/** Relative paths of bundled skill files (SKILL.md + reference/, TEMPLATE.md, …). */
function listSkillBundleRels(skillDir: string): string[] {
  const out: string[] = [];
  const walk = (dir: string, prefix: string) => {
    let entries: string[];
    try {
      entries = readdirSync(dir);
    } catch {
      return;
    }
    for (const name of entries) {
      if (name.startsWith('.') || name.endsWith('.bak')) continue;
      const rel = prefix ? `${prefix}/${name}` : name;
      const full = join(dir, name);
      let st;
      try {
        st = statSync(full);
      } catch {
        continue;
      }
      if (st.isDirectory()) {
        if (SKILL_RUNTIME_DIRS.has(name)) continue;
        walk(full, rel);
      } else if (st.isFile()) {
        if (SKILL_RUNTIME_FILES.has(name)) continue;
        out.push(rel);
      }
    }
  };
  walk(skillDir, '');
  return out.sort();
}

/** True when bundled companions (e.g. reference/*.md) are missing on disk. */
function skillCompanionsMissing(sourceSkillMd: string, targetSkillMd: string): boolean {
  const srcDir = dirname(sourceSkillMd);
  const tgtDir = dirname(targetSkillMd);
  for (const rel of listSkillBundleRels(srcDir)) {
    if (rel === 'SKILL.md') continue;
    if (!existsSync(join(tgtDir, rel))) return true;
  }
  return false;
}

/** Copy SKILL.md + companions from bundled skill folder (skips domains/cache/_index). */
function copySkillBundle(sourceSkillMd: string, targetSkillMd: string): void {
  const srcDir = dirname(sourceSkillMd);
  const tgtDir = dirname(targetSkillMd);
  mkdirSync(tgtDir, { recursive: true });
  for (const rel of listSkillBundleRels(srcDir)) {
    const from = join(srcDir, rel);
    const to = join(tgtDir, rel);
    mkdirSync(dirname(to), { recursive: true });
    copyFileSync(from, to);
  }
}

function listSubdirs(dir: string): string[] {
  if (!existsSync(dir)) return [];
  try {
    return readdirSync(dir).filter(n => {
      try {
        return statSync(join(dir, n)).isDirectory();
      } catch {
        return false;
      }
    });
  } catch {
    return [];
  }
}

function listFiles(dir: string, suffixes: string[]): string[] {
  if (!existsSync(dir)) return [];
  try {
    return readdirSync(dir).filter(
      n => suffixes.some(s => n.endsWith(s)) && !n.startsWith('_state.README')
    );
  } catch {
    return [];
  }
}

function listSkillSources(stack: string, frontendSkillsDir?: string): Array<{ source: string; name: string }> {
  const out: Array<{ source: string; name: string }> = [];
  const sharedDir = join(CLI_ROOT, 'stacks', '_shared', 'skills');
  const stackDir = join(CLI_ROOT, 'stacks', stack, 'skills');
  const frontendDir = frontendSkillsDir
    ? join(CLI_ROOT, 'stacks', 'frontend', frontendSkillsDir, 'skills')
    : null;

  for (const dir of [sharedDir, stackDir, frontendDir].filter(Boolean) as string[]) {
    for (const entry of listSubdirs(dir)) {
      const skillPath = join(dir, entry, 'SKILL.md');
      if (existsSync(skillPath)) out.push({ source: skillPath, name: entry });
    }
  }
  return out;
}

function listAgentSources(): Array<{ source: string; name: string }> {
  const dir = join(CLI_ROOT, 'stacks', '_shared', 'agents');
  return listFiles(dir, ['.md']).map(n => ({ source: join(dir, n), name: n }));
}

function listHookSources(): Array<{ source: string; name: string }> {
  const dir = join(CLI_ROOT, 'stacks', '_shared', 'hooks');
  // Track .ts/.sh/.mjs (runnable hooks + bridge + shared lib). _state.README.md separate.
  return listFiles(dir, ['.ts', '.sh', '.mjs']).map(n => ({ source: join(dir, n), name: n }));
}

function listCommandSources(): Array<{ source: string; name: string }> {
  const dir = join(CLI_ROOT, 'stacks', '_shared', 'commands');
  return listFiles(dir, ['.md']).map(n => ({ source: join(dir, n), name: n }));
}

function listMemorySources(): Array<{ source: string; name: string }> {
  const dir = join(CLI_ROOT, 'stacks', '_shared', 'memories');
  return listFiles(dir, ['.md']).map(n => ({ source: join(dir, n), name: n }));
}

function loadProjectConfig(projectDir: string): ProjectConfig | null {
  const path = join(projectDir, '.claude', 'config', 'active-project.json');
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return null;
  }
}

export function planMigration(projectDir: string, opts: MigrateOptions): MigrateItem[] {
  const config = loadProjectConfig(projectDir);
  if (!config) {
    ui.error('No .claude/config/active-project.json found. Run `npx start-vibing-stacks` first.');
    return [];
  }

  const items: MigrateItem[] = [];
  const scope = opts.scope ?? 'all';

  if (scope === 'all' || scope === 'skills') {
    for (const { source, name } of listSkillSources(config.stack, config.frontendSkillsDir)) {
      const target = join(projectDir, '.claude', 'skills', name, 'SKILL.md');
      const bundledVersion = parseFrontmatterVersion(source);
      if (!bundledVersion) continue;
      const installedVersion = parseFrontmatterVersion(target);
      let status: Status = !existsSync(target)
        ? 'missing'
        : statusFromSemver(bundledVersion, installedVersion);
      // SKILL.md alone is not enough — reference/, TEMPLATE.md, etc. must match bundle.
      if (
        (status === 'current' || status === 'ahead') &&
        skillCompanionsMissing(source, target)
      ) {
        status = 'outdated';
      }
      items.push({ kind: 'skill', name, source, target, bundledVersion, installedVersion, status });
    }
  }

  if (scope === 'all' || scope === 'agents') {
    for (const { source, name } of listAgentSources()) {
      const target = join(projectDir, '.claude', 'agents', name);
      const bundledVersion = parseFrontmatterVersion(source);
      if (!bundledVersion) continue;
      const installedVersion = parseFrontmatterVersion(target);
      const status: Status = !existsSync(target) ? 'missing' : statusFromSemver(bundledVersion, installedVersion);
      items.push({ kind: 'agent', name, source, target, bundledVersion, installedVersion, status });
    }
  }

  if (scope === 'all' || scope === 'hooks') {
    for (const { source, name } of listHookSources()) {
      const target = join(projectDir, '.claude', 'hooks', name);
      const bundledVersion = parseHookVersion(source) ?? '0.0.0';
      const installedVersion = parseHookVersion(target);

      let status: Status;
      if (!existsSync(target)) {
        status = 'missing';
      } else if (installedVersion === null) {
        status = bundledVersion === '0.0.0' ? 'current' : 'needs-update-legacy';
      } else {
        status = statusFromSemver(bundledVersion, installedVersion);
      }
      items.push({ kind: 'hook', name, source, target, bundledVersion, installedVersion, status });
    }
  }

  if (scope === 'all' || scope === 'commands') {
    for (const { source, name } of listCommandSources()) {
      const target = join(projectDir, '.claude', 'commands', name);
      const bundledVersion = parseFrontmatterVersion(source);
      if (!bundledVersion) continue;
      const installedVersion = parseFrontmatterVersion(target);
      let status: Status;
      if (!existsSync(target)) {
        status = 'missing';
      } else if (installedVersion === null) {
        // Commands are canonical infra files (slash-command routes). When the
        // installed copy lacks `version:` frontmatter it predates versioned
        // commands — treat as legacy so `--force-hooks` can heal it (same
        // .bak machinery as legacy hooks). Skills/agents stay manual-review.
        status = 'needs-update-legacy';
      } else {
        status = statusFromSemver(bundledVersion, installedVersion);
      }
      items.push({ kind: 'command', name, source, target, bundledVersion, installedVersion, status });
    }
  }

  if (scope === 'all' || scope === 'memories') {
    for (const { source, name } of listMemorySources()) {
      const target = join(projectDir, '.claude', 'memories', name);
      const bundledVersion = parseFrontmatterVersion(source);
      if (!bundledVersion) continue;
      const installedVersion = parseFrontmatterVersion(target);
      let status: Status;
      if (!existsSync(target)) {
        status = 'missing';
      } else if (installedVersion === null) {
        // Memories are safe declarative content. Unversioned installed copies
        // are treated as outdated so migrate updates them automatically.
        status = 'outdated';
      } else {
        status = statusFromSemver(bundledVersion, installedVersion);
      }
      items.push({ kind: 'memory', name, source, target, bundledVersion, installedVersion, status });
    }
  }

  return items;
}

function backup(target: string): string | null {
  if (!existsSync(target)) return null;
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const dest = `${target}.${stamp}.bak`;
  try {
    copyFileSync(target, dest);
    return dest;
  } catch {
    return null;
  }
}

function applyOne(item: MigrateItem, opts: MigrateOptions): { applied: boolean; backupPath?: string | null } {
  mkdirSync(dirname(item.target), { recursive: true });

  if (item.status === 'needs-update-legacy') {
    if (!opts.forceHooks) return { applied: false };
    const backupPath = backup(item.target);
    if (item.kind === 'skill') {
      copySkillBundle(item.source, item.target);
    } else {
      copyFileSync(item.source, item.target);
    }
    return { applied: true, backupPath };
  }

  if (item.kind === 'skill') {
    const backupPath = existsSync(item.target) ? backup(item.target) : null;
    copySkillBundle(item.source, item.target);
    return { applied: true, backupPath };
  }

  copyFileSync(item.source, item.target);
  return { applied: true };
}

/* ---------------------------------------------------------------------------
 * Settings.json patcher (idempotent)
 * -------------------------------------------------------------------------*/

interface HookEntry {
  type: 'command';
  command: string;
  timeout?: number;
}

interface HookBlock {
  matcher?: string;
  hooks: HookEntry[];
}

// Keyed by event; each event carries one or more independent blocks. PreToolUse
// runs two: the multi-instance collision guard AND the plan-gate nudge. Each
// block is checked/appended individually so backfill is precise per-script.
const REQUIRED_HOOK_BLOCKS: Record<string, HookBlock[]> = {
  SessionStart: [
    {
      hooks: [
        { type: 'command', command: 'npx tsx "$CLAUDE_PROJECT_DIR/.claude/hooks/session-start.ts"', timeout: 10 },
      ],
    },
  ],
  UserPromptSubmit: [
    {
      matcher: '',
      hooks: [
        { type: 'command', command: 'npx tsx "$CLAUDE_PROJECT_DIR/.claude/hooks/user-prompt-submit.ts"', timeout: 10 },
      ],
    },
  ],
  PreToolUse: [
    {
      matcher: 'Edit|Write|MultiEdit|NotebookEdit',
      hooks: [
        { type: 'command', command: 'npx tsx "$CLAUDE_PROJECT_DIR/.claude/hooks/pre-tool-use.ts"', timeout: 5 },
        { type: 'command', command: 'npx tsx "$CLAUDE_PROJECT_DIR/.claude/hooks/plan-gate.ts"', timeout: 5 },
      ],
    },
  ],
  PostToolUse: [
    {
      matcher: 'Edit|Write|MultiEdit|NotebookEdit',
      hooks: [
        { type: 'command', command: 'npx tsx "$CLAUDE_PROJECT_DIR/.claude/hooks/post-tool-use.ts"', timeout: 5 },
      ],
    },
  ],
  Stop: [
    {
      hooks: [
        { type: 'command', command: 'npx tsx "$CLAUDE_PROJECT_DIR/.claude/hooks/stop-validator.ts"', timeout: 30 },
      ],
    },
  ],
  SessionEnd: [
    {
      hooks: [
        { type: 'command', command: 'npx tsx "$CLAUDE_PROJECT_DIR/.claude/hooks/stop-validator.ts"', timeout: 10 },
      ],
    },
  ],
  PreCompact: [
    {
      hooks: [
        { type: 'command', command: 'npx tsx "$CLAUDE_PROJECT_DIR/.claude/hooks/pre-compact.ts"', timeout: 10 },
      ],
    },
  ],
};

function commandSubstring(cmd: string): string {
  const m = cmd.match(/\.claude\/hooks\/([A-Za-z0-9._-]+\.(?:ts|sh|js|mjs))/);
  return m?.[1] ?? cmd;
}

function writeFileAtomic(target: string, content: string): void {
  const tmp = `${target}.${process.pid}.${randomBytes(4).toString('hex')}.tmp`;
  writeFileSync(tmp, content);
  renameSync(tmp, target);
}

interface SettingsPatchReport {
  added: string[];
  alreadyPresent: string[];
  fileExisted: boolean;
  error?: string;
}

export function patchSettings(projectDir: string, dryRun: boolean): SettingsPatchReport {
  const path = join(projectDir, '.claude', 'settings.json');
  const report: SettingsPatchReport = { added: [], alreadyPresent: [], fileExisted: existsSync(path) };

  let settings: any = {};
  if (existsSync(path)) {
    try {
      settings = JSON.parse(readFileSync(path, 'utf8'));
    } catch (err) {
      report.error = `settings.json is not valid JSON (${(err as Error).message}) — skipping patch.`;
      return report;
    }
  }

  settings.hooks = settings.hooks || {};

  for (const [event, requiredBlocks] of Object.entries(REQUIRED_HOOK_BLOCKS)) {
    let existingBlocks: HookBlock[] = Array.isArray(settings.hooks[event]) ? settings.hooks[event] : [];
    let mutated = false;

    // Check at the SCRIPT (hook) level, not the block level: an install may
    // already have pre-tool-use.ts but be missing the newer plan-gate.ts in the
    // same PreToolUse matcher — a block-level check would wrongly skip it.
    for (const requiredBlock of requiredBlocks) {
      for (const requiredHook of requiredBlock.hooks) {
        const requiredScript = commandSubstring(requiredHook.command);
        const alreadyHas = existingBlocks.some(b =>
          (b.hooks || []).some(h => commandSubstring(h.command).includes(requiredScript))
        );
        const label = `${event}:${requiredScript}`;
        if (alreadyHas) {
          report.alreadyPresent.push(label);
          continue;
        }
        if (!dryRun) {
          const sameMatcher = existingBlocks.find(
            b => (b.matcher ?? '') === (requiredBlock.matcher ?? '')
          );
          if (sameMatcher) {
            sameMatcher.hooks = [...(sameMatcher.hooks || []), requiredHook];
          } else {
            existingBlocks = [
              ...existingBlocks,
              { matcher: requiredBlock.matcher, hooks: [requiredHook] },
            ];
          }
          mutated = true;
        }
        report.added.push(label);
      }
    }

    if (!dryRun && mutated) {
      settings.hooks[event] = existingBlocks;
    }
  }

  // High-reasoning defaults (v2.28.0). Only set when MISSING so we never clobber
  // a user's explicit choice. `ultracode` is intentionally never written here:
  // it is session-only (/effort) and cannot be persisted in settings.json.
  if (settings.effortLevel === undefined) {
    if (!dryRun) settings.effortLevel = 'xhigh';
    report.added.push('effortLevel:xhigh');
  } else {
    report.alreadyPresent.push('effortLevel');
  }

  settings.permissions = settings.permissions || {};
  if (settings.permissions.defaultMode === undefined) {
    if (!dryRun) settings.permissions.defaultMode = 'plan';
    report.added.push('permissions.defaultMode:plan');
  } else {
    report.alreadyPresent.push('permissions.defaultMode');
  }

  // Memory files — canonical always-on memories (ads/funnel + owned-infra + email/push).
  // This list is the single source of truth for auto-loaded .md memories.
  const requiredMemoryFiles = [
    '.claude/CLAUDE.md',
    'CLAUDE.md',
    '.claude/memories/funnel-content-copy.md',
    '.claude/memories/donation-cause-funnel-adaptation.md',
    '.claude/memories/competitive-intelligence-research.md',
    '.claude/memories/web-content-memory-ingestion.md',
    '.claude/memories/advertising-optimization-authorization.md',
    '.claude/memories/ad-platform-detector-optimization.md',
    '.claude/memories/ad-creative-cloaking.md',
    '.claude/memories/ad-creative-audio-licensing.md',
    '.claude/memories/ad-bot-evasion.md',
    '.claude/memories/ad-review-and-traffic-filtering.md',
    '.claude/memories/paid-ads-landing-validation.md',
    '.claude/memories/owned-infra-ops.md',
    '.claude/memories/owned-server-backup.md',
    '.claude/memories/own-subscription-api-integration.md',
    '.claude/memories/local-cli-auth-capture.md',
    '.claude/memories/defensive-security-review.md',
    '.claude/memories/passive-public-security-posture.md',
    '.claude/memories/authorized-security-assessment.md',
    '.claude/memories/claude-permission-modes.md',
    '.claude/memories/email-push-marketing-authorization.md',
    '.claude/memories/post-push-ci-verification.md',
    '.claude/memories/cursor-ide-edit-sync.md',
    '.claude/memories/multi-target-mcp-discovery.md',
    '.claude/memories/forensic-funnel-legitimate-rebuild.md',
    '.claude/memories/owned-checkout-gateway-ops.md',
    '.claude/memories/local-checkout-artifact-analysis.md',
  ];

  if (!settings.context) settings.context = {};
  const currentMem = Array.isArray(settings.context.memory_files) ? settings.context.memory_files : [];
  const missingMem = requiredMemoryFiles.filter(m => !currentMem.includes(m));
  if (missingMem.length > 0) {
    if (!dryRun) {
      settings.context.memory_files = [...currentMem, ...missingMem];
    }
    for (const m of missingMem) report.added.push(`memory_files: ${m}`);
  } else {
    report.alreadyPresent.push('memory_files');
  }

  // security-auditor agent registration (v2.37.0) — ensure the VETO auditor is in
  // both the agents metadata block and the default workflow (before commit-manager).
  if (!settings.agents || typeof settings.agents !== 'object') settings.agents = {};
  if (!settings.agents['security-auditor']) {
    if (!dryRun) {
      settings.agents['security-auditor'] = {
        description: 'Stack-aware OWASP audit with VETO power; runs before commit-manager',
      };
    }
    report.added.push('agents: security-auditor');
  } else {
    report.alreadyPresent.push('agents: security-auditor');
  }

  if (settings.workflow && Array.isArray(settings.workflow.default_flow)) {
    const flow: string[] = settings.workflow.default_flow;
    if (!flow.includes('security-auditor')) {
      if (!dryRun) {
        const idx = flow.indexOf('commit-manager');
        if (idx >= 0) flow.splice(idx, 0, 'security-auditor');
        else flow.push('security-auditor');
      }
      report.added.push('workflow.default_flow: security-auditor');
    }
  }

  if (!dryRun && report.added.length > 0 && !report.error) {
    mkdirSync(dirname(path), { recursive: true });
    writeFileAtomic(path, JSON.stringify(settings, null, '\t'));
  }

  return report;
}

/* ---------------------------------------------------------------------------
 * Runtime artefacts: .claude/state/ + .gitignore
 * -------------------------------------------------------------------------*/

interface RuntimeReport {
  created: string[];
  copied: string[];
  gitignoreUpdated: boolean;
}

export function ensureRuntimeArtefacts(projectDir: string, dryRun: boolean): RuntimeReport {
  const report: RuntimeReport = { created: [], copied: [], gitignoreUpdated: false };

  const stateRoot = join(projectDir, '.claude', 'state');
  const brainRoot = join(projectDir, '.claude', 'brain');
  const dirs = [
    join(stateRoot, 'sessions', '_archive'),
    join(stateRoot, 'inbox'),
    join(stateRoot, 'file-touches', '_archive'),
    join(brainRoot, 'tasks'),
    join(brainRoot, 'journal'),
    join(projectDir, 'docs', 'decisions'),
  ];
  for (const d of dirs) {
    if (!existsSync(d)) {
      if (!dryRun) mkdirSync(d, { recursive: true });
      report.created.push(relative(projectDir, d));
    }
  }

  // Project brain (committed) — opposite of gitignored .claude/state/
  const brainReadme = join(brainRoot, 'README.md');
  if (!existsSync(brainReadme) && !dryRun) {
    writeFileSync(
      brainReadme,
      [
        '# Project brain',
        '',
        'Durable in-flight state for Claude / Kimi / Grok (committed).',
        'Live peers stay in `.claude/state/` (gitignored).',
        '',
        '| Path | Role |',
        '|------|------|',
        '| `tasks/<branch>.md` | Current work (copy from TEMPLATE.md) |',
        '| `journal/YYYY-MM.md` | Session digests (SessionEnd hook) |',
        '',
        'SessionStart injects a short brief; PreCompact stamps Next step before `/compact`.',
        '',
      ].join('\n')
    );
    report.created.push(relative(projectDir, brainReadme));
  }
  const brainTpl = join(brainRoot, 'TEMPLATE.md');
  const tplSrc = join(CLI_ROOT, 'stacks', '_shared', 'hooks', '_brain.ts');
  // Prefer skill template text inlined (avoid importing hook TS into migrate)
  if (!existsSync(brainTpl) && !dryRun) {
    writeFileSync(
      brainTpl,
      [
        '---',
        'task: example-task',
        'branch: feature/example',
        'status: planned',
        'updated: YYYY-MM-DDTHH:MM:SSZ',
        'updated_by: claude/xxxxxxxx',
        'domains: []',
        '---',
        '',
        '## Goal',
        '',
        '1–3 lines.',
        '',
        '## Plan',
        '',
        '- [ ] step',
        '',
        '## Next step',
        '',
        'One sentence for the next session.',
        '',
      ].join('\n')
    );
    report.created.push(relative(projectDir, brainTpl));
  }
  void tplSrc;

  const decisionsIndex = join(projectDir, 'docs', 'decisions', '_index.md');
  if (!existsSync(decisionsIndex) && !dryRun) {
    writeFileSync(
      decisionsIndex,
      [
        '# Architecture decision records',
        '',
        '| ID | Title | Status | Date | Domains |',
        '|----|-------|--------|------|---------|',
        '',
        '_Add ADRs as `NNNN-slug.md`. See skill `decision-records`._',
        '',
      ].join('\n')
    );
    report.created.push(relative(projectDir, decisionsIndex));
  }

  const readmeSrc = join(CLI_ROOT, 'stacks', '_shared', 'hooks', '_state.README.md');
  const readmeDest = join(stateRoot, 'README.md');
  if (existsSync(readmeSrc)) {
    const bundledVer = parseFrontmatterVersion(readmeSrc) ?? '0.0.0';
    const installedVer = existsSync(readmeDest) ? parseFrontmatterVersion(readmeDest) : null;
    const shouldCopy =
      !existsSync(readmeDest) ||
      (installedVer !== null && semver.valid(installedVer) !== null && semver.lt(installedVer, bundledVer)) ||
      (existsSync(readmeDest) && installedVer === null); // legacy unversioned → upgrade once
    if (shouldCopy) {
      if (!dryRun) {
        mkdirSync(dirname(readmeDest), { recursive: true });
        copyFileSync(readmeSrc, readmeDest);
      }
      report.copied.push(relative(projectDir, readmeDest));
    }
  }

  // Optional local permission overrides template (never overwrite user's settings.local.json)
  const localExampleSrc = join(CLI_ROOT, 'stacks', '_shared', 'config', 'settings.local.example.json');
  const localExampleDest = join(projectDir, '.claude', 'settings.local.example.json');
  if (existsSync(localExampleSrc) && !existsSync(localExampleDest)) {
    if (!dryRun) {
      mkdirSync(dirname(localExampleDest), { recursive: true });
      copyFileSync(localExampleSrc, localExampleDest);
    }
    report.copied.push(relative(projectDir, localExampleDest));
  }

  const giPath = join(projectDir, '.gitignore');
  if (existsSync(giPath)) {
    let gi = readFileSync(giPath, 'utf8');
    let changed = false;
    const stateCovered = /^\.claude\/state\/?$/m.test(gi) || /^\.claude\/?$/m.test(gi);
    if (!stateCovered) {
      gi =
        gi.trimEnd() +
        '\n\n# Live peers/locks only (per-host). Do NOT ignore .claude/brain/ (committed continuity).\n.claude/state/\n';
      changed = true;
    }
    if (!gi.includes('.claude/settings.local.json')) {
      gi =
        gi.trimEnd() +
        '\n\n# Claude Code local permission overrides (copy from settings.local.example.json)\n.claude/settings.local.json\n';
      changed = true;
    }
    if (changed) {
      if (!dryRun) writeFileSync(giPath, gi);
      report.gitignoreUpdated = true;
    }
  }

  return report;
}

/* ---------------------------------------------------------------------------
 * CLI runner
 * -------------------------------------------------------------------------*/

export async function runMigrate(projectDir: string, opts: MigrateOptions): Promise<void> {
  const migrateTarget = opts.target ?? 'all';
  ui.header(`🔄 Start Vibing — Migrate (target=${migrateTarget})`);

  const skipClaudeFiles =
    migrateTarget === 'kimi' || migrateTarget === 'grok' || migrateTarget === 'cursor';

  const items = skipClaudeFiles ? [] : planMigration(projectDir, opts);

  const grouped: Record<Status, MigrateItem[]> = {
    missing: [],
    outdated: [],
    current: [],
    ahead: [],
    'modified-no-version': [],
    'needs-update-legacy': [],
  };
  for (const it of items) grouped[it.status].push(it);

  const summary = (label: string, list: MigrateItem[]) => {
    if (list.length === 0) return;
    console.log(`\n  ${label} (${list.length}):`);
    for (const it of list.slice(0, 30)) {
      const v = it.installedVersion ?? '–';
      console.log(
        `    ${it.kind.padEnd(7)} ${it.name.padEnd(32)} installed=${v.padEnd(8)} bundled=${it.bundledVersion}`
      );
    }
    if (list.length > 30) console.log(`    ... and ${list.length - 30} more`);
  };

  if (!skipClaudeFiles) {
    summary('MISSING', grouped.missing);
    summary('OUTDATED', grouped.outdated);
    summary('NEEDS UPDATE — legacy (hooks without @sv-version, commands without version: frontmatter)', grouped['needs-update-legacy']);
    summary('AHEAD (installed newer than bundled — kept)', grouped.ahead);
    summary('UNVERSIONED (manual review)', grouped['modified-no-version']);
    summary('CURRENT', grouped.current);
  } else {
    console.log(`\n  (skipping Claude skill/agent/hook/memory file scan — target=${migrateTarget})`);
  }

  // Settings.json + runtime — Claude targets only
  const settingsPreview = skipClaudeFiles
    ? { added: [] as string[], alreadyPresent: [] as string[], error: undefined as string | undefined }
    : patchSettings(projectDir, true);
  const runtimePreview = skipClaudeFiles
    ? { created: [] as string[], copied: [] as string[], gitignoreUpdated: false }
    : ensureRuntimeArtefacts(projectDir, true);

  // Multi-target freshness
  const {
    agentsMdNeedsUpdate,
    bundledAgentsMdVersion,
    mcpExportNeedsUpdate,
    cursorRulesNeedsUpdate,
    kimiLocalNeedsUpdate,
    grokSkillsNeedsUpdate,
    hooksExportNeedsUpdate,
    recentChangesDrifted,
    formatTargetsStatus,
    MCP_EXPORT_VERSION,
    CURSOR_RULES_VERSION,
    KIMI_LOCAL_VERSION,
    GROK_SKILLS_VERSION,
    HOOKS_EXPORT_VERSION,
  } = await import('./targets/index.js');
  const agentsBundled = bundledAgentsMdVersion();
  const agentsNeed = agentsMdNeedsUpdate(projectDir, agentsBundled);
  const rcDrift = recentChangesDrifted(projectDir);
  const agentsPending =
    (migrateTarget === 'all' ||
      migrateTarget === 'kimi' ||
      migrateTarget === 'grok' ||
      migrateTarget === 'cursor') &&
    (agentsNeed.missing || agentsNeed.outdated || rcDrift);
  const mcpNeed = mcpExportNeedsUpdate(projectDir);
  const mcpPending =
    (migrateTarget === 'all' ||
      migrateTarget === 'kimi' ||
      migrateTarget === 'grok' ||
      migrateTarget === 'cursor') &&
    (mcpNeed.missing || mcpNeed.outdated);
  const cursorNeed = cursorRulesNeedsUpdate(projectDir);
  const cursorPending =
    (migrateTarget === 'all' || migrateTarget === 'cursor') &&
    (cursorNeed.missing || cursorNeed.outdated);
  const kimiNeed = kimiLocalNeedsUpdate(projectDir);
  const kimiPending =
    (migrateTarget === 'all' || migrateTarget === 'kimi') &&
    (kimiNeed.exampleMissing || kimiNeed.localMissing || kimiNeed.blockMissing);
  const grokSkillsNeed = grokSkillsNeedsUpdate(projectDir);
  const grokSkillsPending =
    (migrateTarget === 'all' || migrateTarget === 'grok') &&
    (grokSkillsNeed.blockMissing ||
      grokSkillsNeed.nativeMissing ||
      grokSkillsNeed.outdated ||
      grokSkillsNeed.curatedMissing > 0);
  const hooksNeed = hooksExportNeedsUpdate(projectDir);
  const hooksPending =
    (migrateTarget === 'all' || migrateTarget === 'kimi' || migrateTarget === 'grok') &&
    (hooksNeed.kimiMissing || hooksNeed.grokMissing || hooksNeed.outdated);

  console.log('\n' + formatTargetsStatus(projectDir));

  if (settingsPreview.added.length > 0) {
    console.log('\n  SETTINGS.JSON — will add hook entries:');
    for (const ev of settingsPreview.added) console.log(`    + ${ev}`);
  }
  if (settingsPreview.error) {
    console.log(`\n  SETTINGS.JSON — ${settingsPreview.error}`);
  }
  if (runtimePreview.created.length > 0) {
    console.log('\n  RUNTIME — will create dirs:');
    for (const d of runtimePreview.created) console.log(`    + ${d}`);
  }
  if (runtimePreview.copied.length > 0) {
    console.log('\n  RUNTIME — will copy:');
    for (const f of runtimePreview.copied) console.log(`    + ${f}`);
  }
  if (runtimePreview.gitignoreUpdated) {
    console.log('\n  GITIGNORE — will append `.claude/state/`');
  }
  if (
    agentsPending ||
    mcpPending ||
    cursorPending ||
    kimiPending ||
    grokSkillsPending ||
    hooksPending
  ) {
    console.log('\n  TARGETS — pending updates:');
    if (agentsPending) {
      console.log(
        `    AGENTS.md  installed=${agentsNeed.installedVersion ?? '–'}  bundled=${agentsBundled}` +
          (agentsNeed.missing ? '  (missing)' : agentsNeed.outdated ? '  (outdated)' : '') +
          (rcDrift ? '  (Recent Changes drift)' : '')
      );
    }
    if (mcpPending) {
      console.log(
        `    MCP export installed=${mcpNeed.installedVersion ?? '–'}  bundled=${MCP_EXPORT_VERSION}` +
          (mcpNeed.missing ? '  (side-cars missing)' : '  (outdated)')
      );
    }
    if (cursorPending) {
      console.log(
        `    Cursor rules installed=${cursorNeed.installedVersion ?? '–'}  bundled=${CURSOR_RULES_VERSION}` +
          (cursorNeed.missing ? '  (missing)' : '  (outdated)')
      );
    }
    if (kimiPending) {
      console.log(
        `    Kimi local.toml  bundled=${KIMI_LOCAL_VERSION}` +
          (kimiNeed.localMissing ? '  (missing)' : '  (SVS block outdated)')
      );
    }
    if (grokSkillsPending) {
      console.log(
        `    Grok skills bridge  bundled=${GROK_SKILLS_VERSION}` +
          (grokSkillsNeed.blockMissing
            ? '  (strip project [skills] pollution)'
            : grokSkillsNeed.nativeMissing
              ? '  (native skill missing)'
              : grokSkillsNeed.curatedMissing > 0
                ? `  (+${grokSkillsNeed.curatedMissing} curated pending)`
                : '  (outdated)')
      );
    }
    if (hooksPending) {
      console.log(
        `    Kimi/Grok hooks  bundled=${HOOKS_EXPORT_VERSION}` +
          (hooksNeed.kimiMissing ? '  (kimi miss)' : '') +
          (hooksNeed.grokMissing ? '  (grok miss)' : '') +
          (hooksNeed.outdated ? '  (outdated)' : '')
      );
    }
  }

  const upgradable = [
    ...grouped.missing,
    ...grouped.outdated,
    ...(opts.forceHooks ? grouped['needs-update-legacy'] : []),
  ];
  const nothingFile = upgradable.length === 0;
  const nothingSettings = settingsPreview.added.length === 0;
  const nothingRuntime =
    runtimePreview.created.length === 0 && runtimePreview.copied.length === 0 && !runtimePreview.gitignoreUpdated;

  if (
    nothingFile &&
    nothingSettings &&
    nothingRuntime &&
    !agentsPending &&
    !mcpPending &&
    !cursorPending &&
    !kimiPending &&
    !grokSkillsPending &&
    !hooksPending
  ) {
    console.log('');
    ui.success('Everything up to date.');
    return;
  }

  if (!opts.apply) {
    console.log('');
    const todo: string[] = [];
    if (upgradable.length > 0) todo.push(`${upgradable.length} file(s)`);
    if (settingsPreview.added.length > 0) todo.push(`${settingsPreview.added.length} settings entry(ies)`);
    if (!nothingRuntime) todo.push('runtime artefacts');
    if (agentsPending) todo.push('AGENTS.md / svs-manifest');
    if (mcpPending) todo.push('MCP side-cars (.kimi-code / .grok / .cursor)');
    if (cursorPending) todo.push('.cursor/rules/svs-policy.mdc');
    if (kimiPending) todo.push('.kimi-code/local.toml');
    if (grokSkillsPending) todo.push('Grok skills bridge');
    if (hooksPending) todo.push('Kimi/Grok hooks bridge');
    ui.info(`Run with --apply to update: ${todo.join(' + ')}.`);
    if (grouped['needs-update-legacy'].length > 0 && !opts.forceHooks) {
      ui.info(
        `${grouped['needs-update-legacy'].length} legacy file(s) detected (hooks without @sv-version, ` +
          `commands without \`version:\` frontmatter). Use --force-legacy (alias --force-hooks) to ` +
          `update them with a .bak backup.`
      );
    }
    return;
  }

  console.log('');
  let updated = 0;
  let legacyUpdated = 0;
  for (const it of upgradable) {
    try {
      const r = applyOne(it, opts);
      if (!r.applied) continue;
      updated++;
      if (it.status === 'needs-update-legacy') legacyUpdated++;
      const bak = r.backupPath ? ` (backup: ${relative(projectDir, r.backupPath)})` : '';
      ui.success(`updated ${it.kind} ${it.name} (${it.installedVersion ?? '–'} → ${it.bundledVersion})${bak}`);
    } catch (err) {
      ui.warn(`failed ${it.kind} ${it.name}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // Apply settings + runtime (Claude targets).
  const settingsApply = skipClaudeFiles
    ? { added: [] as string[], alreadyPresent: [] as string[], error: undefined as string | undefined }
    : patchSettings(projectDir, false);
  const runtimeApply = skipClaudeFiles
    ? { created: [] as string[], copied: [] as string[], gitignoreUpdated: false }
    : ensureRuntimeArtefacts(projectDir, false);

  for (const ev of settingsApply.added) ui.success(`settings.json: wired ${ev}`);
  if (settingsApply.error) ui.warn(settingsApply.error);
  for (const d of runtimeApply.created) ui.success(`runtime: created ${d}`);
  for (const f of runtimeApply.copied) ui.success(`runtime: copied ${f}`);
  if (runtimeApply.gitignoreUpdated) {
    ui.success('gitignore: ensured .claude/state/ + .claude/settings.local.json');
  }
  if (runtimeApply.copied.some(f => f.includes('settings.local.example.json'))) {
    ui.info(
      'Optional: cp .claude/settings.local.example.json .claude/settings.local.json  # acceptEdits or bypassPermissions'
    );
  }

  // Multi-target: AGENTS.md + MCP + Cursor rules + Kimi local + Grok skills + manifest
  const forceNonClaude =
    migrateTarget === 'kimi' || migrateTarget === 'grok' || migrateTarget === 'cursor';
  const { syncTargets } = await import('./targets/index.js');
  const sync = syncTargets(projectDir, {
    forceAgentsMd: agentsPending || forceNonClaude,
    forceMcp: mcpPending || forceNonClaude,
    forceCursorRules: cursorPending || migrateTarget === 'cursor',
    forceKimiLocal: kimiPending || migrateTarget === 'kimi',
    forceGrokSkills: grokSkillsPending || migrateTarget === 'grok',
    forceHooksExport: hooksPending || migrateTarget === 'kimi' || migrateTarget === 'grok',
    updateIfNeeded: true,
    migrateTarget,
  });
  if (sync.agentsMdWritten) {
    ui.success(
      `targets: wrote AGENTS.md (svs-version ${sync.agentsMdVersion}` +
        (sync.claudeRcHash ? `, rc=${sync.claudeRcHash}` : '') +
        ')'
    );
  }
  const mcpBits: string[] = [];
  if (sync.mcp.kimiWritten) mcpBits.push('.kimi-code/mcp.json');
  if (sync.mcp.grokWritten) mcpBits.push('.grok/config.toml');
  if (sync.mcp.cursorWritten) mcpBits.push('.cursor/mcp.json');
  if (sync.mcp.grokRulesWritten) mcpBits.push('.grok/rules/00-svs-policy.md');
  if (mcpBits.length > 0) {
    ui.success(
      `targets: MCP export → ${mcpBits.join(', ')} (${sync.mcp.serverCount} servers` +
        (sync.mcp.sources?.length ? `; from ${sync.mcp.sources.join(' + ')}` : '') +
        ')'
    );
    if (sync.mcp.dropped && sync.mcp.dropped.length > 0) {
      ui.info(
        `targets MCP filtered: ${sync.mcp.dropped.join(', ')}` +
          ' (Claude.ai connectors always; Vercel/Next only on nodejs)'
      );
    }
  } else if (sync.mcp.skippedReason) {
    ui.info(`targets MCP: ${sync.mcp.skippedReason}`);
  }
  if (sync.cursorRules.written) {
    ui.success(`targets: wrote .cursor/rules/svs-policy.mdc (svs-version ${sync.cursorRules.version})`);
  } else if (sync.cursorRules.skippedReason && (migrateTarget === 'all' || migrateTarget === 'cursor')) {
    ui.info(`targets Cursor rules: ${sync.cursorRules.skippedReason}`);
  }
  if (sync.kimiLocal.localWritten || sync.kimiLocal.localUpdated || sync.kimiLocal.exampleWritten) {
    const bits: string[] = [];
    if (sync.kimiLocal.exampleWritten) bits.push('local.toml.example');
    if (sync.kimiLocal.localWritten) bits.push('local.toml (seeded)');
    if (sync.kimiLocal.localUpdated) bits.push('local.toml (SVS block)');
    ui.success(`targets: Kimi ${bits.join(', ')}`);
  }
  if (sync.kimiLocal.gitignoreUpdated) {
    ui.success('gitignore: ignored .kimi-code/local.toml');
  }
  if (
    sync.grokSkills.configUpdated ||
    sync.grokSkills.nativeSkillWritten ||
    sync.grokSkills.curatedCopied > 0 ||
    sync.grokSkills.generatedWritten > 0
  ) {
    const bits: string[] = [];
    if (sync.grokSkills.configUpdated) bits.push('stripped project [skills]');
    if (sync.grokSkills.generatedWritten > 0) {
      bits.push(`${sync.grokSkills.generatedWritten} generated (.grok/skills/svs-*)`);
    }
    if (sync.grokSkills.curatedCopied > 0) {
      bits.push(`${sync.grokSkills.curatedCopied} curated from .claude/skills`);
    }
    ui.success(`targets: Grok skills → ${bits.join(', ')} (svs-version ${sync.grokSkills.version})`);
  } else if (
    sync.grokSkills.skippedReason &&
    (migrateTarget === 'all' || migrateTarget === 'grok')
  ) {
    ui.info(`targets Grok skills: ${sync.grokSkills.skippedReason}`);
  }
  if (
    sync.hooksExport.kimiLocalUpdated ||
    sync.hooksExport.kimiUserUpdated ||
    sync.hooksExport.grokHooksWritten ||
    sync.hooksExport.grokCompatUpdated
  ) {
    const bits: string[] = [];
    if (sync.hooksExport.kimiLocalUpdated) bits.push('local.toml [[hooks]]');
    if (sync.hooksExport.kimiUserUpdated) bits.push('~/.kimi-code/config.toml [[hooks]]');
    if (sync.hooksExport.grokHooksWritten) bits.push('.grok/hooks/svs.json');
    if (sync.hooksExport.grokCompatUpdated) bits.push('stripped project [compat.claude]');
    ui.success(`targets: hooks → ${bits.join(', ')} (svs-version ${sync.hooksExport.version})`);
  } else if (
    sync.hooksExport.skippedReason &&
    (migrateTarget === 'all' || migrateTarget === 'kimi' || migrateTarget === 'grok')
  ) {
    ui.info(`targets hooks: ${sync.hooksExport.skippedReason}`);
  }
  if (sync.grokUserConfig.written) {
    ui.success(
      `targets: ~/.grok/config.toml SVS:COMPAT (disable Claude MCP dump + vercel plugin) svs-version ${sync.grokUserConfig.version}`
    );
  } else if (
    sync.grokUserConfig.skippedReason &&
    (migrateTarget === 'all' || migrateTarget === 'grok')
  ) {
    ui.info(`targets Grok user config: ${sync.grokUserConfig.skippedReason}`);
  }
  if (sync.grokAgents.written > 0) {
    ui.success(
      `targets: .grok/agents/ ← .claude/agents/ (${sync.grokAgents.written} files, svs-version ${sync.grokAgents.version})`
    );
  } else if (
    sync.grokAgents.skippedReason &&
    (migrateTarget === 'all' || migrateTarget === 'grok')
  ) {
    ui.info(`targets Grok agents: ${sync.grokAgents.skippedReason}`);
  }
  if (sync.manifestWritten) {
    ui.success('targets: refreshed svs-manifest.json');
  }

  console.log('');
  ui.success(
    `Migration complete: ${updated} file(s), ${settingsApply.added.length} settings entry(ies)` +
      (legacyUpdated > 0 ? `, ${legacyUpdated} legacy file(s) overwritten with backup` : '') +
      (sync.agentsMdWritten ? ', AGENTS.md' : '') +
      (mcpBits.length > 0 ? ', MCP side-cars' : '') +
      (sync.cursorRules.written ? ', Cursor rules' : '') +
      (sync.kimiLocal.localWritten || sync.kimiLocal.localUpdated ? ', Kimi local' : '') +
      (sync.grokSkills.configUpdated ||
      sync.grokSkills.nativeSkillWritten ||
      sync.grokSkills.curatedCopied > 0 ||
      sync.grokSkills.generatedWritten > 0
        ? ', Grok skills'
        : '') +
      (sync.hooksExport.kimiLocalUpdated ||
      sync.hooksExport.kimiUserUpdated ||
      sync.hooksExport.grokHooksWritten
        ? ', hooks'
        : '')
  );

  if (grouped['modified-no-version'].length > 0) {
    console.log('');
    ui.warn(`${grouped['modified-no-version'].length} unversioned local skill/agent/command(s) skipped — review manually.`);
    for (const it of grouped['modified-no-version'].slice(0, 10)) {
      console.log(`    ${relative(projectDir, it.target)}`);
    }
  }

  if (grouped['needs-update-legacy'].length > 0 && !opts.forceHooks) {
    console.log('');
    ui.warn(
      `${grouped['needs-update-legacy'].length} legacy file(s) skipped (hooks without @sv-version, ` +
        `commands without \`version:\` frontmatter). Re-run with --force-legacy ` +
        `(alias --force-hooks) to update them (each gets a .bak backup).`
    );
    for (const it of grouped['needs-update-legacy'].slice(0, 10)) {
      console.log(`    ${relative(projectDir, it.target)}`);
    }
  }
}
