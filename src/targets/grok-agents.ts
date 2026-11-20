/**
 * Export Claude Code agents → Grok native `.grok/agents/*.md`.
 *
 * Per Grok README Claude Compatibility: `.claude/agents/` is also scanned, but
 * native `.grok/agents/` is the documented project location and shows up in
 * `/config-agents`. Copy (not symlink) so Grok works even if compat.agents is off.
 *
 * v1.20.0: a lookup stays on the parent. Spawn only for independent work.
 * v1.19.0: tester boots one Expo simulator after Jest when a screen changed.
 * v1.18.0: tester starts a local Podman pod on macOS when a test needs a
 * database or the container image (podman-patterns 1.1).
 * v1.17.0: tester walks a local web page (playwright-automation 2.1) before done.
 * v1.16.0: tester points at expo-testing on react-native.
 * v1.15.0: security-auditor / tester / documenter fork on react-native
 * (SecureStore, Jest+RNTL, Expo Files paths; skip web overlay).
 * v1.14.0: documenter same-pass Attention crumb (+ P&S if gotcha=).
 * HEAD mapping is source of truth. Still one spawn.
 * v1.13.0: one documenter spawn (why=/slug= includes RC). Hook strips
 * Read-first svs-document + 40k compact essays (01a00f26 tail 254+394 s).
 * v1.12.0: no GROK_BANNER in child files (parent spawn law stays in
 * GROK_SPAWN_RECIPE_MD / svs-dev-process). Prefer parent-inline docs when small.
 * v1.11.0: named CVEs in security-baseline/cve-watchlist.md (Read on hit).
 * Agents stay protocol; skills are corpus. Never Read a skill first.
 * v1.10.0: security-auditor CWE matrix + stack forks + dependency CVE probes.
 * v1.9.0: native tester / research-web / security-auditor / claude-md-compactor
 * (Grok Build tools only — search_tool/use_tool, no Claude mcp__ / skills:).
 * v1.8.0: agents_md false; no mandatory svs-document Read (2.90.2 bloated
 * prompt 39k→56k). background:true; push after C2; HEREDOC commit body.
 * v1.7.0: grok-4.6 accepts only low|medium|high|xhigh — pin writers to `low`
 * (not `none`, API 400). Grok frontmatter (prompt_mode, permission_mode,
 * agents_md, tools).
 * v1.6.0: spawn schema often omits `reasoning_effort` (session 01a00f26). Do
 * not pass that key (schema reject blocks spawn). Hook rewrites
 * general-purpose → type name.
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

export const GROK_AGENTS_VERSION = '1.20.0';
export const GROK_AGENTS_REL = '.grok/agents';
export const GROK_PERSONAS_REL = '.grok/personas';
export const GROK_ROLES_REL = '.grok/roles';

export interface GrokAgentsResult {
  written: number;
  overlaysRemoved: number;
  version: string;
  skippedReason?: string;
}

/**
 * Parent spawn law — do **not** prepend this to child `.grok/agents/*.md`.
 * Lives in GROK_SPAWN_RECIPE_MD / generated svs-dev-process only.
 */
export const GROK_BANNER = '';

/**
 * Parent-side spawn recipe (Grok Build 1.0.4+).
 * Custom type loads the lean agent + matching role (reasoning_effort=low).
 * Do not pass reasoning_effort on spawn — schema often omits the key.
 */
export const GROK_SPAWN_RECIPE_MD = [
  '## Grok spawn (type + role pin — parent stays thin)',
  '',
  'A subagent is its own session and is slower than the parent doing the step.',
  'Skip it when the parent can do the work, the user is in the loop, or the',
  'setup costs more than the parallelism (Grok Build subagents guide).',
  '',
  '- Lookup, grep, doc read, one-file edit: parent. No spawn.',
  '- A read that would fill the parent: one `explore` (read + shell, no edits).',
  '  Not a fan-out. Depth is 1. A child cannot spawn.',
  '- Spawn for independent work: tests while the parent edits, or a review of a',
  '  finished diff. `isolation: "none"` unless the child must edit beside the parent.',
  '- Do **not** pass `model` on spawn. Inheritance on rejects a named model.',
  '  Inheritance off uses the parent. A cheaper type is `[subagents.models]` in',
  '  config. Do not invent a model id.',
  '',
  'Grok 1.0.x: `spawn_subagent` often has **no** `reasoning_effort` in the tool schema.',
  'Passing that key fails the schema and the child inherits the parent (`xhigh`).',
  'Resolution order: spawn override → **role** → persona → parent.',
  'SVS pins `low` on `.grok/roles/<name>.toml` (grok-4.6 floor; no prompt_file).',
  '',
  '- Spawn `subagent_type` = native name so the agent **and** role apply',
  '  (`documenter` | `domain-updater` | `commit-manager` | `tester` |',
  '  `research-web` | `security-auditor` | `claude-md-compactor`).',
  '  `capability_mode: "all"`. Do not paste the file into `prompt`.',
  '- Grok Build tools only (`read_file`, `grep_search`, `web_search`, `search_tool`/`use_tool`).',
  '  No Claude `mcp__*` names. `model: inherit` (parent may be grok-code / grok-4.6).',
  '- Do **not** pass `reasoning_effort` on spawn. Role pins `low` (grok-4.6 floor).',
  '- Do **not** tell the child to Read `svs-document` / `AGENTS.md` (native agent is the protocol;',
  '  `agents_md: false`). Skill corpus on trigger only (never first) — e.g.',
  '  `security-baseline/cve-watchlist.md` when the lockfile hits.',
  '- A PreToolUse hook rewrites `general-purpose` → the matching type when the prompt',
  '  names a native agent (so the role still attaches).',
  '- Fastest path: parent Reads the Grok-native agent and executes — no spawn.',
  '  Prefer inline when filesTouched ≤ 5 and no new domain. Spawn when parent context is fat.',
  '- `explore` / `plan` cannot edit files — never as documenter.',
  '- **One** documenter spawn (`why=` `slug=` `gotcha=` if any). Child stamps domains,',
  '  prepends Recent Changes, writes one Attention crumb (P&S only if `gotcha=`).',
  '  Do **not** spawn domain-updater after unless a leftover gotcha remains. tester ∥ auditor OK.',
  '  `background: true`, `isolation: "none"` for writers.',
  '  Do **not** `get_task_output` in the same turn if the user has a next question.',
  '  Skip spawn for `scope.ts commit`. Never tell the child to Read `svs-document`.',
  '',
  '```',
  'spawn_subagent({',
  '  subagent_type: "documenter",',
  '  isolation: "none",',
  '  background: true,',
  '  capability_mode: "all",',
  '  description: "SVS documenter",',
  '  prompt: "HEAD=… filesTouched=… what shipped=… why=… slug=… gotcha=…(or omit). Execute. Return files written."',
  '})',
  '```',
  '',
  'Parent verifies on disk (`jq` `last_commit`, `rg` Recent Changes). Child “done” without writes = miss.',
  'If the type is unknown: parent Reads `.grok/agents/<name>.md` and executes — do not invent a third type.',
].join('\n');

const CLAUDE_ONLY_FM = /^\s*(model|tools|skills):\s*/i;
const FAT_OVERLAY_RE = /instructions_file\s*=|prompt_file\s*=/;
const LEAN_OVERLAY_NAMES = [
  'documenter',
  'domain-updater',
  'commit-manager',
  'tester',
  'research-web',
  'security-auditor',
  'claude-md-compactor',
] as const;

function leanPersonaToml(name: string): string {
  return [
    '# start-vibing-stacks',
    '# SVS persona — writers: low (grok-4.6 does not accept none)',
    'reasoning_effort = "low"',
    `description = "SVS ${name} — tool-first, low reasoning"`,
    'instructions = "Follow the matching .grok/agents file. Use tools immediately. No process essay. Write files, then stop."',
    '',
  ].join('\n');
}

function leanRoleToml(name: string): string {
  return [
    '# start-vibing-stacks',
    '# SVS role — resolution step 2 (spawn schema often omits reasoning_effort)',
    'reasoning_effort = "low"',
    'default_capability_mode = "all"',
    `description = "SVS ${name} — tool-first, low reasoning"`,
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
    return stripSvsGrokBanner(body);
  }
  const meta = fm[1]!
    .split('\n')
    .filter((line) => !CLAUDE_ONLY_FM.test(line))
    .join('\n');
  const rest = stripSvsGrokBanner(fm[2]!.replace(/^\s*\n/, ''));
  return `---\n${meta}\n---\n\n${rest}`;
}

/** 1.3.0 fat overlays (`instructions_file` / `prompt_file`) bloat boot. Keep lean effort pins. */
export function removeSvsGrokOverlays(projectDir: string): number {
  let removed = 0;
  for (const rel of [GROK_ROLES_REL, GROK_PERSONAS_REL]) {
    const dir = join(projectDir, rel);
    if (!existsSync(dir)) continue;
    for (const name of readdirSync(dir)) {
      if (!name.endsWith('.toml')) continue;
      const p = join(dir, name);
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

function leanOverlaysCurrent(projectDir: string): boolean {
  for (const rel of [GROK_PERSONAS_REL, GROK_ROLES_REL]) {
    const dir = join(projectDir, rel);
    const stamp = join(dir, '.svs-version');
    if (!existsSync(stamp)) return false;
    try {
      if (!readFileSync(stamp, 'utf8').includes(GROK_AGENTS_VERSION)) return false;
    } catch {
      return false;
    }
    if (!LEAN_OVERLAY_NAMES.every((n) => existsSync(join(dir, `${n}.toml`)))) return false;
  }
  return true;
}

export function hasStaleSvsGrokOverlays(projectDir: string): boolean {
  for (const rel of [GROK_ROLES_REL, GROK_PERSONAS_REL]) {
    const dir = join(projectDir, rel);
    if (!existsSync(dir)) continue;
    for (const name of readdirSync(dir)) {
      if (!name.endsWith('.toml')) continue;
      try {
        if (FAT_OVERLAY_RE.test(readFileSync(join(dir, name), 'utf8'))) return true;
      } catch {
        /* ignore */
      }
    }
  }
  return !leanOverlaysCurrent(projectDir);
}

function writeLeanEffortOverlays(projectDir: string): number {
  let written = 0;
  const personaDir = join(projectDir, GROK_PERSONAS_REL);
  const roleDir = join(projectDir, GROK_ROLES_REL);
  mkdirSync(personaDir, { recursive: true });
  mkdirSync(roleDir, { recursive: true });
  for (const name of LEAN_OVERLAY_NAMES) {
    writeFileSync(join(personaDir, `${name}.toml`), leanPersonaToml(name));
    writeFileSync(join(roleDir, `${name}.toml`), leanRoleToml(name));
    written += 2;
  }
  writeFileSync(
    join(personaDir, '.svs-version'),
    `# svs-version: ${GROK_AGENTS_VERSION}\n# Lean effort personas (no instructions_file)\n`
  );
  writeFileSync(
    join(roleDir, '.svs-version'),
    `# svs-version: ${GROK_AGENTS_VERSION}\n# Lean effort roles (no prompt_file)\n`
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
  writeLeanEffortOverlays(projectDir);

  return { written, overlaysRemoved, version: GROK_AGENTS_VERSION };
}
