/**
 * Phase 5–7: Kimi project-local config (.kimi-code/local.toml + example).
 * local.toml is machine-specific (absolute paths) — gitignored; example is committed.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { GROK_SKILLS_VERSION, memoryIndexSkillBody, writeSkillMd } from './grok-skills.js';

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

/**
 * 1.3.0: same memory index as Grok — `.kimi-code/skills/svs-memory-index`
 * points at `.claude/memories/` (no full copy).
 * 1.2.0: default_permission_mode = yolo (parity with Claude Launch
 * --dangerously-skip-permissions) so MCP/tool calls are not prompted every turn.
 * Plan mode stays on (plan-then-act); exit plan still needs approval.
 */
export const KIMI_LOCAL_VERSION = '1.3.0';
export const KIMI_LOCAL_REL = '.kimi-code/local.toml';
export const KIMI_LOCAL_EXAMPLE_REL = '.kimi-code/local.toml.example';

const SKILLS_BLOCK_RE = /# SVS:KIMI:START[\s\S]*?# SVS:KIMI:END\n?/;

export interface KimiLocalResult {
  exampleWritten: boolean;
  localWritten: boolean;
  localUpdated: boolean;
  memoryIndexWritten: boolean;
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
    '# Memories: .kimi-code/skills/svs-memory-index → .claude/memories/ (pointers only)',
    '# yolo ≈ Claude --dangerously-skip-permissions (tools/MCP auto-approved).',
    '# Plan mode still on — approve the plan once; tools inside the turn are auto-allowed.',
    'default_plan_mode = true',
    'default_permission_mode = "yolo"',
    'merge_all_available_skills = true',
    `extra_skill_dirs = [${JSON.stringify(skillsAbs)}]`,
    `extra_agent_dirs = [${JSON.stringify(agentsAbs)}]`,
    '# SVS:KIMI:END',
    '',
  ].join('\n');
}

function memoryIndexPath(projectDir: string): string {
  return join(projectDir, '.kimi-code', 'skills', 'svs-memory-index', 'SKILL.md');
}

function memoryIndexStale(projectDir: string): boolean {
  const p = memoryIndexPath(projectDir);
  if (!existsSync(p)) return true;
  try {
    return !readFileSync(p, 'utf8').includes(`svs-version: "${GROK_SKILLS_VERSION}"`);
  } catch {
    return true;
  }
}

export function kimiLocalNeedsUpdate(projectDir: string): {
  exampleMissing: boolean;
  localMissing: boolean;
  blockMissing: boolean;
  memoryIndexStale: boolean;
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
      !raw.includes('extra_agent_dirs') ||
      !raw.includes('default_permission_mode = "yolo"');
  }
  return {
    exampleMissing: !existsSync(examplePath),
    localMissing,
    blockMissing,
    memoryIndexStale: memoryIndexStale(projectDir),
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
        !existing.includes('extra_agent_dirs') ||
        !existing.includes('default_permission_mode = "yolo"')
      ) {
        writeFileSync(localPath, existing.replace(SKILLS_BLOCK_RE, block.trimEnd() + '\n'));
        localUpdated = true;
      }
    } else if (opts.force || !existing.includes('extra_skill_dirs')) {
      writeFileSync(localPath, existing.replace(/\s*$/, '\n\n') + block);
      localUpdated = true;
    }
  }

  const indexPath = memoryIndexPath(projectDir);
  const memoryIndexWritten = !existsSync(indexPath) || memoryIndexStale(projectDir);
  if (memoryIndexWritten) {
    writeSkillMd(
      join(projectDir, '.kimi-code', 'skills'),
      'svs-memory-index',
      memoryIndexSkillBody()
    );
  }

  return {
    exampleWritten,
    localWritten,
    localUpdated,
    memoryIndexWritten,
    version: KIMI_LOCAL_VERSION,
    skippedReason:
      !exampleWritten && !localWritten && !localUpdated && !memoryIndexWritten
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
