/**
 * Start Vibing Stacks — MCP Server Manager
 *
 * Discovers, selects, and configures MCP servers based on stack.
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import inquirer from 'inquirer';
import ora from 'ora';
import chalk from 'chalk';
import * as ui from './ui.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PACKAGE_ROOT = resolve(__dirname, '..');

interface McpServer {
  name: string;
  description: string;
  icon: string;
  tier: string;
  stacks: string[];
  install: string | null;
  config: Record<string, any>;
  envVars: string[];
  publisher: string;
}

interface McpRegistry {
  servers: Record<string, McpServer>;
  tiers: Record<string, string>;
}

/**
 * Load MCP server registry
 */
function loadRegistry(): McpRegistry {
  const registryPath = join(PACKAGE_ROOT, 'stacks', '_shared', 'config', 'mcp-servers.json');
  return JSON.parse(readFileSync(registryPath, 'utf8'));
}

/**
 * Get servers compatible with a stack + database
 */
function getCompatibleServers(
  registry: McpRegistry,
  stackId: string,
  database: string
): { id: string; server: McpServer; recommended: boolean }[] {
  const results: { id: string; server: McpServer; recommended: boolean }[] = [];

  for (const [id, server] of Object.entries(registry.servers)) {
    if (!server.stacks.includes(stackId)) continue;

    // Filter DB-specific MCPs
    if (id === 'mongodb' && database !== 'mongodb') continue;
    if (id === 'mysql' && database !== 'mysql') continue;
    if (id === 'postgres' && database !== 'postgresql') continue;
    if (id === 'nextjs-devtools' && stackId !== 'nodejs') continue;

    const recommended = server.tier === 'core' || 
      (id === 'mongodb' && database === 'mongodb') ||
      (id === 'mysql' && database === 'mysql') ||
      (id === 'postgres' && database === 'postgresql');

    results.push({ id, server, recommended });
  }

  // Sort: core first, then stack-specific, then productivity
  const tierOrder = { core: 0, 'stack-specific': 1, productivity: 2 };
  results.sort((a, b) => {
    const aOrder = tierOrder[a.server.tier as keyof typeof tierOrder] ?? 3;
    const bOrder = tierOrder[b.server.tier as keyof typeof tierOrder] ?? 3;
    return aOrder - bOrder;
  });

  return results;
}

/**
 * Interactive MCP selection
 */
export async function selectMcpServers(
  stackId: string,
  database: string
): Promise<string[]> {
  const registry = loadRegistry();
  const compatible = getCompatibleServers(registry, stackId, database);

  if (compatible.length === 0) {
    ui.info('No MCP servers available for this stack');
    return [];
  }

  ui.header('🔌 MCP Servers');
  console.log(chalk.dim('  Model Context Protocol — extend Claude Code capabilities\n'));

  const { selectedMcps } = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'selectedMcps',
      message: 'Select MCP servers to install:',
      choices: compatible.map((c) => {
        const envNote = c.server.envVars.length > 0
          ? chalk.dim(` (needs: ${c.server.envVars.join(', ')})`)
          : '';
        const tierLabel = c.server.tier === 'core'
          ? chalk.green(' [core]')
          : c.server.tier === 'stack-specific'
            ? chalk.yellow(' [stack]')
            : chalk.dim(' [optional]');

        return {
          name: `${c.server.icon}  ${c.server.name} — ${c.server.description}${tierLabel}${envNote}`,
          value: c.id,
          checked: c.recommended,
        };
      }),
    },
  ]);

  return selectedMcps;
}

/**
 * Install selected MCP servers
 */
export async function installMcpServers(
  selectedIds: string[],
  projectDir: string
): Promise<void> {
  if (selectedIds.length === 0) return;

  const registry = loadRegistry();
  const spinner = ora('Configuring MCP servers...').start();

  // Build Claude Code MCP config
  const mcpConfig: Record<string, any> = {};

  // Load project .env for variable resolution (Laravel DB_* etc.)
  const dotenvPath = join(projectDir, '.env');
  const dotenv: Record<string, string> = {};
  if (existsSync(dotenvPath)) {
    const envContent = readFileSync(dotenvPath, 'utf8');
    for (const line of envContent.split('\n')) {
      const match = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
      if (match) {
        dotenv[match[1]] = match[2].replace(/^["']|["']$/g, '');
      }
    }
  }

  function resolveEnvVars(obj: any): any {
    if (typeof obj === 'string') {
      return obj.replace(/\$\{([^}]+)\}/g, (_, key) => dotenv[key] || process.env[key] || '');
    }
    if (Array.isArray(obj)) return obj.map(resolveEnvVars);
    if (obj && typeof obj === 'object') {
      const resolved: Record<string, any> = {};
      for (const [k, v] of Object.entries(obj)) resolved[k] = resolveEnvVars(v);
      return resolved;
    }
    return obj;
  }

  for (const id of selectedIds) {
    const server = registry.servers[id];
    if (!server) continue;

    mcpConfig[id] = resolveEnvVars(server.config);

    // Try to install stdio-based servers
    if (server.install && server.config.command) {
      spinner.text = `Pre-caching ${server.name}...`;
      try {
        execSync(`${server.install} --help 2>/dev/null || true`, {
          stdio: 'pipe',
          timeout: 30000,
        });
      } catch {
        // Non-critical — Claude Code will install on first use
      }
    }
  }

  // Write MCP config to .claude/config/
  const configDir = join(projectDir, '.claude', 'config');
  mkdirSync(configDir, { recursive: true });
  writeFileSync(
    join(configDir, 'mcp-active.json'),
    JSON.stringify({ mcpServers: mcpConfig }, null, 2)
  );

  // Also write to Claude Code's settings if exists
  const claudeSettingsPath = join(projectDir, '.claude', 'settings.json');
  if (existsSync(claudeSettingsPath)) {
    try {
      const settings = JSON.parse(readFileSync(claudeSettingsPath, 'utf8'));
      settings.mcpServers = mcpConfig;
      writeFileSync(claudeSettingsPath, JSON.stringify(settings, null, '\t'));
    } catch {}
  }

  // Create .env.example with required env vars
  const envVars: string[] = [];
  for (const id of selectedIds) {
    const server = registry.servers[id];
    if (server?.envVars.length) {
      for (const v of server.envVars) {
        envVars.push(`# ${server.name}\n${v}=`);
      }
    }
  }

  if (envVars.length > 0) {
    const envExamplePath = join(projectDir, '.env.mcp.example');
    writeFileSync(envExamplePath, `# MCP Server Environment Variables\n# Copy to .env and fill in values\n\n${envVars.join('\n\n')}\n`);
    spinner.text = 'Created .env.mcp.example for required API keys';
  }

  spinner.succeed(`${selectedIds.length} MCP servers configured`);

  // Show env var warnings
  const needsEnv = selectedIds.filter((id) => {
    const server = registry.servers[id];
    return server?.envVars.length > 0;
  });

  if (needsEnv.length > 0) {
    console.log('');
    ui.warn('Some MCPs need environment variables:');
    for (const id of needsEnv) {
      const server = registry.servers[id];
      console.log(chalk.dim(`    ${server.icon}  ${server.name}: ${server.envVars.join(', ')}`));
    }
    ui.info('See .env.mcp.example for details');
  }
}
