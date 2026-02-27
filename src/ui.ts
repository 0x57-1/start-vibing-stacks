/**
 * Start Vibing Stacks — Terminal UI
 */

import chalk from 'chalk';

export const LOGO = `
${chalk.red('     /\\                              /\\')}
${chalk.red('    / \\\\')}  ${chalk.white('██╗   ██╗')}${chalk.red('                / \\\\')}
${chalk.red('   /   \\\\')} ${chalk.white('████╗ ████║')}${chalk.red('              /   \\\\')}
${chalk.red('  / /\\  \\\\')}${chalk.white('██╔═██╔═██║')}${chalk.red('            / /\\  \\\\')}
${chalk.red(' / /  \\  \\\\')}${chalk.white('██║ ██║ ██║')}${chalk.red('          / /  \\  \\\\')}
${chalk.red('/_/    \\__\\\\')}${chalk.white('╚═╝ ╚═╝ ╚═╝')}${chalk.red('        /_/    \\__\\\\')}

${chalk.bold('  START VIBING STACKS')}${chalk.dim('  ·  Multi-stack AI workflow  ·  v1.0.0')}
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
