#!/usr/bin/env node
/**
 * UserPromptSubmit Hook — Start Vibing Stacks
 *
 * Injects workflow instructions before each user prompt.
 * Reads active-project.json for stack-specific context.
 */

import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

const PROJECT_DIR = process.env['CLAUDE_PROJECT_DIR'] || process.cwd();
const ACTIVE_PROJECT = join(PROJECT_DIR, '.claude', 'config', 'active-project.json');
const STANDARDS_REVIEW = join(PROJECT_DIR, '.claude', 'config', 'standards-review.json');

let stackName = 'Unknown';
let qualityCmd = 'Run quality gates';
try {
  if (existsSync(ACTIVE_PROJECT)) {
    const config = JSON.parse(readFileSync(ACTIVE_PROJECT, 'utf8'));
    stackName = config.stack || 'Unknown';
    const stackConfig = join(PROJECT_DIR, '.claude', 'config', 'quality-gates.json');
    if (existsSync(stackConfig)) {
      const gates = JSON.parse(readFileSync(stackConfig, 'utf8'));
      qualityCmd = gates.runAll || qualityCmd;
    }
  }
} catch {}

interface ReviewFile {
  status: string;
  sources?: string[];
  patterns?: { category: string; name: string }[];
}

let standardsContext = '';
try {
  if (!existsSync(STANDARDS_REVIEW)) {
    standardsContext = `\n\nSTANDARDS REVIEW NEEDED: No standards-review.json found. ` +
      `This project may have existing coding standards (.cursorrules, composer.json configs). ` +
      `Ask the user: "I noticed this project hasn't been scanned for existing standards. ` +
      `Would you like me to review your codebase patterns and adapt my behavior, ` +
      `or should I use the default standards?"`;
  } else {
    const review: ReviewFile = JSON.parse(readFileSync(STANDARDS_REVIEW, 'utf8'));
    if (review.status === 'adapted' && review.patterns && review.patterns.length > 0) {
      const patternList = review.patterns.map(p => `- [${p.category}] ${p.name}`).join('\n');
      standardsContext = `\n\nPROJECT STANDARDS (scanned from ${(review.sources || []).join(', ')}):\n${patternList}\n` +
        `Follow these project-specific patterns. They take priority over generic defaults.`;
    }
  }
} catch {}

async function main(): Promise<void> {
  let hookInput: any = {};
  try {
    const chunks: string[] = [];
    process.stdin.setEncoding('utf8');
    const timeout = setTimeout(() => process.stdin.destroy(), 1000);
    for await (const chunk of process.stdin) {
      chunks.push(chunk);
    }
    clearTimeout(timeout);
    hookInput = JSON.parse(chunks.join('') || '{}');
  } catch {}

  const prompt = hookInput.user_prompt || hookInput.prompt || '';
  if (!prompt.trim()) {
    console.log(JSON.stringify({ continue: true }));
    process.exit(0);
  }

  const today = new Date().toISOString().split('T')[0];

  const systemMessage = `TASK WORKFLOW (Stack: ${stackName}):

0. READ both CLAUDE.md and .claude/config/active-project.json before changes.

1. CREATE a detailed todo-list breaking down the request.
   Include "Update CLAUDE.md" as final task.

2. WORK through each item sequentially.

3. Run quality gates: ${qualityCmd}

4. COMMIT using conventional commits via commit-manager agent.

5. UPDATE CLAUDE.md:
   a. "## Last Change" (date: ${today}, branch, summary)
   b. Update ALL affected rule/flow sections

6. Run stop-validator before finishing.${standardsContext}`;

  console.log(JSON.stringify({ continue: true, systemMessage }));
  process.exit(0);
}

main().catch(() => {
  console.log(JSON.stringify({ continue: true }));
  process.exit(0);
});
