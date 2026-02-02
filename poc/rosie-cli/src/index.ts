#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { scanCommand } from './commands/scan.js';
import { syncCommand } from './commands/sync.js';
import { statusCommand } from './commands/status.js';
import { evidenceCommand } from './commands/evidence.js';
import { releaseCommand } from './commands/release.js';

const program = new Command();

program
  .name('rosie')
  .description(chalk.cyan('ROSIE CLI - Repo-First GxP Compliance Engine'))
  .version('1.0.0');

program
  .command('scan')
  .description('Scan project and display trace graph')
  .option('-f, --format <format>', 'Output format: graph, table, json', 'graph')
  .action(scanCommand);

program
  .command('sync')
  .description('Sync manifest to System of Record')
  .option('-s, --sor-url <url>', 'SoR API URL', 'http://localhost:3000')
  .action(syncCommand);

program
  .command('status')
  .description('Check approval status')
  .option('-s, --sor-url <url>', 'SoR API URL', 'http://localhost:3000')
  .action(statusCommand);

program
  .command('evidence')
  .description('Upload test execution evidence')
  .option('-f, --file <path>', 'Path to gxp-execution.json', './gxp-execution.json')
  .option('-s, --sor-url <url>', 'SoR API URL', 'http://localhost:3000')
  .action(evidenceCommand);

program
  .command('release')
  .description('Request Release Readiness Token')
  .option('-c, --commit-sha <sha>', 'Git commit SHA')
  .option('-s, --sor-url <url>', 'SoR API URL', 'http://localhost:3000')
  .action(releaseCommand);

// Banner
console.log(chalk.cyan(`
  ╔═══════════════════════════════════════════════════════╗
  ║   ${chalk.bold('ROSIE')} - Repo-First GxP Compliance Engine          ║
  ║   Regulatory Orchestration for Software Integrity     ║
  ╚═══════════════════════════════════════════════════════╝
`));

program.parse();
