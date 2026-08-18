/**
 * Sync multi-target artefacts: AGENTS.md + MCP + Cursor rules + Kimi local +
 * Grok skills + Kimi/Grok hooks + manifest
 */

import { createHash } from 'crypto';
import { existsSync, readFileSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import {
  generateAgentsMd,
  bundledAgentsMdVersion,
  readClaudeRecentChangesHash,
} from './agents-md.js';
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
import {
  exportKimiLocal,
  ensureKimiLocalGitignore,
  kimiLocalNeedsUpdate,
  KIMI_LOCAL_VERSION,
} from './kimi-local.js';
import {
  exportGrokSkills,
  grokSkillsNeedsUpdate,
  GROK_SKILLS_VERSION,
  GROK_NATIVE_SKILL_REL,
} from './grok-skills.js';
import {
  exportHooksToTargets,
  hooksExportNeedsUpdate,
  HOOKS_EXPORT_VERSION,
  GROK_HOOKS_REL,
} from './hooks-export.js';
import {
  exportGrokUserConfig,
  grokUserConfigNeedsUpdate,
  GROK_USER_CONFIG_VERSION,
} from './grok-user-config.js';
import {
  exportGrokAgents,
  grokAgentsNeedsUpdate,
  GROK_AGENTS_VERSION,
  GROK_AGENTS_REL,
} from './grok-agents.js';
import { recentChangesDrifted } from './status.js';
import type { MigrateTarget } from './types.js';

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
  forceAgentsMd?: boolean;
  forceMcp?: boolean;
  forceCursorRules?: boolean;
  forceKimiLocal?: boolean;
  forceGrokSkills?: boolean;
  forceHooksExport?: boolean;
  forceGrokUserConfig?: boolean;
  forceGrokAgents?: boolean;
  updateIfNeeded?: boolean;
  migrateTarget?: MigrateTarget;
}

export interface SyncTargetsResult {
  agentsMdWritten: boolean;
  agentsMdVersion: string;
  agentsMdHash: string;
  claudeRcHash?: string;
  manifestWritten: boolean;
  mcp: {
    kimiWritten: boolean;
    grokWritten: boolean;
    cursorWritten: boolean;
    grokRulesWritten: boolean;
    serverCount: number;
    dropped?: string[];
    sources?: string[];
    skippedReason?: string;
  };
  cursorRules: {
    written: boolean;
    version: string;
    skippedReason?: string;
  };
  kimiLocal: {
    exampleWritten: boolean;
    localWritten: boolean;
    localUpdated: boolean;
    gitignoreUpdated: boolean;
    version: string;
    skippedReason?: string;
  };
  grokSkills: {
    configUpdated: boolean;
    nativeSkillWritten: boolean;
    curatedCopied: number;
    generatedWritten: number;
    version: string;
    skippedReason?: string;
  };
  hooksExport: {
    kimiLocalUpdated: boolean;
    kimiUserUpdated: boolean;
    grokHooksWritten: boolean;
    grokCompatUpdated: boolean;
    version: string;
    skippedReason?: string;
  };
  grokUserConfig: {
    written: boolean;
    version: string;
    skippedReason?: string;
  };
  grokAgents: {
    written: number;
    version: string;
    skippedReason?: string;
  };
  skippedReason?: string;
}

export function syncTargets(projectDir: string, opts: SyncTargetsOptions = {}): SyncTargetsResult {
  const target = opts.migrateTarget ?? 'all';
  const syncAgents =
    target === 'all' || target === 'kimi' || target === 'grok' || target === 'cursor';
  const syncMcp =
    target === 'all' || target === 'kimi' || target === 'grok' || target === 'cursor';
  const syncCursorRules = target === 'all' || target === 'cursor';
  const syncKimi = target === 'all' || target === 'kimi';
  const syncGrokSkills = target === 'all' || target === 'grok';
  const syncHooks = target === 'all' || target === 'kimi' || target === 'grok';

  const bundled = bundledAgentsMdVersion();
  const need = agentsMdNeedsUpdate(projectDir, bundled);
  const rcDrift = recentChangesDrifted(projectDir);
  const updateIfNeeded = opts.updateIfNeeded !== false;
  const shouldWriteAgents =
    syncAgents &&
    (opts.forceAgentsMd === true ||
      (updateIfNeeded && (need.missing || need.outdated || rcDrift)));

  let agentsMdWritten = false;
  let hash = '';
  let claudeRcHash: string | undefined;
  let skippedReason: string | undefined;

  if (shouldWriteAgents) {
    const r = generateAgentsMd(projectDir, { force: true });
    agentsMdWritten = r.written;
    hash = r.hash;
    claudeRcHash = r.claudeRcHash;
  } else if (syncAgents) {
    skippedReason = rcDrift
      ? 'AGENTS.md RC drift detected but force not set'
      : `AGENTS.md current (svs-version ${need.installedVersion ?? '?'} >= ${bundled})`;
    const p = join(projectDir, 'AGENTS.md');
    if (existsSync(p)) {
      hash = createHash('sha256').update(readFileSync(p, 'utf8')).digest('hex').slice(0, 16);
    }
    claudeRcHash = readClaudeRecentChangesHash(projectDir) ?? undefined;
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

  const activeStack = (() => {
    try {
      const p = join(projectDir, '.claude', 'config', 'active-project.json');
      if (!existsSync(p)) return null;
      const j = JSON.parse(readFileSync(p, 'utf8')) as { stack?: unknown };
      return typeof j.stack === 'string' ? j.stack : null;
    } catch {
      return null;
    }
  })();

  const mcp = shouldWriteMcp
    ? exportMcpToTargets(projectDir, {
        targets: mcpTargets,
        force: opts.forceMcp === true,
        stack: activeStack,
      })
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

  const kimiNeed = kimiLocalNeedsUpdate(projectDir);
  const shouldWriteKimi =
    syncKimi &&
    (opts.forceKimiLocal === true ||
      (updateIfNeeded &&
        (kimiNeed.exampleMissing || kimiNeed.localMissing || kimiNeed.blockMissing)));

  let kimiLocalResult: {
    exampleWritten: boolean;
    localWritten: boolean;
    localUpdated: boolean;
    version: string;
    skippedReason?: string;
  } = {
    exampleWritten: false,
    localWritten: false,
    localUpdated: false,
    version: KIMI_LOCAL_VERSION,
    skippedReason: syncKimi
      ? shouldWriteKimi
        ? undefined
        : 'Kimi local.toml SVS block current'
      : 'skipped (target≠kimi/all)',
  };
  let gitignoreUpdated = false;
  if (shouldWriteKimi) {
    kimiLocalResult = exportKimiLocal(projectDir, { force: opts.forceKimiLocal === true });
    gitignoreUpdated = ensureKimiLocalGitignore(projectDir);
  }

  const grokSkillsNeed = grokSkillsNeedsUpdate(projectDir);
  const shouldWriteGrokSkills =
    syncGrokSkills &&
    (opts.forceGrokSkills === true ||
      (updateIfNeeded &&
        (grokSkillsNeed.blockMissing ||
          grokSkillsNeed.nativeMissing ||
          grokSkillsNeed.outdated ||
          grokSkillsNeed.curatedMissing > 0)));

  const grokSkills = shouldWriteGrokSkills
    ? exportGrokSkills(projectDir, { force: opts.forceGrokSkills === true })
    : {
        configUpdated: false,
        nativeSkillWritten: false,
        curatedCopied: 0,
        generatedWritten: 0,
        version: GROK_SKILLS_VERSION,
        skippedReason: syncGrokSkills
          ? 'Grok skills bridge current'
          : 'skipped (target≠grok/all)',
      };

  const hooksNeed = hooksExportNeedsUpdate(projectDir);
  const shouldWriteHooks =
    syncHooks &&
    (opts.forceHooksExport === true ||
      (updateIfNeeded &&
        (hooksNeed.kimiMissing || hooksNeed.grokMissing || hooksNeed.outdated)));

  const hookTargets: Array<'kimi' | 'grok'> =
    target === 'kimi' ? ['kimi'] : target === 'grok' ? ['grok'] : ['kimi', 'grok'];

  const hooksExport = shouldWriteHooks
    ? exportHooksToTargets(projectDir, {
        force: opts.forceHooksExport === true,
        targets: hookTargets,
      })
    : {
        kimiLocalUpdated: false,
        kimiUserUpdated: false,
        grokHooksWritten: false,
        grokCompatUpdated: false,
        version: HOOKS_EXPORT_VERSION,
        skippedReason: syncHooks ? 'Hooks export current' : 'skipped (target≠kimi/grok/all)',
      };

  const syncGrokUser = target === 'all' || target === 'grok';
  const shouldWriteGrokUser =
    syncGrokUser &&
    (opts.forceGrokUserConfig === true ||
      (updateIfNeeded && grokUserConfigNeedsUpdate()));
  const grokUserConfig = shouldWriteGrokUser
    ? exportGrokUserConfig({ force: true, stack: activeStack })
    : {
        written: false,
        version: GROK_USER_CONFIG_VERSION,
        path: '',
        skippedReason: syncGrokUser
          ? 'Grok user compat current'
          : 'skipped (target≠grok/all)',
      };

  const syncGrokAgents = target === 'all' || target === 'grok';
  const agentsNeed = grokAgentsNeedsUpdate(projectDir);
  const shouldWriteGrokAgents =
    syncGrokAgents &&
    (opts.forceGrokAgents === true ||
      (updateIfNeeded && (agentsNeed.missing || agentsNeed.outdated)));
  const grokAgents = shouldWriteGrokAgents
    ? exportGrokAgents(projectDir, { force: opts.forceGrokAgents === true })
    : {
        written: 0,
        version: GROK_AGENTS_VERSION,
        skippedReason: syncGrokAgents
          ? agentsNeed.claudeCount === 0
            ? 'No .claude/agents to export'
            : 'Grok agents current'
          : 'skipped (target≠grok/all)',
      };

  const prev = readManifest(projectDir);
  const manifest = defaultManifest(packageVersion(), {
    version: bundled,
    hash: hash || prev?.agentsMd?.hash,
    claudeRcHash: claudeRcHash || prev?.agentsMd?.claudeRcHash,
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
      mcpVersion: mcp.cursorWritten ? MCP_EXPORT_VERSION : prev?.targets?.cursor?.mcpVersion,
    };
    manifest.cursorRules = { version: CURSOR_RULES_VERSION };
  } else if (prev?.cursorRules) {
    manifest.cursorRules = prev.cursorRules;
  }

  if (
    kimiLocalResult.localWritten ||
    kimiLocalResult.localUpdated ||
    existsSync(join(projectDir, '.kimi-code', 'local.toml'))
  ) {
    manifest.kimiLocal = { version: KIMI_LOCAL_VERSION };
    manifest.targets.kimi = {
      ...manifest.targets.kimi,
      enabled: true,
      rulesVersion: KIMI_LOCAL_VERSION,
    };
  } else if (prev?.kimiLocal) {
    manifest.kimiLocal = prev.kimiLocal;
  }

  if (
    grokSkills.configUpdated ||
    grokSkills.nativeSkillWritten ||
    grokSkills.curatedCopied > 0 ||
    grokSkills.generatedWritten > 0 ||
    existsSync(join(projectDir, GROK_NATIVE_SKILL_REL))
  ) {
    manifest.grokSkills = { version: GROK_SKILLS_VERSION };
    manifest.targets.grok = {
      ...manifest.targets.grok,
      enabled: true,
      rulesVersion: prev?.targets?.grok?.rulesVersion ?? GROK_RULES_VERSION,
    };
  } else if (prev?.grokSkills) {
    manifest.grokSkills = prev.grokSkills;
  }

  if (
    hooksExport.kimiLocalUpdated ||
    hooksExport.kimiUserUpdated ||
    hooksExport.grokHooksWritten ||
    existsSync(join(projectDir, GROK_HOOKS_REL)) ||
    existsSync(join(projectDir, '.claude', 'hooks', 'svs-bridge.mjs'))
  ) {
    manifest.hooksExport = { version: HOOKS_EXPORT_VERSION };
  } else if (prev?.hooksExport) {
    manifest.hooksExport = prev.hooksExport;
  }

  if (grokUserConfig.written || !grokUserConfigNeedsUpdate()) {
    manifest.grokUserConfig = { version: GROK_USER_CONFIG_VERSION };
  } else if (prev?.grokUserConfig) {
    manifest.grokUserConfig = prev.grokUserConfig;
  }

  if (
    grokAgents.written > 0 ||
    existsSync(join(projectDir, GROK_AGENTS_REL, '.svs-version'))
  ) {
    manifest.grokAgents = { version: GROK_AGENTS_VERSION };
  } else if (prev?.grokAgents) {
    manifest.grokAgents = prev.grokAgents;
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
    agentsMdVersion: bundled,
    agentsMdHash: hash,
    claudeRcHash,
    manifestWritten: true,
    mcp,
    cursorRules: {
      written: cursorRules.written,
      version: cursorRules.version,
      skippedReason: cursorRules.skippedReason,
    },
    kimiLocal: {
      ...kimiLocalResult,
      gitignoreUpdated,
    },
    grokSkills,
    hooksExport,
    grokUserConfig: {
      written: grokUserConfig.written,
      version: grokUserConfig.version,
      skippedReason: grokUserConfig.skippedReason,
    },
    grokAgents: {
      written: grokAgents.written,
      version: grokAgents.version,
      skippedReason: grokAgents.skippedReason,
    },
    skippedReason,
  };
}
