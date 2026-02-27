/**
 * Start Vibing Stacks — Dependency Installer & Validator
 *
 * Validates system requirements and auto-installs missing dependencies.
 * macOS-first with Homebrew, with Linux fallbacks.
 */

import { execSync } from 'child_process';
import { platform } from 'os';
import * as semver from 'semver';
import ora from 'ora';
import * as ui from './ui.js';
import type { Requirement } from './types.js';

const OS = platform();

export interface ValidationResult {
  name: string;
  installed: boolean;
  version: string | null;
  meetsMinimum: boolean;
  minVersion: string;
}

/**
 * Get installed version of a tool
 */
function getVersion(command: string, versionFlag: string, regex: string): string | null {
  try {
    const output = execSync(`${command} ${versionFlag} 2>&1`, {
      encoding: 'utf8',
      timeout: 10000,
    }).trim();
    const match = output.match(new RegExp(regex));
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

/**
 * Check if Homebrew is installed (macOS)
 */
function hasHomebrew(): boolean {
  try {
    execSync('which brew', { encoding: 'utf8', stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Install Homebrew on macOS
 */
function installHomebrew(): boolean {
  const spinner = ora('Installing Homebrew...').start();
  try {
    execSync(
      '/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"',
      { stdio: 'inherit', timeout: 300000 }
    );
    spinner.succeed('Homebrew installed');
    return true;
  } catch {
    spinner.fail('Failed to install Homebrew');
    return false;
  }
}

/**
 * Install a dependency using the appropriate system command
 */
function installDependency(req: Requirement): boolean {
  const cmd = OS === 'darwin' ? req.installCommand.macos : req.installCommand.linux;
  if (!cmd) return false;

  const spinner = ora(`Installing ${req.name}...`).start();
  try {
    execSync(cmd, { stdio: 'pipe', timeout: 300000 });
    spinner.succeed(`${req.name} installed`);
    return true;
  } catch (err) {
    spinner.fail(`Failed to install ${req.name}`);
    return false;
  }
}

/**
 * Validate all requirements for a stack
 */
export function validateRequirements(requirements: Requirement[]): ValidationResult[] {
  const results: ValidationResult[] = [];

  for (const req of requirements) {
    const version = getVersion(req.command, req.versionFlag, req.versionRegex);
    const installed = version !== null;
    let meetsMinimum = false;

    if (installed && version) {
      try {
        const cleaned = semver.coerce(version);
        const minCleaned = semver.coerce(req.minVersion);
        if (cleaned && minCleaned) {
          meetsMinimum = semver.gte(cleaned, minCleaned);
        }
      } catch {
        meetsMinimum = false;
      }
    }

    results.push({
      name: req.name,
      installed,
      version,
      meetsMinimum,
      minVersion: req.minVersion,
    });
  }

  return results;
}

/**
 * Auto-install missing or outdated requirements
 */
export async function autoInstall(requirements: Requirement[]): Promise<boolean> {
  ui.header('🔍 Validating Requirements');

  // Ensure Homebrew on macOS
  if (OS === 'darwin' && !hasHomebrew()) {
    ui.warn('Homebrew not found. Installing...');
    if (!installHomebrew()) {
      ui.error('Cannot proceed without Homebrew on macOS');
      return false;
    }
  }

  const results = validateRequirements(requirements);
  let allGood = true;

  for (const result of results) {
    if (result.installed && result.meetsMinimum) {
      ui.success(`${result.name} ${result.version} (>= ${result.minVersion})`);
    } else if (result.installed && !result.meetsMinimum) {
      ui.warn(`${result.name} ${result.version} is below minimum ${result.minVersion}`);
      const req = requirements.find((r) => r.name === result.name)!;
      if (!installDependency(req)) {
        allGood = false;
      }
    } else {
      ui.warn(`${result.name} not found`);
      const req = requirements.find((r) => r.name === result.name)!;
      if (!installDependency(req)) {
        allGood = false;
      }
    }
  }

  // Re-validate after installation
  if (!allGood) {
    console.log('');
    ui.info('Re-validating after installation...');
    const recheck = validateRequirements(requirements);
    allGood = recheck.every((r) => r.installed && r.meetsMinimum);

    if (!allGood) {
      const failing = recheck.filter((r) => !r.installed || !r.meetsMinimum);
      for (const f of failing) {
        ui.error(`${f.name}: ${f.installed ? `v${f.version} < ${f.minVersion}` : 'not found'}`);
      }
    }
  }

  return allGood;
}

/**
 * Install Composer using PHP 8.3+
 */
export async function installComposer(): Promise<boolean> {
  // Check if composer exists
  const composerVersion = getVersion('composer', '--version', '(\\d+\\.\\d+\\.\\d+)');
  if (composerVersion) {
    ui.success(`Composer ${composerVersion} already installed`);
    return true;
  }

  ui.warn('Composer not found. Installing via PHP...');

  // Verify PHP is available first
  const phpVersion = getVersion('php', '-v', 'PHP\\s+(\\d+\\.\\d+\\.\\d+)');
  if (!phpVersion) {
    ui.error('PHP not found. Install PHP first.');
    return false;
  }

  const spinner = ora('Installing Composer...').start();
  try {
    // Official Composer install method
    const commands = [
      'php -r "copy(\'https://getcomposer.org/installer\', \'composer-setup.php\');"',
      'php composer-setup.php',
      'php -r "unlink(\'composer-setup.php\');"',
    ];

    if (OS === 'darwin') {
      commands.push('sudo mv composer.phar /usr/local/bin/composer');
    } else {
      commands.push('sudo mv composer.phar /usr/local/bin/composer');
    }

    for (const cmd of commands) {
      execSync(cmd, { stdio: 'pipe', timeout: 60000 });
    }

    spinner.succeed('Composer installed globally');
    return true;
  } catch {
    spinner.fail('Failed to install Composer');
    ui.info('Manual install: https://getcomposer.org/download/');
    return false;
  }
}

/**
 * Install Claude Code if not present
 */
export function installClaudeCode(): boolean {
  try {
    execSync('which claude', { stdio: 'pipe' });
    const version = getVersion('claude', '--version', '(\\d+\\.\\d+\\.\\d+)');
    ui.success(`Claude Code ${version || 'installed'}`);
    return true;
  } catch {
    ui.warn('Claude Code not found. Installing...');
    const spinner = ora('Installing Claude Code...').start();
    try {
      execSync('npm install -g @anthropic-ai/claude-code', {
        stdio: 'pipe',
        timeout: 120000,
      });
      spinner.succeed('Claude Code installed');
      return true;
    } catch {
      spinner.fail('Failed to install Claude Code');
      ui.info('Manual install: npm install -g @anthropic-ai/claude-code');
      return false;
    }
  }
}
