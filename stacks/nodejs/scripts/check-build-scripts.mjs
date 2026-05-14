#!/usr/bin/env node
/**
 * check-build-scripts.mjs
 *
 * Static validator for package.json#scripts that run at deploy time.
 *
 * Catches the "tsx: command not found / Error: Command 'npm run build'
 * exited with 127" class of bug, which appears on Vercel, Docker
 * (`npm ci --omit=dev`), and any CI that runs with `NODE_ENV=production`.
 *
 * Rule: any binary invoked from `build`, `prebuild`, `postbuild`,
 * `start`, `postinstall`, `prepare`, or `prepublishOnly` MUST be one of:
 *   - a Node-builtin (`node`, plain shell)
 *   - prefixed with `npx` / `bunx` / `pnpm exec`
 *   - the package's own `bin` entry
 *   - present in `dependencies` (NOT just `devDependencies`)
 *   - a plain-Node script: `node scripts/foo.mjs`
 *
 * Usage:
 *   node scripts/check-build-scripts.mjs            # auto-detect ./package.json
 *   node scripts/check-build-scripts.mjs ./pkg/dir  # explicit dir
 *
 * Exit codes:
 *   0  OK
 *   1  dev-only tool referenced from a deploy-time script
 *   2  no package.json found (skipped)
 */

import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve, join, relative } from 'node:path';

// Scripts that run during install/build on Vercel, Docker, npm publish, etc.
// `postinstall` runs even with `--omit=dev`, so its commands MUST resolve from prod deps.
const DEPLOY_TIME_SCRIPTS = [
  'build',
  'prebuild',
  'postbuild',
  'start',
  'postinstall',
  'prepare',
  'prepublishOnly',
];

// Tools that are conventionally dev-only. If the script invokes one of these
// directly (without `npx`/`bunx`) AND it's not in `dependencies`, that's the bug.
const DEV_ONLY_TOOLS = new Set([
  'tsx',
  'ts-node',
  'tsc',
  'typescript',
  'vitest',
  'jest',
  'mocha',
  'ava',
  'tap',
  'eslint',
  'prettier',
  'biome',
  'rome',
  'tsup',
  'esbuild',
  'rollup',
  'webpack',
  'rspack',
  'parcel',
  'tailwindcss',
  'postcss',
  'sass',
  'less',
  'concurrently',
  'nodemon',
  'pm2',
]);

// Tokens that are NEVER a binary invocation (control flow, shell built-ins, etc.)
const NON_BINARY_TOKENS = new Set([
  '&&',
  '||',
  ';',
  '|',
  '&',
  '>',
  '<',
  '>>',
  '<<',
  '!',
  '$',
  '(',
  ')',
  '{',
  '}',
  'if',
  'then',
  'else',
  'fi',
  'for',
  'do',
  'done',
  'while',
  'case',
  'esac',
  'cd',
  'echo',
  'export',
  'true',
  'false',
  'cat',
  'rm',
  'cp',
  'mv',
  'mkdir',
  'test',
  'sh',
  'bash',
  'zsh',
  'set',
]);

// Wrapper commands that defer to a separate binary (their first arg is the actual tool,
// which we want to evaluate against the same rules).
const WRAPPERS = new Set(['npx', 'bunx', 'pnpm', 'yarn', 'cross-env', 'env']);

/**
 * Strip shell quoting and split a command line into bare tokens.
 * Naive but adequate for typical package.json scripts.
 */
function tokenize(line) {
  const out = [];
  let cur = '';
  let quote = null;
  for (const ch of line) {
    if (quote) {
      if (ch === quote) quote = null;
      else cur += ch;
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      continue;
    }
    if (/\s/.test(ch)) {
      if (cur) {
        out.push(cur);
        cur = '';
      }
      continue;
    }
    cur += ch;
  }
  if (cur) out.push(cur);
  return out;
}

/**
 * Walk a script command and return the list of "first-binary" tokens that
 * would actually be invoked. Handles `&&`, `||`, `;`, and a small set of
 * wrappers (npx, bunx, cross-env).
 *
 * Returns Array<{ binary: string, prefixedByWrapper: boolean }>
 */
function extractInvocations(command) {
  const tokens = tokenize(command);
  const invocations = [];

  let expectBinary = true; // start of a sub-command
  let wrapperPrefix = false;

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];

    if (t === '&&' || t === '||' || t === ';' || t === '|') {
      expectBinary = true;
      wrapperPrefix = false;
      continue;
    }

    // Skip env-var assignments like FOO=bar baz
    if (expectBinary && /^[A-Z_][A-Z0-9_]*=/.test(t)) {
      continue;
    }

    if (!expectBinary) continue;

    // Wrappers: their "real" binary is the next token
    if (WRAPPERS.has(t)) {
      wrapperPrefix = true;
      // for `pnpm exec` / `pnpm run` style, eat the sub-word
      if (t === 'pnpm' && tokens[i + 1] === 'exec') {
        i++;
        continue;
      }
      if (t === 'yarn' && tokens[i + 1] === 'dlx') {
        i++;
        continue;
      }
      // for `cross-env FOO=bar baz` we need to skip env assignments too
      if (t === 'cross-env' || t === 'env') {
        let j = i + 1;
        while (j < tokens.length && /^[A-Z_][A-Z0-9_]*=/.test(tokens[j])) j++;
        if (j < tokens.length) {
          invocations.push({ binary: tokens[j], prefixedByWrapper: false });
        }
        i = j;
        expectBinary = false;
        wrapperPrefix = false;
        continue;
      }
      continue;
    }

    if (NON_BINARY_TOKENS.has(t)) {
      // Don't reset expectBinary for stuff like `echo`; treat as inert
      continue;
    }

    invocations.push({ binary: t, prefixedByWrapper: wrapperPrefix });
    expectBinary = false;
    wrapperPrefix = false;
  }

  return invocations;
}

/**
 * Returns true if the binary is "safe" — Node-builtin invocation, or
 * resolves from prod dependencies (or the package's own bin).
 */
function isSafe(binary, prefixedByWrapper, ctx) {
  if (prefixedByWrapper) return true;
  if (binary === 'node') return true;
  // Direct script: `./scripts/x.sh`, `node ./scripts/x.mjs` — wrapped above
  if (binary.startsWith('./') || binary.startsWith('/')) return true;
  // Module via `node --import`: `node scripts/foo.mjs` is already handled above

  // Package's own bin
  if (ctx.ownBins.has(binary)) return true;

  // Prod dep (the package itself may install a bin)
  if (ctx.prodDeps.has(binary)) return true;

  // Subpackages of a prod dep (rare but valid: `next-bundle-analyzer` → `next` group)
  // — handled by direct match above for typical cases.

  // Some prod deps install differently-named bins (e.g. `typescript` → `tsc`).
  // We can't statically know these without crawling node_modules, so the
  // heuristic falls back on the DEV_ONLY_TOOLS deny-list for the well-known
  // offenders.
  return !DEV_ONLY_TOOLS.has(binary);
}

async function readJSON(path) {
  const raw = await readFile(path, 'utf8');
  return JSON.parse(raw);
}

async function detectRoot(args) {
  if (args.length > 0) return resolve(args[0]);
  return process.cwd();
}

async function main() {
  const args = process.argv.slice(2);
  const root = await detectRoot(args);
  const pkgPath = join(root, 'package.json');

  if (!existsSync(pkgPath)) {
    console.log('[build-scripts] no package.json found — skipped.');
    process.exit(2);
  }

  const pkg = await readJSON(pkgPath);
  const scripts = pkg.scripts ?? {};
  const prodDeps = new Set(Object.keys(pkg.dependencies ?? {}));
  const devDeps = new Set(Object.keys(pkg.devDependencies ?? {}));
  const ownBins = new Set(
    typeof pkg.bin === 'string' ? [pkg.name] : Object.keys(pkg.bin ?? {})
  );
  const ctx = { prodDeps, devDeps, ownBins };

  const findings = [];

  for (const scriptName of DEPLOY_TIME_SCRIPTS) {
    const cmd = scripts[scriptName];
    if (!cmd) continue;

    const invocations = extractInvocations(cmd);
    for (const inv of invocations) {
      if (isSafe(inv.binary, inv.prefixedByWrapper, ctx)) continue;
      const inDev = devDeps.has(inv.binary);
      findings.push({
        script: scriptName,
        command: cmd,
        binary: inv.binary,
        inDev,
      });
    }
  }

  if (findings.length > 0) {
    console.error('');
    console.error('  BUILD SCRIPT HYGIENE FAILURE (deploy will crash with exit 127)');
    console.error('  ' + '─'.repeat(60));
    console.error('');
    console.error(
      '  These deploy-time scripts call a binary that will not be'
    );
    console.error(
      '  available on Vercel/Docker (NODE_ENV=production strips devDeps).'
    );
    console.error('');
    for (const f of findings) {
      console.error(`  scripts.${f.script}  →  ${f.command}`);
      console.error(`    missing binary: "${f.binary}"`);
      if (f.inDev) {
        console.error(
          `    → "${f.binary}" is in devDependencies; deploy install omits devDeps`
        );
      } else {
        console.error(
          `    → "${f.binary}" is not in dependencies and not a known wrapper`
        );
      }
      console.error('');
    }
    console.error('  Fix (in order of preference):');
    console.error(
      '    1. Convert any TS helper to .mjs and call via `node scripts/x.mjs`'
    );
    console.error(
      '    2. Move the tool to `dependencies` if it is genuinely needed at runtime'
    );
    console.error(
      '    3. Prefix with `npx`/`bunx` (slower, network-dependent)'
    );
    console.error(
      '    4. As LAST RESORT, set Vercel `installCommand: "npm install --include=dev"`'
    );
    console.error('');
    process.exit(1);
  }

  const pkgRel = relative(process.cwd(), pkgPath) || 'package.json';
  console.log(`[build-scripts] OK — no dev-only tools in deploy-time scripts (${pkgRel})`);
  process.exit(0);
}

main().catch((err) => {
  console.error('[build-scripts] script failed:', err);
  process.exit(1);
});
