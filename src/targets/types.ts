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
  grokUserConfig?: { version: string };
  grokAgents?: { version: string };
}

/** Keep ≥ policy-pack svs-version so bundledAgentsMdVersion() does not stale-loop. */
export const AGENTS_MD_GENERATOR_VERSION = '1.2.11';

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
    // Parity with Claude Launch --dangerously-skip-permissions (tools/MCP auto-approve).
    args: ['--yolo'],
  },
  {
    id: 'grok',
    label: 'Grok',
    bin: 'grok',
    // Parity with Claude Launch bypass (--always-approve; alias --yolo).
    // Grok 1.0.4: `--trust` is hidden from `--help` but still accepted — same as
    // `/hooks-trust`; writes ~/.grok/trusted_folders.toml (hooks + project MCP/LSP).
    // Subagents are on by default (`--no-subagents` disables). Do not pass
    // `--restore-code` on resume (chat-only unless the user asks).
    args: ['--always-approve', '--trust'],
  },
];

export function parseMigrateTarget(raw: string | undefined | null): MigrateTarget {
  if (!raw) return 'all';
  const v = raw.trim().toLowerCase();
  if (v === 'all' || v === 'claude' || v === 'kimi' || v === 'grok' || v === 'cursor') return v;
  return 'all';
}
