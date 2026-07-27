/**
 * Export Claude Code agents → Grok native `.grok/agents/*.md`.
 *
 * Per Grok README Claude Compatibility: `.claude/agents/` is also scanned, but
 * native `.grok/agents/` is the documented project location and shows up in
 * `/config-agents`. Copy (not symlink) so Grok works even if compat.agents is off.
 */

import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

export const GROK_AGENTS_VERSION = '1.0.0';
export const GROK_AGENTS_REL = '.grok/agents';

export interface GrokAgentsResult {
  written: number;
  version: string;
  skippedReason?: string;
}

function listClaudeAgentFiles(projectDir: string): string[] {
  const dir = join(projectDir, '.claude', 'agents');
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((n) => n.endsWith('.md') && !n.startsWith('_'))
    .sort();
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
    copyFileSync(join(srcDir, name), join(destDir, name));
    written++;
  }
  writeFileSync(
    join(destDir, '.svs-version'),
    `# svs-version: ${GROK_AGENTS_VERSION}\n# Copied from .claude/agents/ by start-vibing-stacks\n`
  );

  return { written, version: GROK_AGENTS_VERSION };
}
