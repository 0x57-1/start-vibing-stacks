#!/usr/bin/env node
// @sv-version: 1.1.0
/**
 * Flags a Laravel tree that did not arrive from this package.
 *
 * A page is routes/web.php → a thin controller → Inertia::render.
 * The query is a Service. Input is a Form Request. Shared props and the
 * document head go through HandleInertiaRequests. A fixed table is config/.
 * routes/api.php returns a Resource. There is no app/Data, and app/Support
 * is not a drawer for page chrome.
 *
 * Exit 1 when it prints findings. The agent fixes those files before the
 * new feature. Behavior stays the same.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { isAbsolute, join, relative } from 'node:path';

const root = process.argv[2]
  ? isAbsolute(process.argv[2])
    ? process.argv[2]
    : join(process.cwd(), process.argv[2])
  : process.cwd();
const app = join(root, 'app');

if (!existsSync(join(root, 'composer.json')) || !existsSync(join(app, 'Http', 'Controllers'))) {
  console.log('check-laravel-layout: not a Laravel app');
  process.exit(0);
}

const findings = [];

function phpFilesHere(dir) {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const name of readdirSync(dir)) {
    if (!name.endsWith('.php')) continue;
    const path = join(dir, name);
    try {
      if (statSync(path).isFile()) out.push(path);
    } catch {
      /* skip */
    }
  }
  return out;
}

function phpFiles(dir) {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const name of readdirSync(dir)) {
    if (name.startsWith('.')) continue;
    const path = join(dir, name);
    let st;
    try {
      st = statSync(path);
    } catch {
      continue;
    }
    if (st.isDirectory()) out.push(...phpFiles(path));
    else if (name.endsWith('.php')) out.push(path);
  }
  return out;
}

function rel(path) {
  return relative(root, path);
}

function lines(path) {
  return readFileSync(path, 'utf8').split('\n').filter((l) => l.trim() !== '').length;
}

function text(path) {
  return readFileSync(path, 'utf8');
}

for (const path of phpFiles(join(app, 'Data'))) {
  findings.push(`${rel(path)}: app/Data is a reference bag. Move the table to config/ or return it from a Service.`);
}

const support = phpFiles(join(app, 'Support'));
const drawerName = /Inertia|Theme|MapStyle|Head|Seo/;
if (support.length > 3 || support.some((p) => drawerName.test(p))) {
  for (const path of support) {
    findings.push(
      `${rel(path)}: app/Support is a drawer. Page chrome goes to HandleInertiaRequests. A query goes to a Service. A fixed table goes to config/.`
    );
  }
}

for (const path of phpFilesHere(join(app, 'Services'))) {
  findings.push(
    `${rel(path)}: a service lives in app/Services/<Domain>/, beside the other classes of that domain. A job for it lives in app/Jobs/<Domain>/.`
  );
}

for (const path of phpFilesHere(join(app, 'Jobs'))) {
  findings.push(
    `${rel(path)}: a job lives in app/Jobs/<Domain>/, the same domain as the service it calls.`
  );
}

const jobsDir = join(app, 'Jobs');
if (existsSync(jobsDir)) {
  for (const name of readdirSync(jobsDir)) {
    const path = join(jobsDir, name);
    let st;
    try {
      st = statSync(path);
    } catch {
      continue;
    }
    if (!st.isDirectory() || name.startsWith('.')) continue;
    if (!existsSync(join(app, 'Services', name))) {
      findings.push(
        `app/Jobs/${name}: no app/Services/${name}. The job calls that service. The query does not live in the job.`
      );
    }
  }
}

for (const path of phpFiles(join(app, 'Jobs'))) {
  const src = text(path);
  if (/onQueue\(\s*['"]default['"]\s*\)/.test(src)) {
    findings.push(
      `${rel(path)}: queue name is default. Name a queue a worker on this host actually consumes.`
    );
  }
}

for (const path of phpFiles(join(app, 'Services'))) {
  const src = text(path);
  if (/Inertia::render|<head|data-inertia/.test(src) || /\/Seo\/|Head\.php$|SeoFactory\.php$/.test(path)) {
    findings.push(
      `${rel(path)}: page chrome is in a Service. The document head and shared props go through HandleInertiaRequests. A Service returns data.`
    );
  }
}

for (const path of phpFiles(join(app, 'Http', 'Controllers'))) {
  if (path.includes(`${join('Controllers', 'Api')}`) || path.includes(`${join('Controllers', 'Concerns')}`)) continue;
  const src = text(path);
  if (lines(path) > 80) {
    findings.push(
      `${rel(path)}: fat controller. One Service call and Inertia::render. The query moves to a Service.`
    );
  }
  if (/return\s+view\(/.test(src)) {
    findings.push(`${rel(path)}: a page returns Inertia::render, not view().`);
  }
}

const requests = join(app, 'Http', 'Requests');
if (!existsSync(requests)) {
  const validates = phpFiles(join(app, 'Http', 'Controllers')).some((p) => /->validate\(/.test(text(p)));
  if (validates) {
    findings.push('app/Http/Requests: missing. Input on a page goes through a Form Request.');
  }
}

const composer = text(join(root, 'composer.json'));
const middleware = join(app, 'Http', 'Middleware', 'HandleInertiaRequests.php');
if (/inertiajs\/inertia-laravel/.test(composer) && !existsSync(middleware)) {
  findings.push(
    'app/Http/Middleware/HandleInertiaRequests.php: missing. Shared props and the document head go through this middleware.'
  );
}

if (findings.length === 0) {
  console.log('check-laravel-layout: layout ok');
  process.exit(0);
}

const shown = findings.slice(0, 40);
for (const line of shown) console.log(line);
if (findings.length > shown.length) {
  console.log(`… and ${findings.length - shown.length} more`);
}
console.log(`check-laravel-layout: ${findings.length} finding(s). Fix these into the Inertia page layout before the new feature.`);
process.exit(1);
