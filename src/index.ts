#!/usr/bin/env node
/**
 * Start Vibing Stacks — CLI Entry Point
 *
 * Multi-stack AI-powered development workflow for Claude Code.
 * Detects project stack, validates requirements, and configures agents.
 */

import { existsSync, readFileSync } from 'fs';
import { join, basename, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import inquirer from 'inquirer';
import chalk from 'chalk';
import * as ui from './ui.js';
import { detectProject, detectPhpFramework, detectNodeFramework, detectPythonFramework } from './detector.js';
import { autoInstall, installComposer, installClaudeCode } from './installer.js';
import { loadStackConfig, setupProject } from './setup.js';
import { selectMcpServers, installMcpServers } from './mcp.js';
import { scanProjectStandards } from './scanner.js';
import type { ProjectConfig, StandardsReview } from './types.js';
import { detectPreline, hasGlobalPrelineCorpus } from './targets/project-ui.js';

const __cli_filename = fileURLToPath(import.meta.url);
const __cli_dirname = dirname(__cli_filename);
const CLI_ROOT = resolve(__cli_dirname, '..');
const PKG_VERSION: string = JSON.parse(readFileSync(join(CLI_ROOT, 'package.json'), 'utf8')).version;

// =============================================================================
// CLI Arguments
// =============================================================================

const args = process.argv.slice(2);
const SUBCOMMAND = args[0] && !args[0].startsWith('-') ? args[0] : null;
function parseFlagValue(flag: string): string | undefined {
  const eq = args.find((a) => a.startsWith(`${flag}=`));
  if (eq) return eq.slice(flag.length + 1);
  const idx = args.indexOf(flag);
  if (idx >= 0 && args[idx + 1] && !args[idx + 1].startsWith('-')) return args[idx + 1];
  return undefined;
}

const FLAGS = {
  force: args.includes('--force'),
  noClaude: args.includes('--no-claude'),
  noMcp: args.includes('--no-mcp'),
  noInstall: args.includes('--no-install'),
  help: args.includes('--help') || args.includes('-h'),
  version: args.includes('--version') || args.includes('-v'),
  apply: args.includes('--apply'),
  forceHooks: args.includes('--force-hooks') || args.includes('--force-legacy'),
  withMemoryOptimization: args.includes('--with-memory-optimization'),
  skipUpdate: args.includes('--skip-update'),
  noLaunch: args.includes('--no-launch'),
  target: parseFlagValue('--target'),
};

if (FLAGS.version) {
  console.log(PKG_VERSION);
  process.exit(0);
}

if (FLAGS.help) {
  console.log(ui.LOGO);
  console.log(`
  ${chalk.bold('Usage:')}
    npx start-vibing-stacks [command] [options]

  ${chalk.bold('Commands:')}
    (default)         Setup or resume current project
                      Resume: Launch auto-migrates when outdated; prefer
                      npx start-vibing-stacks@latest (stale npx cache = old skills)
                      Launch Grok = grok --always-approve --trust
    migrate           Compare installed vs bundled skill/agent/memory versions
                      Syncs AGENTS.md + MCP + .cursor/rules (Kimi/Grok/Cursor)
                      --apply updates, then opens the launcher (TTY).
                      (npm publish alone does NOT update project .claude/)

  ${chalk.bold('Options:')}
    --force           Overwrite existing configuration (default command)
    --apply           Apply updates (migrate command)
    --target <id>     migrate only: claude | kimi | grok | cursor | all (default: all)
                      (migrate always prints TARGET STATUS)
    --skip-update     Launch without auto migrate --apply (not recommended)
    --force-legacy    Overwrite legacy hooks (no @sv-version) AND legacy commands
                      (no version: frontmatter) — each gets a timestamped .bak
    --force-hooks     Alias for --force-legacy (kept for back-compat)
    --no-claude       Skip Claude Code installation
    --no-mcp          Skip MCP server selection
    --no-install      Skip dependency installation
    --with-memory-optimization
                      Install/refresh Memory Optimization Pipeline (setup AND migrate --apply)
    --no-launch       After migrate --apply, exit instead of opening the launcher
    --help, -h        Show this help
    --version, -v     Show version

  ${chalk.bold('Supported Stacks:')}
    🐘 PHP 8.3+       Laravel 12 + Octane + Sanctum SPA API + React/Vite/Axios
    📦 Node.js/TS     Next.js, Nuxt, Express, Fastify
    🐍 Python 3.12+   FastAPI, Django, Flask
  `);
  process.exit(0);
}

// Subcommand: migrate — apply then fall through to main() launcher (TTY)
if (SUBCOMMAND === 'migrate') {
  const { runMigrate } = await import('./migrate.js');
  const { parseMigrateTarget } = await import('./targets/index.js');
  const migrateDir = process.cwd();
  await runMigrate(migrateDir, {
    apply: FLAGS.apply,
    forceHooks: FLAGS.forceHooks,
    target: parseMigrateTarget(FLAGS.target),
    withMemoryOptimization: FLAGS.withMemoryOptimization,
  });
  const configured = existsSync(join(migrateDir, '.claude', 'config', 'active-project.json'));
  const interactive =
    Boolean(process.stdin.isTTY) && process.env['CI'] !== 'true' && process.env['CI'] !== '1';
  const resumeAfter = FLAGS.apply && configured && interactive && !FLAGS.noLaunch;
  if (!resumeAfter) {
    process.exit(0);
  }
  ui.info('Opening launcher…');
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

      // Surface pending package updates (memories/skills/etc.) — resume alone never
      // overwrites .claude/; users must migrate --apply (or pick the menu option).
      const { planMigration } = await import('./migrate.js');
      const pending = planMigration(projectDir, { apply: false }).filter(
        (it) => it.status === 'outdated' || it.status === 'missing'
      );
      const {
        availableLaunchTargets,
        launchMenuLabel,
        formatLaunchCommand,
        resolveLaunchSpec,
        launchTarget,
        agentsMdNeedsUpdate,
        bundledAgentsMdVersion,
        syncTargets,
        formatTargetsStatus,
        recentChangesDrifted,
        cursorRulesNeedsUpdate,
        kimiLocalNeedsUpdate,
        grokSkillsNeedsUpdate,
        hooksExportNeedsUpdate,
        mcpExportNeedsUpdate,
      } = await import('./targets/index.js');
      const agentsNeed = agentsMdNeedsUpdate(projectDir, bundledAgentsMdVersion());
      const agentsPending =
        agentsNeed.missing || agentsNeed.outdated || recentChangesDrifted(projectDir);
      const cursorPending = (() => {
        const c = cursorRulesNeedsUpdate(projectDir);
        return c.missing || c.outdated;
      })();
      const kimiPending = (() => {
        const k = kimiLocalNeedsUpdate(projectDir);
        return k.localMissing || k.blockMissing || k.exampleMissing;
      })();
      const grokSkillsPending = (() => {
        const g = grokSkillsNeedsUpdate(projectDir);
        return g.blockMissing || g.nativeMissing || g.outdated || g.curatedMissing > 0;
      })();
      const hooksPending = (() => {
        const h = hooksExportNeedsUpdate(projectDir);
        return h.kimiMissing || h.grokMissing || h.outdated;
      })();
      const mcpPending = (() => {
        const m = mcpExportNeedsUpdate(projectDir);
        return m.missing || m.outdated;
      })();
      let pendingTotal =
        pending.length +
        (agentsPending ? 1 : 0) +
        (cursorPending ? 1 : 0) +
        (kimiPending ? 1 : 0) +
        (grokSkillsPending ? 1 : 0) +
        (hooksPending ? 1 : 0) +
        (mcpPending ? 1 : 0);

      const justMigrated = SUBCOMMAND === 'migrate' && FLAGS.apply;
      if (justMigrated && pendingTotal > 0 && !FLAGS.skipUpdate) {
        ui.info(`Applying ${pendingTotal} leftover update(s) after migrate…`);
        const { runMigrate } = await import('./migrate.js');
        await runMigrate(projectDir, {
          apply: true,
          forceHooks: FLAGS.forceHooks,
          withMemoryOptimization: FLAGS.withMemoryOptimization,
        });
        const leftover = planMigration(projectDir, { apply: false }).filter(
          (it) => it.status === 'outdated' || it.status === 'missing'
        );
        const agents2 = agentsMdNeedsUpdate(projectDir, bundledAgentsMdVersion());
        const cur2 = cursorRulesNeedsUpdate(projectDir);
        const kimi2 = kimiLocalNeedsUpdate(projectDir);
        const grok2 = grokSkillsNeedsUpdate(projectDir);
        const hooks2 = hooksExportNeedsUpdate(projectDir);
        const mcp2 = mcpExportNeedsUpdate(projectDir);
        pendingTotal =
          leftover.length +
          (agents2.missing || agents2.outdated || recentChangesDrifted(projectDir) ? 1 : 0) +
          (cur2.missing || cur2.outdated ? 1 : 0) +
          (kimi2.localMissing || kimi2.blockMissing || kimi2.exampleMissing ? 1 : 0) +
          (grok2.blockMissing || grok2.nativeMissing || grok2.outdated || grok2.curatedMissing > 0
            ? 1
            : 0) +
          (hooks2.kimiMissing || hooks2.grokMissing || hooks2.outdated ? 1 : 0) +
          (mcp2.missing || mcp2.outdated ? 1 : 0);
      }

      if (!justMigrated) {
        console.log('\n' + formatTargetsStatus(projectDir));
      }

      const pendingLabel =
        pendingTotal > 0
          ? `📦  Update from package (${pendingTotal} outdated/missing) — migrate --apply`
          : '📦  Update from package (migrate --apply)';
      if (pendingTotal > 0 && !justMigrated) {
        ui.warn(
          `${pendingTotal} bundled artefact(s) newer than this project — Launch will auto-migrate, or: npx start-vibing-stacks@latest migrate --apply`
        );
      }

      const { checkCliFreshness } = await import('./version-check.js');
      const cliFresh = await checkCliFreshness(PKG_VERSION);
      if (cliFresh.stale && cliFresh.latest) {
        ui.warn(
          `CLI running ${PKG_VERSION} but npm latest is ${cliFresh.latest} — npx cache is stale.`
        );
        ui.warn(`Re-run: npx start-vibing-stacks@latest`);
      }

      const launchChoices = availableLaunchTargets().map((t) => {
        const icon = t.id === 'claude' ? '🚀' : t.id === 'kimi' ? '🌙' : '⚡';
        const suffix =
          pendingTotal > 0 && !FLAGS.skipUpdate ? ' (auto-update first)' : '';
        return { name: `${icon}  ${launchMenuLabel(t)}${suffix}`, value: `launch:${t.id}` };
      });
      if (launchChoices.length === 0) {
        launchChoices.push({
          name: '🚀  Launch Claude Code (install `claude` on PATH first)',
          value: 'launch:claude',
        });
      }

      console.log('');

      const skipFullMenu = justMigrated && pendingTotal === 0;
      const updateChoice = { name: pendingLabel, value: 'migrate' };
      const { action } = await inquirer.prompt([
        {
          type: 'list',
          name: 'action',
          message: skipFullMenu ? 'Launch:' : 'What do you want to do?',
          choices: skipFullMenu
            ? [...launchChoices, { name: '❌  Exit', value: 'exit' }]
            : [
                // Prefer Update when project artefacts lag (common Kimi/Grok skip path)
                ...(pendingTotal > 0 ? [updateChoice] : []),
                ...launchChoices,
                ...(pendingTotal > 0 ? [] : [updateChoice]),
                { name: '📄  Regenerate AGENTS.md (Kimi/Grok/Cursor)', value: 'sync-agents' },
                { name: '🧩  Sync Cursor rules + MCP (.cursor/)', value: 'sync-cursor' },
                { name: '🔄  Reconfigure project (fresh setup)', value: 'reconfig' },
                { name: '❌  Exit', value: 'exit' },
              ],
        },
      ]);

      if (action === 'migrate') {
        const { runMigrate } = await import('./migrate.js');
        await runMigrate(projectDir, { apply: true, forceHooks: FLAGS.forceHooks });
        process.exit(0);
      }

      if (action === 'sync-agents') {
        const sync = syncTargets(projectDir, {
          forceAgentsMd: true,
          forceCursorRules: true,
          forceKimiLocal: true,
          forceGrokSkills: true,
          forceHooksExport: true,
          migrateTarget: 'all',
        });
        if (sync.agentsMdWritten) {
          ui.success(`Wrote AGENTS.md (svs-version ${sync.agentsMdVersion})`);
        } else {
          ui.info(sync.skippedReason || 'AGENTS.md unchanged');
        }
        if (sync.cursorRules.written) {
          ui.success(`Wrote .cursor/rules/svs-policy.mdc (svs-version ${sync.cursorRules.version})`);
        }
        if (sync.kimiLocal.localWritten || sync.kimiLocal.localUpdated) {
          ui.success('Updated .kimi-code/local.toml (SVS block)');
        }
        if (
          sync.grokSkills.configUpdated ||
          sync.grokSkills.nativeSkillWritten ||
          sync.grokSkills.curatedCopied > 0 ||
          sync.grokSkills.generatedWritten > 0
        ) {
          ui.success(
            `Updated Grok skills (svs-version ${sync.grokSkills.version};` +
              ` curated=${sync.grokSkills.curatedCopied}, generated=${sync.grokSkills.generatedWritten})`
          );
        }
        if (
          sync.hooksExport.kimiLocalUpdated ||
          sync.hooksExport.kimiUserUpdated ||
          sync.hooksExport.grokHooksWritten
        ) {
          ui.success(`Updated Kimi/Grok hooks bridge (svs-version ${sync.hooksExport.version})`);
        }
        process.exit(0);
      }

      if (action === 'sync-cursor') {
        const sync = syncTargets(projectDir, {
          forceAgentsMd: true,
          forceMcp: true,
          forceCursorRules: true,
          migrateTarget: 'cursor',
        });
        if (sync.cursorRules.written) {
          ui.success(`Wrote .cursor/rules/svs-policy.mdc (svs-version ${sync.cursorRules.version})`);
        } else {
          ui.info(sync.cursorRules.skippedReason || 'Cursor rules unchanged');
        }
        if (sync.mcp.cursorWritten) {
          ui.success('Wrote .cursor/mcp.json');
        } else if (sync.mcp.skippedReason) {
          ui.info(sync.mcp.skippedReason);
        }
        if (sync.agentsMdWritten) {
          ui.success(`Wrote AGENTS.md (svs-version ${sync.agentsMdVersion})`);
        }
        process.exit(0);
      }

      if (typeof action === 'string' && action.startsWith('launch:')) {
        const targetId = action.slice('launch:'.length) as 'claude' | 'kimi' | 'grok';
        if (targetId === 'claude' && FLAGS.noClaude) {
          process.exit(0);
        }

        // Stale npx CLI cannot refresh memories/skills to npm latest — stop early.
        if (cliFresh.stale && cliFresh.latest && !FLAGS.skipUpdate) {
          const { proceedStale } = await inquirer.prompt([
            {
              type: 'confirm',
              name: 'proceedStale',
              message: `CLI ${PKG_VERSION} < npm ${cliFresh.latest}. Launch anyway? (prefer npx start-vibing-stacks@latest)`,
              default: false,
            },
          ]);
          if (!proceedStale) {
            ui.info('Aborted. Run: npx start-vibing-stacks@latest');
            process.exit(1);
          }
        }

        // Auto migrate before Launch — Kimi/Grok previously only synced side-cars
        // and skipped .claude skills/memories/hooks, so versions stayed old.
        if (!FLAGS.skipUpdate && pendingTotal > 0) {
          ui.info(`Applying ${pendingTotal} pending update(s) before launch…`);
          const { runMigrate } = await import('./migrate.js');
          await runMigrate(projectDir, {
            apply: true,
            forceHooks: FLAGS.forceHooks,
            // kimi/grok read .claude/skills via extra_*_dirs — always refresh Claude artefacts too
            target: 'all',
          });
        } else if (targetId === 'kimi' || targetId === 'grok') {
          syncTargets(projectDir, {
            updateIfNeeded: true,
            migrateTarget: targetId,
            forceHooksExport: true,
            forceKimiLocal: targetId === 'kimi',
            forceGrokSkills: targetId === 'grok',
            forceGrokAgents: targetId === 'grok',
          });
        }

        // After migrate, force target side-cars once more (hooks/skills/local.toml).
        if (targetId === 'kimi' || targetId === 'grok') {
          const sync = syncTargets(projectDir, {
            updateIfNeeded: true,
            migrateTarget: targetId,
            forceHooksExport: true,
            forceKimiLocal: targetId === 'kimi',
            forceGrokSkills: targetId === 'grok',
            forceGrokAgents: targetId === 'grok',
            forceMcp: true,
          });
          if (sync.kimiLocal.localUpdated || sync.kimiLocal.localWritten) {
            ui.success('Kimi local.toml refreshed');
          }
          if (
            sync.grokSkills.nativeSkillWritten ||
            sync.grokSkills.curatedCopied > 0 ||
            sync.grokSkills.generatedWritten > 0
          ) {
            ui.success(`Grok skills refreshed (svs-version ${sync.grokSkills.version})`);
          }
          if (sync.hooksExport.grokHooksWritten || sync.hooksExport.kimiLocalUpdated) {
            ui.success(`Hooks bridge refreshed (svs-version ${sync.hooksExport.version})`);
          }
        }

        const launchSpec = resolveLaunchSpec(targetId);
        console.log(chalk.dim(`\n  $ ${formatLaunchCommand(launchSpec)}\n`));
        const result = launchTarget(projectDir, targetId);
        if (!result.ok) {
          ui.warn(result.message || 'Launch failed');
        } else if (result.message) {
          ui.info(result.message);
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

  const defaultFramework =
    detectedFramework ||
    stackConfig.frameworks.find((f) => f.default)?.id ||
    undefined;

  const { framework } = await inquirer.prompt([
    {
      type: 'list',
      name: 'framework',
      message: 'Select framework:',
      default: defaultFramework,
      choices: stackConfig.frameworks.map((f) => ({
        name: `${f.icon}  ${f.name}`,
        value: f.id,
      })),
    },
  ]);

  const selectedFramework = stackConfig.frameworks.find((f) => f.id === framework);

  // ─── Step 4: Select Database ───────────────────────────────────────────
  const defaultDatabase = stackConfig.databases.find((d) => d.default)?.id || undefined;

  const { database } = await inquirer.prompt([
    {
      type: 'list',
      name: 'database',
      message: 'Select database:',
      default: defaultDatabase,
      choices: stackConfig.databases.map((d) => ({
        name: `${d.icon}  ${d.name}`,
        value: d.id,
      })),
    },
  ]);

  // ─── Step 5: Frontend ──────────────────────────────────────────────────
  const compatibleFrontends = stackConfig.frontendOptions.filter(
    (f) => !f.frameworks || f.frameworks.includes(framework)
  );

  const defaultFrontend = compatibleFrontends.find((f) => f.default)?.id || undefined;

  const { frontend } = await inquirer.prompt([
    {
      type: 'list',
      name: 'frontend',
      message: 'Frontend included?',
      default: defaultFrontend,
      choices: compatibleFrontends.map((f) => ({
        name: `${f.icon}  ${f.name}`,
        value: f.id,
      })),
    },
  ]);

  let prelineMoon: boolean | undefined;
  if (frontend && frontend !== 'none') {
    const det = detectPreline(projectDir);
    const globalOk = hasGlobalPrelineCorpus();
    const { prelineChoice } = await inquirer.prompt([
      {
        type: 'list',
        name: 'prelineChoice',
        message: 'Preline moon corpus? Markup is read from ~/.claude/skills/preline-moon (not shipped in npm)',
        default: det.used ? 'yes' : 'no',
        choices: [
          {
            name: globalOk
              ? 'Yes — use the global 5.0 capture'
              : 'Yes — pointer only (global capture not on disk yet)',
            value: 'yes',
          },
          { name: 'No — project design-system only', value: 'no' },
          {
            name: det.used
              ? `Detect from this repo (found: ${det.evidence.join(', ')})`
              : 'Detect from this repo (no Preline found)',
            value: 'detect',
          },
        ],
      },
    ]);
    prelineMoon = prelineChoice === 'yes' ? true : prelineChoice === 'no' ? false : det.used;
  }

  // ─── Step 6: Deploy — GitHub (default) ──────────────────────────────────
  const deploy = 'github';

  // ─── Step 6b: MCP Servers ────────────────────────────────────────────
  const selectedMcps = FLAGS.noMcp ? [] : await selectMcpServers(stackId, database);

  // ─── Step 6c: Standards Review ──────────────────────────────────────────
  let standardsReview: StandardsReview | undefined;

  const scanResults = scanProjectStandards(projectDir);

  if (scanResults.patterns.length > 0) {
    console.log('');
    ui.header('📋 Standards Review');
    ui.info(`Found ${scanResults.patterns.length} patterns from: ${scanResults.sources.join(', ')}`);
    console.log('');

    const categories = new Map<string, string[]>();
    for (const p of scanResults.patterns) {
      const list = categories.get(p.category) || [];
      list.push(p.name);
      categories.set(p.category, list);
    }

    for (const [category, items] of categories) {
      console.log(chalk.cyan(`  ${category}:`));
      for (const item of items.slice(0, 3)) {
        console.log(chalk.dim(`    • ${item}`));
      }
      if (items.length > 3) {
        console.log(chalk.dim(`    ... and ${items.length - 3} more`));
      }
    }

    console.log('');
    const { adaptStandards } = await inquirer.prompt([
      {
        type: 'list',
        name: 'adaptStandards',
        message: 'Adapt AI skills to match your project standards?',
        choices: [
          {
            name: `🎯  Use my standards ${chalk.dim('— import patterns into AI context')}`,
            value: 'adapt',
          },
          {
            name: `📦  Use defaults ${chalk.dim('— start with plugin defaults')}`,
            value: 'defaults',
          },
        ],
      },
    ]);

    scanResults.status = adaptStandards === 'adapt' ? 'adapted' : 'defaults';
    scanResults.userChoice = adaptStandards;
    standardsReview = scanResults;

    if (adaptStandards === 'adapt') {
      ui.success(`${scanResults.patterns.length} patterns will be imported into AI context`);
    }
  }

  // ─── Step 7: Show Summary & Confirm ────────────────────────────────────
  const selectedFrontend = compatibleFrontends.find((f) => f.id === frontend);

  const config: ProjectConfig = {
    name: projectName,
    stack: stackId,
    framework,
    database,
    frontend,
    prelineMoon,
    frontendSkillsDir: selectedFrontend?.skillsDir,
    frontendBaseSkillsDir: selectedFrontend?.baseSkillsDir,
    deploy,
    path: projectDir,
    createdAt: new Date().toISOString(),
    skills: [
      ...stackConfig.skills,
      ...(selectedFramework?.skills ?? []),
    ],
    qualityGates: `stacks/${stackId}/config/quality-gates.json`,
    cursorRules: detection.hasCursorRules,
    domains: {},
    standardsReview,
  };

  const standardsLabel = standardsReview
    ? standardsReview.status === 'adapted'
      ? `${standardsReview.patterns.length} patterns imported`
      : 'Using defaults'
    : 'No patterns found';

  ui.configSummary({
    'Stack': `${stackConfig.icon}  ${stackConfig.name} (${stackConfig.runtime})`,
    'Framework': framework,
    'Database': database,
    'Frontend': frontend,
    'Preline moon':
      frontend && frontend !== 'none'
        ? prelineMoon
          ? 'yes (global ~/.claude/skills/preline-moon)'
          : 'no (design-system only)'
        : 'n/a',
    'Deploy': '🐙 GitHub (git push)',
    'Standards': standardsLabel,
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
    withMemoryOptimization: FLAGS.withMemoryOptimization,
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
