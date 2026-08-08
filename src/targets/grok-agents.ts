/**
 * Export Claude Code agents → Grok native `.grok/agents/*.md`.
 *
 * Per Grok README Claude Compatibility: `.claude/agents/` is also scanned, but
 * native `.grok/agents/` is the documented project location and shows up in
 * `/config-agents`. Copy (not symlink) so Grok works even if compat.agents is off.
 *
 * v1.1.0: adapt for Kimi/Grok — strip Claude-only `model: sonnet`, inject banner
 * that agents must be Read+executed inline (no Task auto-invoke).
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

export const GROK_AGENTS_VERSION = '1.2.0';
export const GROK_AGENTS_REL = '.grok/agents';

export interface GrokAgentsResult {
  written: number;
  version: string;
  skippedReason?: string;
}

const GROK_BANNER =
  '> **Kimi / Grok:** Claude Task auto-invoke is unavailable. ' +
  '**Read this entire agent file and execute every step inline** (or `spawn_subagent` on Grok). ' +
  'After source edits, skill `svs-finalize` — **same order as Claude**: ' +
  '`commit-manager`/`scope.ts commit` (code) → `documenter` → `domain-updater` (CLAUDE.md Recent Changes) → docs commit. ' +
  'Never `git add -A`. Stop blocks until docs catch up.\n';

function listClaudeAgentFiles(projectDir: string): string[] {
  const dir = join(projectDir, '.claude', 'agents');
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((n) => n.endsWith('.md') && !n.startsWith('_'))
    .sort();
}

/** Strip Claude-only frontmatter keys and inject Kimi/Grok execution banner. */
export function adaptAgentForGrok(body: string): string {
  const fm = body.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!fm) {
    return `${GROK_BANNER}\n${body}`;
  }
  let meta = fm[1]!;
  meta = meta
    .split('\n')
    .filter((line) => !/^\s*model:\s*/i.test(line))
    .join('\n');
  // Prefer generic tool list wording for Grok (Claude Edit/Bash names still OK via bridge).
  if (!/^\s*description:/m.test(meta)) {
    /* keep */
  }
  const rest = fm[2]!.replace(/^\s*\n/, '');
  if (rest.includes('**Kimi / Grok:**')) {
    return `---\n${meta}\n---\n\n${rest}`;
  }
  return `---\n${meta}\n---\n\n${GROK_BANNER}\n${rest}`;
}

export function grokAgentsNeedsUpdate(projectDir: string): {
  missing: boolean;
  outdated: boolean;
  claudeCount: number;
} {
  const names = listClaudeAgentFiles(projectDir);
  const destDir = join(projectDir, GROK_AGENTS_REL);
  if (names.length === 0) {
    return { missing: false, outdated: false, claudeCount: 0 };
  }
  if (!existsSync(destDir)) {
    return { missing: true, outdated: false, claudeCount: names.length };
  }
  const stamp = join(destDir, '.svs-version');
  let outdated = !existsSync(stamp);
  if (!outdated) {
    try {
      outdated = !readFileSync(stamp, 'utf8').includes(GROK_AGENTS_VERSION);
    } catch {
      outdated = true;
    }
  }
  for (const name of names) {
    if (!existsSync(join(destDir, name))) {
      return { missing: true, outdated, claudeCount: names.length };
    }
  }
  return { missing: false, outdated, claudeCount: names.length };
}

export function exportGrokAgents(
  projectDir: string,
  opts: { force?: boolean } = {}
): GrokAgentsResult {
  const need = grokAgentsNeedsUpdate(projectDir);
  if (need.claudeCount === 0) {
    return {
      written: 0,
      version: GROK_AGENTS_VERSION,
      skippedReason: 'No .claude/agents/*.md to export',
    };
  }
  if (!opts.force && !need.missing && !need.outdated) {
    return {
      written: 0,
      version: GROK_AGENTS_VERSION,
      skippedReason: 'Grok agents current',
    };
  }

  const srcDir = join(projectDir, '.claude', 'agents');
  const destDir = join(projectDir, GROK_AGENTS_REL);
  mkdirSync(destDir, { recursive: true });

  let written = 0;
  for (const name of listClaudeAgentFiles(projectDir)) {
    const raw = readFileSync(join(srcDir, name), 'utf8');
    writeFileSync(join(destDir, name), adaptAgentForGrok(raw));
    written++;
  }
  writeFileSync(
    join(destDir, '.svs-version'),
    `# svs-version: ${GROK_AGENTS_VERSION}\n# Adapted from .claude/agents/ by start-vibing-stacks (inline-exec banner)\n`
  );

  return { written, version: GROK_AGENTS_VERSION };
}
