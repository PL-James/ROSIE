import chalk from 'chalk';
import { execSync } from 'child_process';
import { buildTraceGraph } from '../graph/builder.js';

export async function syncCommand(options: { sorUrl?: string }): Promise<void> {
  const projectDir = process.cwd();
  const sorUrl = options.sorUrl || process.env.ROSIE_SOR_URL || 'http://localhost:3000';

  console.log(chalk.cyan('\n  ROSIE Sync'));
  console.log(chalk.gray('  ──────────────────────────────────────────────'));
  console.log(chalk.gray(`  Project: ${projectDir}`));
  console.log(chalk.gray(`  SoR URL: ${sorUrl}\n`));

  // Build graph
  const graph = await buildTraceGraph(projectDir);
  if (!graph) {
    console.log(chalk.red('  Error: No gxp-product.md manifest found'));
    process.exit(1);
  }

  // Get commit SHA
  let commitSha = 'demo-commit-' + Date.now().toString(16);
  try {
    commitSha = execSync('git rev-parse HEAD', { cwd: projectDir, encoding: 'utf-8' }).trim();
  } catch {
    console.log(chalk.yellow('  Warning: Not a git repository, using demo commit SHA'));
  }

  // Prepare payload
  const payload = {
    product_code: graph.product_code,
    version: graph.version,
    commit_sha: commitSha,
    manifest_hash: graph.manifest_hash,
    nodes: graph.nodes.map(n => ({
      gxp_id: n.gxp_id,
      type: n.type,
      title: n.title,
      description: n.description,
      risk: n.risk,
    })),
    edges: graph.edges,
  };

  console.log(chalk.gray(`  Syncing ${graph.nodes.length} nodes, ${graph.edges.length} edges...`));

  try {
    const response = await fetch(`${sorUrl}/v1/sync/manifest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': 'ci-agent@rosie.local',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    const result = await response.json();

    console.log(chalk.green('\n  Sync successful!'));
    console.log(chalk.gray('  ──────────────────────────────────────────────'));
    console.log(`  Sync ID:     ${chalk.cyan(result.sync_id)}`);
    console.log(`  Nodes:       ${chalk.green(result.nodes_created)}`);
    console.log(`  Edges:       ${chalk.green(result.edges_created)}`);
    console.log(`  Pending:     ${chalk.yellow(result.pending_approvals.length)} approvals`);
    console.log(`  Commit:      ${chalk.cyan(commitSha.substring(0, 7))}`);
    console.log(`  Hash:        ${chalk.yellow(graph.manifest_hash)}`);
    console.log('');

    if (result.pending_approvals.length > 0) {
      console.log(chalk.gray('  Pending approvals:'));
      for (const id of result.pending_approvals.slice(0, 5)) {
        console.log(chalk.yellow(`    • ${id}`));
      }
      if (result.pending_approvals.length > 5) {
        console.log(chalk.gray(`    ... and ${result.pending_approvals.length - 5} more`));
      }
      console.log('');
    }

  } catch (error) {
    console.log(chalk.red(`\n  Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`));
    console.log(chalk.gray('  Make sure the SoR server is running.\n'));
    process.exit(1);
  }
}
