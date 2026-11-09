/**
 * npm registry freshness for the running CLI (npx cache often sticks on old builds).
 */

export function compareSemver(a: string, b: string): number {
  const pa = a.replace(/^v/, '').split('.').map((x) => parseInt(x, 10) || 0);
  const pb = b.replace(/^v/, '').split('.').map((x) => parseInt(x, 10) || 0);
  const n = Math.max(pa.length, pb.length);
  for (let i = 0; i < n; i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d !== 0) return d < 0 ? -1 : 1;
  }
  return 0;
}

/** True when `candidate` is strictly newer than `current`. */
export function isSemverNewer(candidate: string, current: string): boolean {
  return compareSemver(candidate, current) > 0;
}

/**
 * Fetch `latest` from the npm registry. Returns null on timeout/network/parse errors.
 */
export async function fetchNpmLatestVersion(
  packageName: string,
  timeoutMs = 3000
): Promise<string | null> {
  const url = `https://registry.npmjs.org/${encodeURIComponent(packageName)}/latest`;
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        signal: ctrl.signal,
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      });
      if (!res.ok) return null;
      const body = (await res.json()) as { version?: unknown };
      return typeof body.version === 'string' ? body.version : null;
    } finally {
      clearTimeout(timer);
    }
  } catch {
    return null;
  }
}

export interface CliFreshness {
  running: string;
  latest: string | null;
  stale: boolean;
}

export async function checkCliFreshness(
  runningVersion: string,
  packageName = 'start-vibing-stacks'
): Promise<CliFreshness> {
  const latest = await fetchNpmLatestVersion(packageName);
  const stale = Boolean(latest && isSemverNewer(latest, runningVersion));
  return { running: runningVersion, latest, stale };
}

/**
 * `npx pkg@latest` keeps the extracted tree under `~/.npm/_npx` keyed by the
 * spec string, so a later publish still runs the old binary. Re-run the
 * registry version (a new cache key) with prefer-online. Do not wipe the
 * whole npm cache. `SVS_REEXEC=1` stops a loop.
 */
export async function reexecIfRegistryIsNewer(running: string, argv: string[]): Promise<void> {
  if (process.env['SVS_REEXEC'] === '1') return;
  const fresh = await checkCliFreshness(running);
  if (!fresh.stale || !fresh.latest) return;
  const { spawnSync } = await import('node:child_process');
  process.stderr.write(
    `npx is running ${running}. Registry latest is ${fresh.latest}. Re-running that version (prefer-online).\n` +
      'If the tarball 404s, the registry CDN is still warming (~5 min). Retry the same command.\n'
  );
  const child = spawnSync('npx', ['--yes', `start-vibing-stacks@${fresh.latest}`, ...argv], {
    stdio: 'inherit',
    env: {
      ...process.env,
      SVS_REEXEC: '1',
      npm_config_prefer_online: 'true',
    },
  });
  if (child.error) {
    process.stderr.write(`Could not re-run npx (${child.error.message}). Continuing with ${running}.\n`);
    return;
  }
  process.exit(child.status === null ? 1 : child.status);
}
