/**
 * Write user-level ~/.grok/config.toml SVS:COMPAT block.
 *
 * Grok docs (Claude Code Compatibility):
 * - Loads ~/.claude.json MCP + Claude plugins (incl. vercel OAuth) by default
 * - Project .grok/config.toml may only set mcp_servers / plugins / permission
 * - [compat.*] belongs in ~/.grok/config.toml only
 *
 * Without this block, every Grok session merges global Claude MCP + vercel
 * plugin and often hangs on OAuth before skills/hooks/agents appear.
 *
 * skills=false: Claude global trees (e.g. cybersecurity-suite ~750 SKILL.md)
 * make session.create take many minutes. Native skills stay in .grok/skills/.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { homedir } from 'os';
import { dirname, join } from 'path';

export const GROK_USER_CONFIG_VERSION = '1.1.0';

const COMPAT_BLOCK_RE = /# SVS:COMPAT:START[\s\S]*?# SVS:COMPAT:END\n?/;

export interface GrokUserConfigResult {
  written: boolean;
  version: string;
  path: string;
  skippedReason?: string;
}

function homeDir(): string {
  return process.env['HOME'] || process.env['USERPROFILE'] || homedir();
}

/**
 * @param stackId — when not `nodejs`, keep vercel plugin disabled (OAuth hang).
 *   On nodejs we still disable the Claude vercel *plugin* MCP; Next tools come
 *   from project `nextjs-devtools` stdio export instead.
 */
export function grokUserCompatBlock(_stackId?: string | null): string {
  return [
    '# SVS:COMPAT:START — managed by start-vibing-stacks migrate',
    `# svs-version: ${GROK_USER_CONFIG_VERSION}`,
    '# Stop global Claude/Cursor MCP dump + vercel plugin OAuth from hanging Grok.',
    '# skills=false: avoid loading ~/.claude/skills trees (cybersecurity-suite etc.)',
    '# that make session.create take many minutes. Use .grok/skills/ + project agents.',
    '# Flip skills=true only if you need Claude skill parity and accept slow boot.',
    '[compat.claude]',
    'mcps = false',
    'hooks = false',
    'skills = false',
    'agents = true',
    'rules = true',
    '',
    '[compat.cursor]',
    'mcps = false',
    'hooks = false',
    'skills = false',
    'rules = true',
    '',
    '[plugins]',
    '# Claude plugin vercel ships https://mcp.vercel.com (OAuth). Disable for Grok boot.',
    'disabled = ["vercel"]',
    '# SVS:COMPAT:END',
    '',
  ].join('\n');
}

export function grokUserConfigNeedsUpdate(): boolean {
  const path = join(homeDir(), '.grok', 'config.toml');
  if (!existsSync(path)) return true;
  try {
    const raw = readFileSync(path, 'utf8');
    if (!COMPAT_BLOCK_RE.test(raw)) return true;
    if (!raw.includes(`svs-version: ${GROK_USER_CONFIG_VERSION}`)) return true;
    // Orphan compat tables before/outside SVS markers (skills=true duplicates)
    const without = raw.replace(COMPAT_BLOCK_RE, '');
    if (/\[compat\.(?:claude|cursor)\]/.test(without)) return true;
    return false;
  } catch {
    return true;
  }
}

/**
 * Remove orphan `[compat.*]` / duplicate `[plugins] disabled` that sit *outside*
 * the SVS:COMPAT markers (older manual edits). Keeps marketplace/ui/models intact.
 */
function stripOrphanCompatSections(toml: string): string {
  let out = toml.replace(COMPAT_BLOCK_RE, '\n__SVS_COMPAT_PLACEHOLDER__\n');
  // Drop bare compat.claude / compat.cursor tables (until next [section] or EOF)
  out = out.replace(
    /\n\[compat\.(?:claude|cursor)\]\n(?:[^\[]|\n)*?(?=\n\[|\n*$)/g,
    '\n'
  );
  // Drop bare [plugins] that only set disabled = [...] (SVS owns that)
  out = out.replace(
    /\n\[plugins\]\n(?:#.*\n)*disabled\s*=\s*\[[^\]]*\]\s*\n?/g,
    '\n'
  );
  return out.replace(/\n{3,}/g, '\n\n');
}

export function exportGrokUserConfig(
  opts: { force?: boolean; stack?: string | null } = {}
): GrokUserConfigResult {
  const path = join(homeDir(), '.grok', 'config.toml');
  const block = grokUserCompatBlock(opts.stack);
  const need = opts.force || grokUserConfigNeedsUpdate();
  if (!need) {
    return {
      written: false,
      version: GROK_USER_CONFIG_VERSION,
      path,
      skippedReason: 'Grok user compat current',
    };
  }

  mkdirSync(dirname(path), { recursive: true });
  if (!existsSync(path)) {
    writeFileSync(
      path,
      [
        '# Grok user config — SVS compat block managed by start-vibing-stacks',
        '',
        block,
      ].join('\n')
    );
    return { written: true, version: GROK_USER_CONFIG_VERSION, path };
  }

  let existing = readFileSync(path, 'utf8');
  existing = stripOrphanCompatSections(existing);
  if (existing.includes('__SVS_COMPAT_PLACEHOLDER__')) {
    writeFileSync(
      path,
      existing.replace('__SVS_COMPAT_PLACEHOLDER__', block.trimEnd())
    );
  } else if (COMPAT_BLOCK_RE.test(existing)) {
    writeFileSync(path, existing.replace(COMPAT_BLOCK_RE, block.trimEnd() + '\n'));
  } else {
    writeFileSync(path, existing.replace(/\s*$/, '\n\n') + block);
  }
  return { written: true, version: GROK_USER_CONFIG_VERSION, path };
}
