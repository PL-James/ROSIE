import { createHash } from 'crypto';
import type { TraceGraph } from './builder.js';

export function computeManifestHash(graph: TraceGraph): string {
  const data = JSON.stringify({
    nodes: graph.nodes.map(n => ({
      gxp_id: n.gxp_id,
      type: n.type,
      title: n.title,
      description: n.description,
    })),
    edges: graph.edges,
    version: graph.version,
  });

  const hex = createHash('sha256').update(data, 'utf8').digest('hex');
  return 'sha256:' + hex;
}

export function verifyManifestHash(graph: TraceGraph, expectedHash: string): boolean {
  const computed = computeManifestHash(graph);
  return computed === expectedHash;
}
