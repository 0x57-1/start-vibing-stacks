/**
 * Detect CLI binaries and launch Claude / Kimi / Grok.
 */

import { execFileSync, spawnSync } from 'child_process';
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
  try {
    execFileSync(spec.bin, spec.args, {
      cwd: projectDir,
      stdio: 'inherit',
      env: { ...process.env },
    });
    return { ok: true };
  } catch {
    // Non-zero exit is normal when the user quits the TUI
    return { ok: true, message: `${spec.label} session ended.` };
  }
}
