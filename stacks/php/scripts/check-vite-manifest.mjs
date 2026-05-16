#!/usr/bin/env node
/**
 * check-vite-manifest.mjs
 *
 * Static validator for Vite + laravel-vite-plugin builds that catches the
 * "entry chunk collides with manualChunks group" bug in Inertia/React apps.
 *
 * Production post-mortem 2026-05: a `vite.config.js` "perf" change added
 *   manualChunks(id) { if (/Auth\//.test(id)) return 'pages-auth' }
 * while `laravel.input[]` already listed `Pages/.../HttpErrorPage.jsx`
 * (referenced directly via `@vite()` in `app.blade.php` for the error layout).
 * Rollup/Rolldown silently dropped the manualChunks group, kept only the
 * entry, and the `import.meta.glob` resolve-map in `resolvePageComponent`
 * ended up pointing every sibling page (Login, Register, ForgotPassword) at
 * the same single-module entry chunk. Server sent `component: 'Auth/Login'`,
 * browser rendered HttpErrorPage. HTTP 200. Empty Laravel logs.
 *
 * Rules enforced (all silent failures in Rollup/Rolldown by default):
 *
 *   R1. Every path in `laravel.input[]` MUST appear in `manifest.json` with
 *       `isEntry: true`.
 *   R2. Any `laravel.input[]` path that ALSO matches a `import.meta.glob`
 *       pattern in the project's JS is a COLLISION. Either exclude it from
 *       the glob, OR short-circuit `manualChunks` with an early
 *       `return undefined` before grouping rules.
 *   R3. Any file under `resources/js/Pages/` that appears as `isEntry: true`
 *       in the manifest is suspect — entry pages must be inspected (they
 *       collapse manualChunks groups). If the file is referenced direct via
 *       `@vite()` in blade, document it; otherwise treat as a build leak.
 *
 * Usage:
 *   node scripts/check-vite-manifest.mjs                     # auto-detect
 *   node scripts/check-vite-manifest.mjs <manifest> <vite.config>
 *
 * Auto-detect order (when no args):
 *   manifest:   public/build/manifest.json,
 *               public/build/.vite/manifest.json
 *   vite.config: vite.config.js, vite.config.mjs, vite.config.ts
 *
 * Exit codes:
 *   0  OK (or no Vite/manifest found — skipped)
 *   1  collision (entry × glob) detected
 *   2  manifest missing an `isEntry: true` for a declared input
 *   3  malformed input (could not parse vite.config or manifest)
 */

import { readFile, readdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve, join, relative, dirname, basename } from 'node:path';

const cwd = process.cwd();
const args = process.argv.slice(2);

// ── Auto-detect paths ────────────────────────────────────────────────────
const MANIFEST_CANDIDATES = [
  'public/build/manifest.json',
  'public/build/.vite/manifest.json',
];
const CONFIG_CANDIDATES = [
  'vite.config.js',
  'vite.config.mjs',
  'vite.config.ts',
];

const manifestPath = args[0]
  ? resolve(cwd, args[0])
  : MANIFEST_CANDIDATES.map((p) => resolve(cwd, p)).find(existsSync);

const configPath = args[1]
  ? resolve(cwd, args[1])
  : CONFIG_CANDIDATES.map((p) => resolve(cwd, p)).find(existsSync);

if (!manifestPath) {
  console.error(
    '[check-vite-manifest] No manifest.json found. ' +
      'Run `npm run build` first, then re-run this check.',
  );
  process.exit(0); // Skip silently if no build artifact yet.
}

if (!configPath) {
  console.error(
    '[check-vite-manifest] No vite.config.{js,mjs,ts} found. Skipping.',
  );
  process.exit(0);
}

// ── Load manifest ────────────────────────────────────────────────────────
let manifest;
try {
  manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
} catch (e) {
  console.error(
    `[check-vite-manifest] Could not parse ${relative(cwd, manifestPath)}: ${e.message}`,
  );
  process.exit(3);
}

// ── Load vite.config ─────────────────────────────────────────────────────
let configSrc;
try {
  configSrc = await readFile(configPath, 'utf8');
} catch (e) {
  console.error(`[check-vite-manifest] Could not read ${configPath}: ${e.message}`);
  process.exit(3);
}

// ── Extract laravel({ input: [...] }) ────────────────────────────────────
// Tolerant regex: matches `laravel({ ... input: [ '...', "..." ] ... })`
// across multiple lines. Also catches the helper form
// `laravel(['resources/css/app.css', 'resources/js/app.jsx'])`.
function extractLaravelInputs(src) {
  const inputs = new Set();

  // Form A: laravel({ input: [...] })
  const formA = /laravel\s*\(\s*\{[\s\S]*?input\s*:\s*\[([\s\S]*?)\][\s\S]*?\}\s*\)/g;
  for (const m of src.matchAll(formA)) {
    const arr = m[1];
    for (const sm of arr.matchAll(/['"`]([^'"`]+)['"`]/g)) inputs.add(sm[1]);
  }

  // Form B: laravel([ ... ])  (shorthand)
  const formB = /laravel\s*\(\s*\[([\s\S]*?)\]\s*\)/g;
  for (const m of src.matchAll(formB)) {
    const arr = m[1];
    for (const sm of arr.matchAll(/['"`]([^'"`]+)['"`]/g)) inputs.add(sm[1]);
  }

  return [...inputs];
}

// ── Extract import.meta.glob patterns from JS sources ────────────────────
// We scan the bootstrap entries listed in laravel.input plus any obvious
// Inertia files (app.jsx, app.tsx, ssr.jsx, ssr.tsx, bootstrap.js) under
// resources/js/.
async function findInertiaGlobs(laravelInputs) {
  const candidates = new Set();
  for (const input of laravelInputs) {
    if (/\.(jsx?|tsx?)$/.test(input)) candidates.add(input);
  }
  for (const f of ['app.jsx', 'app.tsx', 'ssr.jsx', 'ssr.tsx', 'bootstrap.js']) {
    const p = `resources/js/${f}`;
    if (existsSync(resolve(cwd, p))) candidates.add(p);
  }

  const patterns = [];
  for (const rel of candidates) {
    const abs = resolve(cwd, rel);
    if (!existsSync(abs)) continue;
    const src = await readFile(abs, 'utf8');

    // resolvePageComponent(`./Pages/${name}.jsx`, import.meta.glob('./Pages/**/*.jsx'))
    // We just want every `import.meta.glob('...')` literal.
    for (const m of src.matchAll(
      /import\.meta\.glob\s*\(\s*\[?\s*['"`]([^'"`]+)['"`]/g,
    )) {
      patterns.push({ file: rel, pattern: m[1] });
    }
    // Multi-pattern form: import.meta.glob(['./Pages/**/*.jsx', './Other/**/*.jsx'])
    const multi = /import\.meta\.glob\s*\(\s*\[([\s\S]*?)\]/g;
    for (const m of src.matchAll(multi)) {
      for (const sm of m[1].matchAll(/['"`]([^'"`]+)['"`]/g)) {
        patterns.push({ file: rel, pattern: sm[1] });
      }
    }
  }
  return patterns;
}

// Convert a `import.meta.glob` pattern (relative to its host file) into an
// absolute prefix + suffix matcher. Globs supported: `**`, `*`, and explicit
// `{jsx,tsx,vue,svelte}` extension brace groups.
function compileGlob(hostFile, pattern) {
  const hostDir = dirname(resolve(cwd, hostFile));
  // Resolve `./` and `../` segments against the host directory.
  let absPattern = resolve(hostDir, pattern);
  absPattern = absPattern.replace(/\\/g, '/'); // Windows safety

  // Build a regex from the glob.
  // Step 1: expand brace groups `{a,b,c}`.
  const expandBraces = (str) => {
    const m = str.match(/\{([^{}]+)\}/);
    if (!m) return [str];
    const opts = m[1].split(',');
    const out = [];
    for (const o of opts) {
      out.push(...expandBraces(str.slice(0, m.index) + o + str.slice(m.index + m[0].length)));
    }
    return out;
  };

  // Step 2: convert each expansion into a regex.
  const regexes = expandBraces(absPattern).map((expanded) => {
    const reSrc = expanded
      .replace(/[.+^$()|[\]\\]/g, '\\$&')
      .replace(/\*\*/g, '__GLOBSTAR__')
      .replace(/\*/g, '[^/]*')
      .replace(/__GLOBSTAR__/g, '.*');
    return new RegExp(`^${reSrc}$`);
  });

  return { pattern, hostFile, regexes };
}

function globMatches(compiled, absPath) {
  const normalized = absPath.replace(/\\/g, '/');
  return compiled.regexes.some((re) => re.test(normalized));
}

// ── Run validation ───────────────────────────────────────────────────────
const laravelInputs = extractLaravelInputs(configSrc);
if (laravelInputs.length === 0) {
  console.error(
    '[check-vite-manifest] Could not find laravel({ input: [...] }) in ' +
      relative(cwd, configPath) +
      '. Skipping (is this a Laravel + Vite project?).',
  );
  process.exit(0);
}

const errors = [];
const warnings = [];

// R1. Every laravel.input MUST be in the manifest as isEntry.
for (const input of laravelInputs) {
  const entry = manifest[input];
  if (!entry) {
    errors.push({
      rule: 'R1',
      msg: `Input "${input}" declared in laravel.input but absent from manifest. Did the build fail?`,
    });
    continue;
  }
  if (!entry.isEntry) {
    errors.push({
      rule: 'R1',
      msg: `Input "${input}" present in manifest but NOT marked isEntry. Check laravel-vite-plugin version.`,
    });
  }
}

// R2 + R3. Cross-reference laravel.input against glob patterns.
const globs = await findInertiaGlobs(laravelInputs);
if (globs.length > 0) {
  const compiledGlobs = globs.map((g) => compileGlob(g.file, g.pattern));

  for (const input of laravelInputs) {
    if (!/\.(jsx?|tsx?)$/.test(input)) continue; // skip CSS, etc.
    const absInput = resolve(cwd, input);
    for (const cg of compiledGlobs) {
      if (globMatches(cg, absInput)) {
        errors.push({
          rule: 'R2',
          msg:
            `Collision: "${input}" is BOTH in laravel.input[] AND matched by ` +
            `import.meta.glob("${cg.pattern}") in ${cg.hostFile}. ` +
            `Rollup/Rolldown will silently collapse the manualChunks group ` +
            `containing this module, leaving the glob resolve-map pointing ` +
            `siblings at the wrong chunk hash. Either remove from ` +
            `laravel.input[], exclude from the glob, or add early ` +
            `\`return undefined\` for this module in manualChunks.`,
        });
      }
    }
  }
}

// R3. Pages/ files marked as isEntry that are NOT in laravel.input.
// These mean someone added an entry chunk indirectly (e.g. dynamic import
// promoted to entry by chunking heuristics) — worth flagging.
const declaredInputSet = new Set(laravelInputs);
for (const [key, entry] of Object.entries(manifest)) {
  if (!entry.isEntry) continue;
  if (declaredInputSet.has(key)) continue;
  if (key.includes('resources/js/Pages/')) {
    warnings.push({
      rule: 'R3',
      msg:
        `Suspicious entry chunk: "${key}" is under Pages/ and marked ` +
        `isEntry=true but NOT declared in laravel.input[]. This usually ` +
        `means the bundler promoted it to entry to break a circular import ` +
        `or because manualChunks excluded it. Verify the resolve-map of ` +
        `import.meta.glob still points other pages at THIS chunk's siblings, ` +
        `not at this chunk.`,
    });
  }
}

// ── Report ───────────────────────────────────────────────────────────────
const tag = '[check-vite-manifest]';

if (warnings.length > 0) {
  for (const w of warnings) console.warn(`${tag} WARN  ${w.rule}: ${w.msg}`);
}

if (errors.length === 0) {
  console.log(
    `${tag} OK  ${laravelInputs.length} input(s), ${globs.length} glob(s), ` +
      `${Object.keys(manifest).length} manifest entries — no collisions.`,
  );
  process.exit(0);
}

for (const e of errors) console.error(`${tag} FAIL  ${e.rule}: ${e.msg}`);
console.error(
  `\n${tag} Manifest validation failed: ${errors.length} error(s). ` +
    `See "Vite Build Gotchas" in the inertia-react skill for the fix pattern.`,
);
process.exit(errors.some((e) => e.rule === 'R1') ? 2 : 1);
