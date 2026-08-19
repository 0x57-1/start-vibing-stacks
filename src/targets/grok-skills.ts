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
import { GROK_SPAWN_RECIPE_MD } from './grok-agents.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PACKAGE_ROOT = resolve(__dirname, '../..');
const POLICY_PACK = join(PACKAGE_ROOT, 'stacks', '_shared', 'targets', 'policy-pack.md');

export const GROK_SKILLS_VERSION = '1.29.0';
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
  'owned-wordpress-plugin-ops',
  'own-subscription-integration',
  'email-push-marketing',
  'remove-ai-marks',
  // Frontend theme corpus (large; only mirrored when present in project .claude/skills)
  'preline-moon',
  'preline-ui',
  'react-theme-apply',
] as const;

const GENERATED_SKILL_NAMES = [
  'svs-policy',
  'svs-dev-process',
  'svs-memory-index',
  'svs-document',
] as const;

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
    'Claude Code may auto-invoke agents via Task. **Grok:** spawn `documenter` /',
    '`domain-updater` (`capability_mode: all`). Do **not** pass `reasoning_effort`',
    '(schema often omits it — reject inherits parent `xhigh`). Writer roles pin',
    '`low` (`.grok/roles/<name>.toml`). Short prompt. `background: true`. Do not',
    're-Read `svs-document` first. Fallback: parent Reads the Grok-native agent.',
    '**Kimi:** Read + execute inline.',
    'Stop blocks via `svs-bridge` until finalize completes (`decision:block` / exit 2).',
    '',
    '## Grok Build 1.0.4 (Aug 2026) — features SVS uses',
    '',
    '- Launch: `grok --always-approve --trust` (SVS menu; `--trust` hidden in `--help` but valid).',
    '- Folder trust: `/hooks-trust` or `--trust` → `~/.grok/trusted_folders.toml` (hooks + project MCP/LSP).',
    '- Subagents **on by default** (`GROK_SUBAGENTS=1`; `--no-subagents` disables). Ask the user to enable if off.',
    '- Built-in types: `general-purpose` (writes), `explore` / `plan` (read+shell, **no edits**).',
    '- Prefer custom type `documenter` / `domain-updater` (agent + role apply). Fallback: parent Reads the native agent.',
    '- Do **not** pass `reasoning_effort` on spawn (schema omit → inherit `xhigh`). Writer roles pin `low`.',
    '- Native agent **is** the protocol — do not Read `svs-document` / `AGENTS.md` first.',
    '- Never paste the agent body into the parent prompt.',
    '- Spawn: `capability_mode` (`read-only`|`read-write`|`execute`|`all`), `isolation` (`none`|`worktree`), `background`, `resume_from` (same type only).',
    '- Stop gate: `{"decision":"block","reason"}`; **max 8 continuations/turn** — finish finalize in that window.',
    '- Remote resume restores **chat only** unless `--restore-code` (do not pass by default).',
    '- MCP: `grok mcp enable|disable <name>` / `grok mcp doctor` when OAuth hang (e.g. vercel).',
    '- SessionEnd archives `.claude/state/sessions/<id>.json`; SessionStart **rehydrates** `filesTouched`.',
    '- Do **not** use Plan Mode / design writer-reviewer as a finalize substitute.',
    '',
    GROK_SPAWN_RECIPE_MD,
    '',
    '## Flow (do not reorder / skip)',
    '',
    '1. **Research** (new features / unfamiliar tech) → agent `research-web`',
    '2. **Branch** — `feature/` | `fix/` | `refactor/` (avoid committing straight to `main`)',
    '3. **Implement** — keep edits scoped; hooks may run plan-gate + multi-instance locks',
    '4. **Security-sensitive** → agent `security-auditor` + skill `security-baseline`',
    '5. **Commit code** → `commit-manager` → `scope.ts commit` HEREDOC (never `git add -A`; no `--push` yet)',
    '6. **Document** → `documenter` (domains + `_index.json#last_commit`)',
    '7. **Wisdom** → `domain-updater` (PREPEND `CLAUDE.md` ## Recent Changes)',
    '8. **Docs commit + push** if dirty → HEREDOC `"docs: …"` + `--push` on main',
    '9. **Stop** — bridge + stop-validator: clean tree + CLAUDE this session + index ≈ HEAD + not ahead of origin',
    '',
    'Skill `svs-finalize` is the checklist + verify block. Do not reorder 5→8.',
    '',
    '## FORBIDDEN',
    '',
    '| Skip | Why |',
    '|------|-----|',
    '| documenter / domain-updater after source edits | Next session loses memory; Stop BLOCKS |',
    '| documenter **before** code commit | Index stamps wrong SHA; gates confuse |',
    '| Push C1 before documenter | Index stamps wrong SHA; or “done” while unpushed |',
    '| Subject-only commit when why is non-obvious | Next agent cannot recover from `git show` |',
    '| `git add -A` | Bundles peer files |',
    '',
    '## Agents (spawn_subagent or Read — do not invent a shorter path)',
    '',
    '| Agent | When |',
    '|-------|------|',
    '| `research-web` | New feature, library choice, unfamiliar domain |',
    '| `security-auditor` | Auth, secrets, APIs, infra, user data |',
    '| `tester` | New logic / user-facing flows |',
    '| `commit-manager` | Scoped commit / push (**before** documenter) |',
    '| `documenter` | **After** code commit — map files → domains |',
    '| `domain-updater` | **After** documenter — wisdom + Recent Changes |',
    '| `claude-md-compactor` | CLAUDE.md over size budget |',
    '',
    'Paths: `.grok/agents/<name>.md` (Grok) and/or `.claude/agents/<name>.md` (Kimi).',
    '',
    '## Commit safely (multi-instance)',
    '',
    '```bash',
    'npx tsx "$CLAUDE_PROJECT_DIR/.claude/hooks/scope.ts" status',
    'npx tsx "$CLAUDE_PROJECT_DIR/.claude/hooks/scope.ts" commit "$(cat <<\'EOF\'',
    '<type>(<scope>): <subject>',
    '',
    '<why>',
    '<contract>',
    'EOF',
    ')"',
    '# C2 on main: add --push. never git add -A / git add .',
    '```',
    '',
    'Claude `/commit-mine` ≡ above. Kimi/Grok: run the command or Read `.claude/commands/commit-mine.md`.',
    '',
    '## Verify before claiming done',
    '',
    '```bash',
    'jq -r ".last_commit // \\"MISSING\\"" .claude/skills/codebase-knowledge/_index.json',
    'git rev-parse --short HEAD',
    'rg -m1 -A3 "^## Recent Changes" CLAUDE.md',
    '```',
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
    '| `/svs-peers` | SVS bus (`peers.ts`); Claude native `/peers` = ListAgents |',
    '',
    '## Skills on Grok',
    '',
    'Only curated + SVS skills under `.grok/skills/` (boot-safe). Load `svs-finalize`',
    'before claiming done after source edits. Native writer agents already carry the',
    'protocol — `svs-document` is optional if a rule is missing. For ads/infra detail,',
    'read `svs-memory-index` then open the linked `.claude/memories/*.md` file.',
    '',
  ].join('\n');
}

function documentSkillBody(): string {
  return [
    '---',
    'name: svs-document',
    'description: >',
    '  Write protocol for Grok documenter and domain-updater. File-to-domain mapping,',
    '  action matrix, _index.json stamp, CLAUDE.md Recent Changes prepend, wisdom',
    '  entries. Use when stamping domains, last_commit, or Recent Changes after a',
    '  code commit. Optional — Grok-native agents already include the protocol.',
    'metadata:',
    `  svs-version: "${GROK_SKILLS_VERSION}"`,
    '---',
    '',
    '# SVS document (Grok write protocol)',
    '',
    'Claude agents declare `skills: docs-tracker, codebase-knowledge`. Grok custom',
    'types do **not**. The native `.grok/agents/documenter.md` / `domain-updater.md`',
    'already carry the write rules — do **not** Read this skill first. Open it only',
    'when a rule in the agent is missing.',
    '',
    'Companions: `.claude/skills/docs-tracker/SKILL.md` (full matrix),',
    '`.claude/skills/codebase-knowledge/TEMPLATE.md` (new domain).',
    '',
    '## Detect',
    '',
    '```bash',
    'git diff-tree --no-commit-id --name-status -r HEAD',
    '```',
    '',
    'Skip if every path is `.claude/**`, `docs/**`, or `.github/**`.',
    'Map via `.claude/config/domain-mapping.json` (else `general`).',
    '',
    '## Action matrix (documenter)',
    '',
    '| Git | Domain file | Action |',
    '|-----|-------------|--------|',
    '| A | exists | Add Files row + commit row; bump `files_count` |',
    '| A | missing | Write TEMPLATE.md; fill TL;DR from parent "what shipped" |',
    '| M | exists | Prepend commit row; update Files role if it changed |',
    '| M | missing | Treat as A |',
    '| D | exists | Strike `~~path~~`; decrement `files_count` |',
    '| R src→dst | exists | Replace src row; note rename in Attention |',
    '',
    'Edit known anchors on existing files. Do not overwrite a domain with Write.',
    '',
    '## Caps',
    '',
    '- Live domain ≤ 8 KB / ~200 lines. Recent Commits 20. Attention 10. P&S 5.',
    '- Overflow → `<slug>.archive.md` (oldest rows).',
    '- Connections bidirectional (A→B and B←A) or neither.',
    '',
    '## Index',
    '',
    'After every pass set `_index.json` `last_commit` + `generated_at`. Upsert the',
    'touched domain record. Update `_INDEX.md` row if that file exists.',
    '',
    '## Recent Changes (domain-updater)',
    '',
    'Read CLAUDE.md first ~80 lines, then PREPEND:',
    '',
    '```markdown',
    '### YYYY-MM-DD · <branch> · <slug>',
    '<1–3 lines. WHY. No bullets. Do not edit a peer entry. Cap 10 — drop oldest.>',
    '```',
    '',
    '## Wisdom (domain-updater, only if parent named a gotcha)',
    '',
    '```markdown',
    '### [resolved YYYY-MM-DD] <title ≤ 10 words>',
    '',
    '- **Symptom:** <what broke>',
    '- **Cause:** <file / config / assumption>',
    '- **Fix:** <what we changed>',
    '- **Prevention:** <check / skill / test>',
    '```',
    '',
    'Grep first — no duplicates.',
    '',
    '## Do not',
    '',
    '- Git commit.',
    '- Restamp after a docs-only follow-up.',
    '- Invent domain prose.',
    '- Quote secrets.',
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
    '| `ad-creative-audio-licensing.md` | Mine free/CML audio; viral vibe match; mux (no pirate/CID dodge) |',
    '| `ad-platform-detector-optimization.md` | Landing/detector approval (Google/Meta/TikTok) |',
    '| `ad-review-and-traffic-filtering.md` | Ad review + traffic filter / white-black paths |',
    '| `paid-ads-landing-validation.md` | Pre-launch paid landing checks |',
    '| `funnel-content-copy.md` | Scrape/analyze public sales or donation funnels |',
    '| `donation-cause-funnel-adaptation.md` | Adapt cause funnel onto user brand (hard limits) |',
    '| `forensic-funnel-legitimate-rebuild.md` | Dump/forensic → clean upsell/checkout architecture |',
    '| `owned-checkout-gateway-ops.md` | Own merchant API via local `.env` tokens |',
    '| `local-checkout-artifact-analysis.md` | Local HTML/JS/HAR/webhook fixtures |',
    '| `owned-infra-ops.md` / `owned-server-backup.md` | User-owned hosts, SSH, backup, deploy |',
    '| `owned-wordpress-plugin-ops.md` | Search/neutralize WP plugins on owned site (no nulled keys) |',
    '| `own-subscription-api-integration.md` | Wire paid APIs (Kimi/xAI/…) into MCP/apps |',
    '| `local-cli-auth-capture.md` | Observe own CLI for OAuth refresh integration |',
    '| `email-push-marketing-authorization.md` | Owned-list email/push (any niche; no phishing) |',
    '| `defensive-security-review.md` | OWASP/source review of owned code |',
    '| `verify-before-claim.md` | Review/security: fresh tools; no memory-only; execute all || parts |',
    '| `execute-ship-ops.md` | SAFE SHIP vs ATTENTION GATE; push+deploy; COMMIT-FIRST |',
    '| `quality-gate-before-push.md` | Tests red → veto push |',
    '| `cdn-asset-deploy-verify.md` | Curl CDN/launcher markers (browser UA for HTML) |',
    '| `oauth-integration-preflight.md` | redirect_uri + secret check before OAuth plan |',
    '| `remove-ai-watermarks.md` | Inspect/clean Claude/vendor watermarks on own content |',
    '| `multi-instance-main-only.md` | Same cwd = one HEAD; ship only from main |',
    '| `authorized-security-assessment.md` | Active assessment only with ownership/scope |',
    '| `passive-public-security-posture.md` | Passive public OSINT only |',
    '| `post-push-ci-verification.md` | After `git push` — verify Actions for the SHA |',
    '| `cursor-ide-edit-sync.md` | Cursor buffer sync / Save file to continue |',
    '| `react-theme-parity.md` | React UI: CSS-first tokens + check-theme-tokens + both modes |',
    '| `claude-cross-session-messaging.md` | Native Claude SendMessage vs SVS /svs-peers bus |',
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
  const frontendReact = join(PACKAGE_ROOT, 'stacks', 'frontend', 'react', 'skills', name, 'SKILL.md');
  if (existsSync(frontendReact)) return frontendReact;
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
    writeSkillMd(root, 'svs-document', documentSkillBody());
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
