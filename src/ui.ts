/**
 * Start Vibing Stacks — Terminal UI
 */

import { readFileSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';

const __ui_filename = fileURLToPath(import.meta.url);
const __ui_dirname = dirname(__ui_filename);
const VERSION: string = JSON.parse(
  readFileSync(join(resolve(__ui_dirname, '..'), 'package.json'), 'utf8')
).version;

export const LOGO = `
${chalk.hex('#9F7AEA')('    ╔═══════════════════════════════════════════════╗')}
${chalk.hex('#9F7AEA')('    ║')}                                                 ${chalk.hex('#9F7AEA')('║')}
${chalk.hex('#9F7AEA')('    ║')}   ${chalk.hex('#FF6B6B').bold('⚡')} ${chalk.bold.white('S T A R T')}   ${chalk.bold.white('V I B I N G')}   ${chalk.bold.white('S T A C K S')} ${chalk.hex('#FF6B6B').bold('⚡')}  ${chalk.hex('#9F7AEA')('║')}
${chalk.hex('#9F7AEA')('    ║')}                                                 ${chalk.hex('#9F7AEA')('║')}
${chalk.hex('#9F7AEA')('    ║')}      ${chalk.hex('#FF8E53')('🐘 PHP')}    ${chalk.hex('#48BB78')('📦 Node.js')}    ${chalk.hex('#4299E1')('🐍 Python')}      ${chalk.hex('#9F7AEA')('║')}
${chalk.hex('#9F7AEA')('    ║')}                                                 ${chalk.hex('#9F7AEA')('║')}
${chalk.hex('#9F7AEA')('    ║')}   ${chalk.dim('AI-powered dev workflow  ·  33 skills  ·  v' + VERSION)}   ${chalk.hex('#9F7AEA')('║')}
${chalk.hex('#9F7AEA')('    ║')}                                                 ${chalk.hex('#9F7AEA')('║')}
${chalk.hex('#9F7AEA')('    ╚═══════════════════════════════════════════════╝')}
`;

export function header(text: string): void {
  console.log('');
  console.log(chalk.cyan('  ┌' + '─'.repeat(48) + '┐'));
  console.log(chalk.cyan('  │') + '  ' + chalk.bold(text).padEnd(54) + chalk.cyan('│'));
  console.log(chalk.cyan('  └' + '─'.repeat(48) + '┘'));
}

export function success(text: string): void {
  console.log(chalk.green('  ✅ ') + text);
}

export function warn(text: string): void {
  console.log(chalk.yellow('  ⚠️  ') + text);
}

export function error(text: string): void {
  console.log(chalk.red('  ❌ ') + text);
}

export function info(text: string): void {
  console.log(chalk.blue('  ℹ️  ') + text);
}

export function step(n: number, total: number, text: string): void {
  console.log(chalk.dim(`  [${n}/${total}]`) + ' ' + text);
}

export function configSummary(config: Record<string, string>): void {
  console.log('');
  console.log(chalk.cyan('  ╔' + '═'.repeat(48) + '╗'));
  console.log(chalk.cyan('  ║') + chalk.bold('  📋 Project Configuration').padEnd(55) + chalk.cyan('║'));
  console.log(chalk.cyan('  ╠' + '═'.repeat(48) + '╣'));

  for (const [key, value] of Object.entries(config)) {
    const line = `  ${chalk.dim(key + ':')}  ${value}`;
    console.log(chalk.cyan('  ║') + line.padEnd(69) + chalk.cyan('║'));
  }

  console.log(chalk.cyan('  ╚' + '═'.repeat(48) + '╝'));
  console.log('');
}
