/**
 * Tells the user when the optional Jev prompt judge will run in this project.
 * Mirrors `readTypesafeKey` in stacks/_shared/hooks/jev-judge.ts (names + SVS_JEV=0).
 * Reports only the variable name. Never reads the value into output.
 */

import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import * as ui from './ui.js';

const KEY_NAMES = ['SVS_JEV_KEY', 'TYPESAFE_API_KEY'] as const;
type KeyName = (typeof KEY_NAMES)[number];

function envFileHas(projectDir: string, name: KeyName): boolean {
  const path = join(projectDir, '.env');
  if (!existsSync(path)) return false;
  try {
    for (const raw of readFileSync(path, 'utf8').split('\n')) {
      let line = raw.trim();
      if (!line || line.startsWith('#')) continue;
      if (line.startsWith('export ')) line = line.slice(7).trim();
      const eq = line.indexOf('=');
      if (eq < 0 || line.slice(0, eq).trim() !== name) continue;
      const value = line.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
      return value.length > 0;
    }
  } catch {
    return false;
  }
  return false;
}

export function detectJevKey(projectDir: string): { name: KeyName; from: 'env' | '.env' } | null {
  if ((process.env['SVS_JEV'] || '').trim() === '0') return null;
  for (const name of KEY_NAMES) {
    if ((process.env[name] || '').trim()) return { name, from: 'env' };
    if (envFileHas(projectDir, name)) return { name, from: '.env' };
  }
  return null;
}

export function printJevNotice(projectDir: string): void {
  const hit = detectJevKey(projectDir);
  if (!hit) return;
  ui.info(
    `Jev prompt judge ON (${hit.name} in ${hit.from}). Each non-status prompt is sent, redacted, to api.typesafe.ai.`
  );
  if (hit.name === 'TYPESAFE_API_KEY') {
    ui.info('If that key belongs to your app, set SVS_JEV_KEY for the agent or SVS_JEV=0 to turn the judge off.');
  } else {
    ui.info('SVS_JEV=0 turns it off.');
  }
}
