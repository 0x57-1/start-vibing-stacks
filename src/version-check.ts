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
