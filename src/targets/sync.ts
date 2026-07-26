/**
 * Sync multi-target artefacts: AGENTS.md + svs-manifest.json
 */

import { createHash } from 'crypto';
import { existsSync, readFileSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { generateAgentsMd, bundledAgentsMdVersion } from './agents-md.js';
import {
  agentsMdNeedsUpdate,
  defaultManifest,
  readManifest,
  writeManifest,
} from './manifest.js';
import { AGENTS_MD_GENERATOR_VERSION } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PACKAGE_ROOT = resolve(__dirname, '../..');

export function packageVersion(): string {
  try {
    const pkg = JSON.parse(readFileSync(join(PACKAGE_ROOT, 'package.json'), 'utf8'));
    return typeof pkg.version === 'string' ? pkg.version : '0.0.0';
  } catch {
    return '0.0.0';
  }
}

export interface SyncTargetsOptions {
  /** Force regenerate AGENTS.md */
  forceAgentsMd?: boolean;
  /** When true (default), regenerate only if missing or outdated */
  updateIfNeeded?: boolean;
}

export interface SyncTargetsResult {
  agentsMdWritten: boolean;
  agentsMdVersion: string;
  agentsMdHash: string;
  manifestWritten: boolean;
  skippedReason?: string;
}

/**
 * Ensure AGENTS.md + manifest exist / are refreshed for Kimi & Grok.
 */
export function syncTargets(projectDir: string, opts: SyncTargetsOptions = {}): SyncTargetsResult {
  const bundled = bundledAgentsMdVersion();
  const need = agentsMdNeedsUpdate(projectDir, bundled);
  const updateIfNeeded = opts.updateIfNeeded !== false;
  const shouldWrite =
    opts.forceAgentsMd === true || (updateIfNeeded && (need.missing || need.outdated));

  let agentsMdWritten = false;
  let hash = '';
  let skippedReason: string | undefined;

  if (shouldWrite) {
    const r = generateAgentsMd(projectDir, { force: true });
    agentsMdWritten = r.written;
    hash = r.hash;
  } else {
    skippedReason = `AGENTS.md current (svs-version ${need.installedVersion ?? '?'} >= ${bundled})`;
    const p = join(projectDir, 'AGENTS.md');
    if (existsSync(p)) {
      hash = createHash('sha256').update(readFileSync(p, 'utf8')).digest('hex').slice(0, 16);
    }
  }

  const prev = readManifest(projectDir);
  const manifest = defaultManifest(packageVersion(), {
    version: AGENTS_MD_GENERATOR_VERSION,
    hash: hash || prev?.agentsMd?.hash,
  });
  if (prev?.targets) {
    manifest.targets = {
      claude: { ...manifest.targets.claude, ...prev.targets.claude },
      kimi: { ...manifest.targets.kimi, ...prev.targets.kimi },
      grok: { ...manifest.targets.grok, ...prev.targets.grok },
    };
  }
  writeManifest(projectDir, manifest);

  return {
    agentsMdWritten,
    agentsMdVersion: AGENTS_MD_GENERATOR_VERSION,
    agentsMdHash: hash,
    manifestWritten: true,
    skippedReason,
  };
}
