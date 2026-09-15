/**
 * Start Vibing Stacks — Project Detector
 *
 * Auto-detects project stack by scanning for known files.
 * Also detects .cursorrules, CLAUDE.md, and git presence.
 */

import { existsSync, readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import type { DetectionResult } from './types.js';

interface StackSignature {
  id: string;
  files: string[];
  weight: number;
  reason: string;
}

const STACK_SIGNATURES: StackSignature[] = [
  // PHP
  { id: 'php', files: ['composer.json'], weight: 90, reason: 'composer.json detected' },
  { id: 'php', files: ['index.php'], weight: 60, reason: 'index.php detected' },
  { id: 'php', files: ['artisan'], weight: 95, reason: 'Laravel artisan detected' },
  { id: 'php', files: ['public/index.php'], weight: 70, reason: 'public/index.php detected' },
  { id: 'php', files: ['.php-version'], weight: 80, reason: '.php-version detected' },

  // Node.js / TypeScript
  { id: 'nodejs', files: ['package.json'], weight: 80, reason: 'package.json detected' },
  { id: 'nodejs', files: ['tsconfig.json'], weight: 85, reason: 'tsconfig.json detected' },
  { id: 'nodejs', files: ['bun.lockb'], weight: 90, reason: 'Bun lockfile detected' },
  { id: 'nodejs', files: ['next.config.js'], weight: 95, reason: 'Next.js config detected' },
  { id: 'nodejs', files: ['next.config.ts'], weight: 95, reason: 'Next.js TS config detected' },
  { id: 'nodejs', files: ['next.config.mjs'], weight: 95, reason: 'Next.js config detected' },

  // Python
  { id: 'python', files: ['requirements.txt'], weight: 80, reason: 'requirements.txt detected' },
  { id: 'python', files: ['pyproject.toml'], weight: 90, reason: 'pyproject.toml detected' },
  { id: 'python', files: ['Pipfile'], weight: 85, reason: 'Pipfile detected' },
  { id: 'python', files: ['setup.py'], weight: 75, reason: 'setup.py detected' },

  // React Native / Expo — score above generic package.json so empty-ish Expo wins
  { id: 'react-native', files: ['app.json'], weight: 70, reason: 'app.json detected' },
  { id: 'react-native', files: ['app.config.ts'], weight: 90, reason: 'Expo app.config.ts detected' },
  { id: 'react-native', files: ['app.config.js'], weight: 88, reason: 'Expo app.config.js detected' },

];

export function detectProject(projectDir: string): DetectionResult {
  const result: DetectionResult = {
    files: [],
    stacks: [],
    hasCursorRules: false,
    hasClaudeMd: false,
    hasGit: false,
  };

  // Scan top-level files
  try {
    result.files = readdirSync(projectDir);
  } catch {
    return result;
  }

  // Check for Cursor IDE rules
  result.hasCursorRules =
    existsSync(join(projectDir, '.cursorrules')) ||
    existsSync(join(projectDir, '.cursor', 'rules'));

  // Check for existing CLAUDE.md
  result.hasClaudeMd = existsSync(join(projectDir, 'CLAUDE.md'));

  // Check for git
  result.hasGit = existsSync(join(projectDir, '.git'));

  let rnPkgBoost: { confidence: number; reasons: string[] } | null = null;
  const pkgPath = join(projectDir, 'package.json');
  if (existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as {
        dependencies?: Record<string, string>;
        devDependencies?: Record<string, string>;
      };
      const deps = { ...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {}) };
      if (deps['expo'] || deps['react-native'] || deps['expo-router']) {
        rnPkgBoost = {
          confidence: 96,
          reasons: [
            deps['expo']
              ? 'package.json#expo'
              : deps['expo-router']
                ? 'package.json#expo-router'
                : 'package.json#react-native',
          ],
        };
      }
    } catch {
      /* ignore */
    }
  }

  // Score each stack
  const stackScores = new Map<string, { confidence: number; reasons: string[] }>();

  for (const sig of STACK_SIGNATURES) {
    const allExist = sig.files.every((f) => existsSync(join(projectDir, f)));
    if (allExist) {
      const existing = stackScores.get(sig.id) || { confidence: 0, reasons: [] };
      existing.confidence = Math.min(100, existing.confidence + sig.weight);
      existing.reasons.push(sig.reason);
      stackScores.set(sig.id, existing);
    }
  }

  if (rnPkgBoost) {
    const existing = stackScores.get('react-native') || { confidence: 0, reasons: [] };
    existing.confidence = Math.min(100, existing.confidence + rnPkgBoost.confidence);
    existing.reasons.push(...rnPkgBoost.reasons);
    stackScores.set('react-native', existing);
  }

  // Convert to sorted array
  result.stacks = Array.from(stackScores.entries())
    .map(([id, data]) => ({
      id,
      confidence: Math.min(100, data.confidence),
      reason: data.reasons.join(', '),
    }))
    .sort((a, b) => b.confidence - a.confidence);

  return result;
}

/**
 * Detect framework within a PHP project
 */
export function detectPhpFramework(projectDir: string): string | null {
  if (existsSync(join(projectDir, 'artisan'))) {
    if (existsSync(join(projectDir, 'rr.yaml'))) return 'laravel-octane';
    return 'laravel';
  }
  return null;
}

/**
 * Detect framework within a Node.js project
 */
export function detectNodeFramework(projectDir: string): string | null {
  if (
    existsSync(join(projectDir, 'next.config.js')) ||
    existsSync(join(projectDir, 'next.config.ts')) ||
    existsSync(join(projectDir, 'next.config.mjs'))
  )
    return 'nextjs';
  if (existsSync(join(projectDir, 'nuxt.config.ts'))) return 'nuxt';
  if (existsSync(join(projectDir, 'astro.config.mjs')) || existsSync(join(projectDir, 'astro.config.ts'))) return 'astro';
  if (existsSync(join(projectDir, 'svelte.config.js')) || existsSync(join(projectDir, 'svelte.config.ts'))) return 'svelte';

  const pkgPath = join(projectDir, 'package.json');
  if (existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };
      if (deps['express']) return 'express';
      if (deps['fastify']) return 'fastify';
      if (deps['hono']) return 'hono';
    } catch {
      // ignore parse errors
    }
  }

  return null;
}

export function detectPythonFramework(projectDir: string): string | null {
  if (existsSync(join(projectDir, 'manage.py'))) return 'django';

  for (const reqFile of ['requirements.txt', 'pyproject.toml', 'Pipfile']) {
    const filePath = join(projectDir, reqFile);
    if (existsSync(filePath)) {
      const content = readFileSync(filePath, 'utf8').toLowerCase();
      if (content.includes('fastapi')) return 'fastapi';
      if (content.includes('flask')) return 'flask';
    }
  }

  // If Python project detected but no web framework, suggest scripts
  if (
    existsSync(join(projectDir, 'main.py')) &&
    !existsSync(join(projectDir, 'app', 'main.py'))
  ) {
    return 'scripts';
  }

  return null;
}

/** App kind inside a React Native / Expo project. */
export function detectReactNativeFramework(projectDir: string): string | null {
  if (existsSync(join(projectDir, 'app', '(auth)', 'login.tsx'))) return 'expo-auth-panel';
  if (existsSync(join(projectDir, 'app', '(tabs)', '_layout.tsx'))) return 'expo-tabs';
  if (
    existsSync(join(projectDir, 'android', 'app', 'build.gradle')) &&
    !existsSync(join(projectDir, 'app.json')) &&
    !existsSync(join(projectDir, 'app.config.ts'))
  ) {
    return 'bare';
  }
  if (
    existsSync(join(projectDir, 'app', '_layout.tsx')) ||
    existsSync(join(projectDir, 'app.json')) ||
    existsSync(join(projectDir, 'app.config.ts'))
  ) {
    return 'expo-blank';
  }
  return null;
}
