#!/usr/bin/env node
/**
 * Stop Validator Hook — Start Vibing Stacks (Universal)
 *
 * Reads active-project.json to determine stack-specific validations.
 * Blocks task completion if:
 * 1. Branch != main (work must be merged)
 * 2. Git tree not clean
 * 3. CLAUDE.md not updated
 * 4. CLAUDE.md missing required sections
 * 5. CLAUDE.md exceeds 40k chars
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

const PROJECT_DIR = process.env['CLAUDE_PROJECT_DIR'] || process.cwd();
const CLAUDE_MD = join(PROJECT_DIR, 'CLAUDE.md');
const ACTIVE_PROJECT = join(PROJECT_DIR, '.claude', 'config', 'active-project.json');
const MAX_CHARS = 40000;

// Load stack info
let stackId = 'unknown';
try {
  if (existsSync(ACTIVE_PROJECT)) {
    const config = JSON.parse(readFileSync(ACTIVE_PROJECT, 'utf8'));
    stackId = config.stack || 'unknown';
  }
} catch {}

// Source extensions per stack
const STACK_EXTENSIONS: Record<string, Set<string>> = {
  php: new Set(['.php', '.blade.php', '.twig']),
  nodejs: new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs']),
  python: new Set(['.py']),
  go: new Set(['.go']),
  rust: new Set(['.rs']),
};

const sourceExtensions = STACK_EXTENSIONS[stackId] || new Set(['.ts', '.js', '.php', '.py']);

interface HookResult {
  continue: boolean;
  decision: 'approve' | 'block';
  reason: string;
}

function cmd(command: string): string {
  try {
    return execSync(command, { cwd: PROJECT_DIR, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
  } catch {
    return '';
  }
}

function getBranch(): string {
  return cmd('git rev-parse --abbrev-ref HEAD') || 'unknown';
}

function getModifiedFiles(): string[] {
  const staged = cmd('git diff --name-only --cached').split('\n').filter(Boolean);
  const unstaged = cmd('git diff --name-only').split('\n').filter(Boolean);
  const untracked = cmd('git ls-files --others --exclude-standard').split('\n').filter(Boolean);
  return [...new Set([...staged, ...unstaged, ...untracked])];
}

function validate(): HookResult {
  const branch = getBranch();
  const isMain = branch === 'main' || branch === 'master';
  const modified = getModifiedFiles();
  const isClean = modified.length === 0;

  // 1. Must be on main with clean tree
  if (!isMain && modified.length > 0) {
    return {
      continue: true,
      decision: 'block',
      reason: `BLOCKED: On branch '${branch}' with ${modified.length} modified files.\n\nComplete git workflow:\n1. git add -A\n2. git commit -m "type: description"\n3. git checkout main\n4. git merge ${branch}\n5. git push origin main\n6. git branch -d ${branch}`,
    };
  }

  if (!isMain) {
    return {
      continue: true,
      decision: 'block',
      reason: `BLOCKED: On branch '${branch}'. Switch to main:\n1. git checkout main\n2. git merge ${branch}\n3. git push origin main`,
    };
  }

  if (!isClean) {
    return {
      continue: true,
      decision: 'block',
      reason: `BLOCKED: ${modified.length} uncommitted files:\n${modified.slice(0, 10).map(f => `  - ${f}`).join('\n')}\n\nCommit or stash before completing.`,
    };
  }

  // 2. CLAUDE.md must exist
  if (!existsSync(CLAUDE_MD)) {
    return {
      continue: true,
      decision: 'block',
      reason: 'BLOCKED: CLAUDE.md not found. Create it with required sections.',
    };
  }

  const content = readFileSync(CLAUDE_MD, 'utf8');

  // 3. Size check
  if (content.length > MAX_CHARS) {
    return {
      continue: true,
      decision: 'block',
      reason: `BLOCKED: CLAUDE.md is ${content.length} chars (max ${MAX_CHARS}). Run claude-md-compactor agent.`,
    };
  }

  // 4. Required sections
  const required = [
    { pattern: /^# .+/m, name: 'Project Title (H1)' },
    { pattern: /^## Last Change/m, name: 'Last Change' },
    { pattern: /^## Stack/m, name: 'Stack' },
  ];

  const missing = required.filter(r => !r.pattern.test(content)).map(r => r.name);
  if (missing.length > 0) {
    return {
      continue: true,
      decision: 'block',
      reason: `BLOCKED: CLAUDE.md missing sections: ${missing.join(', ')}`,
    };
  }

  // All good
  return {
    continue: false,
    decision: 'approve',
    reason: `ALL CHECKS PASSED ✅\nStack: ${stackId}\nBranch: ${branch}\nTree: Clean`,
  };
}

async function main(): Promise<void> {
  // Read stdin (hook input)
  let hookInput: any = {};
  try {
    const chunks: string[] = [];
    process.stdin.setEncoding('utf8');
    const timeout = setTimeout(() => process.stdin.destroy(), 1000);
    for await (const chunk of process.stdin) {
      chunks.push(chunk);
    }
    clearTimeout(timeout);
    hookInput = JSON.parse(chunks.join('') || '{}');
  } catch {}

  // Prevent loop
  if (hookInput.stop_hook_active) {
    console.log(JSON.stringify({ continue: false, decision: 'approve', reason: 'Cycle detected' }));
    process.exit(0);
  }

  const result = validate();
  console.log(JSON.stringify(result));
  process.exit(0);
}

main().catch(() => {
  console.log(JSON.stringify({ continue: false, decision: 'approve', reason: 'Hook error' }));
  process.exit(0);
});
