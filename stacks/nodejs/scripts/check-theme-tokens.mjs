#!/usr/bin/env node
// @sv-version: 1.0.0
/**
 * check-theme-tokens.mjs
 *
 * Static theme-parity guard for React + Tailwind v4 projects that use semantic
 * tokens (Preline moon / resources/css/themes). Catches the failure modes from
 * pubweb-saas session 8a0abd61 without requiring a PHPUnit suite.
 *
 *   R1. `dark:` next to a semantic color utility (bg-card, text-foreground, …)
 *       freezes one mode — tokens already flip.
 *   R2. `bg-primary` + `text-white` on the same class string (moon dark primary
 *       is a light surface).
 *   R3. `focus:outline-none` / `focus:outline-hidden` without a focus-visible
 *       substitute in the SAME class string (multiline className joined).
 *
 * Usage:
 *   node scripts/check-theme-tokens.mjs
 *   node scripts/check-theme-tokens.mjs resources/js resources/views
 *
 * Exit 0 = pass or skip (no jsx/js under roots).
 * Exit 1 = violations.
 * Exit 2 = usage error.
 */

import { existsSync, readdirSync, readFileSync, statSync } from 'fs';
import { join, relative } from 'path';

const ROOT = process.cwd();
const EXTS = new Set(['.js', '.jsx', '.ts', '.tsx', '.blade.php']);
const SKIP_DIR = new Set([
  'node_modules',
  'vendor',
  'dist',
  'build',
  'public',
  '.git',
  '.claude',
  'coverage',
]);

const SEMANTIC = [
  'bg-card',
  'bg-background',
  'bg-muted',
  'bg-popover',
  'bg-surface',
  'bg-sidebar',
  'bg-navbar',
  'text-foreground',
  'text-muted-foreground',
  'text-primary-foreground',
  'border-card-line',
  'border-line-1',
  'border-line-2',
  'bg-primary',
  'bg-secondary',
  'bg-destructive',
];

const DARK_ON_SEMANTIC = new RegExp(
  `(?:${SEMANTIC.join('|')})(?![a-z0-9-])[^"'\\n]{0,160}\\bdark:(?:bg|text|border)-`,
  'g'
);

function walk(dir, out) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    if (e.isDirectory()) {
      if (SKIP_DIR.has(e.name) || e.name.startsWith('.')) continue;
      walk(join(dir, e.name), out);
      continue;
    }
    const name = e.name;
    const ok = [...EXTS].some((ext) => name.endsWith(ext));
    if (ok) out.push(join(dir, name));
  }
}

function flattenClassStrings(src) {
  // Join broken className={`...`} / '...' spans so R3 sees one string.
  const chunks = [];
  const re = /className\s*=\s*(?:\{`([\s\S]*?)`\}|["']([^"']+)["'])/g;
  let m;
  while ((m = re.exec(src))) {
    chunks.push((m[1] || m[2] || '').replace(/\s+/g, ' '));
  }
  // Also STYLES const quoted values
  const re2 = /:\s*['`]([^'`]{8,400})['`]/g;
  while ((m = re2.exec(src))) chunks.push(m[1].replace(/\s+/g, ' '));
  return chunks;
}

function scanFile(abs) {
  const src = readFileSync(abs, 'utf8');
  const rel = relative(ROOT, abs);
  const hits = [];

  for (const chunk of flattenClassStrings(src)) {
    DARK_ON_SEMANTIC.lastIndex = 0;
    if (DARK_ON_SEMANTIC.test(chunk)) {
      hits.push({ rule: 'R1', rel, detail: 'dark: next to semantic token' });
    }
    if (/\bbg-primary\b/.test(chunk) && /\btext-white\b/.test(chunk)) {
      hits.push({ rule: 'R2', rel, detail: 'bg-primary + text-white' });
    }
    if (/\bfocus:outline-(?:none|hidden)\b/.test(chunk) && !/\bfocus-visible:/.test(chunk) && !/\bfocus:ring-/.test(chunk) && !/\bfocus:outline-2\b/.test(chunk)) {
      hits.push({ rule: 'R3', rel, detail: 'outline-none/hidden without substitute' });
    }
  }
  return hits;
}

function main() {
  const args = process.argv.slice(2);
  if (args.includes('-h') || args.includes('--help')) {
    console.log('Usage: node scripts/check-theme-tokens.mjs [dir ...]');
    process.exit(0);
  }

  const roots = (args.length ? args : ['resources/js', 'resources/views', 'src'])
    .map((p) => join(ROOT, p))
    .filter((p) => existsSync(p) && statSync(p).isDirectory());

  if (roots.length === 0) {
    console.log('check-theme-tokens: no UI roots found — skip');
    process.exit(0);
  }

  const files = [];
  for (const r of roots) walk(r, files);

  if (files.length === 0) {
    console.log('check-theme-tokens: no jsx/js under roots — skip');
    process.exit(0);
  }

  const hits = files.flatMap(scanFile);
  if (hits.length === 0) {
    console.log(`check-theme-tokens: OK (${files.length} files)`);
    process.exit(0);
  }

  const byRule = { R1: 0, R2: 0, R3: 0 };
  for (const h of hits) {
    byRule[h.rule] += 1;
    console.error(`${h.rule} ${h.rel}  ${h.detail}`);
  }
  console.error(
    `\ncheck-theme-tokens: ${hits.length} hit(s)  R1=${byRule.R1} R2=${byRule.R2} R3=${byRule.R3}`
  );
  console.error('Memory: react-theme-parity · skill: react-theme-apply');
  process.exit(1);
}

main();
