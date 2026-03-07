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

  // Rust
  { id: 'rust', files: ['Cargo.toml'], weight: 95, reason: 'Cargo.toml detected' },

  // Go
  { id: 'go', files: ['go.mod'], weight: 95, reason: 'go.mod detected' },
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
  if (existsSync(join(projectDir, 'astro.config.mjs'))) return 'astro';
  return null;
}

export function detectPythonFramework(projectDir: string): string | null {
  // Check manage.py (Django)
  if (existsSync(join(projectDir, 'manage.py'))) return 'django';
  // Check for FastAPI in requirements or pyproject
  for (const reqFile of ['requirements.txt', 'pyproject.toml', 'Pipfile']) {
    const filePath = join(projectDir, reqFile);
    if (existsSync(filePath)) {
      const content = readFileSync(filePath, 'utf8').toLowerCase();
      if (content.includes('fastapi')) return 'fastapi';
      if (content.includes('flask')) return 'flask';
    }
  }
  return null;
}
