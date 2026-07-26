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
export { generateAgentsMd, bundledAgentsMdVersion } from './agents-md.js';
export type { GenerateAgentsMdOptions, GenerateAgentsMdResult } from './agents-md.js';
export { isBinaryOnPath, availableLaunchTargets, launchTarget, resolveLaunchSpec } from './launch.js';
export { syncTargets, packageVersion } from './sync.js';
export type { SyncTargetsOptions, SyncTargetsResult } from './sync.js';
export {
  exportMcpToTargets,
  loadProjectMcpServers,
  MCP_EXPORT_VERSION,
  GROK_RULES_VERSION,
  toKimiMcpJson,
  toGrokMcpTomlFragment,
} from './mcp-export.js';
export type { McpExportResult, ExportMcpOptions, ClaudeMcpServers } from './mcp-export.js';
