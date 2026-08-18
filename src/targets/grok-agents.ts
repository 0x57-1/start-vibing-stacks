/**
 * Export Claude Code agents → Grok native `.grok/agents/*.md`.
 *
 * Per Grok README Claude Compatibility: `.claude/agents/` is also scanned, but
 * native `.grok/agents/` is the documented project location and shows up in
 * `/config-agents`. Copy (not symlink) so Grok works even if compat.agents is off.
 *
 * v1.5.0: richer native agents (create-from-template, Files, connections,
 * index upsert, wisdom structure). Spawn custom type (`documenter`) so the
 * agent IS the child system prompt. Tiny personas set `reasoning_effort=low`
 * (no instructions_file). Spawn recipe passes `reasoning_effort: "low"`.
 * v1.4.0: write Grok-native lean agents (stacks/_shared/targets/grok-native-agents)
 * for documenter / domain-updater / commit-manager. Other Claude agents become
 * short stubs — do not copy 200–400 line Task manuals (session 01a00f26: 8 min
 * finalize from reading those copies).
 * v1.3.1: Do **not** inline agent bodies into the parent spawn prompt (auto-compact
 * / session hang). Child Reads the file in its own window. Drop fat personas/roles
 * (`instructions_file` of Claude manuals).
 * v1.3.0: spawn recipe + overlays (fat overlays reverted in 1.3.1).
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
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';

const PACKAGE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const NATIVE_AGENTS_DIR = join(
  PACKAGE_ROOT,
  'stacks',
  '_shared',
  'targets',
  'grok-native-agents'
);

export const GROK_AGENTS_VERSION = '1.5.0';
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
  '**Grok:** spawn `subagent_type: "<name>"` (`isolation: none`, `capability_mode: all`, `reasoning_effort: "low"`) ' +
  'with a **short** prompt: `HEAD + filesTouched + what shipped.` ' +
  'The child has its own context — **do not paste this file into the parent prompt** (hangs / auto-compact). ' +
  'Do not spawn `explore`/`plan` as a writer. One finalize child at a time. ' +
  'After source edits: `svs-finalize` (`commit-manager` → `documenter` → `domain-updater`). Never `git add -A`. ' +
  'These `.grok/agents/` files are **Grok-native**. Do not open `.claude/agents/` unless this file says to. ' +
  '**Kimi:** Read + execute `.claude/agents/` inline.\n';

/**
 * Parent-side spawn recipe (Grok Build 1.0.4+).
 * Custom type loads the lean agent as the child's system prompt.
 * reasoning_effort low — children inherit the parent's xhigh unless overridden.
 */
export const GROK_SPAWN_RECIPE_MD = [
  '## Grok spawn (custom type + low effort — parent stays thin)',
  '',
  'Grok 1.0.4+: subagents have **their own** context. `.grok/agents/documenter.md`',
  'is a **Grok-native** checklist — not the Claude Task copy.',
  'A parent on `xhigh` otherwise hands that effort to every child (minutes to stamp a SHA).',
  '',
  '- Spawn `subagent_type: "documenter"` / `"domain-updater"` so the agent **is** the child',
  '  (full tools via `capability_mode: "all"`). Do not paste the file into `prompt`.',
  '- Pass `reasoning_effort: "low"` (spawn-time override). Drop the key only if the',
  '  schema rejects it, then retry. Tiny `.grok/personas/<name>.toml` also pin `low`.',
  '- Fallback if the type is unknown: `general-purpose` + `Read .grok/agents/<name>.md FIRST`.',
  '- `explore` / `plan` cannot edit files — never as documenter.',
  '- One finalize child at a time, `background: false`. `background` only for `research-web`.',
  '- Skip spawn for `scope.ts commit` — one shell on the parent.',
  '',
  '```',
  'spawn_subagent({',
  '  subagent_type: "documenter",',
  '  isolation: "none",',
  '  capability_mode: "all",',
  '  reasoning_effort: "low",',
  '  description: "SVS documenter",',
  '  prompt: "HEAD=… filesTouched=… what shipped=… Execute the agent. Return files written."',
  '})',
  '```',
  '',
  'Parent verifies on disk (`jq` `last_commit`, `rg` Recent Changes). Child “done” without writes = miss.',
  'If spawn fails on an unknown key or type: retry without `reasoning_effort` or with',
  '`general-purpose` + Read — do not invent a third type.',
].join('\n');

const CLAUDE_ONLY_FM = /^\s*(model|tools|skills):\s*/i;
const SVS_OVERLAY_MARK = /start-vibing-stacks|# SVS (persona|role)/;
const FAT_OVERLAY_RE = /instructions_file\s*=/;
const LEAN_PERSONA_NAMES = ['documenter', 'domain-updater'] as const;

function leanPersonaToml(name: string): string {
  return [
    '# start-vibing-stacks',
    '# SVS persona — low effort, no instructions_file (boot-safe)',
    'reasoning_effort = "low"',
    `description = "SVS ${name} — tool-first, low reasoning"`,
    'instructions = "Follow the matching .grok/agents file. Use tools immediately. No process essay. Write files, then stop."',
    '',
  ].join('\n');
}

function listClaudeAgentFiles(projectDir: string): string[] {
  const dir = join(projectDir, '.claude', 'agents');
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((n) => n.endsWith('.md') && !n.startsWith('_') && !n.startsWith('.'))
    .sort();
}

function listNativeAgentFiles(): string[] {
  if (!existsSync(NATIVE_AGENTS_DIR)) return [];
  return readdirSync(NATIVE_AGENTS_DIR)
    .filter((n) => n.endsWith('.md') && !n.startsWith('.'))
    .sort();
}

function grokStubAgent(name: string): string {
  const stem = name.replace(/\.md$/i, '');
  return [
    '---',
    `name: ${stem}`,
    'description: >',
    `  Grok stub. Read .claude/agents/${name} only if the parent task needs the full`,
    '  Claude checklist. Otherwise do the minimum asked and return files written.',
    '---',
    '',
    `# ${stem} (Grok stub)`,
    '',
    `Do not load the Claude agent unless you are stuck. Path: \`.claude/agents/${name}\`.`,
    '',
  ].join('\n');
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

/** 1.3.0 fat overlays (`instructions_file` of Claude manuals) bloat boot. Keep lean effort personas. */
export function removeSvsGrokOverlays(projectDir: string): number {
  let removed = 0;
  const rolesDir = join(projectDir, GROK_ROLES_REL);
  if (existsSync(rolesDir)) {
    for (const name of readdirSync(rolesDir)) {
      const p = join(rolesDir, name);
      if (name === '.svs-version' || name.endsWith('.toml')) {
        let raw = '';
        try {
          raw = name.endsWith('.toml') ? readFileSync(p, 'utf8') : '# SVS role';
        } catch {
          continue;
        }
        if (name === '.svs-version' || SVS_OVERLAY_MARK.test(raw) || FAT_OVERLAY_RE.test(raw)) {
          try {
            unlinkSync(p);
            removed++;
          } catch {
            /* ignore */
          }
        }
      }
    }
  }
  const personasDir = join(projectDir, GROK_PERSONAS_REL);
  if (existsSync(personasDir)) {
    for (const name of readdirSync(personasDir)) {
      if (!name.endsWith('.toml')) continue;
      const p = join(personasDir, name);
      let raw = '';
      try {
        raw = readFileSync(p, 'utf8');
      } catch {
        continue;
      }
      if (!FAT_OVERLAY_RE.test(raw)) continue;
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

function leanPersonasCurrent(projectDir: string): boolean {
  const dir = join(projectDir, GROK_PERSONAS_REL);
  const stamp = join(dir, '.svs-version');
  if (!existsSync(stamp)) return false;
  try {
    if (!readFileSync(stamp, 'utf8').includes(GROK_AGENTS_VERSION)) return false;
  } catch {
    return false;
  }
  return LEAN_PERSONA_NAMES.every((n) => existsSync(join(dir, `${n}.toml`)));
}

export function hasStaleSvsGrokOverlays(projectDir: string): boolean {
  const rolesDir = join(projectDir, GROK_ROLES_REL);
  if (existsSync(rolesDir)) {
    for (const name of readdirSync(rolesDir)) {
      if (name === '.svs-version') return true;
      if (!name.endsWith('.toml')) continue;
      try {
        const raw = readFileSync(join(rolesDir, name), 'utf8');
        if (SVS_OVERLAY_MARK.test(raw) || FAT_OVERLAY_RE.test(raw)) return true;
      } catch {
        /* ignore */
      }
    }
  }
  const personasDir = join(projectDir, GROK_PERSONAS_REL);
  if (existsSync(personasDir)) {
    for (const name of readdirSync(personasDir)) {
      if (!name.endsWith('.toml')) continue;
      try {
        if (FAT_OVERLAY_RE.test(readFileSync(join(personasDir, name), 'utf8'))) return true;
      } catch {
        /* ignore */
      }
    }
  }
  return !leanPersonasCurrent(projectDir);
}

function writeLeanEffortPersonas(projectDir: string): number {
  const dir = join(projectDir, GROK_PERSONAS_REL);
  mkdirSync(dir, { recursive: true });
  let written = 0;
  for (const name of LEAN_PERSONA_NAMES) {
    writeFileSync(join(dir, `${name}.toml`), leanPersonaToml(name));
    written++;
  }
  writeFileSync(
    join(dir, '.svs-version'),
    `# svs-version: ${GROK_AGENTS_VERSION}\n# Lean effort personas (no instructions_file)\n`
  );
  return written;
}

function expectedGrokAgentNames(projectDir: string): string[] {
  return [...new Set([...listClaudeAgentFiles(projectDir), ...listNativeAgentFiles()])].sort();
}

export function grokAgentsNeedsUpdate(projectDir: string): {
  missing: boolean;
  outdated: boolean;
  claudeCount: number;
} {
  const names = expectedGrokAgentNames(projectDir);
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
          : 'No Grok-native or .claude/agents to export',
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

  const destDir = join(projectDir, GROK_AGENTS_REL);
  mkdirSync(destDir, { recursive: true });

  let written = 0;
  for (const name of expectedGrokAgentNames(projectDir)) {
    const nativePath = join(NATIVE_AGENTS_DIR, name);
    const body = existsSync(nativePath)
      ? readFileSync(nativePath, 'utf8')
      : grokStubAgent(name);
    writeFileSync(join(destDir, name), body);
    written++;
  }
  writeFileSync(
    join(destDir, '.svs-version'),
    `# svs-version: ${GROK_AGENTS_VERSION}\n# Grok-native agents + stubs (not Claude Task copies)\n`
  );
  writeLeanEffortPersonas(projectDir);

  return { written, overlaysRemoved, version: GROK_AGENTS_VERSION };
}
