import chalk from 'chalk';

export async function statusCommand(options: { sorUrl?: string }): Promise<void> {
  const sorUrl = options.sorUrl || process.env.ROSIE_SOR_URL || 'http://localhost:3000';

  console.log(chalk.cyan('\n  ROSIE Status'));
  console.log(chalk.gray('  ──────────────────────────────────────────────'));
  console.log(chalk.gray(`  SoR URL: ${sorUrl}\n`));

  try {
    const response = await fetch(`${sorUrl}/v1/nodes/status/approvals`);

    if (!response.ok) {
      if (response.status === 404) {
        console.log(chalk.yellow('  No manifest synced yet.'));
        console.log(chalk.gray('  Run `rosie sync` first.\n'));
        return;
      }
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    console.log(chalk.gray('  Approval Status'));
    console.log(chalk.gray('  ──────────────────────────────────────────────'));

    const total = data.total;
    const approved = data.approved;
    const pending = data.pending;
    const rejected = data.rejected;
    const percent = total > 0 ? Math.round((approved / total) * 100) : 0;

    console.log(`  Total:      ${chalk.cyan(total)}`);
    console.log(`  Approved:   ${chalk.green(approved)} (${percent}%)`);
    console.log(`  Pending:    ${chalk.yellow(pending)}`);
    console.log(`  Rejected:   ${chalk.red(rejected)}`);
    console.log('');

    if (data.isFullyApproved) {
      console.log(chalk.green('  ✓ All requirements approved!'));
      console.log(chalk.green('  Ready for release.\n'));
    } else {
      console.log(chalk.yellow('  ✗ Not ready for release'));

      if (pending > 0) {
        console.log(chalk.gray(`\n  Pending approvals:`));
        for (const node of data.pendingNodes.slice(0, 5)) {
          console.log(chalk.yellow(`    • ${node.gxp_id} - ${node.title || node.type}`));
        }
        if (data.pendingNodes.length > 5) {
          console.log(chalk.gray(`    ... and ${data.pendingNodes.length - 5} more`));
        }
      }
      console.log('');
    }

  } catch (error) {
    console.log(chalk.red(`\n  Error: ${error instanceof Error ? error.message : 'Unknown error'}`));
    console.log(chalk.gray('  Make sure the SoR server is running.\n'));
    process.exit(1);
  }
}
