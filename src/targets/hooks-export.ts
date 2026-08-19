/**
 * Phase 7: export Claude hooks → Kimi ([[hooks]]) + Grok (.grok/hooks/svs.json)
 * via shared svs-bridge.mjs (stdin/stdout normalization).
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { homedir } from 'os';
import { dirname, join } from 'path';

export const HOOKS_EXPORT_VERSION = '1.9.0';
export const GROK_HOOKS_REL = '.grok/hooks/svs.json';

const KIMI_HOOKS_BLOCK_RE = /# SVS:HOOKS:START[\s\S]*?# SVS:HOOKS:END\n?/;
const GROK_COMPAT_BLOCK_RE = /# SVS:COMPAT:START[\s\S]*?# SVS:COMPAT:END\n?/;

/** Edit-class tools across Claude / Kimi / Grok naming (Grok Build 1.0 real names). */
const EDIT_MATCHER =
  'Edit|Write|MultiEdit|NotebookEdit|WriteFile|StrReplaceFile|StrReplace|search_replace|write_file|write';

interface HookSpec {
  event: string;
  matcher?: string;
  hook: string;
  timeout: number;
}

/** Full set for Kimi [[hooks]]. */
const HOOK_SPECS: HookSpec[] = [
  { event: 'SessionStart', hook: 'session-start', timeout: 15 },
  { event: 'UserPromptSubmit', hook: 'user-prompt-submit', timeout: 15 },
  { event: 'PreToolUse', matcher: EDIT_MATCHER, hook: 'pre-tool-use', timeout: 10 },
  { event: 'PreToolUse', matcher: EDIT_MATCHER, hook: 'plan-gate', timeout: 10 },
  { event: 'PostToolUse', matcher: EDIT_MATCHER, hook: 'post-tool-use', timeout: 10 },
  { event: 'PreCompact', hook: 'pre-compact', timeout: 10 },
  // Grok Build 1.0 defaults Stop gates to 600s; 90s covers validate + hint I/O.
  { event: 'Stop', hook: 'stop-validator', timeout: 90 },
  { event: 'SessionEnd', hook: 'stop-validator', timeout: 15 },
];

/**
 * Grok native `.grok/hooks/svs.json` — shared `.claude/state` + brain parity.
 * PreCompact stamps brain before product /compact (when the event is emitted).
 * Keep compat.claude.hooks=false so hooks do not double-fire.
 * Grok 1.0: Stop supports decision:block (max 8 continuations/turn); trust via
 * `/hooks-trust` or `grok --trust`.
 */
const SPAWN_MATCHER = 'spawn_subagent|Task';

const GROK_HOOK_SPECS: HookSpec[] = [
  { event: 'SessionStart', hook: 'session-start', timeout: 15 },
  { event: 'UserPromptSubmit', hook: 'user-prompt-submit', timeout: 15 },
  { event: 'PreToolUse', matcher: EDIT_MATCHER, hook: 'pre-tool-use', timeout: 10 },
  { event: 'PreToolUse', matcher: EDIT_MATCHER, hook: 'plan-gate', timeout: 10 },
  { event: 'PreToolUse', matcher: SPAWN_MATCHER, hook: 'grok-spawn-pin', timeout: 10 },
  { event: 'PostToolUse', matcher: EDIT_MATCHER, hook: 'post-tool-use', timeout: 10 },
  { event: 'PreCompact', hook: 'pre-compact', timeout: 10 },
  { event: 'Stop', hook: 'stop-validator', timeout: 90 },
  { event: 'SessionEnd', hook: 'stop-validator', timeout: 15 },
];

export interface HooksExportResult {
  kimiLocalUpdated: boolean;
  kimiUserUpdated: boolean;
  grokHooksWritten: boolean;
  grokCompatUpdated: boolean;
  version: string;
  skippedReason?: string;
}

function bridgeCmd(target: 'kimi' | 'grok', hook: string): string {
  // Both CLIs run hook commands with cwd = project root.
  // Grok docs say "executable path relative to the JSON file", but an *inline*
  // `node …` command is resolved by Node against process.cwd() — so
  // `../../.claude/hooks/…` from `.grok/hooks/svs.json` becomes
  // `<parent-of-repo>/.claude/hooks/…` → MODULE_NOT_FOUND / exit 1 (fail-open).
  // Evidence: pubweb session 019faa63 — 17/17 Stop hooks failed ~50ms, no block.
  return `node .claude/hooks/svs-bridge.mjs ${target} ${hook}`;
}

function kimiHooksTomlBlock(): string {
  const lines = [
    '# SVS:HOOKS:START — managed by start-vibing-stacks migrate',
    `# svs-version: ${HOOKS_EXPORT_VERSION}`,
    '# Bridge → .claude/hooks/*.ts (fail-open). Prefer also in ~/.kimi-code/config.toml',
    '# (Kimi loads [[hooks]] from user config; local.toml is best-effort merge).',
  ];
  for (const h of HOOK_SPECS) {
    lines.push('[[hooks]]');
    lines.push(`event = ${JSON.stringify(h.event)}`);
    if (h.matcher) lines.push(`matcher = ${JSON.stringify(h.matcher)}`);
    lines.push(`command = ${JSON.stringify(bridgeCmd('kimi', h.hook))}`);
    lines.push(`timeout = ${h.timeout}`);
    lines.push('');
  }
  lines.push('# SVS:HOOKS:END');
  lines.push('');
  return lines.join('\n');
}

function grokHooksJson(): string {
  const hooks: Record<string, Array<{ matcher?: string; hooks: Array<Record<string, unknown>> }>> =
    {};

  for (const h of GROK_HOOK_SPECS) {
    if (!hooks[h.event]) hooks[h.event] = [];
    const entry: { matcher?: string; hooks: Array<Record<string, unknown>> } = {
      hooks: [
        {
          type: 'command',
          command: bridgeCmd('grok', h.hook),
          timeout: h.timeout,
        },
      ],
    };
    if (h.matcher) entry.matcher = h.matcher;
    const existing = hooks[h.event]!.find((b) => (b.matcher || '') === (h.matcher || ''));
    if (existing) {
      existing.hooks.push(entry.hooks[0]!);
    } else {
      hooks[h.event]!.push(entry);
    }
  }

  return (
    JSON.stringify(
      {
        _svs: {
          version: HOOKS_EXPORT_VERSION,
          note: 'SVS bridge → Claude hooks. Command uses project-cwd path (.claude/hooks/svs-bridge.mjs). Trust: /hooks-trust. User [compat.claude] hooks=false via migrate.',
        },
        hooks,
      },
      null,
      2
    ) + '\n'
  );
}

export function hooksExportNeedsUpdate(projectDir: string): {
  kimiMissing: boolean;
  grokMissing: boolean;
  outdated: boolean;
} {
  const localPath = join(projectDir, '.kimi-code', 'local.toml');
  let kimiMissing = true;
  let outdated = false;
  if (existsSync(localPath)) {
    const raw = readFileSync(localPath, 'utf8');
    kimiMissing = !KIMI_HOOKS_BLOCK_RE.test(raw);
    if (!kimiMissing && !raw.includes(`svs-version: ${HOOKS_EXPORT_VERSION}`)) {
      // version comment may be in HOOKS or KIMI block — check hooks section
      const m = raw.match(KIMI_HOOKS_BLOCK_RE);
      if (m && !m[0].includes(`svs-version: ${HOOKS_EXPORT_VERSION}`)) outdated = true;
    }
  }

  const grokPath = join(projectDir, GROK_HOOKS_REL);
  const grokMissing = !existsSync(grokPath);
  if (!grokMissing) {
    try {
      const j = JSON.parse(readFileSync(grokPath, 'utf8'));
      if (j?._svs?.version !== HOOKS_EXPORT_VERSION) outdated = true;
    } catch {
      outdated = true;
    }
  }

  // Illegal project [compat.claude] — strip on next export
  const grokConfig = join(projectDir, '.grok', 'config.toml');
  if (existsSync(grokConfig) && GROK_COMPAT_BLOCK_RE.test(readFileSync(grokConfig, 'utf8'))) {
    outdated = true;
  }

  const bridge = join(projectDir, '.claude', 'hooks', 'svs-bridge.mjs');
  if (!existsSync(bridge)) {
    return { kimiMissing: true, grokMissing: true, outdated: true };
  }

  return { kimiMissing, grokMissing, outdated };
}

function upsertTomlBlock(
  path: string,
  block: string,
  re: RegExp,
  header: string[],
  force: boolean
): boolean {
  mkdirSync(dirname(path), { recursive: true });
  if (!existsSync(path)) {
    writeFileSync(path, [...header, '', block].join('\n'));
    return true;
  }
  const existing = readFileSync(path, 'utf8');
  if (re.test(existing)) {
    const m = existing.match(re);
    if (!force && m?.[0]?.includes(`svs-version: ${HOOKS_EXPORT_VERSION}`)) return false;
    writeFileSync(path, existing.replace(re, block.trimEnd() + '\n'));
    return true;
  }
  writeFileSync(path, existing.replace(/\s*$/, '\n\n') + block);
  return true;
}

/** Patch project .kimi-code/local.toml with [[hooks]] (best-effort). */
export function exportKimiHooksLocal(projectDir: string, opts: { force?: boolean } = {}): boolean {
  return upsertTomlBlock(
    join(projectDir, '.kimi-code', 'local.toml'),
    kimiHooksTomlBlock(),
    KIMI_HOOKS_BLOCK_RE,
    [
      '# Kimi Code project-local config (gitignored — absolute paths)',
      '# Created by start-vibing-stacks.',
    ],
    opts.force === true
  );
}

/**
 * Patch ~/.kimi-code/config.toml — official place for [[hooks]].
 * Commands are project-relative (cwd = session project), so one block serves all SVS projects.
 */
export function exportKimiHooksUser(opts: { force?: boolean } = {}): boolean {
  const home = process.env['HOME'] || process.env['USERPROFILE'] || homedir();
  if (!home) return false;
  return upsertTomlBlock(
    join(home, '.kimi-code', 'config.toml'),
    kimiHooksTomlBlock(),
    KIMI_HOOKS_BLOCK_RE,
    ['# Kimi Code user config — SVS hooks block managed by start-vibing-stacks'],
    opts.force === true
  );
}

export function exportGrokHooks(projectDir: string, opts: { force?: boolean } = {}): {
  hooksWritten: boolean;
  /** True when illegal project [compat.claude] SVS block was stripped. */
  compatUpdated: boolean;
} {
  const hooksPath = join(projectDir, GROK_HOOKS_REL);
  let hooksWritten = false;
  if (
    opts.force ||
    !existsSync(hooksPath) ||
    (() => {
      try {
        return JSON.parse(readFileSync(hooksPath, 'utf8'))?._svs?.version !== HOOKS_EXPORT_VERSION;
      } catch {
        return true;
      }
    })()
  ) {
    mkdirSync(dirname(hooksPath), { recursive: true });
    writeFileSync(hooksPath, grokHooksJson());
    hooksWritten = true;
  }

  // [compat.*] belongs in ~/.grok/config.toml only — strip project pollution.
  let compatUpdated = false;
  const configPath = join(projectDir, '.grok', 'config.toml');
  if (existsSync(configPath)) {
    const existing = readFileSync(configPath, 'utf8');
    if (GROK_COMPAT_BLOCK_RE.test(existing)) {
      writeFileSync(
        configPath,
        existing.replace(GROK_COMPAT_BLOCK_RE, '').replace(/\n{3,}/g, '\n\n')
      );
      compatUpdated = true;
    }
  }

  return { hooksWritten, compatUpdated };
}

export function exportHooksToTargets(
  projectDir: string,
  opts: { force?: boolean; targets?: Array<'kimi' | 'grok'> } = {}
): HooksExportResult {
  const targets = opts.targets ?? ['kimi', 'grok'];
  let kimiLocalUpdated = false;
  let kimiUserUpdated = false;
  let grokHooksWritten = false;
  let grokCompatUpdated = false;

  if (targets.includes('kimi')) {
    kimiLocalUpdated = exportKimiHooksLocal(projectDir, { force: opts.force });
    kimiUserUpdated = exportKimiHooksUser({ force: opts.force });
  }
  if (targets.includes('grok')) {
    const g = exportGrokHooks(projectDir, { force: opts.force });
    grokHooksWritten = g.hooksWritten;
    grokCompatUpdated = g.compatUpdated;
  }

  const any = kimiLocalUpdated || kimiUserUpdated || grokHooksWritten || grokCompatUpdated;
  return {
    kimiLocalUpdated,
    kimiUserUpdated,
    grokHooksWritten,
    grokCompatUpdated,
    version: HOOKS_EXPORT_VERSION,
    skippedReason: any ? undefined : 'Hooks export current',
  };
}
