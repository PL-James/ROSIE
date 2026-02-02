import { parseManifest, parseSpecFile } from '../parser/manifest.js';
import { scanDirectory, type GxpAnnotation } from '../parser/annotations.js';
import { glob } from 'glob';
import { join, basename } from 'path';
import { existsSync } from 'fs';

export interface TraceNode {
  gxp_id: string;
  type: string;
  title?: string;
  description?: string;
  risk?: string;
  source: 'spec' | 'code' | 'test';
  file?: string;
  line?: number;
}

export interface TraceEdge {
  source: string;
  target: string;
}

export interface TraceGraph {
  product_code: string;
  version: string;
  nodes: TraceNode[];
  edges: TraceEdge[];
  manifest_hash: string;
}

function computeHash(data: string): string {
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return 'sha256:' + Math.abs(hash).toString(16).padStart(16, '0');
}

export async function buildTraceGraph(projectDir: string): Promise<TraceGraph | null> {
  // Find manifest
  const manifestPath = join(projectDir, 'gxp-product.md');
  if (!existsSync(manifestPath)) {
    return null;
  }

  const manifest = parseManifest(manifestPath);
  if (!manifest) {
    return null;
  }

  const nodes: TraceNode[] = [];
  const edges: TraceEdge[] = [];
  const nodeIds = new Set<string>();

  // Parse spec files
  const specDirs = ['specs/urs', 'specs/frs', 'specs/ds'];
  for (const specDir of specDirs) {
    const fullDir = join(projectDir, specDir);
    if (!existsSync(fullDir)) continue;

    const specFiles = await glob('*.md', { cwd: fullDir });
    for (const file of specFiles) {
      const specPath = join(fullDir, file);
      const spec = parseSpecFile(specPath);
      if (spec && spec.gxp_id) {
        if (!nodeIds.has(spec.gxp_id)) {
          nodes.push({
            gxp_id: spec.gxp_id,
            type: spec.type,
            title: spec.title,
            description: spec.description,
            risk: spec.risk,
            source: 'spec',
            file: specPath,
          });
          nodeIds.add(spec.gxp_id);
        }

        // Add edges from traces
        if (spec.traces) {
          for (const target of spec.traces) {
            edges.push({ source: spec.gxp_id, target });
          }
        }
      }
    }
  }

  // Scan code for annotations
  const srcDir = join(projectDir, 'src');
  if (existsSync(srcDir)) {
    const codeAnnotations = await scanDirectory(srcDir);
    for (const ann of codeAnnotations) {
      if (!nodeIds.has(ann.gxp_id)) {
        nodes.push({
          gxp_id: ann.gxp_id,
          type: ann.type,
          title: ann.title,
          description: ann.description,
          risk: ann.risk,
          source: 'code',
          file: ann.file,
          line: ann.line,
        });
        nodeIds.add(ann.gxp_id);
      }

      if (ann.traces) {
        for (const target of ann.traces) {
          edges.push({ source: ann.gxp_id, target });
        }
      }
    }
  }

  // Scan tests for annotations
  const testsDir = join(projectDir, 'tests');
  if (existsSync(testsDir)) {
    const testAnnotations = await scanDirectory(testsDir);
    for (const ann of testAnnotations) {
      if (!nodeIds.has(ann.gxp_id)) {
        nodes.push({
          gxp_id: ann.gxp_id,
          type: ann.type,
          title: ann.title,
          description: ann.description,
          risk: ann.risk,
          source: 'test',
          file: ann.file,
          line: ann.line,
        });
        nodeIds.add(ann.gxp_id);
      }

      if (ann.traces) {
        for (const target of ann.traces) {
          edges.push({ source: ann.gxp_id, target });
        }
      }
    }
  }

  // Sort nodes by type hierarchy: URS -> FRS -> DS -> OQ/PQ/TC
  const typeOrder: Record<string, number> = {
    URS: 0, FRS: 1, DS: 2, TC: 3, OQ: 4, PQ: 5,
  };
  nodes.sort((a, b) => {
    const orderA = typeOrder[a.type] ?? 99;
    const orderB = typeOrder[b.type] ?? 99;
    if (orderA !== orderB) return orderA - orderB;
    return a.gxp_id.localeCompare(b.gxp_id);
  });

  // Compute manifest hash
  const manifestData = JSON.stringify({ nodes, edges, version: manifest.version });
  const manifestHash = computeHash(manifestData);

  return {
    product_code: manifest.product_code,
    version: manifest.version,
    nodes,
    edges,
    manifest_hash: manifestHash,
  };
}

export function printAsciiGraph(graph: TraceGraph): string {
  const lines: string[] = [];
  lines.push('');
  lines.push(`  Trace Graph: ${graph.product_code} v${graph.version}`);
  lines.push(`  Hash: ${graph.manifest_hash}`);
  lines.push('  ' + '─'.repeat(50));
  lines.push('');

  // Group nodes by type
  const groups: Record<string, TraceNode[]> = {};
  for (const node of graph.nodes) {
    const group = groups[node.type] || [];
    group.push(node);
    groups[node.type] = group;
  }

  // Build adjacency for visualization
  const outgoing = new Map<string, string[]>();
  for (const edge of graph.edges) {
    const targets = outgoing.get(edge.source) || [];
    targets.push(edge.target);
    outgoing.set(edge.source, targets);
  }

  // Print nodes with connections
  const typeOrder = ['URS', 'FRS', 'DS', 'OQ', 'PQ', 'TC'];
  for (const type of typeOrder) {
    const nodesOfType = groups[type];
    if (!nodesOfType || nodesOfType.length === 0) continue;

    lines.push(`  ${type}`);
    for (const node of nodesOfType) {
      const targets = outgoing.get(node.gxp_id) || [];
      const arrow = targets.length > 0 ? ` → ${targets.join(', ')}` : '';
      const title = node.title ? ` (${node.title.substring(0, 30)}...)` : '';
      lines.push(`    ├─ ${node.gxp_id}${title}${arrow}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}
