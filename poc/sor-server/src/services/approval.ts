import {
  getNodeById,
  getNodesByManifest,
  getPendingNodes,
  approveNode as dbApproveNode,
  rejectNode as dbRejectNode,
  logAudit,
  type Node
} from '../db/sqlite.js';

export interface ApprovalResult {
  node: Node;
  success: boolean;
  message: string;
}

export function approveNode(nodeId: string, approvedBy: string, comment?: string): ApprovalResult {
  const node = getNodeById(nodeId);
  if (!node) {
    return {
      node: null as unknown as Node,
      success: false,
      message: 'Node not found'
    };
  }

  if (node.status === 'Approved') {
    return {
      node,
      success: false,
      message: 'Node is already approved'
    };
  }

  const updatedNode = dbApproveNode(nodeId, approvedBy);
  if (!updatedNode) {
    return {
      node: node,
      success: false,
      message: 'Failed to approve node'
    };
  }

  logAudit(
    'APPROVAL',
    approvedBy,
    `Approved ${node.gxp_id}${comment ? `: ${comment}` : ''}`
  );

  return {
    node: updatedNode,
    success: true,
    message: 'Node approved successfully'
  };
}

export function rejectNode(nodeId: string, rejectedBy: string, reason: string): ApprovalResult {
  const node = getNodeById(nodeId);
  if (!node) {
    return {
      node: null as unknown as Node,
      success: false,
      message: 'Node not found'
    };
  }

  const updatedNode = dbRejectNode(nodeId, rejectedBy);
  if (!updatedNode) {
    return {
      node: node,
      success: false,
      message: 'Failed to reject node'
    };
  }

  logAudit(
    'REJECTION',
    rejectedBy,
    `Rejected ${node.gxp_id}: ${reason}`
  );

  return {
    node: updatedNode,
    success: true,
    message: 'Node rejected'
  };
}

export function approveAllPending(manifestId: string, approvedBy: string): {
  approved: number;
  nodes: Node[];
} {
  const pending = getPendingNodes(manifestId);
  const approved: Node[] = [];

  for (const node of pending) {
    const result = approveNode(node.id, approvedBy);
    if (result.success) {
      approved.push(result.node);
    }
  }

  return {
    approved: approved.length,
    nodes: approved
  };
}

export function getApprovalStatus(manifestId: string): {
  total: number;
  approved: number;
  pending: number;
  rejected: number;
  pendingNodes: Node[];
  isFullyApproved: boolean;
} {
  const nodes = getNodesByManifest(manifestId);
  const pending = nodes.filter(n => n.status === 'Pending');
  const approved = nodes.filter(n => n.status === 'Approved');
  const rejected = nodes.filter(n => n.status === 'Rejected');

  return {
    total: nodes.length,
    approved: approved.length,
    pending: pending.length,
    rejected: rejected.length,
    pendingNodes: pending,
    isFullyApproved: pending.length === 0 && rejected.length === 0 && nodes.length > 0
  };
}
