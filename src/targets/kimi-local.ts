/**
 * Phase 5–6: Kimi project-local config (.kimi-code/local.toml + example).
 * local.toml is machine-specific (absolute paths) — gitignored; example is committed.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PACKAGE_ROOT = resolve(__dirname, '../..');
const EXAMPLE_SRC = join(
  PACKAGE_ROOT,
  'stacks',
  '_shared',
  'targets',
  'kimi-local.toml.example'
);

/** 1.1.0: + extra_agent_dirs → .claude/agents */
export const KIMI_LOCAL_VERSION = '1.1.0';
export const KIMI_LOCAL_REL = '.kimi-code/local.toml';
export const KIMI_LOCAL_EXAMPLE_REL = '.kimi-code/local.toml.example';

const SKILLS_BLOCK_RE = /# SVS:KIMI:START[\s\S]*?# SVS:KIMI:END\n?/;

export interface KimiLocalResult {
  exampleWritten: boolean;
  localWritten: boolean;
  localUpdated: boolean;
  version: string;
  skippedReason?: string;
}

function skillsBlock(projectDir: string): string {
  const skillsAbs = join(projectDir, '.claude', 'skills');
  const agentsAbs = join(projectDir, '.claude', 'agents');
  return [
    '# SVS:KIMI:START — managed by start-vibing-stacks migrate',
    `# svs-version: ${KIMI_LOCAL_VERSION}`,
    '# Root AGENTS.md = project instructions. MCP = .kimi-code/mcp.json',
    'default_plan_mode = true',
    'default_permission_mode = "manual"',
    'merge_all_available_skills = true',
    `extra_skill_dirs = [${JSON.stringify(skillsAbs)}]`,
    `extra_agent_dirs = [${JSON.stringify(agentsAbs)}]`,
    '# SVS:KIMI:END',
    '',
  ].join('\n');
}

export function kimiLocalNeedsUpdate(projectDir: string): {
  exampleMissing: boolean;
  localMissing: boolean;
  blockMissing: boolean;
} {
  const examplePath = join(projectDir, KIMI_LOCAL_EXAMPLE_REL);
  const localPath = join(projectDir, KIMI_LOCAL_REL);
  const localMissing = !existsSync(localPath);
  let blockMissing = localMissing;
  if (!localMissing) {
    const raw = readFileSync(localPath, 'utf8');
    blockMissing =
      !SKILLS_BLOCK_RE.test(raw) ||
      !raw.includes(`svs-version: ${KIMI_LOCAL_VERSION}`) ||
      !raw.includes('extra_agent_dirs');
  }
  return {
    exampleMissing: !existsSync(examplePath),
    localMissing,
    blockMissing,
  };
}

export function exportKimiLocal(
  projectDir: string,
  opts: { force?: boolean } = {}
): KimiLocalResult {
  const kimiDir = join(projectDir, '.kimi-code');
  mkdirSync(kimiDir, { recursive: true });

  let exampleWritten = false;
  const exampleDest = join(projectDir, KIMI_LOCAL_EXAMPLE_REL);
  if (existsSync(EXAMPLE_SRC) && (!existsSync(exampleDest) || opts.force)) {
    writeFileSync(exampleDest, readFileSync(EXAMPLE_SRC, 'utf8'));
    exampleWritten = true;
  }

  const localPath = join(projectDir, KIMI_LOCAL_REL);
  const block = skillsBlock(projectDir);
  let localWritten = false;
  let localUpdated = false;

  if (!existsSync(localPath)) {
    writeFileSync(
      localPath,
      [
        '# Kimi Code project-local config (gitignored — absolute paths)',
        '# Created by start-vibing-stacks. Edit freely; SVS:KIMI block is refreshed by migrate.',
        '',
        block,
      ].join('\n')
    );
    localWritten = true;
  } else {
    const existing = readFileSync(localPath, 'utf8');
    if (SKILLS_BLOCK_RE.test(existing)) {
      if (
        opts.force ||
        !existing.includes(`svs-version: ${KIMI_LOCAL_VERSION}`) ||
        !existing.includes('extra_agent_dirs')
      ) {
        writeFileSync(localPath, existing.replace(SKILLS_BLOCK_RE, block.trimEnd() + '\n'));
        localUpdated = true;
      }
    } else if (opts.force || !existing.includes('extra_skill_dirs')) {
      writeFileSync(localPath, existing.replace(/\s*$/, '\n\n') + block);
      localUpdated = true;
    }
  }

  return {
    exampleWritten,
    localWritten,
    localUpdated,
    version: KIMI_LOCAL_VERSION,
    skippedReason:
      !exampleWritten && !localWritten && !localUpdated
        ? 'Kimi local.toml SVS block current'
        : undefined,
  };
}

export function ensureKimiLocalGitignore(projectDir: string): boolean {
  const giPath = join(projectDir, '.gitignore');
  if (!existsSync(giPath)) return false;
  let gi = readFileSync(giPath, 'utf8');
  if (gi.includes('.kimi-code/local.toml')) return false;
  gi =
    gi.trimEnd() +
    '\n\n# Kimi Code project-local config (absolute paths; machine-specific)\n.kimi-code/local.toml\n';
  writeFileSync(giPath, gi);
  return true;
}
