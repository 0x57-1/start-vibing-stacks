#!/usr/bin/env node
// @sv-version: 1.0.0
/**
 * Grok PreToolUse — pin finalize spawns to the native agent type.
 *
 * Grok 1.0.x spawn_subagent schema often omits `reasoning_effort`. Injecting
 * that key via updatedInput fails the schema and BLOCKS the spawn. Effort is
 * pinned to `low` by `.grok/roles/<name>.toml` (step 2) once the type matches.
 *
 * This hook only rewrites `subagent_type` when the call is clearly documenter
 * or domain-updater but the parent used `general-purpose`. Fail-open.
 */

import { readStdinJson } from './_state.js';

const FINALIZE_TYPES = ['documenter', 'domain-updater'] as const;

function pickType(input: Record<string, unknown>): (typeof FINALIZE_TYPES)[number] | null {
  const type = String(input['subagent_type'] || input['subagentType'] || '')
    .trim()
    .toLowerCase();
  if (type === 'documenter' || type === 'domain-updater') return type;
  const blob = `${input['description'] || ''} ${input['prompt'] || ''}`.toLowerCase();
  if (/\bdomain-updater\b/.test(blob) || /recent changes|last change/.test(blob)) {
    return 'domain-updater';
  }
  if (
    /\bdocumenter\b/.test(blob) ||
    /_index\.json/.test(blob) ||
    /stamp domains/.test(blob)
  ) {
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
    // Do not add reasoning_effort — schema reject blocks the spawn.
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
