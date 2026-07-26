/**
 * Human-readable multi-target artefact status for migrate / resume.
 */

import { existsSync } from 'fs';
import { join } from 'path';
import {
  agentsMdNeedsUpdate,
  mcpExportNeedsUpdate,
  readManifest,
} from './manifest.js';
import { bundledAgentsMdVersion, readClaudeRecentChangesHash } from './agents-md.js';
import { cursorRulesNeedsUpdate, CURSOR_RULES_REL } from './cursor-rules.js';
import { kimiLocalNeedsUpdate, KIMI_LOCAL_REL } from './kimi-local.js';
import { isBinaryOnPath } from './launch.js';
import { LAUNCH_SPECS } from './types.js';

export interface TargetStatusLine {
  id: string;
  ok: boolean;
  detail: string;
}

export function collectTargetsStatus(projectDir: string): TargetStatusLine[] {
  const lines: TargetStatusLine[] = [];
  const manifest = readManifest(projectDir);
  const bundled = bundledAgentsMdVersion();

  const agents = agentsMdNeedsUpdate(projectDir, bundled);
  lines.push({
    id: 'AGENTS.md',
    ok: !agents.missing && !agents.outdated,
    detail: agents.missing
      ? 'missing'
      : agents.outdated
        ? `outdated (${agents.installedVersion} → ${bundled})`
        : `ok (svs-version ${agents.installedVersion})`,
  });

  const mcp = mcpExportNeedsUpdate(projectDir);
  const mcpBits = [
    existsSync(join(projectDir, '.kimi-code', 'mcp.json')) && 'kimi',
    existsSync(join(projectDir, '.grok', 'config.toml')) && 'grok',
    existsSync(join(projectDir, '.cursor', 'mcp.json')) && 'cursor',
  ].filter(Boolean);
  lines.push({
    id: 'MCP side-cars',
    ok: !mcp.missing && !mcp.outdated,
    detail: mcp.missing
      ? mcpBits.length
        ? `partial (${mcpBits.join(',')})`
        : 'missing (need mcp-active.json first)'
      : mcp.outdated
        ? `outdated (${mcp.installedVersion})`
        : `ok (${mcpBits.join(',') || 'none'}; export ${manifest?.mcpExport?.version ?? '–'})`,
  });

  const cursor = cursorRulesNeedsUpdate(projectDir);
  lines.push({
    id: CURSOR_RULES_REL,
    ok: !cursor.missing && !cursor.outdated,
    detail: cursor.missing
      ? 'missing'
      : cursor.outdated
        ? `outdated (${cursor.installedVersion})`
        : `ok (svs-version ${cursor.installedVersion})`,
  });

  const kimi = kimiLocalNeedsUpdate(projectDir);
  lines.push({
    id: KIMI_LOCAL_REL,
    ok: !kimi.localMissing && !kimi.blockMissing,
    detail: kimi.localMissing
      ? 'missing (will seed on migrate)'
      : kimi.blockMissing
        ? 'SVS block missing/outdated'
        : 'ok (SVS block present)',
  });

  lines.push({
    id: 'svs-manifest',
    ok: !!manifest,
    detail: manifest ? `ok (pkg ${manifest.packageVersion})` : 'missing',
  });

  for (const spec of LAUNCH_SPECS) {
    const on = isBinaryOnPath(spec.bin);
    lines.push({
      id: `CLI ${spec.label}`,
      ok: on,
      detail: on ? `on PATH (${spec.bin})` : `not on PATH (${spec.bin})`,
    });
  }

  const rcNow = readClaudeRecentChangesHash(projectDir);
  const rcStored = manifest?.agentsMd?.claudeRcHash;
  if (rcNow && rcStored) {
    lines.push({
      id: 'Recent Changes sync',
      ok: rcNow === rcStored,
      detail: rcNow === rcStored ? 'ok (hash match)' : 'CLAUDE.md RC changed — regenerate AGENTS.md',
    });
  } else if (rcNow && existsSync(join(projectDir, 'AGENTS.md'))) {
    lines.push({
      id: 'Recent Changes sync',
      ok: false,
      detail: 'no claudeRcHash in manifest yet — regenerate AGENTS.md',
    });
  }

  return lines;
}

export function formatTargetsStatus(projectDir: string): string {
  const lines = collectTargetsStatus(projectDir);
  const out = ['  TARGET STATUS:'];
  for (const l of lines) {
    out.push(`    ${l.ok ? '✓' : '·'} ${l.id.padEnd(28)} ${l.detail}`);
  }
  return out.join('\n');
}

/** True when CLAUDE.md Recent Changes drifted from last AGENTS.md sync. */
export function recentChangesDrifted(projectDir: string): boolean {
  const manifest = readManifest(projectDir);
  const stored = manifest?.agentsMd?.claudeRcHash;
  if (!stored) return false;
  const now = readClaudeRecentChangesHash(projectDir);
  return !!now && now !== stored;
}
