/**
 * Project UI standard — seed and protect `.claude/skills/design-system`,
 * optionally point at the operator's global Preline moon corpus.
 *
 * The npm tarball does not ship the ~100 MB 5.0 capture. Agents Read
 * `$HOME/.claude/skills/preline-moon` when the project actually uses Preline.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { homedir } from 'os';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { destHasLocalCorpus } from './skill-corpus.js';

const PACKAGE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

export const PROJECT_UI_CONFIG_REL = '.claude/config/project-ui.json';
export const DESIGN_SYSTEM_SKILL_REL = '.claude/skills/design-system/SKILL.md';
export const GROK_DESIGN_SYSTEM_REL = '.grok/skills/design-system/SKILL.md';

export interface ProjectUiFile {
  prelineMoon: boolean;
  designSystem: boolean;
  sources: string[];
}

export interface PrelineDetection {
  used: boolean;
  evidence: string[];
}

const FRONTEND_DEPS = [
  'react',
  'vue',
  'svelte',
  '@sveltejs/kit',
  'tailwindcss',
  '@inertiajs/react',
  '@inertiajs/vue3',
  'preline',
  'expo',
  'react-native',
  'expo-router',
];

const FRONTEND_MARKERS = [
  'resources/js',
  'resources/css',
  'src/components',
  'src/app',
  'app/_layout.tsx',
  'app/globals.css',
  'tailwind.config.js',
  'tailwind.config.ts',
  'components.json',
];

const DESIGN_SOURCE_CANDIDATES = [
  '.claude/skills/design-system/SKILL.md',
  '.grok/skills/design-system/SKILL.md',
  'docs/design/style-guide/README.md',
  'docs/design/style-guide',
  'docs/design/README.md',
  'docs/style-guide.md',
  'docs/DESIGN.md',
  'DESIGN.md',
  'resources/js/Components/Common/uiStyles.js',
  'resources/js/Components/Common/uiStyles.ts',
  'src/lib/uiStyles.js',
  'src/lib/uiStyles.ts',
];

function readJson(path: string): Record<string, unknown> | null {
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function pkgDeps(projectDir: string): Record<string, string> {
  const pkg = readJson(join(projectDir, 'package.json'));
  if (!pkg) return {};
  const deps = (pkg['dependencies'] as Record<string, string>) ?? {};
  const dev = (pkg['devDependencies'] as Record<string, string>) ?? {};
  return { ...deps, ...dev };
}

export function globalPrelineCorpusDir(): string {
  return join(homedir(), '.claude', 'skills', 'preline-moon');
}

export function hasGlobalPrelineCorpus(): boolean {
  return destHasLocalCorpus(globalPrelineCorpusDir());
}

export function hasFrontendLayout(
  projectDir: string,
  frontend?: string
): boolean {
  if (frontend && frontend !== 'none') return true;
  const deps = pkgDeps(projectDir);
  if (FRONTEND_DEPS.some((d) => d in deps)) return true;
  return FRONTEND_MARKERS.some((rel) => existsSync(join(projectDir, rel)));
}

/** True when a frontend project is missing the protected design-system skill. */
export function projectDesignSystemNeedsSeed(
  projectDir: string,
  frontend?: string
): boolean {
  if (!hasFrontendLayout(projectDir, frontend)) return false;
  if (!existsSync(join(projectDir, DESIGN_SYSTEM_SKILL_REL))) return true;
  if (!existsSync(join(projectDir, GROK_DESIGN_SYSTEM_REL))) return true;
  return false;
}

export function detectPreline(projectDir: string): PrelineDetection {
  const evidence: string[] = [];
  const deps = pkgDeps(projectDir);
  if (deps['preline']) evidence.push('package.json#preline');

  const probes = [
    ['resources/views/app.blade.php', 'data-theme="theme-moon"'],
    ['resources/css/app.css', 'preline'],
    ['src/app/globals.css', 'preline'],
    ['index.html', 'data-theme="theme-moon"'],
  ] as const;
  for (const [rel, needle] of probes) {
    const p = join(projectDir, rel);
    if (!existsSync(p)) continue;
    try {
      if (readFileSync(p, 'utf8').includes(needle)) evidence.push(rel);
    } catch {
      /* ignore */
    }
  }

  return { used: evidence.length > 0, evidence };
}

export function findExistingDesignSources(projectDir: string): string[] {
  return DESIGN_SOURCE_CANDIDATES.filter((rel) => existsSync(join(projectDir, rel)));
}

export function readProjectUiFile(projectDir: string): ProjectUiFile | null {
  const j = readJson(join(projectDir, PROJECT_UI_CONFIG_REL));
  if (!j || typeof j['prelineMoon'] !== 'boolean') return null;
  return {
    prelineMoon: j['prelineMoon'] === true,
    designSystem: j['designSystem'] !== false,
    sources: Array.isArray(j['sources']) ? (j['sources'] as string[]) : [],
  };
}

export function writeProjectUiFile(projectDir: string, data: ProjectUiFile): void {
  const dest = join(projectDir, PROJECT_UI_CONFIG_REL);
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, JSON.stringify(data, null, 2) + '\n');
}

/** True when this project should get the Preline pointer (not the 100 MB dump). */
export function wantsPrelineMoon(
  projectDir: string,
  configPrelineMoon?: boolean
): boolean {
  if (configPrelineMoon === true) return true;
  if (configPrelineMoon === false) return false;
  const file = readProjectUiFile(projectDir);
  if (file) return file.prelineMoon;
  if (existsSync(join(projectDir, '.claude', 'skills', 'preline-moon', 'SKILL.md'))) {
    return true;
  }
  return detectPreline(projectDir).used;
}

function seedDesignSystemBody(
  projectName: string,
  sources: string[],
  preline: boolean,
  globalOk: boolean
): string {
  const sourceList =
    sources.length > 0
      ? sources.map((s) => `- \`${s}\``).join('\n')
      : '- _(none found — fill Decisions as you decide)_';
  const corpus = preline
    ? globalOk
      ? 'GLOBAL `~/.claude/skills/preline-moon` (5.0 markup / 4.2 runtime). Pointer skill `preline-moon` in this repo. Never copy the dump here.'
      : 'Preline is in use but `~/.claude/skills/preline-moon` is missing. Ask the operator for the capture. Do not fetch preline.co. Do not invent markup.'
    : 'This project is **not** on Preline. Do not load `preline-moon`. Put tokens, recipes, and layout rules in this file.';

  return `---
name: design-system
description: >-
  THE ${projectName} UI standard — decisions THIS project already made
  (surfaces, buttons, layout, tokens). Start here for any frontend or
  layout edit. Do not invent a second look. Companion protocol:
  project-ui-standard. Preline markup only if project-ui.json says so.
---

# ${projectName} — project UI standard

**You are in the right place if the question is "what does THIS project do".**
This file is the standard. It is not a vendor dump.

Claude, Grok, and Kimi all Read this path (Grok also has a copy under
\`.grok/skills/design-system/\`). **Never delete or rewrite this skill** on
migrate. Append a decision in the same commit as the UI change.

## Precedence

| Layer | Where | Job |
|---|---|---|
| **1. Standard** | this skill | What this repo already decided |
| **2. In-repo authority** | docs / recipes listed below | Measurements win if this file is stale — fix this file in the same pass |
| **3. Vendor corpus** | ${corpus} | Only for an element **not yet defined** in 1–2 |

## Sources already in the repo

${sourceList}

Read those first. Lift decisions here. Do not start a parallel design system.

## Decisions

<!-- Append. Do not erase a row because a new page looks different — fix the page. -->

| Area | Use | Do not |
|---|---|---|
| _(fill)_ | | |

## Recipes / tokens

Point at the project file that owns class strings (e.g. \`uiStyles.js\`).
Parents pass **role**, not a style string. See memory \`react-theme-parity\`.

## Maintenance

When a pattern is decided: update this file in the same commit. A standard
that lives only in the diff is not a standard; the next agent re-derives it.

## See Also

- \`project-ui-standard\` — create/protect this skill; Preline detect vs global corpus
- \`react-theme-apply\` + memory \`react-theme-parity\`
`;
}

export function mirrorDesignSystemToGrok(projectDir: string): boolean {
  const src = join(projectDir, DESIGN_SYSTEM_SKILL_REL);
  const dest = join(projectDir, GROK_DESIGN_SYSTEM_REL);
  if (!existsSync(src)) return false;
  if (existsSync(dest)) return false;
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, readFileSync(src, 'utf8'));
  return true;
}

export function ensureProjectDesignSystem(
  projectDir: string,
  opts: { frontend?: string; projectName?: string; prelineMoon?: boolean } = {}
): { seeded: boolean; mirrored: boolean; sources: string[] } {
  const sources = findExistingDesignSources(projectDir);
  const dest = join(projectDir, DESIGN_SYSTEM_SKILL_REL);
  let seeded = false;

  if (!existsSync(dest) && hasFrontendLayout(projectDir, opts.frontend)) {
    const name = opts.projectName || readJson(join(projectDir, 'package.json'))?.['name'] as string || 'project';
    const preline = wantsPrelineMoon(projectDir, opts.prelineMoon);
    mkdirSync(dirname(dest), { recursive: true });
    writeFileSync(
      dest,
      seedDesignSystemBody(String(name), sources.filter((s) => !s.endsWith('design-system/SKILL.md')), preline, hasGlobalPrelineCorpus())
    );
    seeded = true;
  }

  const mirrored = mirrorDesignSystemToGrok(projectDir);
  return { seeded, mirrored, sources };
}

export function ensurePrelinePointer(
  projectDir: string,
  opts: { prelineMoon?: boolean } = {}
): { written: boolean; skipped: string | null } {
  if (!wantsPrelineMoon(projectDir, opts.prelineMoon)) {
    return { written: false, skipped: 'project is not on Preline' };
  }

  const destDir = join(projectDir, '.claude', 'skills', 'preline-moon');
  if (destHasLocalCorpus(destDir)) {
    return { written: false, skipped: 'local capture present — left untouched' };
  }

  const destMd = join(destDir, 'SKILL.md');
  const srcMd = join(PACKAGE_ROOT, 'stacks', 'frontend', 'react', 'skills', 'preline-moon', 'SKILL.md');
  if (!existsSync(srcMd)) return { written: false, skipped: 'bundled pointer missing' };

  mkdirSync(destDir, { recursive: true });
  if (!existsSync(destMd)) {
    writeFileSync(destMd, readFileSync(srcMd, 'utf8'));
    const indexSrc = join(PACKAGE_ROOT, 'stacks', 'frontend', 'react', 'skills', 'preline-moon', 'INDEX.md');
    if (existsSync(indexSrc)) {
      writeFileSync(join(destDir, 'INDEX.md'), readFileSync(indexSrc, 'utf8'));
    }
    return { written: true, skipped: null };
  }
  return { written: false, skipped: 'pointer already present' };
}

export function ensureProjectUi(
  projectDir: string,
  opts: { frontend?: string; projectName?: string; prelineMoon?: boolean } = {}
): {
  designSystem: { seeded: boolean; mirrored: boolean; sources: string[] };
  preline: { written: boolean; skipped: string | null };
} {
  const prelineMoon = wantsPrelineMoon(projectDir, opts.prelineMoon);
  const designSystem = ensureProjectDesignSystem(projectDir, { ...opts, prelineMoon });
  const preline = ensurePrelinePointer(projectDir, { prelineMoon });
  writeProjectUiFile(projectDir, {
    prelineMoon,
    designSystem: true,
    sources: designSystem.sources,
  });
  return { designSystem, preline };
}
