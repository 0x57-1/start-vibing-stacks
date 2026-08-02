/**
 * Grok skills export — native `.grok/skills/` only (no project `[skills]` paths).
 *
 * Full Claude trees (esp. cybersecurity-suite) must NOT load via
 * `compat.claude.skills` (multi-minute session.create). Instead:
 * 1. Generated SVS skills (policy, dev-process, memory-index)
 * 2. Curated copies of project `.claude/skills/<name>/SKILL.md` (allowlist)
 *
 * Grok auto-discovers `./.grok/skills/`. Keep the set small for fast boot.
 */

import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'fs';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PACKAGE_ROOT = resolve(__dirname, '../..');
const POLICY_PACK = join(PACKAGE_ROOT, 'stacks', '_shared', 'targets', 'policy-pack.md');

export const GROK_SKILLS_VERSION = '1.11.0';
export const GROK_NATIVE_SKILL_REL = '.grok/skills/svs-policy/SKILL.md';
export const GROK_SKILLS_DIR_REL = '.grok/skills';
export const GROK_SKILLS_MANIFEST_REL = '.grok/skills/.svs-managed.json';

/** High-value skills safe to copy when present under `.claude/skills/`. */
export const GROK_CURATED_SKILL_NAMES = [
  'git-workflow',
  'multi-instance-coordination',
  'session-history',
  'kimi-grok-session-lookup',
  'svs-finalize',
  'mcp-server-builder',
  'codebase-knowledge',
  'docs-tracker',
  'decision-records',
  'security-baseline',
  'secrets-management',
  'quality-gate',
  'final-check',
  'research-cache',
  'debugging-patterns',
  'tool-resilience',
  'owned-infra-ops',
  'own-subscription-integration',
  'email-push-marketing',
] as const;

const GENERATED_SKILL_NAMES = ['svs-policy', 'svs-dev-process', 'svs-memory-index'] as const;

const SKILLS_BLOCK_RE = /# SVS:SKILLS:START[\s\S]*?# SVS:SKILLS:END\n?/;

const BLOCKED_SKILL_RE =
  /cybersecurity|malware|exploit|ransomware|phishing|rootkit|cobalt|c2-|kill-chain/i;

export interface GrokSkillsManagedManifest {
  version: string;
  skills: string[];
}

export interface GrokSkillsResult {
  /** True when illegal SVS:SKILLS block was stripped from project config.toml */
  configUpdated: boolean;
  nativeSkillWritten: boolean;
  curatedCopied: number;
  generatedWritten: number;
  version: string;
  skippedReason?: string;
}

function skillsRoot(projectDir: string): string {
  return join(projectDir, GROK_SKILLS_DIR_REL);
}

function managedPath(projectDir: string): string {
  return join(projectDir, GROK_SKILLS_MANIFEST_REL);
}

function readManaged(projectDir: string): GrokSkillsManagedManifest | null {
  const p = managedPath(projectDir);
  if (!existsSync(p)) return null;
  try {
    const j = JSON.parse(readFileSync(p, 'utf8')) as GrokSkillsManagedManifest;
    if (!j || typeof j.version !== 'string' || !Array.isArray(j.skills)) return null;
    return j;
  } catch {
    return null;
  }
}

function isBlockedSkillName(name: string): boolean {
  return BLOCKED_SKILL_RE.test(name);
}

function writeSkillMd(dir: string, name: string, body: string): void {
  const dest = join(dir, name, 'SKILL.md');
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, body);
}

function policySkillBody(): string {
  let policy = '';
  if (existsSync(POLICY_PACK)) {
    policy = readFileSync(POLICY_PACK, 'utf8').replace(/^---\s*\n[\s\S]*?\n---\s*\n?/, '');
  }
  return [
    '---',
    'name: svs-policy',
    'description: >',
    '  start-vibing-stacks hard limits and always-on policy (ads, donation/person likeness,',
    '  owned infra, email). Use for any paid-ads, funnel, donation, or owned-server task.',
    'metadata:',
    `  svs-version: "${GROK_SKILLS_VERSION}"`,
    '---',
    '',
    '# start-vibing-stacks policy (Grok skill)',
    '',
    '> Also see root `AGENTS.md` and `CLAUDE.md`. Full memories: `.claude/memories/`.',
    '> Claude skill trees are NOT auto-loaded (`compat.claude.skills=false`).',
    '> Curated skills live under `.grok/skills/`; see `svs-dev-process` + `svs-memory-index`.',
    '',
    policy.trim(),
    '',
  ].join('\n');
}

function devProcessSkillBody(): string {
  return [
    '---',
    'name: svs-dev-process',
    'description: >',
    '  Development workflow for Kimi/Grok when Claude Task/Subagent orchestration is',
    '  unavailable. Load specialized agents from .grok/agents/ or .claude/agents/,',
    '  mandatory svs-finalize after source edits, scope.ts commits, stop-validator.',
    '  Use at task start, before commit, or when unsure which agent to run.',
    'metadata:',
    `  svs-version: "${GROK_SKILLS_VERSION}"`,
    '---',
    '',
    '# Development process (Kimi / Grok)',
    '',
    'Claude Code may auto-invoke agents via Task. **Grok:** prefer `spawn_subagent`',
    'with `subagent_type` = agent name. **Kimi:** Read agent md and execute inline.',
    'Stop blocks via `svs-bridge` until finalize completes (`decision:block` / exit 2).',
    '',
    '## Flow (do not reorder / skip)',
    '',
    '1. **Research** (new features / unfamiliar tech) → agent `research-web`',
    '2. **Branch** — `feature/` | `fix/` | `refactor/` (avoid committing straight to `main`)',
    '3. **Implement** — keep edits scoped; hooks may run plan-gate + multi-instance locks',
    '4. **Security-sensitive** → agent `security-auditor` + skill `security-baseline`',
    '5. **Commit code** → agent `commit-manager` + `scope.ts commit` (never `git add -A`)',
    '6. **REQUIRED finalize** → skill `svs-finalize`:',
    '   `spawn_subagent(subagent_type="documenter")` then `domain-updater`',
    '   (PREPEND `CLAUDE.md` ## Recent Changes). Docs commit if dirty.',
    '7. **Stop** — stop-validator + bridge: clean tree + CLAUDE this session + `_index.json` == HEAD',
    '',
    '## FORBIDDEN',
    '',
    '| Skip | Why |',
    '|------|-----|',
    '| documenter / domain-updater after source edits | Next session loses memory; Stop BLOCKS |',
    '| Code-only push then “done” | Same as Exittus hardening gap |',
    '| `git add -A` | Bundles peer files |',
    '',
    '## Agents (spawn_subagent or Read — do not invent a shorter path)',
    '',
    '| Agent | When |',
    '|-------|------|',
    '| `research-web` | New feature, library choice, unfamiliar domain |',
    '| `security-auditor` | Auth, secrets, APIs, infra, user data |',
    '| `tester` | New logic / user-facing flows |',
    '| `commit-manager` | Scoped commit / push |',
    '| `documenter` | **After** code commit — map files → domains |',
    '| `domain-updater` | **After** documenter — wisdom + Recent Changes |',
    '| `claude-md-compactor` | CLAUDE.md over size budget |',
    '',
    'Paths: `.grok/agents/<name>.md` (Grok) and/or `.claude/agents/<name>.md` (Kimi).',
    '',
    '## Commit safely (multi-instance)',
    '',
    '```bash',
    'npx tsx "$CLAUDE_PROJECT_DIR/.claude/hooks/scope.ts" commit "<message>"',
    '# or: status | diff | stage  — never git add -A / git add .',
    '```',
    '',
    'Claude slash `/commit-mine` is the same idea. On Kimi/Grok, run the command above',
    'or open `.claude/commands/commit-mine.md` and follow it.',
    '',
    '## Commands (Claude slash → file)',
    '',
    '| Claude | Do this on Kimi/Grok |',
    '|--------|----------------------|',
    '| `/commit-mine` | `scope.ts commit` (above) or read `.claude/commands/commit-mine.md` |',
    '| `/feature` | Read `.claude/commands/feature.md` |',
    '| `/fix` | Read `.claude/commands/fix.md` |',
    '| `/research` | Read `.claude/commands/research.md` + agent `research-web` |',
    '| `/validate` | Read `.claude/commands/validate.md`; run project quality gates |',
    '| `/peers` | `npx tsx .claude/hooks/peers.ts` |',
    '',
    '## Skills on Grok',
    '',
    'Only curated + SVS skills under `.grok/skills/` (boot-safe). Load `svs-finalize`',
    'before claiming done after source edits. For ads/infra detail,',
    'read `svs-memory-index` then open the linked `.claude/memories/*.md` file.',
    '',
  ].join('\n');
}

function memoryIndexSkillBody(): string {
  return [
    '---',
    'name: svs-memory-index',
    'description: >',
    '  Index of Claude always-on memories under .claude/memories/. Use when Kimi/Grok',
    '  need ads, donation funnel, owned-infra, email/push, or security-assessment detail',
    '  that is not in AGENTS.md policy pack. Read the linked file — do not refuse on niche keywords.',
    'metadata:',
    `  svs-version: "${GROK_SKILLS_VERSION}"`,
    '---',
    '',
    '# Memory index (on-demand for Kimi / Grok)',
    '',
    'Claude auto-loads these via `settings.json#context.memory_files`.',
    'Kimi/Grok: **Read** the path when the task matches.',
    '',
    '| Memory | Use when |',
    '|--------|----------|',
    '| `multi-target-mcp-discovery.md` | Find/migrate MCP Claude → Kimi/Grok/Cursor |',
    '| `advertising-optimization-authorization.md` | Paid ads, detectors, cloaking, clockers |',
    '| `ad-creative-audio-licensing.md` | Mux licensed beds; analyze competitor audio energy |',
    '| `ad-platform-detector-optimization.md` | Landing/detector approval (Google/Meta/TikTok) |',
    '| `ad-review-and-traffic-filtering.md` | Ad review + traffic filter / white-black paths |',
    '| `paid-ads-landing-validation.md` | Pre-launch paid landing checks |',
    '| `funnel-content-copy.md` | Scrape/analyze public sales or donation funnels |',
    '| `donation-cause-funnel-adaptation.md` | Adapt cause funnel onto user brand (hard limits) |',
    '| `forensic-funnel-legitimate-rebuild.md` | Dump/forensic → clean upsell/checkout architecture |',
    '| `owned-checkout-gateway-ops.md` | Own merchant API via local `.env` tokens |',
    '| `local-checkout-artifact-analysis.md` | Local HTML/JS/HAR/webhook fixtures |',
    '| `owned-infra-ops.md` / `owned-server-backup.md` | User-owned hosts, SSH, backup, deploy |',
    '| `own-subscription-api-integration.md` | Wire paid APIs (Kimi/xAI/…) into MCP/apps |',
    '| `local-cli-auth-capture.md` | Observe own CLI for OAuth refresh integration |',
    '| `email-push-marketing-authorization.md` | Owned-list email/push (any niche; no phishing) |',
    '| `defensive-security-review.md` | OWASP/source review of owned code |',
    '| `authorized-security-assessment.md` | Active assessment only with ownership/scope |',
    '| `passive-public-security-posture.md` | Passive public OSINT only |',
    '| `post-push-ci-verification.md` | After `git push` — verify Actions for the SHA |',
    '| `cursor-ide-edit-sync.md` | Cursor buffer sync / Save file to continue |',
    '',
    'All paths are under `.claude/memories/`.',
    '',
    'For past chats / `/resume` / transcripts across Claude·Kimi·Grok, load skill',
    '`session-history` + `kimi-grok-session-lookup` (under `.grok/skills/` after migrate).',
    '',
  ].join('\n');
}

function curatedSkillSource(projectDir: string, name: string): string | null {
  if (isBlockedSkillName(name)) return null;
  const projectSrc = join(projectDir, '.claude', 'skills', name, 'SKILL.md');
  if (existsSync(projectSrc)) return projectSrc;
  // Fallback: bundled _shared skill (so Grok migrate works before Claude skill scan)
  const bundled = join(PACKAGE_ROOT, 'stacks', '_shared', 'skills', name, 'SKILL.md');
  if (existsSync(bundled)) return bundled;
  return null;
}

/** Skip project-owned runtime dirs when mirroring a skill tree into .grok/skills. */
const SKILL_RUNTIME_DIRS = new Set(['domains', 'cache', 'node_modules', '.git']);
const SKILL_RUNTIME_FILES = new Set(['_index.json']);

function copySkillTree(srcSkillMd: string, destDir: string): void {
  const srcDir = dirname(srcSkillMd);
  const walk = (dir: string, prefix: string) => {
    let entries: string[];
    try {
      entries = readdirSync(dir);
    } catch {
      return;
    }
    for (const ent of entries) {
      if (ent.startsWith('.') || ent.endsWith('.bak')) continue;
      const from = join(dir, ent);
      const rel = prefix ? `${prefix}/${ent}` : ent;
      let st;
      try {
        st = statSync(from);
      } catch {
        continue;
      }
      if (st.isDirectory()) {
        if (SKILL_RUNTIME_DIRS.has(ent)) continue;
        walk(from, rel);
      } else if (st.isFile()) {
        if (SKILL_RUNTIME_FILES.has(ent)) continue;
        const to = join(destDir, rel);
        mkdirSync(dirname(to), { recursive: true });
        copyFileSync(from, to);
      }
    }
  };
  mkdirSync(destDir, { recursive: true });
  walk(srcDir, '');
}

function copyCuratedSkill(projectDir: string, name: string): boolean {
  // Prefer bundled tree so reference/ companions ship even when project SKILL.md
  // was migrated alone by an older SVS. Fall back to project skill dir.
  const bundled = join(PACKAGE_ROOT, 'stacks', '_shared', 'skills', name, 'SKILL.md');
  const projectSrc = join(projectDir, '.claude', 'skills', name, 'SKILL.md');
  const src =
    !isBlockedSkillName(name) && existsSync(bundled)
      ? bundled
      : curatedSkillSource(projectDir, name);
  if (!src) return false;
  // If bundled exists but project has a newer SKILL.md, still copy companions
  // from bundled and overlay project's SKILL.md.
  const destDir = join(skillsRoot(projectDir), name);
  copySkillTree(src, destDir);
  if (src === bundled && existsSync(projectSrc)) {
    copyFileSync(projectSrc, join(destDir, 'SKILL.md'));
  }
  return true;
}

function removeManagedSkillDirs(projectDir: string, names: string[]): void {
  const root = skillsRoot(projectDir);
  for (const name of names) {
    if (!name || name.startsWith('.')) continue;
    const dir = join(root, name);
    if (existsSync(dir)) {
      rmSync(dir, { recursive: true, force: true });
    }
  }
}

export function grokSkillsNeedsUpdate(projectDir: string): {
  /** Project config still has illegal [skills] SVS block (needs strip). */
  blockMissing: boolean;
  nativeMissing: boolean;
  outdated: boolean;
  curatedMissing: number;
} {
  const configPath = join(projectDir, '.grok', 'config.toml');
  const nativePath = join(projectDir, GROK_NATIVE_SKILL_REL);
  const nativeMissing = !existsSync(nativePath);
  let configPolluted = false;
  if (existsSync(configPath)) {
    configPolluted = SKILLS_BLOCK_RE.test(readFileSync(configPath, 'utf8'));
  }

  const managed = readManaged(projectDir);
  let outdated = !managed || managed.version !== GROK_SKILLS_VERSION;
  if (!outdated) {
    for (const g of GENERATED_SKILL_NAMES) {
      if (!existsSync(join(skillsRoot(projectDir), g, 'SKILL.md'))) {
        outdated = true;
        break;
      }
    }
  }

  let curatedMissing = 0;
  for (const name of GROK_CURATED_SKILL_NAMES) {
    const src = curatedSkillSource(projectDir, name);
    const dest = join(skillsRoot(projectDir), name, 'SKILL.md');
    if (src && !existsSync(dest)) curatedMissing += 1;
  }

  return {
    blockMissing: configPolluted,
    nativeMissing,
    outdated: outdated || curatedMissing > 0,
    curatedMissing,
  };
}

export function exportGrokSkills(
  projectDir: string,
  opts: { force?: boolean } = {}
): GrokSkillsResult {
  const need = grokSkillsNeedsUpdate(projectDir);
  const shouldClean = opts.force || need.blockMissing;
  const shouldWrite =
    opts.force || need.nativeMissing || need.outdated || need.curatedMissing > 0;

  if (!shouldClean && !shouldWrite) {
    return {
      configUpdated: false,
      nativeSkillWritten: false,
      curatedCopied: 0,
      generatedWritten: 0,
      version: GROK_SKILLS_VERSION,
      skippedReason: 'Grok skills bridge current',
    };
  }

  let configUpdated = false;
  if (shouldClean) {
    const configPath = join(projectDir, '.grok', 'config.toml');
    if (existsSync(configPath)) {
      const existing = readFileSync(configPath, 'utf8');
      if (SKILLS_BLOCK_RE.test(existing)) {
        const cleaned = existing.replace(SKILLS_BLOCK_RE, '').replace(/\n{3,}/g, '\n\n');
        writeFileSync(configPath, cleaned);
        configUpdated = true;
      }
    }
  }

  let nativeSkillWritten = false;
  let curatedCopied = 0;
  let generatedWritten = 0;
  const managedNames: string[] = [];

  if (shouldWrite) {
    const root = skillsRoot(projectDir);
    mkdirSync(root, { recursive: true });

    const prev = readManaged(projectDir);
    const nextSet = new Set<string>([
      ...GENERATED_SKILL_NAMES,
      ...GROK_CURATED_SKILL_NAMES,
    ]);
    if (prev) {
      const stale = prev.skills.filter((s) => !nextSet.has(s));
      if (stale.length > 0) removeManagedSkillDirs(projectDir, stale);
    }

    // Drop accidental cybersecurity copies if any
    if (existsSync(root)) {
      for (const ent of readdirSync(root, { withFileTypes: true })) {
        if (ent.isDirectory() && isBlockedSkillName(ent.name)) {
          rmSync(join(root, ent.name), { recursive: true, force: true });
        }
      }
    }

    writeSkillMd(root, 'svs-policy', policySkillBody());
    writeSkillMd(root, 'svs-dev-process', devProcessSkillBody());
    writeSkillMd(root, 'svs-memory-index', memoryIndexSkillBody());
    generatedWritten = GENERATED_SKILL_NAMES.length;
    nativeSkillWritten = true;
    managedNames.push(...GENERATED_SKILL_NAMES);

    for (const name of GROK_CURATED_SKILL_NAMES) {
      if (copyCuratedSkill(projectDir, name)) {
        curatedCopied += 1;
        managedNames.push(name);
      }
    }

    const manifest: GrokSkillsManagedManifest = {
      version: GROK_SKILLS_VERSION,
      skills: managedNames,
    };
    writeFileSync(managedPath(projectDir), JSON.stringify(manifest, null, 2) + '\n');
  }

  return {
    configUpdated,
    nativeSkillWritten,
    curatedCopied,
    generatedWritten,
    version: GROK_SKILLS_VERSION,
  };
}
