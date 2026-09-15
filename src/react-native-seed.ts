/**
 * Optional Expo app seed when the project tree has no app yet.
 * Never overwrites an existing app.json / app/_layout.tsx.
 */

import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'fs';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';

const PACKAGE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

export const EXPO_APP_KINDS = new Set(['expo-tabs', 'expo-auth-panel', 'expo-blank']);

export function seedReactNativeApp(
  projectDir: string,
  opts: { framework: string; projectName: string; force?: boolean }
): { seeded: number; skipped: string | null } {
  if (!EXPO_APP_KINDS.has(opts.framework)) {
    return { seeded: 0, skipped: 'bare React Native — no Expo seed (skills/memories only)' };
  }

  const already =
    existsSync(join(projectDir, 'app.json')) ||
    existsSync(join(projectDir, 'app.config.ts')) ||
    existsSync(join(projectDir, 'app', '_layout.tsx'));
  if (already && !opts.force) {
    return { seeded: 0, skipped: 'existing Expo/RN tree — left untouched' };
  }

  const src = join(PACKAGE_ROOT, 'stacks', 'react-native', 'app-templates', opts.framework);
  if (!existsSync(src)) {
    return { seeded: 0, skipped: `bundled template missing (${opts.framework})` };
  }

  const slug = opts.projectName.replace(/[^a-zA-Z0-9_-]/g, '-') || 'app';
  const shared = join(PACKAGE_ROOT, 'stacks', 'react-native', 'app-templates', '_shared');
  let seeded = 0;
  if (existsSync(shared)) {
    seeded += copyTemplate(shared, projectDir, slug, Boolean(opts.force));
  }
  seeded += copyTemplate(src, projectDir, slug, Boolean(opts.force));
  return { seeded, skipped: null };
}

function copyTemplate(src: string, dest: string, slug: string, overwrite: boolean): number {
  let count = 0;
  mkdirSync(dest, { recursive: true });
  for (const entry of readdirSync(src)) {
    if (entry.startsWith('.')) continue;
    const from = join(src, entry);
    const to = join(dest, entry);
    const st = statSync(from);
    if (st.isDirectory()) {
      count += copyTemplate(from, to, slug, overwrite);
      continue;
    }
    if (existsSync(to) && !overwrite) continue;
    let body = readFileSync(from, 'utf8');
    body = body.replaceAll('{{PROJECT_NAME}}', slug).replaceAll('{{PROJECT_SLUG}}', slug);
    mkdirSync(dirname(to), { recursive: true });
    writeFileSync(to, body);
    count++;
  }
  return count;
}
