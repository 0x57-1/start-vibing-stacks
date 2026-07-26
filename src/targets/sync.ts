/**
 * Sync multi-target artefacts: AGENTS.md + MCP side-cars + Cursor rules + manifest
 */

import { createHash } from 'crypto';
import { existsSync, readFileSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { generateAgentsMd, bundledAgentsMdVersion } from './agents-md.js';
import {
  agentsMdNeedsUpdate,
  defaultManifest,
  mcpExportNeedsUpdate,
  readManifest,
  writeManifest,
} from './manifest.js';
import {
  exportMcpToTargets,
  GROK_RULES_VERSION,
  MCP_EXPORT_VERSION,
} from './mcp-export.js';
import {
  CURSOR_RULES_VERSION,
  cursorRulesNeedsUpdate,
  exportCursorRules,
} from './cursor-rules.js';
import type { MigrateTarget } from './types.js';
import { AGENTS_MD_GENERATOR_VERSION } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PACKAGE_ROOT = resolve(__dirname, '../..');

export function packageVersion(): string {
  try {
    const pkg = JSON.parse(readFileSync(join(PACKAGE_ROOT, 'package.json'), 'utf8'));
    return typeof pkg.version === 'string' ? pkg.version : '0.0.0';
  } catch {
    return '0.0.0';
  }
}

export interface SyncTargetsOptions {
  /** Force regenerate AGENTS.md */
  forceAgentsMd?: boolean;
  /** Force rewrite MCP side-cars + Grok rules */
  forceMcp?: boolean;
  /** Force rewrite .cursor/rules/svs-policy.mdc */
  forceCursorRules?: boolean;
  /** When true (default), regenerate only if missing or outdated */
  updateIfNeeded?: boolean;
  /** Limit which targets get artefacts (default all non-claude) */
  migrateTarget?: MigrateTarget;
}

export interface SyncTargetsResult {
  agentsMdWritten: boolean;
  agentsMdVersion: string;
  agentsMdHash: string;
  manifestWritten: boolean;
  mcp: {
    kimiWritten: boolean;
    grokWritten: boolean;
    cursorWritten: boolean;
    grokRulesWritten: boolean;
    serverCount: number;
    skippedReason?: string;
  };
  cursorRules: {
    written: boolean;
    version: string;
    skippedReason?: string;
  };
  skippedReason?: string;
}

/**
 * Ensure AGENTS.md + MCP side-cars + Cursor rules + manifest exist / are refreshed.
 */
export function syncTargets(projectDir: string, opts: SyncTargetsOptions = {}): SyncTargetsResult {
  const target = opts.migrateTarget ?? 'all';
  const syncAgents =
    target === 'all' || target === 'kimi' || target === 'grok' || target === 'cursor';
  const syncMcp =
    target === 'all' || target === 'kimi' || target === 'grok' || target === 'cursor';
  const syncCursorRules = target === 'all' || target === 'cursor';

  const bundled = bundledAgentsMdVersion();
  const need = agentsMdNeedsUpdate(projectDir, bundled);
  const updateIfNeeded = opts.updateIfNeeded !== false;
  const shouldWriteAgents =
    syncAgents &&
    (opts.forceAgentsMd === true || (updateIfNeeded && (need.missing || need.outdated)));

  let agentsMdWritten = false;
  let hash = '';
  let skippedReason: string | undefined;

  if (shouldWriteAgents) {
    const r = generateAgentsMd(projectDir, { force: true });
    agentsMdWritten = r.written;
    hash = r.hash;
  } else if (syncAgents) {
    skippedReason = `AGENTS.md current (svs-version ${need.installedVersion ?? '?'} >= ${bundled})`;
    const p = join(projectDir, 'AGENTS.md');
    if (existsSync(p)) {
      hash = createHash('sha256').update(readFileSync(p, 'utf8')).digest('hex').slice(0, 16);
    }
  }

  const mcpNeed = mcpExportNeedsUpdate(projectDir);
  const shouldWriteMcp =
    syncMcp &&
    (opts.forceMcp === true || (updateIfNeeded && (mcpNeed.missing || mcpNeed.outdated)));

  const mcpTargets: Array<'kimi' | 'grok' | 'cursor'> =
    target === 'kimi'
      ? ['kimi']
      : target === 'grok'
        ? ['grok', 'cursor']
        : target === 'cursor'
          ? ['cursor']
          : ['kimi', 'grok', 'cursor'];

  const mcp = shouldWriteMcp
    ? exportMcpToTargets(projectDir, { targets: mcpTargets, force: opts.forceMcp === true })
    : {
        kimiWritten: false,
        grokWritten: false,
        cursorWritten: false,
        grokRulesWritten: false,
        serverCount: 0,
        skippedReason: syncMcp
          ? mcpNeed.missing || mcpNeed.outdated
            ? undefined
            : `MCP side-cars current (mcpExport ${mcpNeed.installedVersion ?? '?'} >= ${MCP_EXPORT_VERSION})`
          : 'skipped (target=claude)',
      };

  const cursorNeed = cursorRulesNeedsUpdate(projectDir);
  const shouldWriteCursorRules =
    syncCursorRules &&
    (opts.forceCursorRules === true ||
      (updateIfNeeded && (cursorNeed.missing || cursorNeed.outdated)));

  const cursorRules = shouldWriteCursorRules
    ? exportCursorRules(projectDir, { force: true })
    : {
        written: false,
        version: CURSOR_RULES_VERSION,
        skippedReason: syncCursorRules
          ? cursorNeed.missing || cursorNeed.outdated
            ? undefined
            : `Cursor rules current (svs-version ${cursorNeed.installedVersion})`
          : 'skipped (target≠cursor/all)',
      };

  const prev = readManifest(projectDir);
  const manifest = defaultManifest(packageVersion(), {
    version: AGENTS_MD_GENERATOR_VERSION,
    hash: hash || prev?.agentsMd?.hash,
  });
  if (prev?.targets) {
    manifest.targets = {
      claude: { ...manifest.targets.claude, ...prev.targets.claude },
      kimi: { ...manifest.targets.kimi, ...prev.targets.kimi },
      grok: { ...manifest.targets.grok, ...prev.targets.grok },
      cursor: { ...manifest.targets.cursor, ...prev.targets.cursor },
    };
  }
  if (mcp.kimiWritten) {
    manifest.targets.kimi = {
      ...manifest.targets.kimi,
      enabled: true,
      mcpVersion: MCP_EXPORT_VERSION,
    };
  }
  if (mcp.grokWritten) {
    manifest.targets.grok = {
      ...manifest.targets.grok,
      enabled: true,
      mcpVersion: MCP_EXPORT_VERSION,
      rulesVersion: mcp.grokRulesWritten
        ? GROK_RULES_VERSION
        : prev?.targets?.grok?.rulesVersion ?? GROK_RULES_VERSION,
    };
  }
  if (cursorRules.written || existsSync(join(projectDir, '.cursor', 'rules', 'svs-policy.mdc'))) {
    manifest.targets.cursor = {
      ...manifest.targets.cursor,
      enabled: true,
      rulesVersion: CURSOR_RULES_VERSION,
      mcpVersion: mcp.cursorWritten
        ? MCP_EXPORT_VERSION
        : prev?.targets?.cursor?.mcpVersion,
    };
    manifest.cursorRules = { version: CURSOR_RULES_VERSION };
  } else if (prev?.cursorRules) {
    manifest.cursorRules = prev.cursorRules;
  }

  const hasMcpSidecars =
    mcp.kimiWritten ||
    mcp.grokWritten ||
    mcp.cursorWritten ||
    existsSync(join(projectDir, '.kimi-code', 'mcp.json')) ||
    existsSync(join(projectDir, '.grok', 'config.toml')) ||
    existsSync(join(projectDir, '.cursor', 'mcp.json'));
  if (hasMcpSidecars) {
    manifest.mcpExport = { version: MCP_EXPORT_VERSION };
  } else if (prev?.mcpExport) {
    manifest.mcpExport = prev.mcpExport;
  }
  writeManifest(projectDir, manifest);

  return {
    agentsMdWritten,
    agentsMdVersion: AGENTS_MD_GENERATOR_VERSION,
    agentsMdHash: hash,
    manifestWritten: true,
    mcp,
    cursorRules: {
      written: cursorRules.written,
      version: cursorRules.version,
      skippedReason: cursorRules.skippedReason,
    },
    skippedReason,
  };
}
