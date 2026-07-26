/**
 * Multi-target adapters (Claude / Kimi / Grok) — Phase 1–3 types.
 */

export type TargetId = 'claude' | 'kimi' | 'grok';

export type MigrateTarget = TargetId | 'cursor' | 'all';

export interface TargetLaunchSpec {
  id: TargetId;
  label: string;
  /** Binary name on PATH */
  bin: string;
  /** argv after the binary */
  args: string[];
}

export interface AgentsMdMeta {
  /** Generator / policy-pack semver (frontmatter svs-version) */
  version: string;
  /** sha256 of generated body (optional diagnostics) */
  hash?: string;
  /** sha256 prefix of CLAUDE.md ## Recent Changes (Phase 5 drift detection) */
  claudeRcHash?: string;
}

export interface TargetManifestEntry {
  enabled: boolean;
  mcpVersion?: string;
  rulesVersion?: string;
}

export interface SvsManifest {
  /** npm package version that last wrote this manifest */
  packageVersion: string;
  updatedAt: string;
  targets: {
    claude: TargetManifestEntry;
    kimi: TargetManifestEntry;
    grok: TargetManifestEntry;
    cursor?: TargetManifestEntry;
  };
  agentsMd: AgentsMdMeta;
  mcpExport?: { version: string };
  cursorRules?: { version: string };
  kimiLocal?: { version: string };
  grokSkills?: { version: string };
  hooksExport?: { version: string };
}

export const AGENTS_MD_GENERATOR_VERSION = '1.0.0';

export const LAUNCH_SPECS: TargetLaunchSpec[] = [
  {
    id: 'claude',
    label: 'Claude Code',
    bin: 'claude',
    // Launch convenience only — project settings.json stays defaultMode: plan.
    args: ['--dangerously-skip-permissions'],
  },
  {
    id: 'kimi',
    label: 'Kimi Code',
    bin: 'kimi',
    args: [],
  },
  {
    id: 'grok',
    label: 'Grok',
    bin: 'grok',
    args: [],
  },
];

export function parseMigrateTarget(raw: string | undefined | null): MigrateTarget {
  if (!raw) return 'all';
  const v = raw.trim().toLowerCase();
  if (v === 'all' || v === 'claude' || v === 'kimi' || v === 'grok' || v === 'cursor') return v;
  return 'all';
}
