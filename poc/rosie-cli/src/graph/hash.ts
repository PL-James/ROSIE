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

  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }

  return 'sha256:' + Math.abs(hash).toString(16).padStart(16, '0');
}

export function verifyManifestHash(graph: TraceGraph, expectedHash: string): boolean {
  const computed = computeManifestHash(graph);
  return computed === expectedHash;
}
