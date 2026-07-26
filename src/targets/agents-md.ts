/**
 * Generate root `AGENTS.md` for Kimi Code / Grok (shared file).
 * Claude keeps full CLAUDE.md + .claude/memories; this is a condensed twin.
 */

import { createHash } from 'crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { AGENTS_MD_GENERATOR_VERSION } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PACKAGE_ROOT = resolve(__dirname, '../..');

const POLICY_PACK = join(PACKAGE_ROOT, 'stacks', '_shared', 'targets', 'policy-pack.md');

export interface GenerateAgentsMdOptions {
  /** Overwrite even if AGENTS.md exists and looks user-customized */
  force?: boolean;
  /** Max Recent Changes entries to mirror from CLAUDE.md */
  recentChangesLimit?: number;
}

export interface GenerateAgentsMdResult {
  written: boolean;
  path: string;
  version: string;
  hash: string;
  skippedReason?: string;
}

/**
 * Build AGENTS.md from CLAUDE.md slices + bundled policy pack.
 * Preserves user body between markers if present and force=false with newer local edits —
 * Phase 1: overwrite when missing/outdated/force; otherwise skip if file exists and
 * frontmatter version >= bundled (caller decides outdated via manifest).
 */
export function generateAgentsMd(
  projectDir: string,
  opts: GenerateAgentsMdOptions = {}
): GenerateAgentsMdResult {
  const dest = join(projectDir, 'AGENTS.md');
  const recentLimit = opts.recentChangesLimit ?? 5;

  const policy = loadPolicyPack();
  const claudePath = join(projectDir, 'CLAUDE.md');
  const claude = existsSync(claudePath) ? readFileSync(claudePath, 'utf8') : '';

  const overview = extractSection(claude, '30 Seconds Overview') ?? 'Project configured by start-vibing-stacks.';
  const stack = extractSection(claude, 'Stack') ?? '_See CLAUDE.md for stack table._';
  const recent = extractRecentChanges(claude, recentLimit);
  const projectName = basenameSafe(projectDir);

  const body = [
    '---',
    `svs-version: ${AGENTS_MD_GENERATOR_VERSION}`,
    'generated-by: start-vibing-stacks',
    'targets: kimi, grok, cursor',
    '---',
    '',
    `# ${projectName} — AGENTS.md`,
    '',
    '> Shared project instructions for **Kimi Code**, **Grok**, and tools that read `AGENTS.md`.',
    '> Claude Code prefers `CLAUDE.md` + `.claude/memories/`. Keep both in sync via',
    '> `npx start-vibing-stacks migrate --apply`.',
    '',
    '## 30 Seconds Overview',
    '',
    overview.trim(),
    '',
    '## Stack',
    '',
    stack.trim(),
    '',
    '## Recent Changes (mirrored from CLAUDE.md)',
    '',
    recent.trim() || '_No Recent Changes block found in CLAUDE.md._',
    '',
    '<!-- SVS:POLICY-PACK:START -->',
    stripPolicyFrontmatter(policy).trim(),
    '<!-- SVS:POLICY-PACK:END -->',
    '',
    '## See also',
    '',
    '- `CLAUDE.md` — full Claude Code project rules',
    '- `.claude/memories/` — always-on Claude memories (source of detailed policy)',
    '- `.claude/config/svs-manifest.json` — package/target freshness',
    '',
  ].join('\n');

  const hash = createHash('sha256').update(body).digest('hex').slice(0, 16);

  if (existsSync(dest) && !opts.force) {
    // Caller should pass force when outdated/missing-version; default skip to avoid stomping.
    return {
      written: false,
      path: dest,
      version: AGENTS_MD_GENERATOR_VERSION,
      hash,
      skippedReason: 'exists (pass force to regenerate)',
    };
  }

  mkdirSync(projectDir, { recursive: true });
  writeFileSync(dest, body);
  return {
    written: true,
    path: dest,
    version: AGENTS_MD_GENERATOR_VERSION,
    hash,
  };
}

function loadPolicyPack(): string {
  if (!existsSync(POLICY_PACK)) {
    return '# Policy pack missing from package install.\n';
  }
  return readFileSync(POLICY_PACK, 'utf8');
}

function stripPolicyFrontmatter(md: string): string {
  return md.replace(/^---\s*\n[\s\S]*?\n---\s*\n?/, '');
}

/** Extract markdown section by ## heading (until next ## at same level). */
function extractSection(md: string, title: string): string | null {
  if (!md) return null;
  const lines = md.split('\n');
  const startRe = new RegExp(`^##\\s+${escapeRegExp(title)}\\s*$`);
  const start = lines.findIndex((l) => startRe.test(l));
  if (start < 0) return null;
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    if (/^##\s+/.test(lines[i] ?? '')) {
      end = i;
      break;
    }
  }
  return lines
    .slice(start + 1, end)
    .join('\n')
    .replace(/\n---\s*$/m, '')
    .trim();
}

function extractRecentChanges(md: string, limit: number): string {
  const section = extractSection(md, 'Recent Changes');
  if (!section) return '';
  // Drop HTML comments at top of section
  const cleaned = section.replace(/^<!--[\s\S]*?-->\s*/m, '').trim();
  const blocks = cleaned.split(/(?=^### )/m).filter((b) => b.trim().startsWith('###'));
  return blocks.slice(0, limit).join('\n').trim();
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function basenameSafe(dir: string): string {
  const parts = dir.replace(/\\/g, '/').split('/').filter(Boolean);
  return parts[parts.length - 1] || 'project';
}

/** Bundled policy-pack + generator version for migrate comparisons. */
export function bundledAgentsMdVersion(): string {
  if (!existsSync(POLICY_PACK)) return AGENTS_MD_GENERATOR_VERSION;
  try {
    const raw = readFileSync(POLICY_PACK, 'utf8');
    const fm = /^---\s*\n([\s\S]*?)\n---/.exec(raw);
    const v = fm ? /^svs-version:\s*["']?([0-9.]+)["']?\s*$/m.exec(fm[1] ?? '') : null;
    // Effective version = max(generator, policy-pack) as string compare of patch — keep generator as source of truth for AGENTS.md format.
    return v?.[1] && comparePatch(v[1], AGENTS_MD_GENERATOR_VERSION) > 0
      ? v[1]
      : AGENTS_MD_GENERATOR_VERSION;
  } catch {
    return AGENTS_MD_GENERATOR_VERSION;
  }
}

function comparePatch(a: string, b: string): number {
  const pa = a.split('.').map((n) => parseInt(n, 10) || 0);
  const pb = b.split('.').map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < 3; i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d !== 0) return d < 0 ? -1 : 1;
  }
  return 0;
}
