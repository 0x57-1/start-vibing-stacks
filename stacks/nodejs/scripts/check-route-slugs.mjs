#!/usr/bin/env node
/**
 * check-route-slugs.mjs
 *
 * Static validator for Next.js App Router dynamic-segment naming.
 *
 * Catches the "You cannot use different slug names for the same dynamic path"
 * runtime error BEFORE it ships, because `next build` does not catch it.
 *
 * Rule: inside the same parent directory, every bracket-named child
 * (`[id]`, `[...slug]`, `[[...slug]]`) MUST share the same inner identifier.
 *
 * Examples:
 *
 *   OK     app/users/[userId]/page.tsx
 *          app/users/[userId]/posts/page.tsx
 *
 *   FAIL   app/users/[id]/page.tsx
 *          app/users/[userId]/posts/page.tsx     <-- different slug, same parent
 *
 * Usage:
 *   node scripts/check-route-slugs.mjs            # auto-detect ./app and ./src/app
 *   node scripts/check-route-slugs.mjs ./app      # explicit root(s)
 *
 * Exit codes:
 *   0  OK
 *   1  conflicting slug names detected
 *   2  no app directory found (skipped, not an error in non-Next.js repos)
 */

import { readdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve, join, relative } from 'node:path';

const BRACKET_RE = /^\[\[?\.\.\.?([A-Za-z0-9_]+)\]?\]$|^\[([A-Za-z0-9_]+)\]$/;

function extractSlugName(dirName) {
  const m = dirName.match(BRACKET_RE);
  if (!m) return null;
  return m[1] ?? m[2] ?? null;
}

async function listChildDirs(parent) {
  const entries = await readdir(parent, { withFileTypes: true });
  return entries.filter((e) => e.isDirectory()).map((e) => e.name);
}

async function walk(root, conflicts) {
  const children = await listChildDirs(root);

  const bracketChildren = children
    .map((name) => ({ name, slug: extractSlugName(name) }))
    .filter((c) => c.slug !== null);

  if (bracketChildren.length > 1) {
    const slugs = new Set(bracketChildren.map((c) => c.slug));
    if (slugs.size > 1) {
      conflicts.push({
        parent: root,
        children: bracketChildren.map((c) => c.name),
      });
    }
  }

  for (const child of children) {
    await walk(join(root, child), conflicts);
  }
}

async function detectRoots(args) {
  if (args.length > 0) return args.map((p) => resolve(p));
  const candidates = ['app', 'src/app'].map((p) => resolve(process.cwd(), p));
  return candidates.filter((p) => existsSync(p));
}

async function main() {
  const args = process.argv.slice(2);
  const roots = await detectRoots(args);

  if (roots.length === 0) {
    console.log('[route-slugs] no app/ or src/app/ directory found — skipped.');
    process.exit(2);
  }

  const conflicts = [];
  for (const root of roots) {
    const s = await stat(root).catch(() => null);
    if (!s?.isDirectory()) continue;
    await walk(root, conflicts);
  }

  if (conflicts.length > 0) {
    console.error('');
    console.error('  ROUTE SLUG CONFLICT (next.js will crash at runtime)');
    console.error('  ' + '─'.repeat(60));
    console.error('');
    console.error(
      '  Next.js requires that every bracket-named sibling under the SAME'
    );
    console.error(
      '  parent directory uses the SAME inner slug name. Mixing names'
    );
    console.error(
      '  produces: "You cannot use different slug names for the same'
    );
    console.error('  dynamic path".');
    console.error('');
    for (const c of conflicts) {
      const rel = relative(process.cwd(), c.parent) || '.';
      console.error(`  in: ${rel}/`);
      for (const child of c.children) {
        console.error(`    ├── ${child}`);
      }
      console.error('');
    }
    console.error('  Fix: pick ONE slug name per resource (e.g. [userId]) and');
    console.error('       rename every conflicting sibling to match.');
    console.error('');
    process.exit(1);
  }

  const scanned = roots.map((r) => relative(process.cwd(), r) || '.').join(', ');
  console.log(`[route-slugs] OK — no slug conflicts in: ${scanned}`);
  process.exit(0);
}

main().catch((err) => {
  console.error('[route-slugs] script failed:', err);
  process.exit(1);
});
