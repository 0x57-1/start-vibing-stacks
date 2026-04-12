/**
 * Start Vibing Stacks — Project Standards Scanner
 *
 * Scans existing project files to extract coding patterns
 * and standards already in use.
 */

import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import type { PatternMatch, ScanResult, StandardsReview } from './types.js';

// ─── PHP: Composer dependency map ──────────────────────────────────────────
const COMPOSER_PACKAGES: Record<string, { category: string; name: string }> = {
  'laravel/octane': { category: 'server', name: 'Laravel Octane (long-lived workers)' },
  'laravel/sanctum': { category: 'auth', name: 'Laravel Sanctum for API token auth' },
  'inertiajs/inertia-laravel': { category: 'frontend', name: 'Inertia.js (server-driven SPA)' },
  'laravel/horizon': { category: 'queue', name: 'Laravel Horizon for queue monitoring' },
  'laravel/telescope': { category: 'debug', name: 'Laravel Telescope for debugging' },
  'laravel/cashier': { category: 'billing', name: 'Laravel Cashier for payments' },
  'laravel/scout': { category: 'search', name: 'Laravel Scout for full-text search' },
  'laravel/socialite': { category: 'auth', name: 'Laravel Socialite for OAuth' },
  'spatie/laravel-permission': { category: 'auth', name: 'Spatie Permissions for RBAC' },
  'spatie/laravel-medialibrary': { category: 'media', name: 'Spatie Media Library for file uploads' },
  'spatie/laravel-activitylog': { category: 'audit', name: 'Spatie Activity Log for auditing' },
  'tightenco/ziggy': { category: 'frontend', name: 'Ziggy for Laravel routes in JS' },
  'predis/predis': { category: 'cache', name: 'Predis Redis client' },
  'phpstan/phpstan': { category: 'quality', name: 'PHPStan static analysis' },
  'friendsofphp/php-cs-fixer': { category: 'quality', name: 'PHP-CS-Fixer code style' },
  'pestphp/pest': { category: 'testing', name: 'Pest PHP testing framework' },
  'nunomaduro/larastan': { category: 'quality', name: 'Larastan (PHPStan for Laravel)' },
};

// ─── Node.js: npm/bun dependency map ───────────────────────────────────────
const NPM_PACKAGES: Record<string, { category: string; name: string }> = {
  // Frameworks
  'next': { category: 'framework', name: 'Next.js framework' },
  'nuxt': { category: 'framework', name: 'Nuxt framework' },
  'astro': { category: 'framework', name: 'Astro framework' },
  'express': { category: 'framework', name: 'Express.js server' },
  'fastify': { category: 'framework', name: 'Fastify server' },
  'hono': { category: 'framework', name: 'Hono lightweight framework' },

  // Frontend
  'react': { category: 'frontend', name: 'React library' },
  'vue': { category: 'frontend', name: 'Vue.js framework' },
  'svelte': { category: 'frontend', name: 'Svelte framework' },
  '@sveltejs/kit': { category: 'frontend', name: 'SvelteKit framework' },
  'tailwindcss': { category: 'frontend', name: 'TailwindCSS styling' },
  '@tanstack/react-query': { category: 'data', name: 'TanStack Query for data fetching' },
  'react-hook-form': { category: 'forms', name: 'React Hook Form' },

  // UI
  'sonner': { category: 'ui', name: 'Sonner toast notifications' },
  'framer-motion': { category: 'ui', name: 'Framer Motion animations' },
  'shadcn-ui': { category: 'ui', name: 'shadcn/ui components' },
  '@radix-ui/react-dialog': { category: 'ui', name: 'Radix UI primitives' },

  // API
  '@trpc/server': { category: 'api', name: 'tRPC type-safe API' },

  // Validation
  'zod': { category: 'validation', name: 'Zod schema validation' },

  // Database — MongoDB
  'mongoose': { category: 'database', name: 'Mongoose (MongoDB)' },

  // Database — PostgreSQL
  'pg': { category: 'database', name: 'pg (PostgreSQL client)' },
  '@neondatabase/serverless': { category: 'database', name: 'Neon serverless PostgreSQL' },
  '@vercel/postgres': { category: 'database', name: 'Vercel Postgres' },

  // Database — MySQL
  'mysql2': { category: 'database', name: 'mysql2 (MySQL client)' },
  '@planetscale/database': { category: 'database', name: 'PlanetScale MySQL' },

  // Database — SQLite / Turso
  'better-sqlite3': { category: 'database', name: 'better-sqlite3 (SQLite)' },
  '@libsql/client': { category: 'database', name: 'libSQL / Turso client' },

  // Database — ORMs
  'prisma': { category: 'database', name: 'Prisma ORM' },
  '@prisma/client': { category: 'database', name: 'Prisma Client' },
  'drizzle-orm': { category: 'database', name: 'Drizzle ORM' },
  'typeorm': { category: 'database', name: 'TypeORM' },
  'sequelize': { category: 'database', name: 'Sequelize ORM' },
  'kysely': { category: 'database', name: 'Kysely query builder' },

  // Cache / Redis
  'ioredis': { category: 'cache', name: 'Redis client (ioredis)' },
  '@upstash/redis': { category: 'cache', name: 'Upstash Redis (serverless)' },
  'redis': { category: 'cache', name: 'Redis client (node-redis)' },

  // Auth
  '@auth/core': { category: 'auth', name: 'Auth.js authentication' },
  'next-auth': { category: 'auth', name: 'NextAuth.js authentication' },
  'lucia': { category: 'auth', name: 'Lucia auth library' },
  '@clerk/nextjs': { category: 'auth', name: 'Clerk authentication' },

  // Testing
  'vitest': { category: 'testing', name: 'Vitest testing framework' },
  'jest': { category: 'testing', name: 'Jest testing framework' },
  'playwright': { category: 'testing', name: 'Playwright E2E testing' },
  '@playwright/test': { category: 'testing', name: 'Playwright test runner' },
  'cypress': { category: 'testing', name: 'Cypress E2E testing' },

  // Quality
  'eslint': { category: 'quality', name: 'ESLint linting' },
  'prettier': { category: 'quality', name: 'Prettier code formatting' },
  'husky': { category: 'quality', name: 'Husky git hooks' },
  'lint-staged': { category: 'quality', name: 'lint-staged pre-commit' },

  // Billing
  'stripe': { category: 'billing', name: 'Stripe payments' },

  // Queue
  'bullmq': { category: 'queue', name: 'BullMQ job queue' },

  // Realtime
  'socket.io': { category: 'realtime', name: 'Socket.IO realtime' },
  'pusher': { category: 'realtime', name: 'Pusher realtime' },
  'pusher-js': { category: 'realtime', name: 'Pusher JS client' },

  // Media
  'uploadthing': { category: 'media', name: 'UploadThing file uploads' },
  'sharp': { category: 'media', name: 'Sharp image processing' },

  // Design System
  'preline': { category: 'ui', name: 'Preline UI design system' },
};

function readFileIfExists(path: string): string | null {
  if (!existsSync(path)) return null;
  try {
    return readFileSync(path, 'utf8');
  } catch {
    return null;
  }
}

function scanCursorRules(projectDir: string): ScanResult | null {
  const content = readFileIfExists(join(projectDir, '.cursorrules'));
  if (!content) return null;

  const patterns: PatternMatch[] = [];

  const sectionRegex = /^##\s+(.+)/gm;
  let match: RegExpExecArray | null;
  while ((match = sectionRegex.exec(content)) !== null) {
    patterns.push({
      category: 'coding-style',
      name: `Cursor rule section: ${match[1].trim()}`,
      confidence: 90,
    });
  }

  if (/octane/i.test(content)) {
    patterns.push({ category: 'server', name: 'Octane patterns defined in .cursorrules', confidence: 95 });
  }
  if (/inertia/i.test(content)) {
    patterns.push({ category: 'frontend', name: 'Inertia.js patterns defined in .cursorrules', confidence: 95 });
  }
  if (/sanctum/i.test(content)) {
    patterns.push({ category: 'auth', name: 'Sanctum auth patterns defined in .cursorrules', confidence: 95 });
  }
  if (/uuid/i.test(content)) {
    patterns.push({ category: 'database', name: 'UUIDs as primary keys', confidence: 90 });
  }
  if (/snake_case/i.test(content) || /camelCase/i.test(content)) {
    patterns.push({ category: 'coding-style', name: 'Naming conventions defined', confidence: 85 });
  }
  if (/tailwind/i.test(content)) {
    patterns.push({ category: 'frontend', name: 'TailwindCSS styling', confidence: 90 });
  }
  if (/react/i.test(content)) {
    patterns.push({ category: 'frontend', name: 'ReactJS frontend', confidence: 90 });
  }
  if (/migration/i.test(content) && /never|forbidden|fresh/i.test(content)) {
    patterns.push({ category: 'database', name: 'Migration safety rules defined', confidence: 95 });
  }

  if (patterns.length === 0) return null;

  return { source: '.cursorrules', patterns };
}

function scanComposerJson(projectDir: string): ScanResult | null {
  const content = readFileIfExists(join(projectDir, 'composer.json'));
  if (!content) return null;

  let composer: { require?: Record<string, string>; 'require-dev'?: Record<string, string> };
  try {
    composer = JSON.parse(content);
  } catch {
    return null;
  }

  const patterns: PatternMatch[] = [];
  const allDeps = { ...composer.require, ...composer['require-dev'] };

  for (const [pkg, meta] of Object.entries(COMPOSER_PACKAGES)) {
    if (allDeps[pkg]) {
      patterns.push({
        category: meta.category,
        name: meta.name,
        confidence: 100,
        detail: `${pkg}: ${allDeps[pkg]}`,
      });
    }
  }

  const phpVersion = allDeps['php'];
  if (phpVersion) {
    patterns.push({
      category: 'runtime',
      name: `PHP version constraint: ${phpVersion}`,
      confidence: 100,
    });
  }

  if (patterns.length === 0) return null;

  return { source: 'composer.json', patterns };
}

function scanPhpStan(projectDir: string): ScanResult | null {
  const content =
    readFileIfExists(join(projectDir, 'phpstan.neon')) ||
    readFileIfExists(join(projectDir, 'phpstan.neon.dist'));
  if (!content) return null;

  const patterns: PatternMatch[] = [];

  const levelMatch = content.match(/level:\s*(\d+|max)/);
  if (levelMatch) {
    patterns.push({
      category: 'quality',
      name: `PHPStan level: ${levelMatch[1]}`,
      confidence: 100,
      detail: `level: ${levelMatch[1]}`,
    });
  }

  const baselineMatch = content.match(/baseline/i);
  if (baselineMatch) {
    patterns.push({
      category: 'quality',
      name: 'PHPStan baseline in use',
      confidence: 90,
    });
  }

  if (patterns.length === 0) return null;

  return { source: 'phpstan.neon', patterns };
}

// ─── Node.js Scanners ──────────────────────────────────────────────────────

function scanPackageJson(projectDir: string): ScanResult | null {
  const content = readFileIfExists(join(projectDir, 'package.json'));
  if (!content) return null;

  let pkg: {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
    engines?: Record<string, string>;
    scripts?: Record<string, string>;
  };
  try {
    pkg = JSON.parse(content);
  } catch {
    return null;
  }

  const patterns: PatternMatch[] = [];
  const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };

  for (const [dep, meta] of Object.entries(NPM_PACKAGES)) {
    if (allDeps[dep]) {
      patterns.push({
        category: meta.category,
        name: meta.name,
        confidence: 100,
        detail: `${dep}: ${allDeps[dep]}`,
      });
    }
  }

  const nodeVersion = pkg.engines?.['node'];
  if (nodeVersion) {
    patterns.push({
      category: 'runtime',
      name: `Node.js version constraint: ${nodeVersion}`,
      confidence: 100,
    });
  }

  const bunVersion = pkg.engines?.['bun'];
  if (bunVersion) {
    patterns.push({
      category: 'runtime',
      name: `Bun version constraint: ${bunVersion}`,
      confidence: 100,
    });
  }

  if (pkg.scripts) {
    if (pkg.scripts['typecheck'] || pkg.scripts['type-check']) {
      patterns.push({ category: 'quality', name: 'TypeScript type checking configured', confidence: 90 });
    }
    if (pkg.scripts['lint']) {
      patterns.push({ category: 'quality', name: 'Lint script configured', confidence: 85 });
    }
    if (pkg.scripts['test']) {
      patterns.push({ category: 'testing', name: 'Test script configured', confidence: 85 });
    }
  }

  if (patterns.length === 0) return null;

  return { source: 'package.json', patterns };
}

function scanTsConfig(projectDir: string): ScanResult | null {
  const content = readFileIfExists(join(projectDir, 'tsconfig.json'));
  if (!content) return null;

  const patterns: PatternMatch[] = [];

  if (/"strict"\s*:\s*true/i.test(content)) {
    patterns.push({ category: 'quality', name: 'TypeScript strict mode enabled', confidence: 100 });
  }

  if (/"paths"\s*:/i.test(content)) {
    patterns.push({ category: 'coding-style', name: 'Path aliases configured', confidence: 90 });
  }

  const targetMatch = content.match(/"target"\s*:\s*"(\w+)"/i);
  if (targetMatch) {
    patterns.push({
      category: 'runtime',
      name: `TypeScript target: ${targetMatch[1]}`,
      confidence: 95,
      detail: `target: ${targetMatch[1]}`,
    });
  }

  if (/"noUncheckedIndexedAccess"\s*:\s*true/i.test(content)) {
    patterns.push({ category: 'quality', name: 'Strict index access enabled', confidence: 95 });
  }

  if (patterns.length === 0) return null;

  return { source: 'tsconfig.json', patterns };
}

function scanEslintConfig(projectDir: string): ScanResult | null {
  const configFiles = [
    'eslint.config.js', 'eslint.config.mjs', 'eslint.config.ts',
    '.eslintrc.js', '.eslintrc.cjs', '.eslintrc.json', '.eslintrc.yml',
  ];

  let found = false;
  for (const file of configFiles) {
    if (existsSync(join(projectDir, file))) {
      found = true;
      break;
    }
  }

  if (!found) return null;

  return {
    source: 'eslint config',
    patterns: [
      { category: 'quality', name: 'ESLint config present', confidence: 100 },
    ],
  };
}

// ─── Shared Scanners ───────────────────────────────────────────────────────

function scanProjectFiles(projectDir: string): ScanResult | null {
  const patterns: PatternMatch[] = [];

  if (existsSync(join(projectDir, 'rr.yaml')) || existsSync(join(projectDir, '.rr.yaml'))) {
    patterns.push({ category: 'server', name: 'RoadRunner config present (Octane)', confidence: 100 });
  }

  const csFixerExists =
    existsSync(join(projectDir, '.php-cs-fixer.php')) ||
    existsSync(join(projectDir, '.php-cs-fixer.dist.php'));
  if (csFixerExists) {
    patterns.push({ category: 'quality', name: 'PHP-CS-Fixer config present', confidence: 100 });
  }

  const phpunitExists =
    existsSync(join(projectDir, 'phpunit.xml')) ||
    existsSync(join(projectDir, 'phpunit.xml.dist'));
  if (phpunitExists) {
    patterns.push({ category: 'testing', name: 'PHPUnit config present', confidence: 100 });
  }

  const dockerExists =
    existsSync(join(projectDir, 'docker-compose.yml')) ||
    existsSync(join(projectDir, 'docker-compose.yaml'));
  if (dockerExists) {
    patterns.push({ category: 'deploy', name: 'Docker Compose setup present', confidence: 90 });
  }

  // ── Node.js: Framework configs ──
  const nextConfigExists =
    existsSync(join(projectDir, 'next.config.js')) ||
    existsSync(join(projectDir, 'next.config.mjs')) ||
    existsSync(join(projectDir, 'next.config.ts'));
  if (nextConfigExists) {
    patterns.push({ category: 'framework', name: 'Next.js config present', confidence: 100 });
  }

  if (existsSync(join(projectDir, 'nuxt.config.ts')) || existsSync(join(projectDir, 'nuxt.config.js'))) {
    patterns.push({ category: 'framework', name: 'Nuxt config present', confidence: 100 });
  }

  if (existsSync(join(projectDir, 'astro.config.mjs')) || existsSync(join(projectDir, 'astro.config.ts'))) {
    patterns.push({ category: 'framework', name: 'Astro config present', confidence: 100 });
  }

  if (existsSync(join(projectDir, 'svelte.config.js')) || existsSync(join(projectDir, 'svelte.config.ts'))) {
    patterns.push({ category: 'framework', name: 'SvelteKit config present', confidence: 100 });
  }

  // ── Node.js: Frontend & UI ──
  if (existsSync(join(projectDir, 'tailwind.config.ts')) || existsSync(join(projectDir, 'tailwind.config.js'))) {
    patterns.push({ category: 'frontend', name: 'TailwindCSS config present', confidence: 100 });
  }

  if (existsSync(join(projectDir, 'postcss.config.js')) || existsSync(join(projectDir, 'postcss.config.mjs'))) {
    patterns.push({ category: 'frontend', name: 'PostCSS config present', confidence: 85 });
  }

  if (existsSync(join(projectDir, 'components.json'))) {
    patterns.push({ category: 'ui', name: 'shadcn/ui components.json present', confidence: 95 });
  }

  // ── Node.js: Database configs ──
  if (existsSync(join(projectDir, 'prisma/schema.prisma'))) {
    patterns.push({ category: 'database', name: 'Prisma schema present', confidence: 100 });
  }

  if (existsSync(join(projectDir, 'drizzle.config.ts')) || existsSync(join(projectDir, 'drizzle.config.js'))) {
    patterns.push({ category: 'database', name: 'Drizzle config present', confidence: 100 });
  }

  // ── Node.js: Testing configs ──
  if (existsSync(join(projectDir, 'vitest.config.ts')) || existsSync(join(projectDir, 'vitest.config.js'))) {
    patterns.push({ category: 'testing', name: 'Vitest config present', confidence: 100 });
  }

  if (existsSync(join(projectDir, 'playwright.config.ts'))) {
    patterns.push({ category: 'testing', name: 'Playwright config present', confidence: 100 });
  }

  if (existsSync(join(projectDir, 'cypress.config.ts')) || existsSync(join(projectDir, 'cypress.config.js'))) {
    patterns.push({ category: 'testing', name: 'Cypress config present', confidence: 100 });
  }

  if (existsSync(join(projectDir, 'jest.config.ts')) || existsSync(join(projectDir, 'jest.config.js'))) {
    patterns.push({ category: 'testing', name: 'Jest config present', confidence: 100 });
  }

  // ── Node.js: Package manager ──
  if (existsSync(join(projectDir, 'bun.lockb')) || existsSync(join(projectDir, 'bun.lock'))) {
    patterns.push({ category: 'runtime', name: 'Bun package manager in use', confidence: 100 });
  } else if (existsSync(join(projectDir, 'pnpm-lock.yaml'))) {
    patterns.push({ category: 'runtime', name: 'pnpm package manager in use', confidence: 100 });
  } else if (existsSync(join(projectDir, 'yarn.lock'))) {
    patterns.push({ category: 'runtime', name: 'Yarn package manager in use', confidence: 100 });
  }

  // ── Deploy targets ──
  if (existsSync(join(projectDir, 'vercel.json'))) {
    patterns.push({ category: 'deploy', name: 'Vercel deployment config', confidence: 100 });
  }

  if (existsSync(join(projectDir, 'netlify.toml'))) {
    patterns.push({ category: 'deploy', name: 'Netlify deployment config', confidence: 100 });
  }

  if (existsSync(join(projectDir, 'fly.toml'))) {
    patterns.push({ category: 'deploy', name: 'Fly.io deployment config', confidence: 100 });
  }

  if (existsSync(join(projectDir, 'railway.toml')) || existsSync(join(projectDir, 'railway.json'))) {
    patterns.push({ category: 'deploy', name: 'Railway deployment config', confidence: 100 });
  }

  if (existsSync(join(projectDir, 'Dockerfile'))) {
    patterns.push({ category: 'deploy', name: 'Dockerfile present', confidence: 95 });
  }

  // ── Quality / Git hooks ──
  if (existsSync(join(projectDir, '.husky'))) {
    patterns.push({ category: 'quality', name: 'Husky git hooks configured', confidence: 100 });
  }

  if (existsSync(join(projectDir, '.lintstagedrc')) || existsSync(join(projectDir, '.lintstagedrc.json'))) {
    patterns.push({ category: 'quality', name: 'lint-staged config present', confidence: 95 });
  }

  if (existsSync(join(projectDir, '.prettierrc')) || existsSync(join(projectDir, '.prettierrc.json')) || existsSync(join(projectDir, 'prettier.config.js'))) {
    patterns.push({ category: 'quality', name: 'Prettier config present', confidence: 100 });
  }

  // ── UI/UX Skills ──
  if (
    existsSync(join(projectDir, '.cursor', 'skills', 'ui-ux-pro-max', 'SKILL.md')) ||
    existsSync(join(projectDir, '.claude', 'skills', 'ui-ux-pro-max', 'SKILL.md'))
  ) {
    patterns.push({ category: 'ui', name: 'UI/UX Pro Max skill installed', confidence: 100 });
  }

  // Environment files (works for both PHP and Node.js projects)
  const envFiles = ['.env.example', '.env', '.env.local', '.env.development', '.env.production'];
  let envContent: string | null = null;
  for (const envFile of envFiles) {
    const content = readFileIfExists(join(projectDir, envFile));
    if (content) {
      envContent = (envContent || '') + '\n' + content;
    }
  }
  if (envContent) {
    if (/REDIS_HOST|REDIS_URL/i.test(envContent)) {
      patterns.push({ category: 'cache', name: 'Redis configured', confidence: 85 });
    }
    if (/PUSHER_|BROADCAST_|NEXT_PUBLIC_PUSHER/i.test(envContent)) {
      patterns.push({ category: 'realtime', name: 'Broadcasting/Pusher configured', confidence: 80 });
    }
    if (/MAIL_MAILER|RESEND_API|SENDGRID/i.test(envContent)) {
      patterns.push({ category: 'mail', name: 'Mail service configured', confidence: 75 });
    }
    if (/DATABASE_URL|DB_CONNECTION/i.test(envContent)) {
      patterns.push({ category: 'database', name: 'Database connection configured', confidence: 80 });
    }
    if (/STRIPE_SECRET|STRIPE_KEY/i.test(envContent)) {
      patterns.push({ category: 'billing', name: 'Stripe payments configured', confidence: 85 });
    }

    // Security: detect NEXT_PUBLIC_ with sensitive values
    const sensitivePublicEnv = envContent.match(/^NEXT_PUBLIC_\w*(SECRET|TOKEN|PRIVATE|PASSWORD|CREDENTIAL|OPENAI|API_KEY|DATABASE)\w*\s*=/gmi);
    if (sensitivePublicEnv) {
      for (const found of sensitivePublicEnv) {
        const varName = found.split('=')[0].trim();
        patterns.push({
          category: 'security',
          name: `EXPOSED SECRET: ${varName} is public (visible in browser)`,
          confidence: 100,
          detail: `${varName} uses NEXT_PUBLIC_ prefix which embeds the value in the client JS bundle. Remove NEXT_PUBLIC_ and access via Route Handler or Server Action.`,
        });
      }
    }
  }

  if (patterns.length === 0) return null;

  return { source: 'project files', patterns };
}

/**
 * Run all scanners against a project directory.
 * Returns combined results from all sources.
 */
export function scanProjectStandards(projectDir: string): StandardsReview {
  const scanners = [
    scanCursorRules,
    scanComposerJson,
    scanPhpStan,
    scanPackageJson,
    scanTsConfig,
    scanEslintConfig,
    scanProjectFiles,
  ];

  const results: ScanResult[] = [];
  for (const scanner of scanners) {
    const result = scanner(projectDir);
    if (result) {
      results.push(result);
    }
  }

  const allPatterns = results.flatMap((r) => r.patterns);
  const sources = results.map((r) => r.source);

  return {
    status: results.length > 0 ? 'pending' : 'defaults',
    scannedAt: new Date().toISOString().split('T')[0],
    sources,
    patterns: allPatterns,
    userChoice: 'pending',
  };
}
