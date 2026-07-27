/**
 * Phase 6: Grok skills bridge — native `.grok/skills/svs-policy` only.
 * Grok auto-discovers `./.claude/skills` and `./.grok/skills/`.
 * Do NOT write `[skills]` into project `.grok/config.toml` (project may only
 * contribute mcp_servers / plugins / permission).
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PACKAGE_ROOT = resolve(__dirname, '../..');
const POLICY_PACK = join(PACKAGE_ROOT, 'stacks', '_shared', 'targets', 'policy-pack.md');

export const GROK_SKILLS_VERSION = '1.1.1';
export const GROK_NATIVE_SKILL_REL = '.grok/skills/svs-policy/SKILL.md';

const SKILLS_BLOCK_RE = /# SVS:SKILLS:START[\s\S]*?# SVS:SKILLS:END\n?/;

export interface GrokSkillsResult {
  /** True when illegal SVS:SKILLS block was stripped from project config.toml */
  configUpdated: boolean;
  nativeSkillWritten: boolean;
  version: string;
  skippedReason?: string;
}

function nativeSkillBody(): string {
  let policy = '';
  if (existsSync(POLICY_PACK)) {
    policy = readFileSync(POLICY_PACK, 'utf8').replace(/^---\s*\n[\s\S]*?\n---\s*\n?/, '');
  }
  return [
    '---',
    'name: svs-policy',
    'description: >',
    '  start-vibing-stacks hard limits and always-on policy (ads, donation/person likeness,',
    '  owned infra, email). Use for any paid-ads, funnel, donation, or owned-server task.',
    `metadata:`,
    `  svs-version: "${GROK_SKILLS_VERSION}"`,
    '---',
    '',
    '# start-vibing-stacks policy (Grok skill)',
    '',
    '> Also see root `AGENTS.md` and `CLAUDE.md`. Full memories: `.claude/memories/`.',
    '> Claude skills auto-load from `.claude/skills/` (no project `[skills]` paths needed).',
    '',
    policy.trim(),
    '',
  ].join('\n');
}

export function grokSkillsNeedsUpdate(projectDir: string): {
  /** Project config still has illegal [skills] SVS block (needs strip). */
  blockMissing: boolean;
  nativeMissing: boolean;
  outdated: boolean;
} {
  const configPath = join(projectDir, '.grok', 'config.toml');
  const nativePath = join(projectDir, GROK_NATIVE_SKILL_REL);
  const nativeMissing = !existsSync(nativePath);
  let configPolluted = false;
  if (existsSync(configPath)) {
    configPolluted = SKILLS_BLOCK_RE.test(readFileSync(configPath, 'utf8'));
  }
  let outdated = false;
  if (!nativeMissing) {
    try {
      const sk = readFileSync(nativePath, 'utf8');
      if (!sk.includes(`svs-version: "${GROK_SKILLS_VERSION}"`)) outdated = true;
    } catch {
      /* ignore */
    }
  }
  // Reuse blockMissing = "needs config action" (pollution present)
  return { blockMissing: configPolluted, nativeMissing, outdated };
}

export function exportGrokSkills(
  projectDir: string,
  opts: { force?: boolean } = {}
): GrokSkillsResult {
  const need = grokSkillsNeedsUpdate(projectDir);
  const shouldClean = opts.force || need.blockMissing;
  const shouldNative = opts.force || need.nativeMissing || need.outdated;

  if (!shouldClean && !shouldNative) {
    return {
      configUpdated: false,
      nativeSkillWritten: false,
      version: GROK_SKILLS_VERSION,
      skippedReason: 'Grok skills bridge current',
    };
  }

  let configUpdated = false;
  if (shouldClean) {
    const configPath = join(projectDir, '.grok', 'config.toml');
    if (existsSync(configPath)) {
      const existing = readFileSync(configPath, 'utf8');
      if (SKILLS_BLOCK_RE.test(existing)) {
        const cleaned = existing.replace(SKILLS_BLOCK_RE, '').replace(/\n{3,}/g, '\n\n');
        writeFileSync(configPath, cleaned);
        configUpdated = true;
      }
    }
  }

  let nativeSkillWritten = false;
  if (shouldNative) {
    const dest = join(projectDir, GROK_NATIVE_SKILL_REL);
    mkdirSync(dirname(dest), { recursive: true });
    writeFileSync(dest, nativeSkillBody());
    nativeSkillWritten = true;
  }

  return {
    configUpdated,
    nativeSkillWritten,
    version: GROK_SKILLS_VERSION,
  };
}
