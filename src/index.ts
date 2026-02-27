#!/usr/bin/env node
/**
 * Start Vibing Stacks — CLI Entry Point
 *
 * Multi-stack AI-powered development workflow for Claude Code.
 * Detects project stack, validates requirements, and configures agents.
 */

import { existsSync, readFileSync } from 'fs';
import { join, basename } from 'path';
import inquirer from 'inquirer';
import chalk from 'chalk';
import * as ui from './ui.js';
import { detectProject, detectPhpFramework, detectNodeFramework, detectPythonFramework } from './detector.js';
import { autoInstall, installComposer, installClaudeCode } from './installer.js';
import { loadStackConfig, setupProject } from './setup.js';
import { selectMcpServers, installMcpServers } from './mcp.js';
import type { ProjectConfig, StackConfig } from './types.js';

// =============================================================================
// CLI Arguments
// =============================================================================

const args = process.argv.slice(2);
const FLAGS = {
  force: args.includes('--force'),
  noClaude: args.includes('--no-claude'),
  noMcp: args.includes('--no-mcp'),
  noInstall: args.includes('--no-install'),
  help: args.includes('--help') || args.includes('-h'),
  version: args.includes('--version') || args.includes('-v'),
};

if (FLAGS.version) {
  console.log('1.0.0');
  process.exit(0);
}

if (FLAGS.help) {
  console.log(ui.LOGO);
  console.log(`
  ${chalk.bold('Usage:')}
    npx start-vibing-stacks [options]

  ${chalk.bold('Options:')}
    --force           Overwrite existing configuration
    --no-claude       Skip Claude Code installation
    --no-mcp          Skip MCP server selection
    --no-install      Skip dependency installation
    --help, -h        Show this help
    --version, -v     Show version

  ${chalk.bold('Supported Stacks:')}
    🐘 PHP 8.3+       Laravel, Symfony, CodeIgniter, Vanilla
    📦 Node.js/TS     Next.js, Nuxt, Express, Fastify
    🐍 Python         Django, FastAPI, Flask (coming soon)
    🦀 Rust           (coming soon)
    🐹 Go             (coming soon)
  `);
  process.exit(0);
}

// =============================================================================
// Stack Registry
// =============================================================================

interface StackChoice {
  id: string;
  name: string;
  icon: string;
  available: boolean;
}

const AVAILABLE_STACKS: StackChoice[] = [
  { id: 'php', name: 'PHP 8.3+', icon: '🐘', available: true },
  { id: 'nodejs', name: 'Node.js / TypeScript', icon: '📦', available: true },
  { id: 'python', name: 'Python 3.12+', icon: '🐍', available: true },

];

// =============================================================================
// Main Flow
// =============================================================================

async function main(): Promise<void> {
  console.log(ui.LOGO);

  const projectDir = process.cwd();
  const projectName = basename(projectDir);

  // ─── Quick Resume: Skip setup if already configured ─────────────────────
  const activeProjectPath = join(projectDir, '.claude', 'config', 'active-project.json');
  if (existsSync(activeProjectPath) && !FLAGS.force) {
    try {
      const existing = JSON.parse(readFileSync(activeProjectPath, 'utf8'));
      ui.success(`Project already configured: ${existing.name || projectName}`);
      ui.info(`Stack: ${existing.stack} | Framework: ${existing.framework} | DB: ${existing.database}`);
      console.log('');

      const { action } = await inquirer.prompt([
        {
          type: 'list',
          name: 'action',
          message: 'What do you want to do?',
          choices: [
            { name: '🚀  Launch Claude Code', value: 'launch' },
            { name: '🔄  Reconfigure project (fresh setup)', value: 'reconfig' },
            { name: '❌  Exit', value: 'exit' },
          ],
        },
      ]);

      if (action === 'launch') {
        if (!FLAGS.noClaude) {
          console.log(chalk.dim('\n  Launching Claude Code...\n'));
          const { execSync: run } = await import('child_process');
          try {
            run('claude --dangerously-skip-permissions', {
              cwd: projectDir,
              stdio: 'inherit',
              env: { ...process.env },
            });
          } catch {
            ui.info('Claude Code session ended.');
          }
        }
        process.exit(0);
      }

      if (action === 'exit') {
        process.exit(0);
      }

      // action === 'reconfig' → continue with full setup below
      ui.info('Reconfiguring project...');
      console.log('');
    } catch {
      // Corrupted config, continue with fresh setup
    }
  }

  // ─── Step 1: Detect Project ─────────────────────────────────────────────
  ui.header('🔍 Scanning project directory...');

  const detection = detectProject(projectDir);

  if (detection.hasCursorRules) {
    ui.info('.cursorrules detected — will import into Claude config');
  }
  if (detection.hasClaudeMd) {
    ui.info('Existing CLAUDE.md found — will merge with template');
  }
  if (!detection.hasGit) {
    ui.warn('No .git found — recommend initializing git first');
  }

  if (detection.stacks.length > 0) {
    const topStack = detection.stacks[0];
    console.log('');
    ui.success(`Detected: ${topStack.id.toUpperCase()} (${topStack.confidence}% confidence)`);
    ui.info(`Reason: ${topStack.reason}`);
  }

  // ─── Step 2: Select Stack ───────────────────────────────────────────────
  console.log('');
  const { stackId } = await inquirer.prompt([
    {
      type: 'list',
      name: 'stackId',
      message: 'Select your primary stack:',
      default: detection.stacks.length > 0 ? detection.stacks[0].id : undefined,
      choices: AVAILABLE_STACKS.map((s) => ({
        name: `${s.icon}  ${s.name}${!s.available ? chalk.dim(' (coming soon)') : ''}`,
        value: s.id,
        disabled: !s.available ? 'Coming soon' : false,
      })),
    },
  ]);

  const stackConfig = loadStackConfig(stackId);
  if (!stackConfig) {
    ui.error(`Stack config not found for: ${stackId}`);
    process.exit(1);
  }

  // ─── Step 3: Select Framework ──────────────────────────────────────────
  const detectedFramework =
    stackId === 'php'
      ? detectPhpFramework(projectDir)
      : stackId === 'nodejs'
        ? detectNodeFramework(projectDir)
        : stackId === 'python'
          ? detectPythonFramework(projectDir)
          : null;

  const { framework } = await inquirer.prompt([
    {
      type: 'list',
      name: 'framework',
      message: 'Select framework:',
      default: detectedFramework || undefined,
      choices: stackConfig.frameworks.map((f) => ({
        name: `${f.icon}  ${f.name}`,
        value: f.id,
      })),
    },
  ]);

  // ─── Step 4: Select Database ───────────────────────────────────────────
  const { database } = await inquirer.prompt([
    {
      type: 'list',
      name: 'database',
      message: 'Select database:',
      choices: stackConfig.databases.map((d) => ({
        name: `${d.icon}  ${d.name}`,
        value: d.id,
      })),
    },
  ]);

  // ─── Step 5: Frontend ──────────────────────────────────────────────────
  const { frontend } = await inquirer.prompt([
    {
      type: 'list',
      name: 'frontend',
      message: 'Frontend included?',
      choices: stackConfig.frontendOptions.map((f) => ({
        name: `${f.icon}  ${f.name}`,
        value: f.id,
      })),
    },
  ]);

  // ─── Step 6: Deploy — GitHub (default) ──────────────────────────────────
  const deploy = 'github';

  // ─── Step 6b: MCP Servers ────────────────────────────────────────────
  const selectedMcps = FLAGS.noMcp ? [] : await selectMcpServers(stackId, database);

  // ─── Step 7: Show Summary & Confirm ────────────────────────────────────
  const config: ProjectConfig = {
    name: projectName,
    stack: stackId,
    framework,
    database,
    frontend,
    deploy,
    path: projectDir,
    createdAt: new Date().toISOString(),
    skills: [...stackConfig.skills],
    qualityGates: `stacks/${stackId}/config/quality-gates.json`,
    cursorRules: detection.hasCursorRules,
    domains: {},
  };

  ui.configSummary({
    'Stack': `${stackConfig.icon}  ${stackConfig.name} (${stackConfig.runtime})`,
    'Framework': framework,
    'Database': database,
    'Frontend': frontend,
    'Deploy': '🐙 GitHub (git push)',
    'Agents': '6 universal',
    'Skills': `${stackConfig.skills.length} stack + shared`,
    'Hooks': 'stop-validator + prompt-inject',
    'Gates': stackConfig.qualityGates.map((g) => g.name).join(' → '),
    'MCPs': selectedMcps.length > 0 ? `${selectedMcps.length} servers` : 'None',
  });

  const { confirmed } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirmed',
      message: 'Confirm configuration?',
      default: true,
    },
  ]);

  if (!confirmed) {
    ui.info('Setup cancelled.');
    process.exit(0);
  }

  // ─── Step 8: Validate & Install Requirements ──────────────────────────
  if (!FLAGS.noInstall) {
    const reqOk = await autoInstall(stackConfig.requirements);
    if (!reqOk) {
      ui.error('Some requirements could not be installed. Fix manually and retry.');
      process.exit(1);
    }

    // PHP-specific: install Composer
    if (stackId === 'php') {
      const composerOk = await installComposer();
      if (!composerOk) {
        ui.warn('Composer installation failed — you may need to install it manually');
      }
    }
  }

  // ─── Step 9: Setup Project ─────────────────────────────────────────────
  ui.header('⚡ Configuring project...');

  const setupOk = await setupProject(projectDir, config, {
    force: FLAGS.force,
    noClaude: FLAGS.noClaude,
  });

  if (!setupOk) {
    ui.error('Setup failed.');
    process.exit(1);
  }

  // ─── Step 10: Install MCP Servers ───────────────────────────────────
  if (selectedMcps.length > 0) {
    await installMcpServers(selectedMcps, projectDir);
  }

  // ─── Step 11: Install Claude Code ──────────────────────────────────────
  if (!FLAGS.noClaude) {
    console.log('');
    installClaudeCode();
  }

  // ─── Done ──────────────────────────────────────────────────────────────
  console.log('');
  console.log(chalk.green.bold('  🎸 Ready to vibe!'));
  console.log('');

  if (!FLAGS.noClaude) {
    console.log(chalk.dim('  Launching Claude Code...\n'));

    const { execSync: run } = await import('child_process');
    try {
      run('claude --dangerously-skip-permissions', {
        cwd: projectDir,
        stdio: 'inherit',
        env: { ...process.env },
      });
    } catch {
      console.log('');
      ui.info('Claude Code session ended. Run again with: claude --dangerously-skip-permissions');
    }
  } else {
    console.log(chalk.dim('  Run: claude --dangerously-skip-permissions\n'));
  }
}

main().catch((err) => {
  ui.error(`Unexpected error: ${err}`);
  process.exit(1);
});
