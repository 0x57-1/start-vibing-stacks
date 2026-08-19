/**
 * Phase 4: export shared policy pack → `.cursor/rules/*.mdc` (alwaysApply).
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PACKAGE_ROOT = resolve(__dirname, '../..');
const POLICY_PACK = join(PACKAGE_ROOT, 'stacks', '_shared', 'targets', 'policy-pack.md');

/** Bump when .mdc frontmatter/shape changes. */
export const CURSOR_RULES_VERSION = '1.2.17';

export const CURSOR_RULES_REL = '.cursor/rules/svs-policy.mdc';

export interface CursorRulesResult {
  written: boolean;
  path: string;
  version: string;
  skippedReason?: string;
}

function loadPolicyBody(): string {
  if (!existsSync(POLICY_PACK)) {
    return 'Policy pack missing from start-vibing-stacks install.\n';
  }
  return readFileSync(POLICY_PACK, 'utf8').replace(/^---\s*\n[\s\S]*?\n---\s*\n?/, '');
}

function parseInstalledCursorRulesVersion(file: string): string | null {
  if (!existsSync(file)) return null;
  try {
    const content = readFileSync(file, 'utf8');
    const fm = /^---\s*\n([\s\S]*?)\n---/.exec(content);
    if (!fm) return null;
    const v = /^svs-version:\s*["']?([0-9]+\.[0-9]+\.[0-9]+)["']?\s*$/m.exec(fm[1] ?? '');
    return v?.[1] ?? null;
  } catch {
    return null;
  }
}

function compareSemver(a: string, b: string): number {
  const pa = a.split('.').map((n) => parseInt(n, 10) || 0);
  const pb = b.split('.').map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < 3; i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d !== 0) return d < 0 ? -1 : 1;
  }
  return 0;
}

export function cursorRulesNeedsUpdate(projectDir: string): {
  missing: boolean;
  outdated: boolean;
  installedVersion: string | null;
} {
  const dest = join(projectDir, CURSOR_RULES_REL);
  const missing = !existsSync(dest);
  const installedVersion = parseInstalledCursorRulesVersion(dest);
  if (missing) return { missing: true, outdated: false, installedVersion: null };
  if (!installedVersion) return { missing: false, outdated: true, installedVersion: null };
  return {
    missing: false,
    outdated: compareSemver(installedVersion, CURSOR_RULES_VERSION) < 0,
    installedVersion,
  };
}

/**
 * Write `.cursor/rules/svs-policy.mdc` with alwaysApply from the shared policy pack.
 */
export function exportCursorRules(
  projectDir: string,
  opts: { force?: boolean } = {}
): CursorRulesResult {
  const dest = join(projectDir, CURSOR_RULES_REL);
  const need = cursorRulesNeedsUpdate(projectDir);
  if (!opts.force && !need.missing && !need.outdated) {
    return {
      written: false,
      path: dest,
      version: CURSOR_RULES_VERSION,
      skippedReason: `Cursor rules current (svs-version ${need.installedVersion})`,
    };
  }

  const body = [
    '---',
    `description: start-vibing-stacks shared policy (hard limits, ads/donation, owned infra)`,
    'alwaysApply: true',
    `svs-version: ${CURSOR_RULES_VERSION}`,
    'generated-by: start-vibing-stacks',
    '---',
    '',
    '# start-vibing-stacks — Cursor policy',
    '',
    '> Always-on project rule. Source: `stacks/_shared/targets/policy-pack.md`.',
    '> Full Claude memories: `.claude/memories/`. Shared twin: root `AGENTS.md`.',
    '> Refresh: `npx start-vibing-stacks migrate --target cursor --apply`',
    '',
    loadPolicyBody().trim(),
    '',
  ].join('\n');

  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, body);
  return { written: true, path: dest, version: CURSOR_RULES_VERSION };
}
