// @sv-version: 1.0.0
/**
 * Project brain helpers — durable in-flight state (committed markdown).
 * Fail-open everywhere: never throw into hooks.
 */

import { execSync } from 'child_process';
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'fs';
import { join } from 'path';
import { randomBytes } from 'crypto';

export function brainRoot(projectDir: string): string {
  return join(projectDir, '.claude', 'brain');
}

export function ensureBrainDirs(projectDir: string): void {
  const root = brainRoot(projectDir);
  for (const d of [root, join(root, 'tasks'), join(root, 'journal')]) {
    try {
      mkdirSync(d, { recursive: true });
    } catch {
      /* ignore */
    }
  }
}

function writeAtomic(path: string, content: string): void {
  const tmp = `${path}.${process.pid}.${randomBytes(4).toString('hex')}.tmp`;
  writeFileSync(tmp, content);
  renameSync(tmp, path);
}

function branchSlug(branch: string | undefined): string {
  const b = (branch || 'unknown').trim() || 'unknown';
  return b.replace(/[^\w.-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || 'unknown';
}

export function taskFilePath(projectDir: string, branch: string | undefined): string {
  return join(brainRoot(projectDir), 'tasks', `${branchSlug(branch)}.md`);
}

function cmd(projectDir: string, command: string): string {
  try {
    return execSync(command, {
      cwd: projectDir,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 3000,
    }).trim();
  } catch {
    return '';
  }
}

function latestRecentChangeLine(projectDir: string): string {
  try {
    const md = readFileSync(join(projectDir, 'CLAUDE.md'), 'utf8');
    const m = md.match(/^###\s+(\d{4}-\d{2}-\d{2}\s+·\s+[^\n]+)/m);
    if (!m) return '';
    const start = md.indexOf(m[0]);
    const rest = md.slice(start + m[0].length);
    const next = rest.split('\n').find((l) => l.trim() && !l.startsWith('#'));
    return `${m[1]}${next ? ` — ${next.trim().slice(0, 100)}` : ''}`;
  } catch {
    return '';
  }
}

function readTaskNextStep(projectDir: string, branch: string | undefined): string {
  const p = taskFilePath(projectDir, branch);
  if (!existsSync(p)) return '';
  try {
    const body = readFileSync(p, 'utf8');
    const m = body.match(/^##\s+Next step\s*\n+([^\n#]+)/m);
    return m?.[1]?.trim().slice(0, 200) || '';
  } catch {
    return '';
  }
}

function domainsStale(projectDir: string): boolean {
  const idx = join(projectDir, '.claude', 'skills', 'codebase-knowledge', '_index.json');
  if (!existsSync(idx)) return false;
  try {
    const j = JSON.parse(readFileSync(idx, 'utf8')) as { last_commit?: string };
    if (!j.last_commit) return false;
    const head = cmd(projectDir, 'git rev-parse --short HEAD');
    return !!head && !j.last_commit.startsWith(head) && !head.startsWith(j.last_commit);
  } catch {
    return false;
  }
}

/**
 * Capped resume brief for SessionStart (startup | resume | compact).
 */
export function buildResumeBrief(
  projectDir: string,
  opts: {
    source?: string;
    branch?: string;
    target?: string;
    sessionShort?: string;
  } = {}
): string {
  ensureBrainDirs(projectDir);
  const source = (opts.source || 'startup').toLowerCase();
  const branch = opts.branch || cmd(projectDir, 'git branch --show-current') || 'unknown';
  const dirty = cmd(projectDir, 'git status --porcelain');
  const dirtyCount = dirty ? dirty.split('\n').filter(Boolean).length : 0;
  const recent = latestRecentChangeLine(projectDir);
  const next = readTaskNextStep(projectDir, branch);
  const stale = domainsStale(projectDir);
  const taskPath = `.claude/brain/tasks/${branchSlug(branch)}.md`;

  const lines: string[] = [];
  const lead =
    source === 'compact'
      ? 'PROJECT BRAIN (post-compact) — context was compressed; restore from durable state:'
      : source === 'resume'
        ? 'PROJECT BRAIN (resume) — continuing prior work:'
        : 'PROJECT BRAIN — durable project continuity:';

  lines.push(lead);
  lines.push(`  branch: ${branch}`);
  if (opts.target) lines.push(`  target: ${opts.target}`);
  if (opts.sessionShort) lines.push(`  session: ${opts.sessionShort}`);
  if (recent) lines.push(`  CLAUDE.md: ${recent}`);
  lines.push(`  dirty files: ${dirtyCount}`);
  if (stale) lines.push('  domains: STALE (_index.json last_commit ≠ HEAD) — refresh via documenter');
  if (next) {
    lines.push(`  Next step: ${next}`);
  } else {
    lines.push(`  Next step: (none — create ${taskPath} from .claude/brain/TEMPLATE.md if needed)`);
  }
  lines.push('  Prefer brain + domains over re-exploring. Do not dump full skill trees.');
  return lines.join('\n').slice(0, 1200);
}

export function appendJournalEntry(
  projectDir: string,
  entry: {
    target?: string;
    sessionId?: string;
    branch?: string;
    filesTouched?: string[];
    startedAt?: string;
  }
): void {
  try {
    ensureBrainDirs(projectDir);
    const now = new Date();
    const ym = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
    const path = join(brainRoot(projectDir), 'journal', `${ym}.md`);
    if (!existsSync(path)) {
      writeAtomic(path, `# Brain journal ${ym}\n\n`);
    }
    const short = (entry.sessionId || '').slice(0, 8) || '????????';
    const files = (entry.filesTouched || []).slice(0, 8);
    // Only accept ISO timestamps we wrote ourselves (avoid shell injection).
    const sinceIso =
      entry.startedAt && /^\d{4}-\d{2}-\d{2}T/.test(entry.startedAt) ? entry.startedAt : '';
    const commits = (
      sinceIso
        ? cmd(projectDir, `git log --oneline --since=${JSON.stringify(sinceIso)} -n 5`)
        : cmd(projectDir, 'git log --oneline -n 5')
    )
      .split('\n')
      .filter(Boolean);
    const block = [
      `### ${now.toISOString()} · ${entry.target || 'unknown'} · ${short}`,
      `- branch: ${entry.branch || 'unknown'}`,
      `- filesTouched: ${files.length}${files.length ? ` (${files.join(', ')})` : ''}`,
      commits.length ? `- commits: ${commits.join('; ')}` : '- commits: (none detected)',
      '',
    ].join('\n');
    const prev = readFileSync(path, 'utf8');
    writeAtomic(path, prev.trimEnd() + '\n\n' + block);
  } catch {
    /* fail-open */
  }
}

/** Stamp task file before compaction (PreCompact). */
export function stampTaskBeforeCompact(
  projectDir: string,
  opts: { branch?: string; target?: string; sessionId?: string; note?: string } = {}
): void {
  try {
    ensureBrainDirs(projectDir);
    const branch = opts.branch || cmd(projectDir, 'git branch --show-current') || 'unknown';
    const path = taskFilePath(projectDir, branch);
    const stamp = new Date().toISOString();
    const by = `${opts.target || 'unknown'}/${(opts.sessionId || '').slice(0, 8) || '????????'}`;
    if (!existsSync(path)) {
      writeAtomic(
        path,
        [
          '---',
          `task: ${branchSlug(branch)}`,
          `branch: ${branch}`,
          'status: in-progress',
          `updated: ${stamp}`,
          `updated_by: ${by}`,
          'domains: []',
          '---',
          '',
          '## Goal',
          '',
          '(auto-created on PreCompact — fill in)',
          '',
          '## Next step',
          '',
          opts.note || 'Resume after compact; re-read domain index and continue the open plan.',
          '',
        ].join('\n')
      );
      return;
    }
    let body = readFileSync(path, 'utf8');
    body = body.replace(/^updated:\s*.*$/m, `updated: ${stamp}`);
    if (/^updated_by:\s*/m.test(body)) {
      body = body.replace(/^updated_by:\s*.*$/m, `updated_by: ${by}`);
    } else {
      body = body.replace(/^---\n/, `---\nupdated_by: ${by}\n`);
    }
    if (!/^##\s+Next step/m.test(body)) {
      body = body.trimEnd() + `\n\n## Next step\n\n${opts.note || 'Resume after compact.'}\n`;
    }
    writeAtomic(path, body);
  } catch {
    /* fail-open */
  }
}

export function brainTemplateBody(): string {
  return [
    '---',
    'task: example-task',
    'branch: feature/example',
    'status: planned',
    'started: YYYY-MM-DD',
    'updated: YYYY-MM-DDTHH:MM:SSZ',
    'updated_by: claude/xxxxxxxx',
    'domains: []',
    '---',
    '',
    '## Goal',
    '',
    '1–3 lines: why this change exists.',
    '',
    '## Plan',
    '',
    '- [ ] step',
    '',
    '## Decisions',
    '',
    '- (optional) link docs/decisions/NNNN-slug.md',
    '',
    '## Next step',
    '',
    'One sentence the next session should do first.',
    '',
    '## Open questions',
    '',
    '- ',
    '',
  ].join('\n');
}

export function brainReadmeBody(): string {
  return [
    '# Project brain',
    '',
    'Durable **in-flight** project state for Claude / Kimi / Grok.',
    'Not the same as `.claude/state/` (live peers — gitignored, short-lived).',
    '',
    '| Path | Role |',
    '|------|------|',
    '| `tasks/<branch>.md` | Current work unit (shard by git branch) |',
    '| `journal/YYYY-MM.md` | Append-only session digests (hooks) |',
    '| `TEMPLATE.md` | Copy when starting a task |',
    '',
    'SessionStart injects a short brief from the current branch task file.',
    'PreCompact stamps `updated_by` so post-compact resume still has a Next step.',
    '',
    'Settled knowledge stays in `codebase-knowledge/domains/` and `docs/decisions/`.',
    '',
  ].join('\n');
}
