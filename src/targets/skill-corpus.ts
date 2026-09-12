/**
 * Offline UI corpora (Preline moon, …) must not be clobbered by migrate/setup.
 *
 * The npm package ships a thin pointer for `preline-moon`. Consumer projects
 * (and ~/.claude/skills) may hold a much newer capture (e.g. 5.0, ~100 MB).
 * `copySkillBundle` / `copySkillTree` follow symlinks — a dest link to the
 * global tree would overwrite that capture with the bundled pointer (or the
 * old 4.2.0 dump). Never write through a symlink. Never replace a dest that
 * already has examples/ or data/index.json.
 */
import { existsSync, lstatSync, readdirSync } from 'fs';
import { join } from 'path';

export const CORPUS_SKILL_NAMES = new Set(['preline-moon']);

export function isSymlinkPath(p: string): boolean {
  try {
    return lstatSync(p).isSymbolicLink();
  } catch {
    return false;
  }
}

export function destHasLocalCorpus(skillDir: string): boolean {
  if (!existsSync(skillDir)) return false;
  const data = join(skillDir, 'data', 'index.json');
  const examples = join(skillDir, 'examples');
  if (existsSync(data)) return true;
  if (!existsSync(examples)) return false;
  try {
    return readdirSync(examples).length > 0;
  } catch {
    return false;
  }
}

/** Skip copy into dest — symlink (write-through) or a real local capture. */
export function shouldSkipCorpusWrite(destSkillDir: string): boolean {
  if (isSymlinkPath(destSkillDir)) return true;
  if (isSymlinkPath(join(destSkillDir, 'SKILL.md'))) return true;
  return destHasLocalCorpus(destSkillDir);
}
