import {
  createManifest,
  createNode,
  createEdge,
  getLatestManifest,
  getNodesByManifest,
  getEdgesByManifest,
  logAudit,
  type Manifest,
  type Node,
  type Edge
} from '../db/sqlite.js';

export interface SyncPayload {
  product_code: string;
  version: string;
  commit_sha: string;
  manifest_hash: string;
  nodes: Array<{
    gxp_id: string;
    type: string;
    title?: string;
    description?: string;
    risk?: string;
  }>;
  edges: Array<{
    source: string;
    target: string;
  }>;
}

export interface SyncResult {
  sync_id: string;
  manifest_id: string;
  nodes_created: number;
  edges_created: number;
  pending_approvals: string[];
}

export function syncManifest(payload: SyncPayload, userId?: string): SyncResult {
  // Create manifest
  const manifest = createManifest({
    product_code: payload.product_code,
    version: payload.version,
    commit_sha: payload.commit_sha,
    manifest_hash: payload.manifest_hash
  });

  // Create nodes
  const createdNodes: Node[] = [];
  for (const nodeData of payload.nodes) {
    const node = createNode({
      manifest_id: manifest.id,
      gxp_id: nodeData.gxp_id,
      type: nodeData.type,
      title: nodeData.title,
      description: nodeData.description,
      risk: nodeData.risk
    });
    createdNodes.push(node);
  }

  // Build gxp_id to node id mapping
  const nodeMap = new Map<string, string>();
  for (const node of createdNodes) {
    nodeMap.set(node.gxp_id, node.id);
  }

  // Create edges
  let edgesCreated = 0;
  for (const edgeData of payload.edges) {
    const sourceId = nodeMap.get(edgeData.source);
    const targetId = nodeMap.get(edgeData.target);
    if (sourceId && targetId) {
      createEdge({
        manifest_id: manifest.id,
        source_id: sourceId,
        target_id: targetId
      });
      edgesCreated++;
    }
  }

  // Log audit
  logAudit(
    'MANIFEST_SYNC',
    userId || 'ci-agent@rosie.local',
    `Synced ${payload.product_code} v${payload.version} (${createdNodes.length} nodes, ${edgesCreated} edges)`
  );

  return {
    sync_id: manifest.id,
    manifest_id: manifest.id,
    nodes_created: createdNodes.length,
    edges_created: edgesCreated,
    pending_approvals: createdNodes.map(n => n.gxp_id)
  };
}

export function getManifestWithGraph(manifestId: string): {
  manifest: Manifest;
  nodes: Node[];
  edges: Edge[];
} | null {
  const manifest = getLatestManifest();
  if (!manifest || manifest.id !== manifestId) {
    return null;
  }

  return {
    manifest,
    nodes: getNodesByManifest(manifestId),
    edges: getEdgesByManifest(manifestId)
  };
}

export function getCurrentManifest(): {
  manifest: Manifest;
  nodes: Node[];
  edges: Edge[];
} | null {
  const manifest = getLatestManifest();
  if (!manifest) {
    return null;
  }

  return {
    manifest,
    nodes: getNodesByManifest(manifest.id),
    edges: getEdgesByManifest(manifest.id)
  };
}
