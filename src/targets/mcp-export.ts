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
export const MCP_EXPORT_VERSION = '1.4.0';
export const GROK_RULES_VERSION = '1.2.0';

export type ClaudeMcpServers = Record<string, Record<string, unknown>>;

export interface McpExportResult {
  kimiWritten: boolean;
  grokWritten: boolean;
  cursorWritten: boolean;
  grokRulesWritten: boolean;
  serverCount: number;
  /** Server ids dropped by stack / Claude.ai-connector filters */
  dropped?: string[];
  sources?: string[];
  skippedReason?: string;
}

/** Stacks that may keep Vercel / Next.js DevTools MCP in multi-target side-cars. */
const VERCEL_MCP_STACKS = new Set(['nodejs']);

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

/** HTTP MCP hosts that often block Grok startup on OAuth prompts. */
export function isOauthLikelyUrl(url: string): boolean {
  return /githubcopilot\.com|api\.github\.com\/mcp|sentry\.dev\/mcp|linear\.app\/.*mcp|mcp\.vercel\.com|oauth/i.test(
    url
  );
}

/**
 * Claude.ai hosted connectors (Gmail / Calendar / Drive / …).
 * They only work inside Claude; exporting them hangs Kimi/Grok/Cursor on auth.
 */
export function isClaudeAiConnector(name: string, cfg: Record<string, unknown>): boolean {
  const n = name.trim();
  if (/^claude\.ai\b/i.test(n)) return true;
  if (/\b(gmail|google\s*calendar|google\s*drive)\b/i.test(n)) return true;
  if (cfg.type === 'claudeai' || cfg.connector === 'claude.ai') return true;
  const url = typeof cfg.url === 'string' ? cfg.url : '';
  if (/claude\.ai/i.test(url)) return true;
  return false;
}

/** Vercel HTTP MCP or Next.js DevTools (registry id / npx package). */
export function isVercelStackMcp(name: string, cfg: Record<string, unknown>): boolean {
  const n = name.toLowerCase();
  if (n === 'vercel' || n === 'nextjs-devtools' || n.includes('vercel')) return true;
  const url = typeof cfg.url === 'string' ? cfg.url : '';
  if (/mcp\.vercel\.com/i.test(url)) return true;
  const args = cfg.args;
  if (Array.isArray(args) && args.some((a) => String(a).includes('next-devtools-mcp'))) {
    return true;
  }
  return false;
}

function readProjectStack(projectDir: string): string | null {
  const path = join(projectDir, '.claude', 'config', 'active-project.json');
  if (!existsSync(path)) return null;
  try {
    const j = JSON.parse(readFileSync(path, 'utf8')) as { stack?: unknown };
    return typeof j.stack === 'string' && j.stack.trim() ? j.stack.trim() : null;
  } catch {
    return null;
  }
}

/**
 * Drop Claude.ai connectors always; drop Vercel/Next DevTools unless stack is nodejs.
 */
export function filterServersForExport(
  servers: ClaudeMcpServers,
  stackId: string | null | undefined
): { servers: ClaudeMcpServers; dropped: string[] } {
  const allowVercel = stackId != null && VERCEL_MCP_STACKS.has(stackId);
  const out: ClaudeMcpServers = {};
  const dropped: string[] = [];

  for (const [name, cfg] of Object.entries(servers)) {
    if (isClaudeAiConnector(name, cfg)) {
      dropped.push(name);
      continue;
    }
    if (isVercelStackMcp(name, cfg) && !allowVercel) {
      dropped.push(name);
      continue;
    }
    out[name] = cfg;
  }

  return { servers: out, dropped };
}

function usesNpx(command: string, args: unknown): boolean {
  if (command === 'npx' || command.endsWith('/npx')) return true;
  if (Array.isArray(args) && args.some((a) => a === 'npx' || String(a).includes('npx'))) return true;
  return false;
}

function envString(env: Record<string, unknown> | undefined, key: string): string {
  if (!env || !(key in env)) return '';
  const v = env[key];
  return typeof v === 'string' ? v.trim() : v == null ? '' : String(v).trim();
}

/**
 * MySQL MCP with empty MYSQL_* is flaky (connects then health unavailable) and
 * slows /mcps. Start disabled until real env is filled.
 */
export function isMysqlMissingEnv(name: string, cfg: Record<string, unknown>): boolean {
  const n = name.toLowerCase();
  const args = Array.isArray(cfg.args) ? cfg.args.map(String).join(' ') : '';
  const isMysql =
    n === 'mysql' ||
    n.includes('mysql') ||
    /mcp-server-mysql|@benborla29\/mcp-server-mysql/i.test(args);
  if (!isMysql) return false;
  const env =
    cfg.env && typeof cfg.env === 'object' && !Array.isArray(cfg.env)
      ? (cfg.env as Record<string, unknown>)
      : undefined;
  const host = envString(env, 'MYSQL_HOST');
  const user = envString(env, 'MYSQL_USER');
  const db = envString(env, 'MYSQL_DATABASE');
  return !host || !user || !db;
}

/**
 * Build Grok project MCP TOML fragment.
 * Project `.grok/config.toml` may only contribute mcp_servers / plugins / permission —
 * do not put [skills] or [compat.*] here (those belong in ~/.grok/config.toml).
 */
export function toGrokMcpTomlFragment(servers: ClaudeMcpServers): string {
  const lines: string[] = [
    '# SVS:MCP:START — generated by start-vibing-stacks; migrate --apply refreshes this block',
    `# svs-version: ${MCP_EXPORT_VERSION}`,
    '# OAuth HTTP MCPs (github/sentry/…) + mysql without MYSQL_* start disabled.',
    '# npx servers get startup_timeout_sec=60 to avoid cold-start hangs.',
  ];

  for (const [name, cfg] of Object.entries(servers)) {
    const key = sanitizeTomlKey(name);
    lines.push('');
    lines.push(`[mcp_servers.${key}]`);

    const kimi = toKimiServerEntry(cfg);
    if (typeof kimi.command === 'string') {
      lines.push(`command = ${tomlString(kimi.command)}`);
      if (Array.isArray(kimi.args)) lines.push(`args = ${tomlArray(kimi.args)}`);
      if (kimi.env && typeof kimi.env === 'object' && Object.keys(kimi.env as object).length > 0) {
        lines.push(`env = ${tomlInlineTable(kimi.env as Record<string, unknown>)}`);
      }
      const timeout = usesNpx(kimi.command, kimi.args) ? 60 : 30;
      lines.push(`startup_timeout_sec = ${timeout}`);
      if (isMysqlMissingEnv(name, kimi as Record<string, unknown>)) {
        lines.push('enabled = false');
        lines.push('# disabled: fill MYSQL_HOST/USER/DATABASE then set enabled = true');
      } else {
        lines.push('enabled = true');
      }
    } else if (typeof kimi.url === 'string') {
      lines.push(`url = ${tomlString(kimi.url)}`);
      if (kimi.headers && typeof kimi.headers === 'object') {
        lines.push(`headers = ${tomlInlineTable(kimi.headers as Record<string, unknown>)}`);
      }
      // OAuth MCP often hangs the TUI on session start before the UI appears.
      if (isOauthLikelyUrl(kimi.url)) {
        lines.push('enabled = false');
        lines.push('# disabled: complete OAuth in /mcps then set enabled = true');
      } else {
        lines.push('enabled = true');
        lines.push('startup_timeout_sec = 30');
      }
    }
  }

  lines.push('');
  lines.push('# SVS:MCP:END');
  lines.push('');
  return lines.join('\n');
}

const MCP_BLOCK_RE = /# SVS:MCP:START[\s\S]*?# SVS:MCP:END\n?/;
const SKILLS_BLOCK_RE = /# SVS:SKILLS:START[\s\S]*?# SVS:SKILLS:END\n?/;
const COMPAT_BLOCK_RE = /# SVS:COMPAT:START[\s\S]*?# SVS:COMPAT:END\n?/;

/**
 * Rewrite project `.grok/config.toml` as MCP-only (strip SVS skills/compat pollution).
 * Grok ignores [skills]/[compat] in project files and they confuse diagnosis.
 */
export function writeGrokProjectMcpConfig(projectDir: string, servers: ClaudeMcpServers): void {
  const grokDir = join(projectDir, '.grok');
  mkdirSync(grokDir, { recursive: true });
  const configPath = join(grokDir, 'config.toml');
  const fragment = toGrokMcpTomlFragment(servers);
  const body = [
    '# Grok Build project config — MCP ONLY (managed by start-vibing-stacks)',
    '# Project scope may contribute: [mcp_servers], [plugins], [permission].',
    '# Skills: auto from .grok/skills/ + .claude/skills/ (do not put [skills] here).',
    '# Hooks: .grok/hooks/*.json (requires folder trust). Compat: ~/.grok/config.toml only.',
    '',
    fragment.trimEnd(),
    '',
  ].join('\n');
  writeFileSync(configPath, body);
}

/** @deprecated use writeGrokProjectMcpConfig — kept for tests */
export function mergeGrokConfigToml(existing: string | null, fragment: string): string {
  let base = existing || '';
  base = base.replace(SKILLS_BLOCK_RE, '').replace(COMPAT_BLOCK_RE, '');
  if (MCP_BLOCK_RE.test(base)) {
    return base.replace(MCP_BLOCK_RE, fragment.trimEnd() + '\n');
  }
  return (
    '# Grok Build project config — MCP ONLY (managed by start-vibing-stacks)\n\n' +
    fragment
  );
}

const GROK_RULES_BODY = `---
svs-version: ${GROK_RULES_VERSION}
---

# start-vibing-stacks policy (Grok)

Project rules: root \`AGENTS.md\` + \`CLAUDE.md\`. Hard limits in AGENTS.md policy pack.

- After upgrades: \`npx start-vibing-stacks migrate --apply\`
- MCP: \`.grok/config.toml\` (project). OAuth (github/sentry/vercel) start **disabled** — open \`/mcps\`, auth, enable.
- Vercel / Next DevTools MCP: **nodejs only** (stripped on php/python). Claude.ai Gmail/Calendar/Drive connectors never exported.
- Skills: \`.grok/skills/\` + \`.claude/skills/\` (auto). Hooks: \`.grok/hooks/\` (folder must be trusted).
- If Grok hangs on start: \`grok mcp doctor\` — disable OAuth/plugin MCPs (vercel); avoid [skills]/[compat] in project config.toml.
`;

export interface ExportMcpOptions {
  /** Which side-cars to write (default: all) */
  targets?: Array<'kimi' | 'grok' | 'cursor'>;
  force?: boolean;
  /** Override stack from `.claude/config/active-project.json` (php | nodejs | python | …) */
  stack?: string | null;
}

/**
 * Write Kimi / Grok / Cursor MCP artefacts from merged Claude MCP sources.
 * Filters Claude.ai connectors always; Vercel/Next DevTools only for nodejs.
 */
export function exportMcpToTargets(
  projectDir: string,
  opts: ExportMcpOptions = {}
): McpExportResult {
  const loaded = loadProjectMcpServers(projectDir);
  const sources = listMcpSourceLabels(projectDir);
  if (!loaded || Object.keys(loaded).length === 0) {
    return {
      kimiWritten: false,
      grokWritten: false,
      cursorWritten: false,
      grokRulesWritten: false,
      serverCount: 0,
      dropped: [],
      sources: [],
      skippedReason:
        'No MCP servers in ~/.claude.json, ~/.claude/settings.json, or project .claude/',
    };
  }

  const stackId = opts.stack !== undefined ? opts.stack : readProjectStack(projectDir);
  const { servers, dropped } = filterServersForExport(loaded, stackId);

  if (Object.keys(servers).length === 0) {
    return {
      kimiWritten: false,
      grokWritten: false,
      cursorWritten: false,
      grokRulesWritten: false,
      serverCount: 0,
      dropped,
      sources,
      skippedReason:
        dropped.length > 0
          ? `All MCP servers filtered (dropped: ${dropped.join(', ')})`
          : 'No MCP servers left after filter',
    };
  }

  const want = new Set(opts.targets ?? ['kimi', 'grok', 'cursor']);
  const result: McpExportResult = {
    kimiWritten: false,
    grokWritten: false,
    cursorWritten: false,
    grokRulesWritten: false,
    serverCount: Object.keys(servers).length,
    dropped,
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
    writeGrokProjectMcpConfig(projectDir, servers);
    result.grokWritten = true;

    const rulesDir = join(projectDir, '.grok', 'rules');
    mkdirSync(rulesDir, { recursive: true });
    const rulesPath = join(rulesDir, '00-svs-policy.md');
    if (!existsSync(rulesPath) || opts.force) {
      writeFileSync(rulesPath, GROK_RULES_BODY);
      result.grokRulesWritten = true;
    }
  }

  return result;
}
