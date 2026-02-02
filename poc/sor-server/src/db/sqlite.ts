import Database from 'better-sqlite3';
import { createHash } from 'crypto';
import { v4 as uuidv4 } from 'uuid';

const dbPath = process.env.DATABASE_PATH || './rosie.db';
const db = new Database(dbPath);

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS manifests (
    id TEXT PRIMARY KEY,
    product_code TEXT NOT NULL,
    version TEXT NOT NULL,
    commit_sha TEXT NOT NULL,
    manifest_hash TEXT NOT NULL,
    synced_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS nodes (
    id TEXT PRIMARY KEY,
    manifest_id TEXT NOT NULL,
    gxp_id TEXT NOT NULL,
    type TEXT NOT NULL,
    title TEXT,
    description TEXT,
    risk TEXT DEFAULT 'Medium',
    status TEXT DEFAULT 'Pending',
    approved_by TEXT,
    approved_at TEXT,
    FOREIGN KEY (manifest_id) REFERENCES manifests(id)
  );

  CREATE TABLE IF NOT EXISTS edges (
    id TEXT PRIMARY KEY,
    manifest_id TEXT NOT NULL,
    source_id TEXT NOT NULL,
    target_id TEXT NOT NULL,
    FOREIGN KEY (manifest_id) REFERENCES manifests(id)
  );

  CREATE TABLE IF NOT EXISTS evidence (
    id TEXT PRIMARY KEY,
    manifest_id TEXT NOT NULL,
    execution_id TEXT NOT NULL,
    commit_sha TEXT,
    environment TEXT,
    executed_at TEXT,
    results_json TEXT NOT NULL,
    FOREIGN KEY (manifest_id) REFERENCES manifests(id)
  );

  CREATE TABLE IF NOT EXISTS audit_log (
    id TEXT PRIMARY KEY,
    timestamp TEXT NOT NULL,
    action TEXT NOT NULL,
    user_id TEXT,
    details TEXT,
    payload_hash TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_nodes_manifest ON nodes(manifest_id);
  CREATE INDEX IF NOT EXISTS idx_nodes_gxp_id ON nodes(gxp_id);
  CREATE INDEX IF NOT EXISTS idx_edges_manifest ON edges(manifest_id);
  CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_log(timestamp);
`);

// Types
export interface Manifest {
  id: string;
  product_code: string;
  version: string;
  commit_sha: string;
  manifest_hash: string;
  synced_at: string;
}

export interface Node {
  id: string;
  manifest_id: string;
  gxp_id: string;
  type: string;
  title?: string;
  description?: string;
  risk?: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  approved_by?: string;
  approved_at?: string;
}

export interface Edge {
  id: string;
  manifest_id: string;
  source_id: string;
  target_id: string;
}

export interface Evidence {
  id: string;
  manifest_id: string;
  execution_id: string;
  commit_sha?: string;
  environment?: string;
  executed_at?: string;
  results_json: string;
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  action: string;
  user_id?: string;
  details?: string;
  payload_hash: string;
}

// Helper to compute SHA-256 hash
function computeHash(data: string): string {
  const hex = createHash('sha256').update(data, 'utf8').digest('hex');
  return 'sha256:' + hex;
}

// Audit logging
export function logAudit(action: string, userId?: string, details?: string): AuditEntry {
  const entry: AuditEntry = {
    id: uuidv4(),
    timestamp: new Date().toISOString(),
    action,
    user_id: userId,
    details,
    payload_hash: computeHash(JSON.stringify({ action, userId, details, timestamp: Date.now() }))
  };

  db.prepare(`
    INSERT INTO audit_log (id, timestamp, action, user_id, details, payload_hash)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(entry.id, entry.timestamp, entry.action, entry.user_id, entry.details, entry.payload_hash);

  return entry;
}

// Manifest operations
export function createManifest(data: Omit<Manifest, 'id' | 'synced_at'>): Manifest {
  const manifest: Manifest = {
    id: uuidv4(),
    ...data,
    synced_at: new Date().toISOString()
  };

  db.prepare(`
    INSERT INTO manifests (id, product_code, version, commit_sha, manifest_hash, synced_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(manifest.id, manifest.product_code, manifest.version, manifest.commit_sha, manifest.manifest_hash, manifest.synced_at);

  return manifest;
}

export function getLatestManifest(productCode?: string): Manifest | undefined {
  const query = productCode
    ? `SELECT * FROM manifests WHERE product_code = ? ORDER BY synced_at DESC LIMIT 1`
    : `SELECT * FROM manifests ORDER BY synced_at DESC LIMIT 1`;

  return productCode
    ? db.prepare(query).get(productCode) as Manifest | undefined
    : db.prepare(query).get() as Manifest | undefined;
}

export function getManifestBySha(commitSha: string): Manifest | undefined {
  return db.prepare(`SELECT * FROM manifests WHERE commit_sha = ? ORDER BY synced_at DESC LIMIT 1`)
    .get(commitSha) as Manifest | undefined;
}

// Node operations
export function createNode(data: Omit<Node, 'id' | 'status' | 'approved_by' | 'approved_at'>): Node {
  const node: Node = {
    id: uuidv4(),
    ...data,
    status: 'Pending'
  };

  db.prepare(`
    INSERT INTO nodes (id, manifest_id, gxp_id, type, title, description, risk, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(node.id, node.manifest_id, node.gxp_id, node.type, node.title, node.description, node.risk, node.status);

  return node;
}

export function getNodesByManifest(manifestId: string): Node[] {
  return db.prepare(`SELECT * FROM nodes WHERE manifest_id = ?`).all(manifestId) as Node[];
}

export function getNodeByGxpId(manifestId: string, gxpId: string): Node | undefined {
  return db.prepare(`SELECT * FROM nodes WHERE manifest_id = ? AND gxp_id = ?`)
    .get(manifestId, gxpId) as Node | undefined;
}

export function getNodeById(nodeId: string): Node | undefined {
  return db.prepare(`SELECT * FROM nodes WHERE id = ?`).get(nodeId) as Node | undefined;
}

export function approveNode(nodeId: string, approvedBy: string): Node | undefined {
  const now = new Date().toISOString();
  db.prepare(`
    UPDATE nodes SET status = 'Approved', approved_by = ?, approved_at = ? WHERE id = ?
  `).run(approvedBy, now, nodeId);

  return getNodeById(nodeId);
}

export function rejectNode(nodeId: string, rejectedBy: string): Node | undefined {
  const now = new Date().toISOString();
  db.prepare(`
    UPDATE nodes SET status = 'Rejected', approved_by = ?, approved_at = ? WHERE id = ?
  `).run(rejectedBy, now, nodeId);

  return getNodeById(nodeId);
}

export function getPendingNodes(manifestId: string): Node[] {
  return db.prepare(`SELECT * FROM nodes WHERE manifest_id = ? AND status = 'Pending'`)
    .all(manifestId) as Node[];
}

// Edge operations
export function createEdge(data: Omit<Edge, 'id'>): Edge {
  const edge: Edge = {
    id: uuidv4(),
    ...data
  };

  db.prepare(`
    INSERT INTO edges (id, manifest_id, source_id, target_id)
    VALUES (?, ?, ?, ?)
  `).run(edge.id, edge.manifest_id, edge.source_id, edge.target_id);

  return edge;
}

export function getEdgesByManifest(manifestId: string): Edge[] {
  return db.prepare(`SELECT * FROM edges WHERE manifest_id = ?`).all(manifestId) as Edge[];
}

// Evidence operations
export function createEvidence(data: Omit<Evidence, 'id'>): Evidence {
  const evidence: Evidence = {
    id: uuidv4(),
    ...data
  };

  db.prepare(`
    INSERT INTO evidence (id, manifest_id, execution_id, commit_sha, environment, executed_at, results_json)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(evidence.id, evidence.manifest_id, evidence.execution_id, evidence.commit_sha, evidence.environment, evidence.executed_at, evidence.results_json);

  return evidence;
}

export function getEvidenceByManifest(manifestId: string): Evidence[] {
  return db.prepare(`SELECT * FROM evidence WHERE manifest_id = ?`).all(manifestId) as Evidence[];
}

// Audit log operations
export function getAuditLog(limit = 50): AuditEntry[] {
  return db.prepare(`SELECT * FROM audit_log ORDER BY timestamp DESC LIMIT ?`).all(limit) as AuditEntry[];
}

// Stats
export function getStats(manifestId: string): { total: number; approved: number; pending: number; rejected: number } {
  const nodes = getNodesByManifest(manifestId);
  return {
    total: nodes.length,
    approved: nodes.filter(n => n.status === 'Approved').length,
    pending: nodes.filter(n => n.status === 'Pending').length,
    rejected: nodes.filter(n => n.status === 'Rejected').length
  };
}

export default db;
