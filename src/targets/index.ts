export type {
  TargetId,
  TargetLaunchSpec,
  SvsManifest,
  AgentsMdMeta,
  MigrateTarget,
  TargetManifestEntry,
} from './types.js';
export { AGENTS_MD_GENERATOR_VERSION, LAUNCH_SPECS, parseMigrateTarget } from './types.js';
export {
  MANIFEST_REL,
  manifestPath,
  readManifest,
  writeManifest,
  defaultManifest,
  agentsMdNeedsUpdate,
  mcpExportNeedsUpdate,
} from './manifest.js';
export {
  generateAgentsMd,
  bundledAgentsMdVersion,
  hashClaudeRecentChanges,
  readClaudeRecentChangesHash,
} from './agents-md.js';
export type { GenerateAgentsMdOptions, GenerateAgentsMdResult } from './agents-md.js';
export { isBinaryOnPath, availableLaunchTargets, launchTarget, resolveLaunchSpec } from './launch.js';
export { syncTargets, packageVersion } from './sync.js';
export type { SyncTargetsOptions, SyncTargetsResult } from './sync.js';
export {
  exportMcpToTargets,
  loadProjectMcpServers,
  listMcpSourceLabels,
  asMcpServers,
  MCP_EXPORT_VERSION,
  GROK_RULES_VERSION,
  toKimiMcpJson,
  toGrokMcpTomlFragment,
} from './mcp-export.js';
export type { McpExportResult, ExportMcpOptions, ClaudeMcpServers } from './mcp-export.js';
export {
  exportCursorRules,
  cursorRulesNeedsUpdate,
  CURSOR_RULES_VERSION,
  CURSOR_RULES_REL,
} from './cursor-rules.js';
export type { CursorRulesResult } from './cursor-rules.js';
export {
  exportKimiLocal,
  ensureKimiLocalGitignore,
  kimiLocalNeedsUpdate,
  KIMI_LOCAL_VERSION,
  KIMI_LOCAL_REL,
  KIMI_LOCAL_EXAMPLE_REL,
} from './kimi-local.js';
export type { KimiLocalResult } from './kimi-local.js';
export {
  exportGrokSkills,
  grokSkillsNeedsUpdate,
  GROK_SKILLS_VERSION,
  GROK_NATIVE_SKILL_REL,
} from './grok-skills.js';
export type { GrokSkillsResult } from './grok-skills.js';
export {
  exportHooksToTargets,
  hooksExportNeedsUpdate,
  exportKimiHooksLocal,
  exportKimiHooksUser,
  exportGrokHooks,
  HOOKS_EXPORT_VERSION,
  GROK_HOOKS_REL,
} from './hooks-export.js';
export type { HooksExportResult } from './hooks-export.js';
export {
  collectTargetsStatus,
  formatTargetsStatus,
  recentChangesDrifted,
} from './status.js';
export type { TargetStatusLine } from './status.js';
