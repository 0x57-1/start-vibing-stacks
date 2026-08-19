#!/usr/bin/env node
// @sv-version: 1.1.0
/**
 * Grok PreToolUse — pin SVS spawns to the native agent type.
 *
 * Grok 1.0.x spawn_subagent schema often omits `reasoning_effort`. Injecting
 * that key via updatedInput fails the schema and BLOCKS the spawn. Effort is
 * pinned to `low` by `.grok/roles/<name>.toml` (step 2) once the type matches.
 *
 * Rewrites `subagent_type` when the call is clearly an SVS native but the
 * parent used `general-purpose`. Fail-open.
 */

import { readStdinJson } from './_state.js';

const NATIVE_TYPES = [
  'documenter',
  'domain-updater',
  'commit-manager',
  'tester',
  'research-web',
  'security-auditor',
  'claude-md-compactor',
] as const;

type NativeType = (typeof NATIVE_TYPES)[number];

function pickType(input: Record<string, unknown>): NativeType | null {
  const type = String(input['subagent_type'] || input['subagentType'] || '')
    .trim()
    .toLowerCase();
  if ((NATIVE_TYPES as readonly string[]).includes(type)) return type as NativeType;
  const blob = `${input['description'] || ''} ${input['prompt'] || ''}`.toLowerCase();
  if (/\bclaude-md-compactor\b/.test(blob) || /compact claude\.md/.test(blob)) {
    return 'claude-md-compactor';
  }
  if (/\bsecurity-auditor\b/.test(blob) || /\bcwe-\d/.test(blob) || /\bveto power\b/.test(blob)) {
    return 'security-auditor';
  }
  if (/\bresearch-web\b/.test(blob) || /\bunified_search\b/.test(blob)) {
    return 'research-web';
  }
  if (/\btester\b/.test(blob) && /\b(phpunit|vitest|pytest)\b/.test(blob)) {
    return 'tester';
  }
  if (/\bcommit-manager\b/.test(blob) || /scope\.ts commit/.test(blob)) {
    return 'commit-manager';
  }
  if (/\bdomain-updater\b/.test(blob) || /recent changes|last change/.test(blob)) {
    return 'domain-updater';
  }
  if (/\bdocumenter\b/.test(blob) || /_index\.json/.test(blob) || /stamp domains/.test(blob)) {
    return 'documenter';
  }
  return null;
}

async function main(): Promise<void> {
  try {
    const raw = (await readStdinJson(1500)) as Record<string, unknown>;
    const tool = String(raw['tool_name'] || raw['toolName'] || '');
    if (!/^(spawn_subagent|Task)$/i.test(tool)) {
      process.stdout.write(JSON.stringify({ decision: 'allow' }) + '\n');
      return;
    }
    const input = {
      ...((raw['tool_input'] || raw['toolInput'] || {}) as Record<string, unknown>),
    };
    const want = pickType(input);
    const current = String(input['subagent_type'] || input['subagentType'] || '')
      .trim()
      .toLowerCase();
    if (!want || current === want) {
      process.stdout.write(JSON.stringify({ decision: 'allow' }) + '\n');
      return;
    }
    const updated = { ...input, subagent_type: want };
    delete updated['subagentType'];
    process.stdout.write(
      JSON.stringify({
        hookSpecificOutput: {
          hookEventName: 'PreToolUse',
          updatedInput: updated,
        },
      }) + '\n'
    );
  } catch {
    process.stdout.write(JSON.stringify({ decision: 'allow' }) + '\n');
  }
}

void main();
