/**
 * Start Vibing Stacks — Migrate
 *
 * Compares the SKILL.md / agent / hook versions installed in .claude/
 * against the bundled stacks/<stack>/ and stacks/_shared/ versions.
 *
 * Reports outdated, missing, and modified items. Optionally upgrades.
 *
 * Skill version contract:
 *   YAML frontmatter at top of SKILL.md must include `version: X.Y.Z`.
 *   No frontmatter = treated as "v0" / pre-versioning.
 */

import { existsSync, readFileSync, copyFileSync, mkdirSync, statSync, readdirSync } from 'fs';
import { join, relative, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import * as semver from 'semver';
import * as ui from './ui.js';

const __m_filename = fileURLToPath(import.meta.url);
const __m_dirname = dirname(__m_filename);
const CLI_ROOT = resolve(__m_dirname, '..');

const FRONTMATTER_RE = /^---\s*\n([\s\S]*?)\n---/;
const VERSION_RE = /^version:\s*["']?([0-9]+\.[0-9]+\.[0-9]+(?:-[A-Za-z0-9.-]+)?)["']?\s*$/m;

export interface MigrateItem {
  kind: 'skill' | 'agent' | 'hook';
  name: string;
  source: string;
  target: string;
  bundledVersion: string;
  installedVersion: string | null;
  status: 'missing' | 'outdated' | 'current' | 'ahead' | 'modified-no-version';
}

export interface MigrateOptions {
  apply: boolean;
  scope?: 'skills' | 'agents' | 'hooks' | 'all';
}

interface ProjectConfig {
  stack: string;
  frontendSkillsDir?: string;
}

function parseVersion(file: string): string | null {
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

function statusOf(bundled: string, installed: string | null): MigrateItem['status'] {
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
      try { return statSync(join(dir, n)).isDirectory(); } catch { return false; }
    });
  } catch { return []; }
}

function listFiles(dir: string, suffix: string): string[] {
  if (!existsSync(dir)) return [];
  try {
    return readdirSync(dir).filter(n => n.endsWith(suffix));
  } catch { return []; }
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
  return listFiles(dir, '.md').map(n => ({ source: join(dir, n), name: n }));
}

function listHookSources(): Array<{ source: string; name: string }> {
  const dir = join(CLI_ROOT, 'stacks', '_shared', 'hooks');
  return listFiles(dir, '.ts').map(n => ({ source: join(dir, n), name: n }));
}

function loadProjectConfig(projectDir: string): ProjectConfig | null {
  const path = join(projectDir, '.claude', 'config', 'active-project.json');
  if (!existsSync(path)) return null;
  try { return JSON.parse(readFileSync(path, 'utf8')); }
  catch { return null; }
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
      const bundledVersion = parseVersion(source);
      if (!bundledVersion) continue;
      const installedVersion = parseVersion(target);
      const status: MigrateItem['status'] = !existsSync(target)
        ? 'missing'
        : statusOf(bundledVersion, installedVersion);
      items.push({ kind: 'skill', name, source, target, bundledVersion, installedVersion, status });
    }
  }

  if (scope === 'all' || scope === 'agents') {
    for (const { source, name } of listAgentSources()) {
      const target = join(projectDir, '.claude', 'agents', name);
      const bundledVersion = parseVersion(source);
      if (!bundledVersion) continue;
      const installedVersion = parseVersion(target);
      const status: MigrateItem['status'] = !existsSync(target)
        ? 'missing'
        : statusOf(bundledVersion, installedVersion);
      items.push({ kind: 'agent', name, source, target, bundledVersion, installedVersion, status });
    }
  }

  if (scope === 'all' || scope === 'hooks') {
    for (const { source, name } of listHookSources()) {
      const target = join(projectDir, '.claude', 'hooks', name);
      const bundledVersion = '0.0.0';
      const installedVersion = existsSync(target) ? '0.0.0' : null;
      const status: MigrateItem['status'] = !existsSync(target) ? 'missing' : 'current';
      items.push({ kind: 'hook', name, source, target, bundledVersion, installedVersion, status });
    }
  }

  return items;
}

function applyOne(item: MigrateItem): void {
  mkdirSync(dirname(item.target), { recursive: true });
  copyFileSync(item.source, item.target);
}

export async function runMigrate(projectDir: string, opts: MigrateOptions): Promise<void> {
  ui.header('🔄 Start Vibing — Migrate');

  const items = planMigration(projectDir, opts);
  if (items.length === 0) {
    ui.info('Nothing to migrate.');
    return;
  }

  const grouped: Record<MigrateItem['status'], MigrateItem[]> = {
    missing: [], outdated: [], current: [], ahead: [], 'modified-no-version': [],
  };
  for (const it of items) grouped[it.status].push(it);

  const summary = (label: string, list: MigrateItem[]) => {
    if (list.length === 0) return;
    console.log(`\n  ${label} (${list.length}):`);
    for (const it of list.slice(0, 30)) {
      const v = it.installedVersion ?? '–';
      console.log(`    ${it.kind.padEnd(5)} ${it.name.padEnd(32)} installed=${v.padEnd(8)} bundled=${it.bundledVersion}`);
    }
    if (list.length > 30) console.log(`    ... and ${list.length - 30} more`);
  };

  summary('MISSING', grouped.missing);
  summary('OUTDATED', grouped.outdated);
  summary('AHEAD (installed newer than bundled — kept)', grouped.ahead);
  summary('UNVERSIONED (manual review)', grouped['modified-no-version']);
  summary('CURRENT', grouped.current);

  const upgradable = [...grouped.missing, ...grouped.outdated];
  if (upgradable.length === 0) {
    console.log('');
    ui.success('Everything up to date.');
    return;
  }

  if (!opts.apply) {
    console.log('');
    ui.info(`Run with --apply to install/update ${upgradable.length} item(s).`);
    return;
  }

  console.log('');
  for (const it of upgradable) {
    try {
      applyOne(it);
      ui.success(`updated ${it.kind} ${it.name} (${it.installedVersion ?? '–'} → ${it.bundledVersion})`);
    } catch (err) {
      ui.warn(`failed ${it.kind} ${it.name}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  console.log('');
  ui.success(`Migration complete: ${upgradable.length} item(s) updated.`);

  if (grouped['modified-no-version'].length > 0) {
    console.log('');
    ui.warn(`${grouped['modified-no-version'].length} unversioned local item(s) skipped — review manually.`);
    for (const it of grouped['modified-no-version'].slice(0, 10)) {
      console.log(`    ${relative(projectDir, it.target)}`);
    }
  }
}
