#!/usr/bin/env node
// @sv-version: 1.2.0
/**
 * Grok PreToolUse — pin SVS spawns to the native agent type + strip fat child
 * prompts. Session 01a00f26: parent still said “Read first: svs-document” and
 * “CLAUDE.md ≤40000 compact HOW” — domain-updater 394 s for a 3-line RC.
 *
 * Do not inject reasoning_effort (schema omit → inherit xhigh). Fail-open.
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

const FAT_PROMPT_LINE =
  /^\s*(Read first:.*|Read [`']?\.grok\/skills\/svs-document.*|then follow the documenter protocol.*|Content-depth:.*|If AGENTS\.md mirrors.*|.*MUST stay.*40000.*|.*wc -m.*|CLAUDE\.md is ~?\d+.*|Drop oldest RC and compact.*|Verify count before finishing.*)\s*$/gim;

export function stripFatChildPrompt(prompt: string): string {
  const re = new RegExp(FAT_PROMPT_LINE.source, 'gim');
  return prompt.replace(re, '').replace(/\n{3,}/g, '\n\n').trim();
}

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
    const rawPrompt = String(input['prompt'] || '');
    const prompt = stripFatChildPrompt(rawPrompt);
    const typeChanged = Boolean(want && current !== want);
    const promptChanged = prompt !== rawPrompt.trim();
    if (!typeChanged && !promptChanged) {
      process.stdout.write(JSON.stringify({ decision: 'allow' }) + '\n');
      return;
    }
    const updated: Record<string, unknown> = { ...input };
    if (want) updated['subagent_type'] = want;
    if (promptChanged) updated['prompt'] = prompt;
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
