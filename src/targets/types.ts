/**
 * Multi-target adapters (Claude / Kimi / Grok) — Phase 1 types.
 */

export type TargetId = 'claude' | 'kimi' | 'grok';

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
}

export interface SvsManifest {
  /** npm package version that last wrote this manifest */
  packageVersion: string;
  updatedAt: string;
  targets: {
    claude: { enabled: boolean };
    kimi: { enabled: boolean };
    grok: { enabled: boolean };
  };
  agentsMd: AgentsMdMeta;
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
