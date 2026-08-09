#!/usr/bin/env node
// @sv-version: 1.0.0
/**
 * OPTIONAL user-global UserPromptSubmit (`~/.claude/hooks/user-prompt-submit.ts`).
 *
 * Copy this file over a legacy global UPS that injects "English only" / Last Change /
 * UI agents / Playwright on every prompt. When the project has SVS UPS (`@sv-version`),
 * this hook no-ops so Claude does not get two conflicting systemMessages.
 *
 * Install:
 *   cp stacks/_shared/config/user-prompt-submit.global.ts ~/.claude/hooks/user-prompt-submit.ts
 */

import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

async function readStdinWithTimeout(timeoutMs: number): Promise<string> {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      process.stdin.destroy();
      resolve('{}');
    }, timeoutMs);

    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk: string) => {
      data += chunk;
    });
    process.stdin.on('end', () => {
      clearTimeout(timeout);
      resolve(data || '{}');
    });
    process.stdin.on('error', () => {
      clearTimeout(timeout);
      resolve('{}');
    });

    if (process.stdin.readableEnded) {
      clearTimeout(timeout);
      resolve('{}');
    }
  });
}

function projectHasSvsUps(projectDir: string): boolean {
  const hook = join(projectDir, '.claude', 'hooks', 'user-prompt-submit.ts');
  if (!existsSync(hook)) return false;
  try {
    return /@sv-version:\s*\d+\.\d+\.\d+/.test(readFileSync(hook, 'utf8'));
  } catch {
    return false;
  }
}

async function main(): Promise<void> {
  let hookInput: {
    user_prompt?: string;
    prompt?: string;
    cwd?: string;
    CLAUDE_PROJECT_DIR?: string;
  } = {};
  try {
    const stdin = await readStdinWithTimeout(1000);
    if (stdin && stdin.trim()) {
      hookInput = JSON.parse(stdin);
    }
  } catch {
    hookInput = {};
  }

  const projectDir =
    process.env['CLAUDE_PROJECT_DIR'] ||
    hookInput.CLAUDE_PROJECT_DIR ||
    hookInput.cwd ||
    process.cwd();

  if (projectHasSvsUps(projectDir)) {
    console.log(JSON.stringify({ continue: true }));
    process.exit(0);
  }

  const prompt = hookInput.user_prompt || hookInput.prompt || '';
  if (!prompt.trim()) {
    console.log(JSON.stringify({ continue: true }));
    process.exit(0);
  }

  const systemMessage =
    `TASK WORKFLOW (global fallback — install start-vibing-stacks for full hooks):\n` +
    `1. Prefer evidence (Read/Grep/Bash) over memory.\n` +
    `2. On ship/urgent/production: push + verify CI; do not wait for a second ask.\n` +
    `3. On status checks (“foi publicado?”): git/gh/curl only — no UI agents / Playwright.`;

  console.log(JSON.stringify({ continue: true, systemMessage }));
  process.exit(0);
}

main().catch(() => {
  console.log(JSON.stringify({ continue: true }));
  process.exit(0);
});
