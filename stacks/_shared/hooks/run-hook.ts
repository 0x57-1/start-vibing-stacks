#!/usr/bin/env node
// @sv-version: 1.0.0
/**
 * Universal Hook Runner — Start Vibing Stacks
 *
 * Runtime fallbacks: bun → npx tsx
 * Usage: npx tsx run-hook.ts <hook-name>
 */

import { spawnSync } from 'child_process';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const HOOKS_DIR = dirname(fileURLToPath(import.meta.url));

function checkRuntime(cmd: string): boolean {
  try {
    const result = spawnSync(cmd, ['--version'], {
      stdio: 'pipe', shell: true, timeout: 5000,
    });
    return result.status === 0;
  } catch { return false; }
}

function runWithRuntime(cmd: string, args: string[], input: string) {
  try {
    const result = spawnSync(cmd, args, {
      input, shell: true, stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 30000, encoding: 'utf8',
    });
    return {
      exitCode: result.status ?? 1,
      output: result.stdout?.toString() || '',
      error: result.stderr?.toString() || undefined,
    };
  } catch (err) {
    return { exitCode: 1, output: '', error: String(err) };
  }
}

async function readStdin(timeoutMs: number): Promise<string> {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => { process.stdin.destroy(); resolve('{}'); }, timeoutMs);
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk: string) => { data += chunk; });
    process.stdin.on('end', () => { clearTimeout(timeout); resolve(data || '{}'); });
    process.stdin.on('error', () => { clearTimeout(timeout); resolve('{}'); });
    if (process.stdin.readableEnded) { clearTimeout(timeout); resolve('{}'); }
  });
}

async function main(): Promise<void> {
  const hookName = process.argv[2];
  if (!hookName) {
    console.error('[run-hook] Usage: npx tsx run-hook.ts <hook-name>');
    process.exit(1);
  }

  const tsPath = join(HOOKS_DIR, `${hookName}.ts`);
  if (!existsSync(tsPath)) {
    console.error(`[run-hook] Hook not found: ${tsPath}`);
    process.stdout.write(JSON.stringify({ decision: 'approve', continue: true, reason: 'Hook not found' }));
    process.exit(0);
  }

  const stdinData = await readStdin(2000);
  const runtimes = [
    { name: 'bun', cmd: 'bun' },
    { name: 'npx-tsx', cmd: 'npx tsx' },
  ];

  for (const runtime of runtimes) {
    if (!checkRuntime(runtime.cmd.split(' ')[0])) continue;

    const result = runWithRuntime(runtime.cmd, [tsPath], stdinData);
    process.stdout.write(result.output);
    if (result.error) process.stderr.write(result.error);
    process.exit(result.exitCode);
  }

  console.error('[run-hook] No runtime available');
  process.stdout.write(JSON.stringify({ decision: 'approve', continue: true, reason: 'No runtime available' }));
  process.exit(0);
}

main().catch(() => {
  process.stdout.write(JSON.stringify({ decision: 'approve', continue: true, reason: 'Hook error' }));
  process.exit(0);
});
