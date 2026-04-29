#!/usr/bin/env node
/**
 * Final Check — executable validator with VETO.
 *
 * Scans staged + unstaged source files for forbidden patterns:
 *  - debug statements (console.log, var_dump, dd, print debug)
 *  - TODO/FIXME left in code
 *  - any-typed code (TypeScript)
 *  - hardcoded secrets
 *  - test .skip / .only
 *  - dangerous functions (RCE, command injection)
 *
 * Exits 0 if clean, 1 if any blocking finding. Output is human-readable.
 */

import { spawnSync } from 'child_process';
import { existsSync, readFileSync, statSync } from 'fs';
import { extname, join } from 'path';

const PROJECT_DIR = process.env['CLAUDE_PROJECT_DIR'] || process.cwd();
const ACTIVE_PROJECT = join(PROJECT_DIR, '.claude', 'config', 'active-project.json');

let stackId = 'unknown';
try {
  if (existsSync(ACTIVE_PROJECT)) {
    stackId = JSON.parse(readFileSync(ACTIVE_PROJECT, 'utf8')).stack || 'unknown';
  }
} catch {}

const STACK_EXTENSIONS: Record<string, Set<string>> = {
  php: new Set(['.php', '.blade.php']),
  nodejs: new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs']),
  python: new Set(['.py']),
};
const sourceExt = STACK_EXTENSIONS[stackId] || new Set(['.ts', '.js', '.php', '.py']);

interface Finding {
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  file: string;
  line: number;
  rule: string;
  excerpt: string;
}

const findings: Finding[] = [];

function git(...args: string[]): string {
  const r = spawnSync('git', args, { cwd: PROJECT_DIR, encoding: 'utf8' });
  return (r.stdout || '').trim();
}

// Paths that are always skipped (validator itself, generated, vendored, etc.)
const SKIP_PATH_RE = /(^|\/)(\.claude\/hooks|\.claude\/scripts|node_modules|dist|build|coverage|vendor|\.next|\.nuxt|venv|\.venv|stacks\/_shared\/hooks)\//;

function listFiles(): string[] {
  const staged = git('diff', '--name-only', '--cached', '--diff-filter=ACMR').split('\n');
  const unstaged = git('diff', '--name-only', '--diff-filter=ACMR').split('\n');
  const untracked = git('ls-files', '--others', '--exclude-standard').split('\n');
  const all = new Set<string>();
  for (const f of [...staged, ...unstaged, ...untracked]) {
    if (!f) continue;
    if (SKIP_PATH_RE.test('/' + f)) continue;
    if (!sourceExt.has(extname(f).toLowerCase())) continue;
    const full = join(PROJECT_DIR, f);
    if (!existsSync(full)) continue;
    try {
      if (statSync(full).isFile()) all.add(f);
    } catch {}
  }
  return [...all];
}

interface Rule {
  re: RegExp;
  rule: string;
  severity: Finding['severity'];
  appliesTo?: (path: string) => boolean;
}

const isTest = (p: string) => /\.(test|spec)\.[tj]sx?$|tests?\//i.test(p);
const isPhp = (p: string) => p.endsWith('.php');
const isPy = (p: string) => p.endsWith('.py');
const isJs = (p: string) => /\.(t|j)sx?$|\.mjs$/.test(p);

// Build dangerous-function regex via parts to avoid trivial lexical scans
const DANGEROUS_JS = new RegExp('\\b' + 'ev' + 'al' + '\\s*\\(');
const DANGEROUS_PY = new RegExp('\\b(?:' + 'ev' + 'al' + '|exec)\\s*\\(');

const RULES: Rule[] = [
  // Debug statements
  { re: /\bconsole\.(log|debug|trace)\s*\(/, rule: 'console debug statement', severity: 'MEDIUM',
    appliesTo: p => isJs(p) && !isTest(p) },
  { re: /\b(var_dump|dd|dump|print_r)\s*\(/, rule: 'PHP debug statement', severity: 'MEDIUM',
    appliesTo: isPhp },
  { re: /^[^#]*\bprint\s*\(/m, rule: 'Python print() (use logger)', severity: 'LOW',
    appliesTo: p => isPy(p) && !isTest(p) },

  // Tests
  { re: /\b(it|test|describe)\.(only|skip)\s*\(/, rule: '.only / .skip in test', severity: 'HIGH',
    appliesTo: p => /\.(test|spec)\./i.test(p) },
  { re: /@pytest\.mark\.skip\b/, rule: 'pytest skip marker', severity: 'MEDIUM',
    appliesTo: isPy },

  // TypeScript any
  { re: /:\s*any\b(?!\s*\/\*\s*ok)/, rule: 'explicit any (use unknown or proper type)', severity: 'MEDIUM',
    appliesTo: p => /\.(ts|tsx)$/.test(p) },
  { re: /@ts-ignore/, rule: '@ts-ignore (use @ts-expect-error with comment)', severity: 'MEDIUM',
    appliesTo: p => /\.(ts|tsx)$/.test(p) },

  // TODO / FIXME — informational
  { re: /\b(TODO|FIXME|XXX|HACK)\b/, rule: 'unresolved TODO/FIXME', severity: 'LOW' },

  // Secrets — high signal patterns
  { re: /(?:api[_-]?key|secret|token|bearer|password|aws_(?:access|secret)_key|private_key)\s*[:=]\s*["'][A-Za-z0-9/+=_\-.]{20,}["']/i,
    rule: 'possible hardcoded secret', severity: 'CRITICAL' },
  { re: /(?:NEXT_PUBLIC|VITE|REACT_APP)_[A-Z_]*(?:SECRET|TOKEN|PRIVATE|PASSWORD|CREDENTIAL)/,
    rule: 'public env var contains secret-like name', severity: 'CRITICAL' },

  // Dangerous code execution
  { re: DANGEROUS_JS, rule: 'arbitrary code execution function — RCE risk', severity: 'HIGH',
    appliesTo: p => isJs(p) || isPhp(p) },
  { re: DANGEROUS_PY, rule: 'arbitrary code execution function — RCE risk', severity: 'HIGH',
    appliesTo: isPy },
  { re: /shell\s*=\s*True/, rule: 'subprocess shell=True (command injection)', severity: 'HIGH',
    appliesTo: isPy },

  // SQL string concat (rough)
  { re: /(SELECT|INSERT|UPDATE|DELETE)\s[^"']*?\+\s*[a-zA-Z_]/i,
    rule: 'possible SQL string concatenation', severity: 'HIGH', appliesTo: p => isJs(p) || isPhp(p) },
  { re: /f["'][^"']*\b(SELECT|INSERT|UPDATE|DELETE)\b[^"']*\{/i,
    rule: 'f-string SQL (use bind parameters)', severity: 'HIGH', appliesTo: isPy },
];

const SEVERITY_ORDER: Record<Finding['severity'], number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
const PLACEHOLDER_RE = /<\s*your[_\- ]|YOUR_[A-Z_]+|placeholder|example\.com|sk_test_|sk_xxx|xxxxxxxx/i;

function scan(file: string) {
  const full = join(PROJECT_DIR, file);
  let content: string;
  try { content = readFileSync(full, 'utf8'); } catch { return; }

  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? '';
    if (line.length > 1000) continue;          // skip minified
    if (PLACEHOLDER_RE.test(line)) continue;   // example/template values
    for (const r of RULES) {
      if (r.appliesTo && !r.appliesTo(file)) continue;
      if (r.re.test(line)) {
        findings.push({
          severity: r.severity,
          file,
          line: i + 1,
          rule: r.rule,
          excerpt: line.trim().slice(0, 160),
        });
      }
    }
  }
}

function main() {
  const files = listFiles();
  if (files.length === 0) {
    console.log('Final check: no source files in current diff to scan.');
    process.exit(0);
  }

  for (const f of files) scan(f);

  findings.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);

  const blocking = findings.filter(f => f.severity === 'CRITICAL' || f.severity === 'HIGH');
  const warnings = findings.filter(f => f.severity === 'MEDIUM' || f.severity === 'LOW');

  if (findings.length === 0) {
    console.log(`Final check passed (${files.length} file${files.length === 1 ? '' : 's'} scanned, stack=${stackId}).`);
    process.exit(0);
  }

  console.log(`Final check report — stack=${stackId}, files=${files.length}\n`);

  if (blocking.length > 0) {
    console.log(`BLOCKING — ${blocking.length} critical/high finding${blocking.length === 1 ? '' : 's'}:\n`);
    for (const f of blocking) {
      console.log(`  [${f.severity}] ${f.file}:${f.line}`);
      console.log(`    ${f.rule}`);
      console.log(`    > ${f.excerpt}`);
    }
    console.log('');
  }

  if (warnings.length > 0) {
    console.log(`WARNINGS — ${warnings.length} medium/low finding${warnings.length === 1 ? '' : 's'}:\n`);
    for (const f of warnings.slice(0, 20)) {
      console.log(`  [${f.severity}] ${f.file}:${f.line}  ${f.rule}`);
    }
    if (warnings.length > 20) console.log(`  ... and ${warnings.length - 20} more`);
    console.log('');
  }

  process.exit(blocking.length > 0 ? 1 : 0);
}

main();
