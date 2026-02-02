import chalk from 'chalk';
import { execSync } from 'child_process';

export async function releaseCommand(options: { commitSha?: string; sorUrl?: string }): Promise<void> {
  const sorUrl = options.sorUrl || process.env.ROSIE_SOR_URL || 'http://localhost:3000';

  // Get commit SHA
  let commitSha = options.commitSha;
  if (!commitSha) {
    try {
      commitSha = execSync('git rev-parse HEAD', { encoding: 'utf-8' }).trim();
    } catch {
      console.log(chalk.red('\n  Error: Could not determine commit SHA.'));
      console.log(chalk.gray('  Provide --commit-sha or run from a git repository.\n'));
      process.exit(1);
    }
  }

  console.log(chalk.cyan('\n  ROSIE Release Check'));
  console.log(chalk.gray('  ──────────────────────────────────────────────'));
  console.log(chalk.gray(`  SoR URL: ${sorUrl}`));
  console.log(chalk.gray(`  Commit:  ${commitSha}\n`));

  try {
    const response = await fetch(`${sorUrl}/v1/release/readiness/${commitSha}`);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    const data = await response.json();

    console.log(chalk.gray('  Gate Conditions'));
    console.log(chalk.gray('  ──────────────────────────────────────────────'));

    for (const condition of data.conditions) {
      const icon = condition.passed ? chalk.green('✓') : chalk.red('✗');
      const name = condition.passed ? chalk.green(condition.name) : chalk.red(condition.name);
      console.log(`  ${icon} ${name}`);
      console.log(chalk.gray(`    ${condition.details}`));
    }

    console.log('');

    if (data.is_ready) {
      console.log(chalk.green('  ╔═══════════════════════════════════════════╗'));
      console.log(chalk.green('  ║                                           ║'));
      console.log(chalk.green('  ║   ✓ RRT ISSUED - CLEARED FOR RELEASE     ║'));
      console.log(chalk.green('  ║                                           ║'));
      console.log(chalk.green('  ╚═══════════════════════════════════════════╝'));
      console.log('');

      if (data.rrt) {
        console.log(chalk.gray('  Release Readiness Token:'));
        console.log(chalk.cyan(`  ${data.rrt.token.substring(0, 50)}...`));
        console.log('');
        console.log(chalk.gray(`  Issued:  ${new Date(data.rrt.issued_at).toLocaleString()}`));
        console.log(chalk.gray(`  Expires: ${new Date(data.rrt.expires_at).toLocaleString()}`));
        console.log('');
      }
    } else {
      console.log(chalk.red('  ╔═══════════════════════════════════════════╗'));
      console.log(chalk.red('  ║                                           ║'));
      console.log(chalk.red('  ║   ✗ RELEASE BLOCKED                       ║'));
      console.log(chalk.red('  ║                                           ║'));
      console.log(chalk.red('  ╚═══════════════════════════════════════════╝'));
      console.log('');

      if (data.blocking_issues && data.blocking_issues.length > 0) {
        console.log(chalk.gray('  Blocking issues:'));
        for (const issue of data.blocking_issues) {
          console.log(chalk.red(`    • ${issue}`));
        }
        console.log('');
      }
    }

  } catch (error) {
    console.log(chalk.red(`\n  Error: ${error instanceof Error ? error.message : 'Unknown error'}`));
    console.log(chalk.gray('  Make sure the SoR server is running.\n'));
    process.exit(1);
  }
}
