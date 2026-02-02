import chalk from 'chalk';
import { buildTraceGraph, printAsciiGraph } from '../graph/builder.js';

export async function scanCommand(options: { format?: string }): Promise<void> {
  const projectDir = process.cwd();

  console.log(chalk.cyan('\n  ROSIE Scan'));
  console.log(chalk.gray('  ──────────────────────────────────────────────'));
  console.log(chalk.gray(`  Scanning: ${projectDir}\n`));

  const graph = await buildTraceGraph(projectDir);

  if (!graph) {
    console.log(chalk.red('  Error: No gxp-product.md manifest found'));
    console.log(chalk.gray('  Make sure you are in a ROSIE-compliant project directory.\n'));
    process.exit(1);
  }

  if (options.format === 'json') {
    console.log(JSON.stringify(graph, null, 2));
    return;
  }

  if (options.format === 'table') {
    console.log(chalk.cyan('  Nodes:'));
    console.log('  ' + '─'.repeat(70));
    console.log(
      chalk.gray('  ID'.padEnd(18)) +
      chalk.gray('Type'.padEnd(8)) +
      chalk.gray('Source'.padEnd(10)) +
      chalk.gray('Title')
    );
    console.log('  ' + '─'.repeat(70));

    for (const node of graph.nodes) {
      const id = chalk.cyan(node.gxp_id.padEnd(16));
      const type = node.type.padEnd(6);
      const source = node.source.padEnd(8);
      const title = (node.title || '-').substring(0, 35);
      console.log(`  ${id}  ${type}  ${source}  ${title}`);
    }

    console.log('  ' + '─'.repeat(70));
    console.log(`\n  ${chalk.green(graph.nodes.length)} nodes, ${chalk.green(graph.edges.length)} edges`);
    console.log(`  Hash: ${chalk.yellow(graph.manifest_hash)}\n`);
    return;
  }

  // Default: graph format
  console.log(printAsciiGraph(graph));
  console.log(`  ${chalk.green(graph.nodes.length)} nodes, ${chalk.green(graph.edges.length)} edges\n`);
}
