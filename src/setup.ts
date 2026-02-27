/**
 * Start Vibing Stacks — Setup Engine
 *
 * Copies and configures stack-specific files into the project.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync, statSync, cpSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import ora from 'ora';
import * as ui from './ui.js';
import type { ProjectConfig, StackConfig } from './types.js';

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
 * Copy directory recursively, preserving structure
 */
function copyDirRecursive(src: string, dest: string, overwrite = false): number {
  if (!existsSync(src)) return 0;
  let count = 0;

  mkdirSync(dest, { recursive: true });
  const entries = readdirSync(src);

  for (const entry of entries) {
    const srcPath = join(src, entry);
    const destPath = join(dest, entry);
    const stat = statSync(srcPath);

    if (stat.isDirectory()) {
      count += copyDirRecursive(srcPath, destPath, overwrite);
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
    spinner.text = 'Directory structure created';

    // 2. Copy shared agents (universal)
    const sharedAgentsDir = join(PACKAGE_ROOT, 'stacks', '_shared', 'agents');
    const agentCount = copyDirRecursive(sharedAgentsDir, join(claudeDir, 'agents'), options.force);
    spinner.text = `Copied ${agentCount} universal agents`;

    // 3. Copy shared skills
    const sharedSkillsDir = join(PACKAGE_ROOT, 'stacks', '_shared', 'skills');
    const sharedSkillCount = copyDirRecursive(sharedSkillsDir, join(claudeDir, 'skills'), options.force);

    // 4. Copy shared hooks
    const sharedHooksDir = join(PACKAGE_ROOT, 'stacks', '_shared', 'hooks');
    const hookCount = copyDirRecursive(sharedHooksDir, join(claudeDir, 'hooks'), options.force);

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
    if (config.frontend && config.frontend !== 'none') {
      const frontendDir = join(PACKAGE_ROOT, 'stacks', 'frontend', config.frontend);
      if (existsSync(frontendDir)) {
        const feSkillCount = copyDirRecursive(
          join(frontendDir, 'skills'),
          join(claudeDir, 'skills'),
          options.force
        );
        spinner.text = `Loaded ${feSkillCount} frontend skills`;
      }
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

    // 11b. Ensure CLAUDE.local.md is gitignored
    const gitignorePath = join(projectDir, '.gitignore');
    if (existsSync(gitignorePath)) {
      const gitignore = readFileSync(gitignorePath, 'utf8');
      if (!gitignore.includes('CLAUDE.local.md')) {
        writeFileSync(gitignorePath, gitignore.trimEnd() + '\n\n# Claude Code local preferences\nCLAUDE.local.md\n');
      }
    }

    // 12. Copy commands
    const sharedCommandsDir = join(PACKAGE_ROOT, 'stacks', '_shared', 'commands');
    if (existsSync(sharedCommandsDir)) {
      copyDirRecursive(sharedCommandsDir, join(claudeDir, 'commands'), options.force);
    }

    // 13. Write settings.json for Claude Code (complete config)
    const settings: Record<string, any> = {
      model: 'sonnet',
      max_tokens: 8192,
      max_turns: 100,

      enableAllProjectMcpServers: true,

      autoMemoryEnabled: true,

      context: {
        compaction_threshold: 0.85,
        enable_compaction: true,
        enable_semantic_search: true,
        memory_files: ['.claude/CLAUDE.md', 'CLAUDE.md'],
      },

      permissions: {
        allow: [
          'Bash(*)',
          'Read(*)',
          'Write(*)',
          'Edit(*)',
          'Grep(*)',
          'Glob(*)',
          'WebSearch(*)',
          'WebFetch(*)',
        ],
        deny: [],
      },

      hooks: {
        UserPromptSubmit: [
          {
            matcher: '',
            hooks: [
              {
                type: 'command',
                command: 'bash .claude/hooks/run-hook.sh user-prompt-submit',
                timeout: 10,
              },
            ],
          },
        ],
        Stop: [
          {
            hooks: [
              {
                type: 'command',
                command: 'bash .claude/hooks/run-hook.sh stop-validator',
                timeout: 30,
              },
            ],
          },
        ],
      },

      agents: {
        'research-web': {
          description: 'Researches best practices before implementation',
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

    spinner.succeed(
      `Setup complete: ${agentCount} agents, ${sharedSkillCount + stackSkillCount} skills, ${hookCount} hooks`
    );

    return true;
  } catch (err) {
    spinner.fail(`Setup failed: ${err}`);
    return false;
  }
}
