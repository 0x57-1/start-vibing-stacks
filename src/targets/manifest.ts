/**
 * `.claude/config/svs-manifest.json` — semver freshness for multi-target sync.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import type { AgentsMdMeta, SvsManifest } from './types.js';
import { AGENTS_MD_GENERATOR_VERSION } from './types.js';

export const MANIFEST_REL = '.claude/config/svs-manifest.json';

export function manifestPath(projectDir: string): string {
  return join(projectDir, MANIFEST_REL);
}

export function readManifest(projectDir: string): SvsManifest | null {
  const path = manifestPath(projectDir);
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as SvsManifest;
  } catch {
    return null;
  }
}

export function defaultManifest(packageVersion: string, agentsMd?: AgentsMdMeta): SvsManifest {
  return {
    packageVersion,
    updatedAt: new Date().toISOString(),
    targets: {
      claude: { enabled: true },
      kimi: { enabled: true },
      grok: { enabled: true },
    },
    agentsMd: agentsMd ?? { version: AGENTS_MD_GENERATOR_VERSION },
  };
}

export function writeManifest(projectDir: string, manifest: SvsManifest): void {
  const path = manifestPath(projectDir);
  mkdirSync(dirname(path), { recursive: true });
  const next: SvsManifest = {
    ...manifest,
    updatedAt: new Date().toISOString(),
  };
  writeFileSync(path, JSON.stringify(next, null, 2) + '\n');
}

/** True when AGENTS.md generator/policy pack in the package is newer than installed. */
export function agentsMdNeedsUpdate(
  projectDir: string,
  bundledAgentsVersion: string
): { missing: boolean; outdated: boolean; installedVersion: string | null } {
  const agentsPath = join(projectDir, 'AGENTS.md');
  const missing = !existsSync(agentsPath);
  const manifest = readManifest(projectDir);
  const installedVersion =
    manifest?.agentsMd?.version ?? parseAgentsFrontmatterVersion(agentsPath);
  if (missing) return { missing: true, outdated: false, installedVersion };
  if (!installedVersion) return { missing: false, outdated: true, installedVersion: null };
  const outdated = compareSemver(installedVersion, bundledAgentsVersion) < 0;
  return { missing: false, outdated, installedVersion };
}

function parseAgentsFrontmatterVersion(file: string): string | null {
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

/** -1 if a < b, 0 equal, 1 if a > b (numeric semver x.y.z only). */
function compareSemver(a: string, b: string): number {
  const pa = a.split('.').map((n) => parseInt(n, 10) || 0);
  const pb = b.split('.').map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < 3; i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d !== 0) return d < 0 ? -1 : 1;
  }
  return 0;
}
