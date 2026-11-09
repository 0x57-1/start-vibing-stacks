/**
 * Start Vibing Stacks — Setup Engine
 *
 * Copies and configures stack-specific files into the project.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import ora from 'ora';
import * as ui from './ui.js';
import type { ProjectConfig, StackConfig } from './types.js';
import {
  OPTIONAL_PRELINE_SKILLS,
  shouldSkipCorpusWrite,
  shouldSkipProjectOwnedWrite,
} from './targets/skill-corpus.js';
import { ensureProjectUi, wantsPrelineMoon } from './targets/project-ui.js';
import { memoryFilesForStack } from './memories-canon.js';
import { seedReactNativeApp } from './react-native-seed.js';
import { printJevNotice } from './jev-notice.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PACKAGE_ROOT = resolve(__dirname, '..');

/**
 * Load a stack configuration from stacks/{id}/stack.json
 */
export function loadStackConfig(stackId: string): StackConfig | null {
  const stackPath = join(PACKAGE_ROOT, 'stacks', stackId, 'stack.json');
  if (!existsSync(stackPath)) return null;

  try {
    const raw = readFileSync(stackPath, 'utf8');
    return JSON.parse(raw) as StackConfig;
  } catch {
    return null;
  }
}

/**
 * Copy Memory Optimization Pipeline into `.claude/memory-optimization/`.
 * Always copied by setup and by `migrate --apply`.
 */
export function installMemoryOptimization(projectDir: string, overwrite = false): number {
  const src = join(PACKAGE_ROOT, 'stacks', '_shared', 'memory-optimization');
  const dest = join(projectDir, '.claude', 'memory-optimization');
  if (!existsSync(src)) return 0;
  return copyDirRecursive(src, dest, overwrite);
}

/**
 * Copy directory recursively, preserving structure
 */
function copyDirRecursive(
  src: string,
  dest: string,
  overwrite = false,
  skipChildNames?: Set<string>
): number {
  if (!existsSync(src)) return 0;
  if (shouldSkipCorpusWrite(dest)) return 0;
  if (shouldSkipProjectOwnedWrite(dest)) return 0;
  let count = 0;

  mkdirSync(dest, { recursive: true });
  const entries = readdirSync(src);

  for (const entry of entries) {
    if (skipChildNames?.has(entry)) continue;
    const srcPath = join(src, entry);
    const destPath = join(dest, entry);
    const stat = statSync(srcPath);

    if (stat.isDirectory()) {
      if (shouldSkipCorpusWrite(destPath)) continue;
      if (shouldSkipProjectOwnedWrite(destPath)) continue;
      count += copyDirRecursive(srcPath, destPath, overwrite, skipChildNames);
    } else {
      if (!existsSync(destPath) || overwrite) {
        const content = readFileSync(srcPath, 'utf8');
        mkdirSync(dirname(destPath), { recursive: true });
        writeFileSync(destPath, content);
        count++;
      }
    }
  }

  return count;
}

/**
 * Setup the project with the selected configuration
 */
export async function setupProject(
  projectDir: string,
  config: ProjectConfig,
  options: { force?: boolean; noClaude?: boolean } = {}
): Promise<boolean> {
  const spinner = ora('Setting up project...').start();
  const claudeDir = join(projectDir, '.claude');

  try {
    // 1. Create .claude directory structure
    mkdirSync(join(claudeDir, 'agents'), { recursive: true });
    mkdirSync(join(claudeDir, 'skills'), { recursive: true });
    mkdirSync(join(claudeDir, 'hooks'), { recursive: true });
    mkdirSync(join(claudeDir, 'config'), { recursive: true });
    mkdirSync(join(claudeDir, 'commands'), { recursive: true });
    mkdirSync(join(claudeDir, 'rules'), { recursive: true });
    mkdirSync(join(claudeDir, 'skills', 'codebase-knowledge', 'domains'), { recursive: true });
    // Multi-instance coordination state (gitignored, runtime-managed)
    mkdirSync(join(claudeDir, 'state', 'sessions', '_archive'), { recursive: true });
    mkdirSync(join(claudeDir, 'state', 'inbox'), { recursive: true });
    mkdirSync(join(claudeDir, 'state', 'file-touches', '_archive'), { recursive: true });
    spinner.text = 'Directory structure created';

    // 2. Copy shared agents (universal)
    const sharedAgentsDir = join(PACKAGE_ROOT, 'stacks', '_shared', 'agents');
    const agentCount = copyDirRecursive(sharedAgentsDir, join(claudeDir, 'agents'), options.force);
    spinner.text = `Copied ${agentCount} universal agents`;

    // 3. Copy shared skills
    const sharedSkillsDir = join(PACKAGE_ROOT, 'stacks', '_shared', 'skills');
    const sharedSkillCount = copyDirRecursive(sharedSkillsDir, join(claudeDir, 'skills'), options.force);

    // 3b. Copy ads-agents (paid advertising intelligence system)
    const adsAgentsDir = join(PACKAGE_ROOT, 'stacks', '_shared', 'ads-agents');
    if (existsSync(adsAgentsDir)) {
      copyDirRecursive(adsAgentsDir, join(claudeDir, 'ads-agents'), options.force);
    }

    // 4. Copy shared hooks
    const sharedHooksDir = join(PACKAGE_ROOT, 'stacks', '_shared', 'hooks');
    const hookCount = copyDirRecursive(sharedHooksDir, join(claudeDir, 'hooks'), options.force);

    // 4b. Multi-instance coordination README in state dir
    const stateReadmeSrc = join(PACKAGE_ROOT, 'stacks', '_shared', 'hooks', '_state.README.md');
    const stateReadmeDest = join(claudeDir, 'state', 'README.md');
    if (existsSync(stateReadmeSrc) && (!existsSync(stateReadmeDest) || options.force)) {
      writeFileSync(stateReadmeDest, readFileSync(stateReadmeSrc, 'utf8'));
    }

    // 5. Copy shared config
    const sharedConfigDir = join(PACKAGE_ROOT, 'stacks', '_shared', 'config');
    copyDirRecursive(sharedConfigDir, join(claudeDir, 'config'), options.force);

    // 6. Copy stack-specific skills
    const stackSkillsDir = join(PACKAGE_ROOT, 'stacks', config.stack, 'skills');
    const stackSkillCount = copyDirRecursive(stackSkillsDir, join(claudeDir, 'skills'), options.force);

    // 7. Copy stack-specific config
    const stackConfigDir = join(PACKAGE_ROOT, 'stacks', config.stack, 'config');
    copyDirRecursive(stackConfigDir, join(claudeDir, 'config'), options.force);

    // 8. Copy frontend-specific skills if applicable
    //    Order matters: base first, then specific (specific can override base).
    if (config.frontend && config.frontend !== 'none') {
      let feSkillCount = 0;
      const skipPreline = wantsPrelineMoon(projectDir, config.prelineMoon, config.frontend)
        ? undefined
        : OPTIONAL_PRELINE_SKILLS;

      if (config.frontendBaseSkillsDir) {
        const baseDir = join(PACKAGE_ROOT, 'stacks', 'frontend', config.frontendBaseSkillsDir);
        if (existsSync(baseDir)) {
          feSkillCount += copyDirRecursive(
            join(baseDir, 'skills'),
            join(claudeDir, 'skills'),
            options.force,
            skipPreline
          );
        }
      }

      const frontendId = config.frontendSkillsDir || config.frontend;
      const frontendDir = join(PACKAGE_ROOT, 'stacks', 'frontend', frontendId);
      if (existsSync(frontendDir)) {
        feSkillCount += copyDirRecursive(
          join(frontendDir, 'skills'),
          join(claudeDir, 'skills'),
          options.force,
          skipPreline
        );
      }

      spinner.text = `Loaded ${feSkillCount} frontend skills`;
    }

    // 9. Write active-project.json
    writeFileSync(
      join(claudeDir, 'config', 'active-project.json'),
      JSON.stringify(config, null, 2)
    );

    // 10. Write/merge CLAUDE.md from template
    const claudeMdTemplate = join(PACKAGE_ROOT, 'templates', `CLAUDE-${config.stack}.md`);
    const claudeMdFallback = join(PACKAGE_ROOT, 'templates', 'CLAUDE-default.md');
    const templatePath = existsSync(claudeMdTemplate) ? claudeMdTemplate : claudeMdFallback;
    const claudeMdDest = join(projectDir, 'CLAUDE.md');

    if (!existsSync(claudeMdDest) || options.force) {
      let template = readFileSync(templatePath, 'utf8');
      // Replace placeholders
      template = template
        .replace(/\{\{PROJECT_NAME\}\}/g, config.name)
        .replace(/\{\{STACK\}\}/g, config.stack.toUpperCase())
        .replace(/\{\{FRAMEWORK\}\}/g, config.framework)
        .replace(/\{\{DATABASE\}\}/g, config.database)
        .replace(/\{\{DATE\}\}/g, new Date().toISOString().split('T')[0]);
      writeFileSync(claudeMdDest, template);
    } else if (existsSync(claudeMdDest)) {
      // Backup existing CLAUDE.md as template for smart merge
      const existing = readFileSync(claudeMdDest, 'utf8');
      if (existsSync(templatePath)) {
        writeFileSync(join(claudeDir, 'CLAUDE.template.md'), readFileSync(templatePath, 'utf8'));
      }
    }

    // 11. Handle .cursorrules integration
    if (config.cursorRules) {
      const cursorRulesPath = join(projectDir, '.cursorrules');
      if (existsSync(cursorRulesPath)) {
        const cursorContent = readFileSync(cursorRulesPath, 'utf8');
        const cursorIntegrationPath = join(claudeDir, 'config', 'cursor-rules-imported.md');
        writeFileSync(cursorIntegrationPath, `# Imported from .cursorrules\n\n${cursorContent}`);
        spinner.text = 'Imported .cursorrules into Claude config';
      }
    }

    // 11b. Ensure local-only Claude/Cursor prefs + state are gitignored
    const gitignorePath = join(projectDir, '.gitignore');
    if (existsSync(gitignorePath)) {
      let gitignore = readFileSync(gitignorePath, 'utf8');
      let changed = false;
      if (!gitignore.includes('CLAUDE.local.md')) {
        gitignore = gitignore.trimEnd() + '\n\n# Claude Code local preferences\nCLAUDE.local.md\n';
        changed = true;
      }
      if (!gitignore.includes('.claude/settings.local.json')) {
        gitignore =
          gitignore.trimEnd() +
          '\n\n# Claude Code local permission overrides (copy from settings.local.example.json)\n.claude/settings.local.json\n';
        changed = true;
      }
      if (!gitignore.match(/^\.claude\/state\/?$/m) && !gitignore.match(/^\.claude\/?$/m)) {
        gitignore = gitignore.trimEnd() + '\n\n# Claude Code multi-instance coordination state (runtime, per-host)\n.claude/state/\n';
        changed = true;
      }
      if (changed) writeFileSync(gitignorePath, gitignore);
    }

    // 11c. Save standards review results
    if (config.standardsReview) {
      const reviewPath = join(claudeDir, 'config', 'standards-review.json');
      writeFileSync(reviewPath, JSON.stringify(config.standardsReview, null, 2));

      if (config.standardsReview.status === 'adapted' && config.standardsReview.patterns.length > 0) {
        const claudeMdPath = join(projectDir, 'CLAUDE.md');
        if (existsSync(claudeMdPath)) {
          let claudeContent = readFileSync(claudeMdPath, 'utf8');

          const categories = new Map<string, string[]>();
          for (const p of config.standardsReview.patterns) {
            const list = categories.get(p.category) || [];
            list.push(p.name);
            categories.set(p.category, list);
          }

          let standardsSection = '\n\n## Project Standards (imported)\n\n';
          standardsSection += `> Scanned from: ${config.standardsReview.sources.join(', ')}\n\n`;
          for (const [category, items] of categories) {
            standardsSection += `### ${category.charAt(0).toUpperCase() + category.slice(1)}\n\n`;
            for (const item of items) {
              standardsSection += `- ${item}\n`;
            }
            standardsSection += '\n';
          }

          claudeContent += standardsSection;
          writeFileSync(claudeMdPath, claudeContent);
        }
        spinner.text = `Imported ${config.standardsReview.patterns.length} project standards`;
      }
    }

    // 11d. Copy CI workflow templates (only when target dir is empty or --force)
    const stackWorkflowsDir = join(PACKAGE_ROOT, 'stacks', config.stack, 'workflows');
    if (existsSync(stackWorkflowsDir)) {
      const ghWorkflowsDir = join(projectDir, '.github', 'workflows');
      const targetIsEmpty = !existsSync(ghWorkflowsDir);
      if (targetIsEmpty || options.force) {
        copyDirRecursive(stackWorkflowsDir, ghWorkflowsDir, options.force);
        spinner.text = 'Installed CI workflow templates';
      }
    }

    // 11e. Copy stack-level helper scripts (e.g. nodejs/scripts/check-route-slugs.mjs)
    // copyDirRecursive is non-destructive by default: existing files in the target
    // project's scripts/ dir are preserved unless --force is passed.
    const stackScriptsDir = join(PACKAGE_ROOT, 'stacks', config.stack, 'scripts');
    if (existsSync(stackScriptsDir)) {
      const projectScriptsDir = join(projectDir, 'scripts');
      const copied = copyDirRecursive(stackScriptsDir, projectScriptsDir, options.force);
      if (copied > 0) {
        spinner.text = `Installed ${copied} stack helper script(s) to scripts/`;
      }
    }

    // 11f. Shared helpers (theme-token guard, …) — all stacks / frontends
    const sharedScriptsDir = join(PACKAGE_ROOT, 'stacks', '_shared', 'scripts');
    if (existsSync(sharedScriptsDir)) {
      const projectScriptsDir = join(projectDir, 'scripts');
      const copied = copyDirRecursive(sharedScriptsDir, projectScriptsDir, options.force);
      if (copied > 0) {
        spinner.text = `Installed ${copied} shared helper script(s) to scripts/`;
      }
    }

    // 12. Copy commands
    const sharedCommandsDir = join(PACKAGE_ROOT, 'stacks', '_shared', 'commands');
    if (existsSync(sharedCommandsDir)) {
      copyDirRecursive(sharedCommandsDir, join(claudeDir, 'commands'), options.force);
    }

    // 12b. Copy shared memories (funnel-content-copy, competitive-intelligence-research, etc.)
    const sharedMemoriesDir = join(PACKAGE_ROOT, 'stacks', '_shared', 'memories');
    if (existsSync(sharedMemoriesDir)) {
      copyDirRecursive(sharedMemoriesDir, join(claudeDir, 'memories'), options.force);
    }

    // 12b2. Stack-only memories (e.g. React Native) — not loaded on other stacks
    const stackMemoriesDir = join(PACKAGE_ROOT, 'stacks', config.stack, 'memories');
    if (existsSync(stackMemoriesDir)) {
      copyDirRecursive(stackMemoriesDir, join(claudeDir, 'memories'), options.force);
    }

    // 12c. Memory Optimization Pipeline is core — always installed
    const mopCopied = installMemoryOptimization(projectDir, Boolean(options.force));
    if (mopCopied > 0) {
      spinner.text = `Installed Memory Optimization Pipeline (${mopCopied} file(s))`;
    }

    // 13. Write settings.json for Claude Code (complete config)
    const settings: Record<string, any> = {
      model: 'sonnet',
      max_tokens: 8192,
      max_turns: 100,

      // Persistent high-reasoning effort. Note: 'ultracode' is session-only
      // (set via /effort) and cannot be persisted here; 'xhigh' is the highest
      // persistable level. On 'sonnet' it falls back to 'high'.
      effortLevel: 'xhigh',

      enableAllProjectMcpServers: true,

      autoMemoryEnabled: true,

      context: {
        compaction_threshold: 0.85,
        enable_compaction: true,
        enable_semantic_search: true,
        memory_files: memoryFilesForStack(config.stack),
      },

      permissions: {
        // Always start sessions in plan mode (read-only): the agent must
        // present a plan before editing. Shift+Tab still cycles modes per turn.
        // Opt into acceptEdits/bypassPermissions via .claude/settings.local.json
        // (copy from settings.local.example.json) — never change this default here.
        defaultMode: 'plan',
        // File tools use the bare name. Claude Code 2.1.319 treats Read(*) /
        // Write(*) / Edit(*) / Grep(*) / Glob(*) as "working directories only"
        // and warns at startup. The bare name allows every path, which is what
        // Tool(*) meant on older releases. Bash(*) stays: it is still equivalent
        // to Bash and does not warn.
        allow: [
          'Bash(*)',
          'Read',
          'Write',
          'Edit',
          'Grep',
          'Glob',
          'WebSearch(*)',
          'WebFetch(*)',
        ],
        deny: [],
      },

      hooks: {
        SessionStart: [
          {
            hooks: [
              {
                type: 'command',
                command: 'npx tsx "$CLAUDE_PROJECT_DIR/.claude/hooks/session-start.ts"',
                timeout: 10,
              },
            ],
          },
        ],
        UserPromptSubmit: [
          {
            matcher: '',
            hooks: [
              {
                type: 'command',
                command: 'npx tsx "$CLAUDE_PROJECT_DIR/.claude/hooks/user-prompt-submit.ts"',
                timeout: 10,
              },
            ],
          },
        ],
        PreToolUse: [
          {
            matcher: 'Edit|Write|MultiEdit|NotebookEdit',
            hooks: [
              {
                type: 'command',
                command: 'npx tsx "$CLAUDE_PROJECT_DIR/.claude/hooks/pre-tool-use.ts"',
                timeout: 5,
              },
              {
                type: 'command',
                command: 'npx tsx "$CLAUDE_PROJECT_DIR/.claude/hooks/plan-gate.ts"',
                timeout: 5,
              },
            ],
          },
        ],
        PostToolUse: [
          {
            matcher: 'Edit|Write|MultiEdit|NotebookEdit',
            hooks: [
              {
                type: 'command',
                command: 'npx tsx "$CLAUDE_PROJECT_DIR/.claude/hooks/post-tool-use.ts"',
                timeout: 5,
              },
            ],
          },
        ],
        Stop: [
          {
            hooks: [
              {
                type: 'command',
                command: 'npx tsx "$CLAUDE_PROJECT_DIR/.claude/hooks/stop-validator.ts"',
                timeout: 30,
              },
            ],
          },
        ],
        SessionEnd: [
          {
            hooks: [
              {
                type: 'command',
                command: 'npx tsx "$CLAUDE_PROJECT_DIR/.claude/hooks/stop-validator.ts"',
                timeout: 10,
              },
            ],
          },
        ],
        PreCompact: [
          {
            hooks: [
              {
                type: 'command',
                command: 'npx tsx "$CLAUDE_PROJECT_DIR/.claude/hooks/pre-compact.ts"',
                timeout: 10,
              },
            ],
          },
        ],
      },

      agents: {
        'research-web': {
          description: 'Researches best practices before implementation',
        },
        'security-auditor': {
          description: 'Stack-aware OWASP audit with VETO power; runs before commit-manager',
        },
        'documenter': {
          description: 'Creates and maintains domain documentation',
        },
        'domain-updater': {
          description: 'Records session learnings in domain docs',
        },
        'commit-manager': {
          description: 'Manages commits and git workflow',
        },
        'claude-md-compactor': {
          description: 'Compacts CLAUDE.md when it exceeds 40k chars',
        },
        'tester': {
          description: 'Creates tests using the stack-appropriate framework',
        },
      },

      workflow: {
        default_flow: [
          'research-web',
          'tester',
          'security-auditor',
          'documenter',
          'domain-updater',
          'commit-manager',
        ],
        config_flow: ['domain-updater', 'commit-manager'],
      },

      rules: {
        research: {
          required_before_implementation: true,
          must_cite_sources: true,
        },
        security: {
          sanitize_all_responses: true,
          owasp_validation_required: true,
        },
        testing: {
          unit_tests_required: true,
          edge_cases_research_required: true,
        },
        documentation: {
          flow_docs_required: true,
          research_must_be_documented: true,
        },
      },
    };

    // Add stack-specific quality gates
    const stackCfg = loadStackConfig(config.stack);
    if (stackCfg) {
      const gates: Record<string, any> = {};
      for (const gate of stackCfg.qualityGates) {
        gates[gate.name.toLowerCase().replace(/\s+/g, '_')] = {
          command: gate.command,
          required: gate.required,
          blocking: gate.required,
        };
      }
      settings.quality_gates = gates;
    }

    writeFileSync(join(claudeDir, 'settings.json'), JSON.stringify(settings, null, '\t'));

    if (config.stack === 'react-native') {
      const seed = seedReactNativeApp(projectDir, {
        framework: config.framework,
        projectName: config.name,
        force: options.force,
      });
      if (seed.seeded > 0) {
        ui.info(`Seeded Expo app (${config.framework}): ${seed.seeded} file(s). Run npm install && npx expo start`);
      } else if (seed.skipped) {
        ui.info(`React Native seed: ${seed.skipped}`);
      }
    }

    const uiState = ensureProjectUi(projectDir, {
      frontend: config.frontend,
      projectName: config.name,
      prelineMoon: config.prelineMoon,
    });
    if (uiState.designSystem.seeded) {
      ui.info('Seeded .claude/skills/design-system/ from existing project sources (protected — migrate will not overwrite)');
    }
    if (uiState.designSystem.mirrored) {
      ui.info('Mirrored design-system → .grok/skills/ (copy, not symlink)');
    }
    if (uiState.preline.written) {
      ui.info('Wrote preline-moon pointer — Read ~/.claude/skills/preline-moon for the 5.0 capture');
    }

    // 15. Auto-install UI/UX Pro Max skill for frontend projects
    const uiproSkillPath = join(projectDir, '.cursor', 'skills', 'ui-ux-pro-max', 'SKILL.md');
    const uiproClaudePath = join(claudeDir, 'skills', 'ui-ux-pro-max', 'SKILL.md');
    if (
      config.stack !== 'react-native' &&
      config.frontend &&
      config.frontend !== 'none' &&
      config.frontend !== 'native' &&
      !existsSync(uiproSkillPath) &&
      !existsSync(uiproClaudePath)
    ) {
      spinner.start('Installing UI/UX Pro Max skill...');
      try {
        const { execFileSync: execF } = await import('child_process');
        execF('npx', ['uipro-cli', 'init', '--ai', 'cursor'], {
          cwd: projectDir,
          stdio: 'pipe',
          timeout: 60000,
        });
        spinner.succeed('UI/UX Pro Max skill installed');
      } catch {
        spinner.warn('UI/UX Pro Max: auto-install failed');
        ui.info('Install manually: npx uipro-cli init --ai cursor');
      }
    }

    // 16. Multi-target: AGENTS.md + MCP side-cars + svs-manifest.json
    const { syncTargets } = await import('./targets/index.js');
    const sync = syncTargets(projectDir, {
      forceAgentsMd: !!options.force,
      forceMcp: !!options.force,
      forceCursorRules: true,
      forceKimiLocal: true,
      forceGrokSkills: true,
      forceHooksExport: true,
      updateIfNeeded: true,
    });
    if (sync.agentsMdWritten) {
      spinner.text = `Wrote AGENTS.md (svs-version ${sync.agentsMdVersion}) for Kimi/Grok/Cursor`;
    }

    spinner.succeed(
      `Setup complete: ${agentCount} agents, ${sharedSkillCount + stackSkillCount} skills, ${hookCount} hooks` +
        (sync.agentsMdWritten ? ' + AGENTS.md' : '') +
        (sync.cursorRules.written ? ' + Cursor rules' : '') +
        (sync.kimiLocal.localWritten || sync.kimiLocal.localUpdated || sync.kimiLocal.skillsWritten
          ? ' + Kimi local'
          : '') +
        (sync.grokSkills.configUpdated ||
        sync.grokSkills.nativeSkillWritten ||
        sync.grokSkills.curatedCopied > 0 ||
        sync.grokSkills.generatedWritten > 0
          ? ' + Grok skills'
          : '') +
        (sync.hooksExport.grokHooksWritten || sync.hooksExport.kimiUserUpdated
          ? ' + Kimi/Grok hooks'
          : '') +
        (sync.mcp.kimiWritten || sync.mcp.grokWritten || sync.mcp.cursorWritten
          ? ' + MCP targets'
          : '')
    );
    printJevNotice(projectDir);

    return true;
  } catch (err) {
    spinner.fail(`Setup failed: ${err}`);
    return false;
  }
}
