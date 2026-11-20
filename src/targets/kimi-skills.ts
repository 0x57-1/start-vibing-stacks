/**
 * Kimi skill tree — same set Grok got from Claude, written under
 * `.kimi-code/skills/` (project skills win over extra_skill_dirs).
 *
 * Generated: svs-policy, svs-dev-process, svs-memory-index, svs-document.
 * Curated: GROK_CURATED_SKILL_NAMES copies (never the cybersecurity tree).
 * Memories stay in `.claude/memories/`. The index is pointers only.
 */

import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';
import {
  GROK_CURATED_SKILL_NAMES,
  copyCuratedSkillInto,
  curatedSkillAvailable,
  memoryIndexSkillBody,
  pruneBlockedSkillDirs,
  readPolicyPackBody,
  writeSkillMd,
  type GrokSkillsManagedManifest,
} from './grok-skills.js';
import { OPTIONAL_PRELINE_SKILLS } from './skill-corpus.js';
import { wantsPrelineMoon } from './project-ui.js';

export const KIMI_SKILLS_VERSION = '1.6.0';
export const KIMI_SKILLS_DIR_REL = '.kimi-code/skills';
export const KIMI_SKILLS_MANIFEST_REL = '.kimi-code/skills/.svs-managed.json';

const GENERATED_SKILL_NAMES = [
  'svs-policy',
  'svs-dev-process',
  'svs-memory-index',
  'svs-document',
] as const;

export interface KimiSkillsResult {
  nativeSkillWritten: boolean;
  curatedCopied: number;
  generatedWritten: number;
  version: string;
  skippedReason?: string;
}

function skillsRoot(projectDir: string): string {
  return join(projectDir, KIMI_SKILLS_DIR_REL);
}

function managedPath(projectDir: string): string {
  return join(projectDir, KIMI_SKILLS_MANIFEST_REL);
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

function policySkillBody(): string {
  return [
    '---',
    'name: svs-policy',
    'description: >',
    '  start-vibing-stacks hard limits and always-on policy (ads, donation/person likeness,',
    '  owned infra, email). Use for any paid-ads, funnel, donation, or owned-server task.',
    'metadata:',
    `  svs-version: "${KIMI_SKILLS_VERSION}"`,
    '---',
    '',
    '# start-vibing-stacks policy (Kimi skill)',
    '',
    '> Also see root `AGENTS.md` and `CLAUDE.md`.',
    '> Own skills: `.kimi-code/skills/` (this file, svs-dev-process, svs-document, svs-memory-index, curated copies).',
    '> Stack skills that are not in that set still load from `.claude/skills` via `extra_skill_dirs`.',
    '> Memories stay in `.claude/memories/`. Read `svs-memory-index`, then the linked file.',
    '> Do not copy those memory files into `.kimi-code/skills/`.',
    '',
    readPolicyPackBody(),
    '',
  ].join('\n');
}

function devProcessSkillBody(): string {
  return [
    '---',
    'name: svs-dev-process',
    'description: >',
    '  Development workflow for Kimi Code. Read and execute agents from .claude/agents/,',
    '  mandatory documenter then domain-updater after source edits, scope.ts commits,',
    '  stop-validator. Use at task start, before commit, or when unsure which agent to run.',
    'metadata:',
    `  svs-version: "${KIMI_SKILLS_VERSION}"`,
    '---',
    '',
    '# Development process (Kimi)',
    '',
    'Kimi does not spawn Grok subagents. **Read** `.claude/agents/<name>.md`',
    '(also on `extra_agent_dirs`) and do the steps. After source edits, run',
    '`documenter`, then `domain-updater`. Stop blocks via `svs-bridge` until',
    'finalize completes (`decision:block` / exit 2).',
    '',
    '## Flow (do not reorder / skip)',
    '',
    '1. **Research** — a short lookup is this turn. Read `research-web` only',
    '   for a wide search.',
    '2. **Branch** — `feature/` | `fix/` | `refactor/` (avoid committing straight to `main`)',
    '3. **Implement** — keep edits scoped; hooks may run plan-gate + multi-instance locks',
    '4. **Security-sensitive** → `security-auditor` + `security-baseline` (named CVEs: `cve-watchlist.md` on lockfile hit)',
    '5. **Commit code** → `commit-manager` → `scope.ts commit` HEREDOC (never `git add -A`; no `--push` yet)',
    '6. **Document** → Read and execute `documenter` (domains + Recent Changes + Attention crumb)',
    '7. **Wisdom** → Read and execute `domain-updater` after documenter',
    '8. **Docs commit + push** if dirty → HEREDOC `"docs: …"` + `--push` on main',
    '9. **Stop** — bridge + stop-validator: clean tree + CLAUDE this session + index ≈ HEAD + not ahead of origin',
    '',
    'Skill `svs-finalize` is the checklist. Do not reorder 5→8.',
    '',
    '## FORBIDDEN',
    '',
    '| Skip | Why |',
    '|------|-----|',
    '| documenter after source edits | Next session loses memory; Stop BLOCKS |',
    '| documenter **before** code commit | Index stamps wrong SHA |',
    '| Push the code commit before documenter | Index stamps wrong SHA |',
    '| `git add -A` | Bundles peer files |',
    '',
    '## Agents (Read — do not invent a shorter path)',
    '',
    '| Agent | When |',
    '|-------|------|',
    '| `research-web` | New feature |',
    '| `security-auditor` | Auth/API — CWE veto; `cve-watchlist.md` on lockfile hit |',
    '| `tester` | New logic |',
    '| `commit-manager` | Scoped HEREDOC commit / push after the docs commit |',
    '| `documenter` | **After** code commit |',
    '| `domain-updater` | After documenter |',
    '| `claude-md-compactor` | CLAUDE.md over ~20 KB |',
    '',
    'Paths: `.claude/agents/<name>.md`.',
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
    '# docs commit on main: add --push. never git add -A / git add .',
    '```',
    '',
    '## Skills on Kimi',
    '',
    'Curated + SVS skills live under `.kimi-code/skills/` (same names Grok uses).',
    'A stack skill that is not in that set still loads from `.claude/skills`.',
    'When the same name exists in both, the `.kimi-code/skills` copy wins.',
    'Load `svs-finalize` before claiming done after source edits.',
    'For ads/infra detail, read `svs-memory-index` then the linked `.claude/memories/*.md` file.',
    '',
  ].join('\n');
}

function documentSkillBody(): string {
  return [
    '---',
    'name: svs-document',
    'description: >',
    '  Write protocol for Kimi documenter and domain-updater. File-to-domain mapping,',
    '  action matrix, _index.json stamp, CLAUDE.md Recent Changes prepend, wisdom',
    '  entries. Use when stamping domains, last_commit, or Recent Changes after a',
    '  code commit.',
    'metadata:',
    `  svs-version: "${KIMI_SKILLS_VERSION}"`,
    '---',
    '',
    '# SVS document (Kimi write protocol)',
    '',
    'Read `.claude/agents/documenter.md`, then this matrix. After that, Read',
    '`.claude/agents/domain-updater.md` and run it. Do not git commit from here.',
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
    '## Recent Changes',
    '',
    'Read CLAUDE.md first ~80 lines only. PREPEND. No HOW rewrite. No AGENTS.md. No wc:',
    '',
    '```markdown',
    '### YYYY-MM-DD · <branch> · <slug>',
    '<1–3 lines. WHY. No bullets. Do not edit a peer entry. Cap 10 — drop oldest.>',
    '```',
    '',
    '## Wisdom (domain-updater)',
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

export function kimiSkillsNeedsUpdate(projectDir: string): {
  nativeMissing: boolean;
  outdated: boolean;
  curatedMissing: number;
} {
  const root = skillsRoot(projectDir);
  const nativeMissing = !existsSync(join(root, 'svs-policy', 'SKILL.md'));
  const managed = readManaged(projectDir);
  let outdated = !managed || managed.version !== KIMI_SKILLS_VERSION;
  if (!outdated) {
    for (const g of GENERATED_SKILL_NAMES) {
      if (!existsSync(join(root, g, 'SKILL.md'))) {
        outdated = true;
        break;
      }
    }
  }

  let curatedMissing = 0;
  for (const name of GROK_CURATED_SKILL_NAMES) {
    const dest = join(root, name, 'SKILL.md');
    if (OPTIONAL_PRELINE_SKILLS.has(name) && !wantsPrelineMoon(projectDir) && !existsSync(dest)) {
      continue;
    }
    if (curatedSkillAvailable(projectDir, name) && !existsSync(dest)) curatedMissing += 1;
  }

  return {
    nativeMissing,
    outdated: outdated || curatedMissing > 0,
    curatedMissing,
  };
}

export function exportKimiSkills(
  projectDir: string,
  opts: { force?: boolean } = {}
): KimiSkillsResult {
  const need = kimiSkillsNeedsUpdate(projectDir);
  const shouldWrite =
    opts.force || need.nativeMissing || need.outdated || need.curatedMissing > 0;

  if (!shouldWrite) {
    return {
      nativeSkillWritten: false,
      curatedCopied: 0,
      generatedWritten: 0,
      version: KIMI_SKILLS_VERSION,
      skippedReason: 'Kimi skills current',
    };
  }

  const root = skillsRoot(projectDir);
  mkdirSync(root, { recursive: true });
  pruneBlockedSkillDirs(root);

  const prev = readManaged(projectDir);
  const nextSet = new Set<string>([...GENERATED_SKILL_NAMES, ...GROK_CURATED_SKILL_NAMES]);
  if (prev) {
    const generatedSet = new Set<string>(GENERATED_SKILL_NAMES);
    for (const name of prev.skills) {
      if (generatedSet.has(name) && !nextSet.has(name)) {
        const dir = join(root, name);
        if (existsSync(dir)) rmSync(dir, { recursive: true, force: true });
      }
    }
  }

  writeSkillMd(root, 'svs-policy', policySkillBody());
  writeSkillMd(root, 'svs-dev-process', devProcessSkillBody());
  writeSkillMd(root, 'svs-memory-index', memoryIndexSkillBody(KIMI_SKILLS_VERSION));
  writeSkillMd(root, 'svs-document', documentSkillBody());

  const managedNames: string[] = [...GENERATED_SKILL_NAMES];
  let curatedCopied = 0;
  for (const name of GROK_CURATED_SKILL_NAMES) {
    const destMd = join(root, name, 'SKILL.md');
    const existed = existsSync(destMd);
    if (copyCuratedSkillInto(projectDir, name, root)) {
      if (!existed && existsSync(destMd)) curatedCopied += 1;
      managedNames.push(name);
    }
  }

  const manifest: GrokSkillsManagedManifest = {
    version: KIMI_SKILLS_VERSION,
    skills: managedNames,
  };
  writeFileSync(managedPath(projectDir), JSON.stringify(manifest, null, 2) + '\n');

  return {
    nativeSkillWritten: true,
    curatedCopied,
    generatedWritten: GENERATED_SKILL_NAMES.length,
    version: KIMI_SKILLS_VERSION,
  };
}
