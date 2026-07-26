/**
 * Phase 6: Grok skills bridge — [skills] paths → .claude/skills + native svs-policy skill.
 * Grok also auto-discovers Claude skills; explicit paths survive if compat is disabled.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PACKAGE_ROOT = resolve(__dirname, '../..');
const POLICY_PACK = join(PACKAGE_ROOT, 'stacks', '_shared', 'targets', 'policy-pack.md');

export const GROK_SKILLS_VERSION = '1.0.0';
export const GROK_NATIVE_SKILL_REL = '.grok/skills/svs-policy/SKILL.md';

const SKILLS_BLOCK_RE = /# SVS:SKILLS:START[\s\S]*?# SVS:SKILLS:END\n?/;

export interface GrokSkillsResult {
  configUpdated: boolean;
  nativeSkillWritten: boolean;
  version: string;
  skippedReason?: string;
}

function skillsTomlBlock(projectDir: string): string {
  const skillsAbs = join(projectDir, '.claude', 'skills');
  return [
    '# SVS:SKILLS:START — managed by start-vibing-stacks',
    `# svs-version: ${GROK_SKILLS_VERSION}`,
    '# Grok also auto-reads .claude/skills; this path keeps discovery if Claude compat is off.',
    '[skills]',
    `paths = [${JSON.stringify(skillsAbs)}]`,
    '# SVS:SKILLS:END',
    '',
  ].join('\n');
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
    '> Claude skills are on `[skills].paths` → `.claude/skills` (see `.grok/config.toml`).',
    '',
    policy.trim(),
    '',
  ].join('\n');
}

export function grokSkillsNeedsUpdate(projectDir: string): {
  blockMissing: boolean;
  nativeMissing: boolean;
  outdated: boolean;
} {
  const configPath = join(projectDir, '.grok', 'config.toml');
  const nativePath = join(projectDir, GROK_NATIVE_SKILL_REL);
  const nativeMissing = !existsSync(nativePath);
  let blockMissing = true;
  let outdated = false;
  if (existsSync(configPath)) {
    const raw = readFileSync(configPath, 'utf8');
    blockMissing = !SKILLS_BLOCK_RE.test(raw);
    if (!blockMissing && !raw.includes(`svs-version: ${GROK_SKILLS_VERSION}`)) {
      outdated = true;
    }
  }
  if (!nativeMissing) {
    try {
      const sk = readFileSync(nativePath, 'utf8');
      if (!sk.includes(`svs-version: "${GROK_SKILLS_VERSION}"`)) outdated = true;
    } catch {
      /* ignore */
    }
  }
  return { blockMissing, nativeMissing, outdated };
}

export function exportGrokSkills(
  projectDir: string,
  opts: { force?: boolean } = {}
): GrokSkillsResult {
  const need = grokSkillsNeedsUpdate(projectDir);
  const shouldConfig = opts.force || need.blockMissing || need.outdated;
  const shouldNative = opts.force || need.nativeMissing || need.outdated;

  if (!shouldConfig && !shouldNative) {
    return {
      configUpdated: false,
      nativeSkillWritten: false,
      version: GROK_SKILLS_VERSION,
      skippedReason: 'Grok skills bridge current',
    };
  }

  let configUpdated = false;
  if (shouldConfig) {
    const grokDir = join(projectDir, '.grok');
    mkdirSync(grokDir, { recursive: true });
    const configPath = join(grokDir, 'config.toml');
    const block = skillsTomlBlock(projectDir);
    const existing = existsSync(configPath) ? readFileSync(configPath, 'utf8') : '';
    if (!existing.trim()) {
      writeFileSync(
        configPath,
        '# Grok Build project config — managed blocks by start-vibing-stacks\n\n' + block
      );
    } else if (SKILLS_BLOCK_RE.test(existing)) {
      writeFileSync(configPath, existing.replace(SKILLS_BLOCK_RE, block.trimEnd() + '\n'));
    } else {
      writeFileSync(configPath, existing.replace(/\s*$/, '\n\n') + block);
    }
    configUpdated = true;
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
