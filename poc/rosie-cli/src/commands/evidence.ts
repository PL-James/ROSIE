import chalk from 'chalk';
import { readFileSync, existsSync } from 'fs';

export async function evidenceCommand(options: { file?: string; sorUrl?: string }): Promise<void> {
  const sorUrl = options.sorUrl || process.env.ROSIE_SOR_URL || 'http://localhost:3000';
  const evidenceFile = options.file || './gxp-execution.json';

  console.log(chalk.cyan('\n  ROSIE Evidence Upload'));
  console.log(chalk.gray('  ──────────────────────────────────────────────'));
  console.log(chalk.gray(`  SoR URL: ${sorUrl}`));
  console.log(chalk.gray(`  File:    ${evidenceFile}\n`));

  if (!existsSync(evidenceFile)) {
    console.log(chalk.red(`  Error: Evidence file not found: ${evidenceFile}`));
    console.log(chalk.gray('\n  Create a gxp-execution.json file with test results.\n'));
    process.exit(1);
  }

  try {
    const content = readFileSync(evidenceFile, 'utf-8');
    const evidence = JSON.parse(content);

    // Validate structure
    if (!evidence.execution_id || !Array.isArray(evidence.results)) {
      console.log(chalk.red('  Error: Invalid evidence file format'));
      console.log(chalk.gray('  Expected: { execution_id, results: [...] }\n'));
      process.exit(1);
    }

    console.log(chalk.gray(`  Uploading ${evidence.results.length} test results...`));

    const response = await fetch(`${sorUrl}/v1/evidence/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': 'ci-agent@rosie.local',
      },
      body: content,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    const result = await response.json();

    console.log(chalk.green('\n  Evidence uploaded successfully!'));
    console.log(chalk.gray('  ──────────────────────────────────────────────'));
    console.log(`  Evidence ID: ${chalk.cyan(result.evidence_id)}`);
    console.log(`  Passed:      ${chalk.green(result.summary.passed)}`);
    console.log(`  Failed:      ${chalk.red(result.summary.failed)}`);
    console.log(`  Skipped:     ${chalk.gray(result.summary.skipped)}`);
    console.log('');

    if (result.summary.failed > 0) {
      console.log(chalk.yellow('  Warning: Some tests failed. Release may be blocked.\n'));
    }

  } catch (error) {
    if (error instanceof SyntaxError) {
      console.log(chalk.red('  Error: Invalid JSON in evidence file'));
    } else {
      console.log(chalk.red(`\n  Error: ${error instanceof Error ? error.message : 'Unknown error'}`));
    }
    console.log(chalk.gray('  Make sure the SoR server is running.\n'));
    process.exit(1);
  }
}
