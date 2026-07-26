/**
 * Export Claude MCP config → Kimi (.kimi-code/mcp.json), Grok (.grok/config.toml),
 * and Cursor (.cursor/mcp.json) for multi-target parity.
 *
 * Sources (merged; later wins on same server id):
 *   1. ~/.claude.json#mcpServers (+ projects[<abs>]#mcpServers)
 *   2. ~/.claude/settings.json#mcpServers
 *   3. <project>/.claude/config/mcp-active.json
 *   4. <project>/.claude/settings.json#mcpServers
 *   5. <project>/.mcp.json
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { homedir } from 'os';
import { dirname, join, resolve } from 'path';

/** Bump when export shape / source merge changes (manifest freshness). */
export const MCP_EXPORT_VERSION = '1.1.0';
export const GROK_RULES_VERSION = '1.0.1';

export type ClaudeMcpServers = Record<string, Record<string, unknown>>;

export interface McpExportResult {
  kimiWritten: boolean;
  grokWritten: boolean;
  cursorWritten: boolean;
  grokRulesWritten: boolean;
  serverCount: number;
  sources?: string[];
  skippedReason?: string;
}

function homeDir(): string {
  return process.env['HOME'] || process.env['USERPROFILE'] || homedir();
}

/** Extract mcpServers map from a parsed JSON value. */
export function asMcpServers(raw: unknown): ClaudeMcpServers | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const obj = raw as Record<string, unknown>;
  const servers =
    obj.mcpServers && typeof obj.mcpServers === 'object' && !Array.isArray(obj.mcpServers)
      ? (obj.mcpServers as Record<string, unknown>)
      : obj;
  const keys = Object.keys(servers);
  if (keys.length === 0) return null;
  const first = servers[keys[0]!];
  if (!first || typeof first !== 'object' || Array.isArray(first)) return null;
  // Reject if this looks like a full settings file mistaken for servers
  if ('permissions' in servers && 'hooks' in servers) return null;
  return servers as ClaudeMcpServers;
}

function tryLoadMcpFile(path: string): ClaudeMcpServers | null {
  if (!existsSync(path)) return null;
  try {
    return asMcpServers(JSON.parse(readFileSync(path, 'utf8')));
  } catch {
    return null;
  }
}

function mergeServers(
  into: ClaudeMcpServers,
  from: ClaudeMcpServers | null,
  sources: string[],
  label: string
): void {
  if (!from || Object.keys(from).length === 0) return;
  Object.assign(into, from);
  sources.push(label);
}

/**
 * Load merged Claude MCP map: user-global (~/.claude.json) + project files.
 * Project entries override user-global on the same server id.
 */
export function loadProjectMcpServers(projectDir: string): ClaudeMcpServers | null {
  const merged: ClaudeMcpServers = {};
  const sources: string[] = [];
  const absProject = resolve(projectDir);
  const home = homeDir();

  // 1) User-global ~/.claude.json (root + this project's entry under projects)
  const claudeJsonPath = join(home, '.claude.json');
  if (existsSync(claudeJsonPath)) {
    try {
      const j = JSON.parse(readFileSync(claudeJsonPath, 'utf8')) as Record<string, unknown>;
      mergeServers(merged, asMcpServers({ mcpServers: j.mcpServers }), sources, '~/.claude.json');
      const projects = j.projects;
      if (projects && typeof projects === 'object' && !Array.isArray(projects)) {
        const map = projects as Record<string, { mcpServers?: unknown }>;
        const entry = map[absProject] ?? map[projectDir];
        if (entry?.mcpServers) {
          mergeServers(
            merged,
            asMcpServers({ mcpServers: entry.mcpServers }),
            sources,
            `~/.claude.json#projects[${absProject}]`
          );
        }
      }
    } catch {
      /* ignore corrupt user file */
    }
  }

  // 2) User settings
  mergeServers(
    merged,
    tryLoadMcpFile(join(home, '.claude', 'settings.json')),
    sources,
    '~/.claude/settings.json'
  );

  // 3–5) Project overlays (win on conflict)
  mergeServers(
    merged,
    tryLoadMcpFile(join(projectDir, '.claude', 'config', 'mcp-active.json')),
    sources,
    '.claude/config/mcp-active.json'
  );
  mergeServers(
    merged,
    tryLoadMcpFile(join(projectDir, '.claude', 'settings.json')),
    sources,
    '.claude/settings.json'
  );
  mergeServers(merged, tryLoadMcpFile(join(projectDir, '.mcp.json')), sources, '.mcp.json');

  if (Object.keys(merged).length === 0) return null;
  // Stash sources on a non-enumerable note? callers use return value only —
  // exportMcpToTargets re-scans via loadMcpSources for reporting.
  void sources;
  return merged;
}

/** Diagnostic: which source files contributed (same merge order). */
export function listMcpSourceLabels(projectDir: string): string[] {
  const sources: string[] = [];
  const absProject = resolve(projectDir);
  const home = homeDir();
  const claudeJsonPath = join(home, '.claude.json');
  if (existsSync(claudeJsonPath)) {
    try {
      const j = JSON.parse(readFileSync(claudeJsonPath, 'utf8')) as Record<string, unknown>;
      if (asMcpServers({ mcpServers: j.mcpServers })) sources.push('~/.claude.json');
      const projects = j.projects as Record<string, { mcpServers?: unknown }> | undefined;
      const entry = projects?.[absProject] ?? projects?.[projectDir];
      if (entry?.mcpServers && asMcpServers({ mcpServers: entry.mcpServers })) {
        sources.push('~/.claude.json#projects');
      }
    } catch {
      /* ignore */
    }
  }
  if (tryLoadMcpFile(join(home, '.claude', 'settings.json'))) {
    sources.push('~/.claude/settings.json');
  }
  if (tryLoadMcpFile(join(projectDir, '.claude', 'config', 'mcp-active.json'))) {
    sources.push('.claude/config/mcp-active.json');
  }
  if (tryLoadMcpFile(join(projectDir, '.claude', 'settings.json'))) {
    sources.push('.claude/settings.json');
  }
  if (tryLoadMcpFile(join(projectDir, '.mcp.json'))) sources.push('.mcp.json');
  return sources;
}

/** Normalize one Claude MCP entry to Kimi / Cursor-friendly shape. */
export function toKimiServerEntry(cfg: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};

  if (typeof cfg.command === 'string') {
    out.command = cfg.command;
    if (Array.isArray(cfg.args)) out.args = cfg.args;
    if (cfg.env && typeof cfg.env === 'object') out.env = cfg.env;
    if (typeof cfg.cwd === 'string') out.cwd = cfg.cwd;
    return out;
  }

  if (typeof cfg.url === 'string') {
    out.url = cfg.url;
    if (cfg.headers && typeof cfg.headers === 'object') out.headers = cfg.headers;
    if (cfg.type === 'sse' || cfg.transport === 'sse') out.transport = 'sse';
    return out;
  }

  return { ...cfg };
}

export function toKimiMcpJson(servers: ClaudeMcpServers): string {
  const mcpServers: Record<string, Record<string, unknown>> = {};
  for (const [name, cfg] of Object.entries(servers)) {
    mcpServers[name] = toKimiServerEntry(cfg);
  }
  return JSON.stringify({ mcpServers }, null, 2) + '\n';
}

export function toCursorMcpJson(servers: ClaudeMcpServers): string {
  const mcpServers: Record<string, Record<string, unknown>> = {};
  for (const [name, cfg] of Object.entries(servers)) {
    mcpServers[name] = { ...cfg };
  }
  return JSON.stringify({ mcpServers }, null, 2) + '\n';
}

function tomlString(s: string): string {
  return JSON.stringify(s);
}

function tomlArray(arr: unknown[]): string {
  return `[${arr.map((x) => (typeof x === 'string' ? tomlString(x) : JSON.stringify(x))).join(', ')}]`;
}

function tomlInlineTable(obj: Record<string, unknown>): string {
  const parts: string[] = [];
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === 'string') parts.push(`${k} = ${tomlString(v)}`);
    else parts.push(`${k} = ${JSON.stringify(v)}`);
  }
  return `{ ${parts.join(', ')} }`;
}

function sanitizeTomlKey(name: string): string {
  if (/^[A-Za-z0-9_-]+$/.test(name)) return name;
  return tomlString(name);
}

/** Build Grok project MCP TOML fragment (marked for idempotent replace). */
export function toGrokMcpTomlFragment(servers: ClaudeMcpServers): string {
  const lines: string[] = [
    '# SVS:MCP:START — generated by start-vibing-stacks; migrate --apply refreshes this block',
  ];

  for (const [name, cfg] of Object.entries(servers)) {
    const key = sanitizeTomlKey(name);
    lines.push('');
    lines.push(`[mcp_servers.${key}]`);

    const kimi = toKimiServerEntry(cfg);
    if (typeof kimi.command === 'string') {
      lines.push(`command = ${tomlString(kimi.command)}`);
      if (Array.isArray(kimi.args)) lines.push(`args = ${tomlArray(kimi.args)}`);
      if (kimi.env && typeof kimi.env === 'object') {
        lines.push(`env = ${tomlInlineTable(kimi.env as Record<string, unknown>)}`);
      }
    } else if (typeof kimi.url === 'string') {
      lines.push(`url = ${tomlString(kimi.url)}`);
      if (kimi.headers && typeof kimi.headers === 'object') {
        lines.push(`headers = ${tomlInlineTable(kimi.headers as Record<string, unknown>)}`);
      }
    }
  }

  lines.push('');
  lines.push('# SVS:MCP:END');
  lines.push('');
  return lines.join('\n');
}

const MCP_BLOCK_RE = /# SVS:MCP:START[\s\S]*?# SVS:MCP:END\n?/;

export function mergeGrokConfigToml(existing: string | null, fragment: string): string {
  const header =
    '# Grok Build project config — MCP block managed by start-vibing-stacks\n';
  if (!existing || !existing.trim()) {
    return header + '\n' + fragment;
  }
  if (MCP_BLOCK_RE.test(existing)) {
    return existing.replace(MCP_BLOCK_RE, fragment.trimEnd() + '\n');
  }
  return existing.replace(/\s*$/, '\n\n') + fragment;
}

const GROK_RULES_BODY = `---
svs-version: ${GROK_RULES_VERSION}
---

# start-vibing-stacks policy (Grok)

Project rules for this repo are in root \`AGENTS.md\` (shared with Kimi) and \`CLAUDE.md\` (Claude Code).

- Follow **Hard limits** in \`AGENTS.md\` (charity/person impersonation, phishing, unauthorized scan).
- Prefer user-owned identity/assets for donation/cause rebuilds; placeholder + continue if founder face matches Org X.
- After package upgrades: \`npx start-vibing-stacks migrate --apply\`.

MCP: \`migrate --apply\` merges \`~/.claude.json\` + project \`.claude/\` into \`.grok/config.toml\` (SVS:MCP).
Also \`.kimi-code/mcp.json\`, \`.cursor/mcp.json\`. See memory \`multi-target-mcp-discovery\`.
`;

export interface ExportMcpOptions {
  /** Which side-cars to write (default: all) */
  targets?: Array<'kimi' | 'grok' | 'cursor'>;
  force?: boolean;
}

/**
 * Write Kimi / Grok / Cursor MCP artefacts from merged Claude MCP sources.
 */
export function exportMcpToTargets(
  projectDir: string,
  opts: ExportMcpOptions = {}
): McpExportResult {
  const servers = loadProjectMcpServers(projectDir);
  const sources = listMcpSourceLabels(projectDir);
  if (!servers || Object.keys(servers).length === 0) {
    return {
      kimiWritten: false,
      grokWritten: false,
      cursorWritten: false,
      grokRulesWritten: false,
      serverCount: 0,
      sources: [],
      skippedReason:
        'No MCP servers in ~/.claude.json, ~/.claude/settings.json, or project .claude/',
    };
  }

  const want = new Set(opts.targets ?? ['kimi', 'grok', 'cursor']);
  const result: McpExportResult = {
    kimiWritten: false,
    grokWritten: false,
    cursorWritten: false,
    grokRulesWritten: false,
    serverCount: Object.keys(servers).length,
    sources,
  };

  if (want.has('kimi')) {
    const dest = join(projectDir, '.kimi-code', 'mcp.json');
    mkdirSync(dirname(dest), { recursive: true });
    writeFileSync(dest, toKimiMcpJson(servers));
    result.kimiWritten = true;
  }

  if (want.has('cursor')) {
    const dest = join(projectDir, '.cursor', 'mcp.json');
    mkdirSync(dirname(dest), { recursive: true });
    writeFileSync(dest, toCursorMcpJson(servers));
    result.cursorWritten = true;
  }

  if (want.has('grok')) {
    const grokDir = join(projectDir, '.grok');
    mkdirSync(grokDir, { recursive: true });
    const configPath = join(grokDir, 'config.toml');
    const existing = existsSync(configPath) ? readFileSync(configPath, 'utf8') : null;
    const fragment = toGrokMcpTomlFragment(servers);
    writeFileSync(configPath, mergeGrokConfigToml(existing, fragment));
    result.grokWritten = true;

    const rulesDir = join(grokDir, 'rules');
    mkdirSync(rulesDir, { recursive: true });
    const rulesPath = join(rulesDir, '00-svs-policy.md');
    if (!existsSync(rulesPath) || opts.force) {
      writeFileSync(rulesPath, GROK_RULES_BODY);
      result.grokRulesWritten = true;
    }
  }

  return result;
}
