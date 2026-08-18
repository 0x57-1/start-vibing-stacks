/**
 * Export Claude Code agents → Grok native `.grok/agents/*.md`.
 *
 * Per Grok README Claude Compatibility: `.claude/agents/` is also scanned, but
 * native `.grok/agents/` is the documented project location and shows up in
 * `/config-agents`. Copy (not symlink) so Grok works even if compat.agents is off.
 *
 * v1.3.1: Do **not** inline agent bodies into the parent spawn prompt (auto-compact
 * / session hang). Child Reads the file in its own window. Drop personas/roles
 * overlays — Grok cannot pass a persona on spawn, and `instructions_file` at
 * discovery bloats boot. Prefer `general-purpose` (failed custom types waste a
 * Stop continuation; max 8/turn).
 * v1.3.0: spawn recipe + overlays (reverted overlays in 1.3.1).
 * v1.1.0: strip Claude-only `model: sonnet`, inject inline-exec banner.
 */

import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  unlinkSync,
  writeFileSync,
} from 'fs';
import { join } from 'path';

export const GROK_AGENTS_VERSION = '1.3.1';
export const GROK_AGENTS_REL = '.grok/agents';
export const GROK_PERSONAS_REL = '.grok/personas';
export const GROK_ROLES_REL = '.grok/roles';

export interface GrokAgentsResult {
  written: number;
  overlaysRemoved: number;
  version: string;
  skippedReason?: string;
}

/** Injected at the top of every exported agent. Keep as one leading blockquote. */
export const GROK_BANNER =
  '> **Kimi / Grok:** Claude Task auto-invoke is unavailable. ' +
  '**Grok:** spawn `general-purpose` (`isolation: none`, writers `capability_mode: all`) with a **short** prompt: ' +
  '`Read this file FIRST, then execute. HEAD + filesTouched + task.` ' +
  'The child has its own context — **do not paste this file into the parent prompt** (hangs / auto-compact). ' +
  'Do not spawn `explore`/`plan` as a writer. One finalize child at a time. ' +
  'After source edits: `svs-finalize` (`commit-manager` → `documenter` → `domain-updater`). Never `git add -A`. ' +
  '**Kimi:** Read + execute every step inline.\n';

/**
 * Parent-side spawn recipe (Grok Build 1.0.4).
 * Child window loads the agent; parent stays thin.
 */
export const GROK_SPAWN_RECIPE_MD = [
  '## Grok spawn (child Reads the agent — parent stays thin)',
  '',
  'Grok 1.0.4: subagents have **their own** context. Setup cost that exceeds the',
  'benefit hangs the parent (auto-compact, 8 Stop continuations/turn).',
  '',
  '- **Do not** paste `.grok/agents/<name>.md` into the parent `prompt`.',
  '- **Do not** install personas/roles that `instructions_file` those mds (not a spawn param; boot bloat).',
  '- Prefer built-in `general-purpose` for writers. Failed custom types waste a turn.',
  '- `explore` / `plan` cannot edit files — never as documenter.',
  '- One finalize child at a time, `background: false`. `background` only for `research-web`.',
  '- Skip spawn for `scope.ts commit` — one shell on the parent.',
  '',
  '```',
  'spawn_subagent({',
  '  subagent_type: "general-purpose",',
  '  isolation: "none",',
  '  capability_mode: "all",',
  '  description: "SVS documenter",',
  '  prompt: "Read .grok/agents/documenter.md FIRST. Execute every step. HEAD=… filesTouched=… Stamp domains + _index.json. Return files written."',
  '})',
  '```',
  '',
  'Parent verifies on disk (`jq` `last_commit`, `rg` Recent Changes). Child “done” without writes = miss.',
  'If spawn fails: parent Reads the agent and executes — do not retry invented types.',
].join('\n');

const CLAUDE_ONLY_FM = /^\s*(model|tools|skills):\s*/i;
const SVS_OVERLAY_MARK = /start-vibing-stacks|# SVS (persona|role)/;

function listClaudeAgentFiles(projectDir: string): string[] {
  const dir = join(projectDir, '.claude', 'agents');
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((n) => n.endsWith('.md') && !n.startsWith('_') && !n.startsWith('.'))
    .sort();
}

/** Drop a leading SVS `> **Kimi / Grok:**` blockquote so we can rewrite it. */
export function stripSvsGrokBanner(rest: string): string {
  return rest.replace(/^>\s*\*\*Kimi \/ Grok:\*\*[^\n]*(?:\n>[^\n]*)*\n+/, '');
}

/** Strip Claude-only frontmatter keys and inject the current SVS spawn banner. */
export function adaptAgentForGrok(body: string): string {
  const fm = body.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!fm) {
    return `${GROK_BANNER}\n${stripSvsGrokBanner(body)}`;
  }
  const meta = fm[1]!
    .split('\n')
    .filter((line) => !CLAUDE_ONLY_FM.test(line))
    .join('\n');
  const rest = stripSvsGrokBanner(fm[2]!.replace(/^\s*\n/, ''));
  return `---\n${meta}\n---\n\n${GROK_BANNER}\n${rest}`;
}

/** 1.3.0 wrote these; they bloat Grok discovery and are not a spawn parameter. */
export function removeSvsGrokOverlays(projectDir: string): number {
  let removed = 0;
  for (const rel of [GROK_PERSONAS_REL, GROK_ROLES_REL]) {
    const dir = join(projectDir, rel);
    if (!existsSync(dir)) continue;
    for (const name of readdirSync(dir)) {
      const p = join(dir, name);
      if (name === '.svs-version') {
        try {
          unlinkSync(p);
          removed++;
        } catch {
          /* ignore */
        }
        continue;
      }
      if (!name.endsWith('.toml')) continue;
      let raw = '';
      try {
        raw = readFileSync(p, 'utf8');
      } catch {
        continue;
      }
      if (!SVS_OVERLAY_MARK.test(raw)) continue;
      try {
        unlinkSync(p);
        removed++;
      } catch {
        /* ignore */
      }
    }
  }
  return removed;
}

export function hasStaleSvsGrokOverlays(projectDir: string): boolean {
  for (const rel of [GROK_PERSONAS_REL, GROK_ROLES_REL]) {
    const dir = join(projectDir, rel);
    if (!existsSync(dir)) continue;
    if (existsSync(join(dir, '.svs-version'))) return true;
    for (const name of readdirSync(dir)) {
      if (!name.endsWith('.toml')) continue;
      try {
        if (SVS_OVERLAY_MARK.test(readFileSync(join(dir, name), 'utf8'))) return true;
      } catch {
        /* ignore */
      }
    }
  }
  return false;
}

export function grokAgentsNeedsUpdate(projectDir: string): {
  missing: boolean;
  outdated: boolean;
  claudeCount: number;
} {
  const names = listClaudeAgentFiles(projectDir);
  const destDir = join(projectDir, GROK_AGENTS_REL);
  if (names.length === 0) {
    return {
      missing: false,
      outdated: hasStaleSvsGrokOverlays(projectDir),
      claudeCount: 0,
    };
  }
  if (!existsSync(destDir)) {
    return { missing: true, outdated: false, claudeCount: names.length };
  }
  const stamp = join(destDir, '.svs-version');
  let outdated = !existsSync(stamp) || hasStaleSvsGrokOverlays(projectDir);
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
  const overlaysRemoved = removeSvsGrokOverlays(projectDir);
  if (need.claudeCount === 0) {
    return {
      written: 0,
      overlaysRemoved,
      version: GROK_AGENTS_VERSION,
      skippedReason:
        overlaysRemoved > 0
          ? `Removed ${overlaysRemoved} Grok persona/role overlay(s)`
          : 'No .claude/agents/*.md to export',
    };
  }
  if (!opts.force && !need.missing && !need.outdated && overlaysRemoved === 0) {
    return {
      written: 0,
      overlaysRemoved: 0,
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
    `# svs-version: ${GROK_AGENTS_VERSION}\n# Adapted from .claude/agents/ (thin spawn banner; no personas/roles)\n`
  );

  return { written, overlaysRemoved, version: GROK_AGENTS_VERSION };
}
