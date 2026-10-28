/**
 * Generate root `AGENTS.md` for Kimi Code / Grok (shared file).
 * Claude keeps full CLAUDE.md + .claude/memories; this is a condensed twin.
 */

import { createHash } from 'crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { AGENTS_MD_GENERATOR_VERSION } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PACKAGE_ROOT = resolve(__dirname, '../..');

const POLICY_PACK = join(PACKAGE_ROOT, 'stacks', '_shared', 'targets', 'policy-pack.md');

export interface GenerateAgentsMdOptions {
  /** Overwrite even if AGENTS.md exists and looks user-customized */
  force?: boolean;
  /** Max Recent Changes entries to mirror from CLAUDE.md */
  recentChangesLimit?: number;
}

export interface GenerateAgentsMdResult {
  written: boolean;
  path: string;
  version: string;
  hash: string;
  /** Hash of CLAUDE.md Recent Changes used in this generation */
  claudeRcHash: string;
  skippedReason?: string;
}

/**
 * Build AGENTS.md from CLAUDE.md slices + bundled policy pack.
 * Preserves user body between markers if present and force=false with newer local edits —
 * Phase 1: overwrite when missing/outdated/force; otherwise skip if file exists and
 * frontmatter version >= bundled (caller decides outdated via manifest).
 */
export function generateAgentsMd(
  projectDir: string,
  opts: GenerateAgentsMdOptions = {}
): GenerateAgentsMdResult {
  const dest = join(projectDir, 'AGENTS.md');
  const recentLimit = opts.recentChangesLimit ?? 5;

  const policy = loadPolicyPack();
  const version = bundledAgentsMdVersion();
  const claudePath = join(projectDir, 'CLAUDE.md');
  const claude = existsSync(claudePath) ? readFileSync(claudePath, 'utf8') : '';

  const overview = extractSection(claude, '30 Seconds Overview') ?? 'Project configured by start-vibing-stacks.';
  const stack = extractSection(claude, 'Stack') ?? '_See CLAUDE.md for stack table._';
  const recent = extractRecentChanges(claude, recentLimit);
  const claudeRcHash = hashClaudeRecentChanges(claude, recentLimit);
  const projectName = basenameSafe(projectDir);

  const body = [
    '---',
    `svs-version: ${version}`,
    'generated-by: start-vibing-stacks',
    'targets: kimi, grok, cursor',
    '---',
    '',
    `# ${projectName} — AGENTS.md`,
    '',
    '> Shared project instructions for **Kimi Code**, **Grok**, and tools that read `AGENTS.md`.',
    '> Claude Code prefers `CLAUDE.md` + `.claude/memories/`. Keep both in sync via',
    '> `npx start-vibing-stacks migrate --apply`.',
    '',
    '## 30 Seconds Overview',
    '',
    overview.trim(),
    '',
    '## Stack',
    '',
    stack.trim(),
    '',
    '## Recent Changes (mirrored from CLAUDE.md)',
    '',
    recent.trim() || '_No Recent Changes block found in CLAUDE.md._',
    '',
    '## Development process (Kimi / Grok)',
    '',
    'Claude Code can auto-invoke specialized agents via Task/Subagent. **Kimi and Grok do not** —',
    'use native spawn / Read agents (skill `svs-finalize`). Stop hook blocks until finalize is done.',
    '',
    '### Flow (do not skip — same order as Claude)',
    '',
    '1. **Research** (new features) → agent `research-web`',
    '2. **Branch** — `feature/` | `fix/` | `refactor/` (avoid direct commits to `main`)',
    '3. **Implement** — scoped edits; hooks may enforce plan-gate + multi-instance file locks',
    '4. **Security-sensitive** → `security-auditor` + `security-baseline` (named CVEs: `cve-watchlist.md` on lockfile hit)',
    '5. **Commit code** → `commit-manager` + `scope.ts commit` HEREDOC (never `git add -A`; no `--push` yet)',
    '6. **documenter** → domains + `_index.json`',
    '7. **domain-updater** → PREPEND `CLAUDE.md` ## Recent Changes',
    '8. **Docs commit + push** if dirty → HEREDOC `"docs: …"` + `--push` on main',
    '9. **Stop** — bridge blocks (Grok `decision:block` / Kimi exit 2) until docs catch up',
    '',
    'Skill `svs-finalize`. **Grok:** spawn `documenter` / `domain-updater` (`capability_mode: all`, `background: true`).',
    'Do **not** pass `reasoning_effort`. Writer roles pin `low`. Short prompt. Do not Read `svs-document` first.',
    'Fallback: parent Reads the Grok-native agent. Do not restamp after `docs:`. Not `explore`/`plan`.',
    '**Kimi:** Read + execute `.claude/agents/<name>.md`.',
    '',
    '### FORBIDDEN',
    '',
    '- Push C1 before documenter; claim done while ahead of origin',
    '- Subject-only commit when why is non-obvious (`git show` must stand alone)',
    '- documenter before the code commit',
    '- Claiming done while Stop would block on finalize',
    '',
    '### Agents',
    '',
    '| Agent | When | Path |',
    '|-------|------|------|',
    '| `research-web` | New feature / unfamiliar tech (Grok: `search_tool`/`use_tool`) | `.grok/agents/` or `.claude/agents/` |',
    '| `security-auditor` | Auth, secrets, APIs, infra | same |',
    '| `tester` | New logic / user-facing flows | same |',
    '| `commit-manager` | Scoped commit / push (**before** documenter) | same |',
    '| `documenter` | **After** code commit — map files → domains | same |',
    '| `domain-updater` | **After** documenter — wisdom + Recent Changes | same |',
    '| `claude-md-compactor` | CLAUDE.md over size budget | same |',
    '| `long-session-consistency` | Resume/compact/cross-CLI memory design | same |',
    '| `knowledge-rag-eval` | Obsidian/ADR/embeddings — ship or skip | same |',
    '',
    'Kimi: `extra_agent_dirs` → `.claude/agents/`. Grok: adapted copy in `.grok/agents/` on migrate.',
    '',
    '### Safe commit (multi-instance)',
    '',
    '```bash',
    'npx tsx "$CLAUDE_PROJECT_DIR/.claude/hooks/scope.ts" commit "<message>"',
    '```',
    '',
    'Claude `/commit-mine` is the same idea. Prefer `scope commit` over staging the whole tree.',
    '',
    '### Commands (Claude slash → run the file)',
    '',
    '| Claude | On Kimi / Grok |',
    '|--------|----------------|',
    '| `/commit-mine` | `scope.ts commit` (above) or read `.claude/commands/commit-mine.md` |',
    '| `/feature` | Read `.claude/commands/feature.md` |',
    '| `/fix` | Read `.claude/commands/fix.md` |',
    '| `/research` | Read `.claude/commands/research.md` + agent `research-web` |',
    '| `/validate` | Read `.claude/commands/validate.md` + project quality gates |',
    '| `/svs-peers` | SVS bus (`peers.ts`); Claude native `/peers` = ListAgents |',
    '',
    '### Skills & memories',
    '',
    '- **Kimi** — project `.claude/skills/` via `local.toml` `extra_skill_dirs`.',
    '  Memories: `.kimi-code/skills/svs-memory-index` (same pointers as Grok). Read the linked `.claude/memories/` file.',
    '- **Grok** — curated + SVS skills under `.grok/skills/` only (`compat.claude.skills=false` for boot).',
    '  Load `svs-dev-process`, `svs-finalize`, `svs-memory-index`, `session-history`, `kimi-grok-session-lookup`.',
    '- **Shared bus** — `.claude/state/` (peers, locks, inbox; gitignored).',
    '- **Project brain** — `.claude/brain/` (committed tasks + journal). SessionStart brief + PreCompact stamp.',
    '- **Decisions** — `docs/decisions/` (ADRs — durable why). Skill `decision-records`.',
    '- **Compact** — use product `/compact` with a short hint; restore from brain — see skill `session-history`.',
    '',
    '<!-- SVS:POLICY-PACK:START -->',
    stripPolicyFrontmatter(policy).trim(),
    '<!-- SVS:POLICY-PACK:END -->',
    '',
    '## See also',
    '',
    '- `CLAUDE.md` — full Claude Code project rules',
    '- `.claude/memories/` — detailed always-on Claude memories (Read on demand from Kimi/Grok)',
    '- `.claude/memories/multi-target-mcp-discovery.md` — find/migrate MCP → Kimi/Grok/Cursor',
    '- `.claude/config/mcp-active.json` — Claude MCP source for `migrate --apply`',
    '- `.claude/config/svs-manifest.json` — package/target freshness',
    '- `.grok/skills/svs-dev-process/SKILL.md` — same process as a Grok-native skill',
    '',
  ].join('\n');

  const hash = createHash('sha256').update(body).digest('hex').slice(0, 16);

  if (existsSync(dest) && !opts.force) {
    // Caller should pass force when outdated/missing-version; default skip to avoid stomping.
    return {
      written: false,
      path: dest,
      version,
      hash,
      claudeRcHash,
      skippedReason: 'exists (pass force to regenerate)',
    };
  }

  mkdirSync(projectDir, { recursive: true });
  writeFileSync(dest, body);
  return {
    written: true,
    path: dest,
    version,
    hash,
    claudeRcHash,
  };
}

/** Hash of the Recent Changes slice mirrored into AGENTS.md (for drift detection). */
export function hashClaudeRecentChanges(claudeMd: string, limit = 5): string {
  const recent = extractRecentChanges(claudeMd, limit);
  return createHash('sha256').update(recent).digest('hex').slice(0, 16);
}

export function readClaudeRecentChangesHash(projectDir: string, limit = 5): string | null {
  const claudePath = join(projectDir, 'CLAUDE.md');
  if (!existsSync(claudePath)) return null;
  return hashClaudeRecentChanges(readFileSync(claudePath, 'utf8'), limit);
}

function loadPolicyPack(): string {
  if (!existsSync(POLICY_PACK)) {
    return '# Policy pack missing from package install.\n';
  }
  return readFileSync(POLICY_PACK, 'utf8');
}

function stripPolicyFrontmatter(md: string): string {
  return md.replace(/^---\s*\n[\s\S]*?\n---\s*\n?/, '');
}

/** Extract markdown section by ## heading (until next ## at same level). */
function extractSection(md: string, title: string): string | null {
  if (!md) return null;
  const lines = md.split('\n');
  const startRe = new RegExp(`^##\\s+${escapeRegExp(title)}\\s*$`);
  const start = lines.findIndex((l) => startRe.test(l));
  if (start < 0) return null;
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    if (/^##\s+/.test(lines[i] ?? '')) {
      end = i;
      break;
    }
  }
  return lines
    .slice(start + 1, end)
    .join('\n')
    .replace(/\n---\s*$/m, '')
    .trim();
}

function extractRecentChanges(md: string, limit: number): string {
  const section = extractSection(md, 'Recent Changes');
  if (!section) return '';
  // Drop HTML comments at top of section
  const cleaned = section.replace(/^<!--[\s\S]*?-->\s*/m, '').trim();
  const blocks = cleaned.split(/(?=^### )/m).filter((b) => b.trim().startsWith('###'));
  return blocks.slice(0, limit).join('\n').trim();
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function basenameSafe(dir: string): string {
  const parts = dir.replace(/\\/g, '/').split('/').filter(Boolean);
  return parts[parts.length - 1] || 'project';
}

/** Bundled policy-pack + generator version for migrate comparisons. */
export function bundledAgentsMdVersion(): string {
  if (!existsSync(POLICY_PACK)) return AGENTS_MD_GENERATOR_VERSION;
  try {
    const raw = readFileSync(POLICY_PACK, 'utf8');
    const fm = /^---\s*\n([\s\S]*?)\n---/.exec(raw);
    const v = fm ? /^svs-version:\s*["']?([0-9.]+)["']?\s*$/m.exec(fm[1] ?? '') : null;
    // Effective version = max(generator, policy-pack) as string compare of patch — keep generator as source of truth for AGENTS.md format.
    return v?.[1] && comparePatch(v[1], AGENTS_MD_GENERATOR_VERSION) > 0
      ? v[1]
      : AGENTS_MD_GENERATOR_VERSION;
  } catch {
    return AGENTS_MD_GENERATOR_VERSION;
  }
}

function comparePatch(a: string, b: string): number {
  const pa = a.split('.').map((n) => parseInt(n, 10) || 0);
  const pb = b.split('.').map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < 3; i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d !== 0) return d < 0 ? -1 : 1;
  }
  return 0;
}
