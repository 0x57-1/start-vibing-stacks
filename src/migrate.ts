/**
 * Start Vibing Stacks — Migrate (v2 — smart, idempotent, settings-aware)
 *
 * Compares installed vs bundled versions for skills, agents, hooks AND commands.
 * Also reconciles runtime artefacts that earlier migrate versions ignored:
 *
 *  - hooks: parsed via `// @sv-version: x.y.z` header. Legacy installs (no tag)
 *    are skipped with a "needs-update-legacy" warning unless `--force-hooks` is
 *    passed (which makes a `.bak` copy before overwriting).
 *  - commands: same `version:` frontmatter contract as skills/agents.
 *  - .claude/settings.json — patched idempotently to ensure the bundled hook
 *    chain (SessionStart / UserPromptSubmit / PreToolUse / PostToolUse / Stop /
 *    SessionEnd) is wired. Existing entries are preserved; only missing entries
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
const SV_VERSION_RE = /\/\/\s*@sv-version:\s*([0-9]+\.[0-9]+\.[0-9]+(?:-[A-Za-z0-9.-]+)?)/;

type Status =
  | 'missing'
  | 'outdated'
  | 'current'
  | 'ahead'
  | 'modified-no-version'
  | 'needs-update-legacy';

export interface MigrateItem {
  kind: 'skill' | 'agent' | 'hook' | 'command';
  name: string;
  source: string;
  target: string;
  bundledVersion: string;
  installedVersion: string | null;
  status: Status;
}

export interface MigrateOptions {
  apply: boolean;
  scope?: 'skills' | 'agents' | 'hooks' | 'commands' | 'all';
  forceHooks?: boolean;
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
  // Track .ts and .sh files (runnable hooks + shared lib). _state.README.md is handled separately.
  return listFiles(dir, ['.ts', '.sh']).map(n => ({ source: join(dir, n), name: n }));
}

function listCommandSources(): Array<{ source: string; name: string }> {
  const dir = join(CLI_ROOT, 'stacks', '_shared', 'commands');
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
      const status: Status = !existsSync(target) ? 'missing' : statusFromSemver(bundledVersion, installedVersion);
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
    copyFileSync(item.source, item.target);
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

const REQUIRED_HOOK_BLOCKS: Record<string, HookBlock> = {
  SessionStart: {
    hooks: [
      { type: 'command', command: 'npx tsx "$CLAUDE_PROJECT_DIR/.claude/hooks/session-start.ts"', timeout: 10 },
    ],
  },
  UserPromptSubmit: {
    matcher: '',
    hooks: [
      { type: 'command', command: 'npx tsx "$CLAUDE_PROJECT_DIR/.claude/hooks/user-prompt-submit.ts"', timeout: 10 },
    ],
  },
  PreToolUse: {
    matcher: 'Edit|Write|MultiEdit|NotebookEdit',
    hooks: [
      { type: 'command', command: 'npx tsx "$CLAUDE_PROJECT_DIR/.claude/hooks/pre-tool-use.ts"', timeout: 5 },
    ],
  },
  PostToolUse: {
    matcher: 'Edit|Write|MultiEdit|NotebookEdit',
    hooks: [
      { type: 'command', command: 'npx tsx "$CLAUDE_PROJECT_DIR/.claude/hooks/post-tool-use.ts"', timeout: 5 },
    ],
  },
  Stop: {
    hooks: [
      { type: 'command', command: 'npx tsx "$CLAUDE_PROJECT_DIR/.claude/hooks/stop-validator.ts"', timeout: 30 },
    ],
  },
  SessionEnd: {
    hooks: [
      { type: 'command', command: 'npx tsx "$CLAUDE_PROJECT_DIR/.claude/hooks/stop-validator.ts"', timeout: 10 },
    ],
  },
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

  for (const [event, requiredBlock] of Object.entries(REQUIRED_HOOK_BLOCKS)) {
    const existingBlocks: HookBlock[] = Array.isArray(settings.hooks[event]) ? settings.hooks[event] : [];
    const requiredScript = commandSubstring(requiredBlock.hooks[0]!.command);
    const alreadyHas = existingBlocks.some(b =>
      (b.hooks || []).some(h => commandSubstring(h.command).includes(requiredScript))
    );
    if (alreadyHas) {
      report.alreadyPresent.push(event);
      continue;
    }
    if (!dryRun) {
      settings.hooks[event] = [...existingBlocks, requiredBlock];
    }
    report.added.push(event);
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
  const dirs = [
    join(stateRoot, 'sessions', '_archive'),
    join(stateRoot, 'inbox'),
    join(stateRoot, 'file-touches', '_archive'),
  ];
  for (const d of dirs) {
    if (!existsSync(d)) {
      if (!dryRun) mkdirSync(d, { recursive: true });
      report.created.push(relative(projectDir, d));
    }
  }

  const readmeSrc = join(CLI_ROOT, 'stacks', '_shared', 'hooks', '_state.README.md');
  const readmeDest = join(stateRoot, 'README.md');
  if (existsSync(readmeSrc) && !existsSync(readmeDest)) {
    if (!dryRun) {
      mkdirSync(dirname(readmeDest), { recursive: true });
      copyFileSync(readmeSrc, readmeDest);
    }
    report.copied.push(relative(projectDir, readmeDest));
  }

  const giPath = join(projectDir, '.gitignore');
  if (existsSync(giPath)) {
    const gi = readFileSync(giPath, 'utf8');
    const covered = /^\.claude\/state\/?$/m.test(gi) || /^\.claude\/?$/m.test(gi);
    if (!covered) {
      if (!dryRun) {
        const next =
          gi.trimEnd() +
          '\n\n# Claude Code multi-instance coordination state (runtime, per-host)\n.claude/state/\n';
        writeFileSync(giPath, next);
      }
      report.gitignoreUpdated = true;
    }
  }

  return report;
}

/* ---------------------------------------------------------------------------
 * CLI runner
 * -------------------------------------------------------------------------*/

export async function runMigrate(projectDir: string, opts: MigrateOptions): Promise<void> {
  ui.header('🔄 Start Vibing — Migrate');

  const items = planMigration(projectDir, opts);

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

  summary('MISSING', grouped.missing);
  summary('OUTDATED', grouped.outdated);
  summary('NEEDS UPDATE — legacy (hooks without @sv-version, commands without version: frontmatter)', grouped['needs-update-legacy']);
  summary('AHEAD (installed newer than bundled — kept)', grouped.ahead);
  summary('UNVERSIONED (manual review)', grouped['modified-no-version']);
  summary('CURRENT', grouped.current);

  // Settings.json + runtime — preview always, regardless of items.
  const settingsPreview = patchSettings(projectDir, true);
  const runtimePreview = ensureRuntimeArtefacts(projectDir, true);

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

  const upgradable = [
    ...grouped.missing,
    ...grouped.outdated,
    ...(opts.forceHooks ? grouped['needs-update-legacy'] : []),
  ];
  const nothingFile = upgradable.length === 0;
  const nothingSettings = settingsPreview.added.length === 0;
  const nothingRuntime =
    runtimePreview.created.length === 0 && runtimePreview.copied.length === 0 && !runtimePreview.gitignoreUpdated;

  if (nothingFile && nothingSettings && nothingRuntime) {
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

  // Apply settings + runtime.
  const settingsApply = patchSettings(projectDir, false);
  const runtimeApply = ensureRuntimeArtefacts(projectDir, false);

  for (const ev of settingsApply.added) ui.success(`settings.json: wired ${ev}`);
  if (settingsApply.error) ui.warn(settingsApply.error);
  for (const d of runtimeApply.created) ui.success(`runtime: created ${d}`);
  for (const f of runtimeApply.copied) ui.success(`runtime: copied ${f}`);
  if (runtimeApply.gitignoreUpdated) ui.success('gitignore: appended .claude/state/');

  console.log('');
  ui.success(
    `Migration complete: ${updated} file(s), ${settingsApply.added.length} settings entry(ies)` +
      (legacyUpdated > 0 ? `, ${legacyUpdated} legacy file(s) overwritten with backup` : '')
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
