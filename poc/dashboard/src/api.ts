const API_BASE = import.meta.env.VITE_API_URL || '';

export interface DashboardData {
  hasData: boolean;
  stats: {
    total: number;
    approved: number;
    pending: number;
    rejected: number;
  };
  manifest: {
    id: string;
    product_code: string;
    version: string;
    commit_sha: string;
    synced_at: string;
  } | null;
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

export interface NodesResponse {
  manifest_id: string;
  product_code: string;
  version: string;
  nodes: Node[];
  edges: Edge[];
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  action: string;
  user_id?: string;
  details?: string;
  payload_hash: string;
}

export interface EvidenceResult {
  gxp_id: string;
  name: string;
  status: 'passed' | 'failed' | 'skipped';
  duration_ms?: number;
  logs?: string[];
}

export interface Evidence {
  id: string;
  manifest_id: string;
  execution_id: string;
  commit_sha?: string;
  environment?: string;
  executed_at?: string;
  results: EvidenceResult[];
}

export interface ReleaseReadiness {
  is_ready: boolean;
  commit_sha: string;
  manifest_hash?: string;
  conditions: {
    name: string;
    passed: boolean;
    details: string;
  }[];
  blocking_issues: string[];
  rrt?: {
    token: string;
    issued_at: string;
    expires_at: string;
    product_code: string;
    version: string;
    commit_sha: string;
  };
}

async function fetchAPI<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }

  return response.json();
}

export const api = {
  getDashboard: () => fetchAPI<DashboardData>('/v1/dashboard'),

  getNodes: () => fetchAPI<NodesResponse>('/v1/nodes'),

  approveNode: (nodeId: string, approvedBy?: string) =>
    fetchAPI<{ success: boolean; node: Node }>(`/v1/nodes/${nodeId}/approve`, {
      method: 'POST',
      body: JSON.stringify({ approved_by: approvedBy || 'qa@example.com' }),
    }),

  rejectNode: (nodeId: string, reason: string, rejectedBy?: string) =>
    fetchAPI<{ success: boolean; node: Node }>(`/v1/nodes/${nodeId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ rejected_by: rejectedBy || 'qa@example.com', reason }),
    }),

  approveAll: (approvedBy?: string) =>
    fetchAPI<{ success: boolean; approved: number; nodes: string[] }>('/v1/demo/approve-all', {
      method: 'POST',
      body: JSON.stringify({ approved_by: approvedBy || 'qa@example.com' }),
    }),

  getAudit: (limit = 50) => fetchAPI<{ entries: AuditEntry[]; count: number }>(`/v1/audit?limit=${limit}`),

  getEvidence: () =>
    fetchAPI<{ manifest_id: string; evidence: Evidence[] }>('/v1/evidence'),

  getReleaseReadiness: (sha: string) =>
    fetchAPI<ReleaseReadiness>(`/v1/release/readiness/${sha}`),

  resetDemo: () =>
    fetchAPI<{ success: boolean; message: string }>('/v1/demo/reset', {
      method: 'POST',
    }),
};
