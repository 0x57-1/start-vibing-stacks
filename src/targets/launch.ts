/**
 * Detect CLI binaries and launch Claude / Kimi / Grok.
 */

import { execFileSync, spawnSync } from 'child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { homedir } from 'os';
import { dirname, join, resolve } from 'path';
import type { TargetId, TargetLaunchSpec } from './types.js';
import { LAUNCH_SPECS } from './types.js';

export function resolveLaunchSpec(id: TargetId): TargetLaunchSpec {
  const spec = LAUNCH_SPECS.find((s) => s.id === id);
  if (!spec) throw new Error(`Unknown target: ${id}`);
  return spec;
}

/** True if `bin` is on PATH. */
export function isBinaryOnPath(bin: string): boolean {
  try {
    if (process.platform === 'win32') {
      const r = spawnSync('where.exe', [bin], { encoding: 'utf8' });
      return r.status === 0 && !!(r.stdout || '').trim();
    }
    const w = spawnSync('which', [bin], { encoding: 'utf8' });
    return w.status === 0 && !!(w.stdout || '').trim();
  } catch {
    return false;
  }
}

export function availableLaunchTargets(): TargetLaunchSpec[] {
  return LAUNCH_SPECS.filter((s) => isBinaryOnPath(s.bin));
}

/** Menu label includes the real argv (Grok: `--always-approve --trust`). */
export function launchMenuLabel(spec: TargetLaunchSpec): string {
  const flags = spec.args.length ? ` ${spec.args.join(' ')}` : '';
  return `Launch ${spec.label}${flags}`;
}

export function formatLaunchCommand(spec: TargetLaunchSpec): string {
  return [spec.bin, ...spec.args].join(' ');
}

/**
 * Persist Grok folder trust so hooks/MCP/LSP run even if the user later starts
 * bare `grok` (Launch still passes `--trust` for the session).
 * Store: ~/.grok/trusted_folders.toml — same file `/hooks-trust` writes.
 */
export function ensureGrokFolderTrust(projectDir: string): { wrote: boolean; path: string } {
  if (process.env['GROK_FOLDER_TRUST'] === '0') {
    return { wrote: false, path: '' };
  }
  const home = process.env['HOME'] || process.env['USERPROFILE'] || homedir();
  const path = join(home, '.grok', 'trusted_folders.toml');
  const abs = resolve(projectDir);
  const header = `[folders."${abs}"]`;
  const now = Math.floor(Date.now() / 1000);
  mkdirSync(dirname(path), { recursive: true });
  let raw = '';
  if (existsSync(path)) {
    try {
      raw = readFileSync(path, 'utf8');
    } catch {
      raw = '';
    }
  }
  const escaped = abs.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const blockRe = new RegExp(
    `\\[folders\\."${escaped}"\\]\\n(?:trusted\\s*=\\s*\\w+\\n)?(?:decided_at\\s*=\\s*\\d+\\n)?`,
    'm'
  );
  if (blockRe.test(raw) && /trusted\s*=\s*true/.test(raw.match(blockRe)?.[0] ?? '')) {
    return { wrote: false, path };
  }
  const block = `${header}\ntrusted = true\ndecided_at = ${now}\n`;
  const next = blockRe.test(raw)
    ? raw.replace(blockRe, block + '\n')
    : `${raw.replace(/\s*$/, '')}\n\n${block}\n`;
  writeFileSync(path, next.replace(/^\n+/, ''));
  return { wrote: true, path };
}

/**
 * Run the target CLI interactively (stdio inherit). Returns when the process exits.
 */
export function launchTarget(projectDir: string, id: TargetId): { ok: boolean; message?: string } {
  const spec = resolveLaunchSpec(id);
  if (!isBinaryOnPath(spec.bin)) {
    return {
      ok: false,
      message: `${spec.label} CLI (\`${spec.bin}\`) not found on PATH. Install it, then retry.`,
    };
  }
  if (id === 'grok') {
    ensureGrokFolderTrust(projectDir);
  }
  const env = { ...process.env };
  if (id === 'grok' && env['GROK_SUBAGENTS'] === undefined) {
    env['GROK_SUBAGENTS'] = '1';
  }
  try {
    execFileSync(spec.bin, spec.args, {
      cwd: projectDir,
      stdio: 'inherit',
      env,
    });
    return { ok: true };
  } catch {
    // Non-zero exit is normal when the user quits the TUI
    return { ok: true, message: `${spec.label} session ended.` };
  }
}
