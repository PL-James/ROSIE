import { Router, type Request, type Response } from 'express';
import {
  getLatestManifest,
  getNodesByManifest,
  getNodeById,
  getEdgesByManifest
} from '../db/sqlite.js';
import { approveNode, rejectNode, approveAllPending, getApprovalStatus } from '../services/approval.js';

const router = Router();

// GET /v1/nodes - Get all nodes for current manifest
router.get('/', (_req: Request, res: Response) => {
  try {
    const manifest = getLatestManifest();
    if (!manifest) {
      res.status(404).json({ error: 'No manifest found' });
      return;
    }

    const nodes = getNodesByManifest(manifest.id);
    const edges = getEdgesByManifest(manifest.id);

    res.json({
      manifest_id: manifest.id,
      product_code: manifest.product_code,
      version: manifest.version,
      nodes,
      edges
    });
  } catch (error) {
    console.error('Get nodes error:', error);
    res.status(500).json({
      error: 'Failed to get nodes',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /v1/nodes/status/approvals - Get approval status
// IMPORTANT: This route must be defined before /:id to avoid being shadowed
router.get('/status/approvals', (_req: Request, res: Response) => {
  try {
    const manifest = getLatestManifest();
    if (!manifest) {
      res.status(404).json({ error: 'No manifest found' });
      return;
    }

    const status = getApprovalStatus(manifest.id);
    res.json({
      manifest_id: manifest.id,
      ...status
    });
  } catch (error) {
    console.error('Get approval status error:', error);
    res.status(500).json({
      error: 'Failed to get approval status',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /v1/nodes/:id - Get a specific node
router.get('/:id', (req: Request, res: Response) => {
  try {
    const node = getNodeById(req.params.id);
    if (!node) {
      res.status(404).json({ error: 'Node not found' });
      return;
    }

    res.json(node);
  } catch (error) {
    console.error('Get node error:', error);
    res.status(500).json({
      error: 'Failed to get node',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /v1/nodes/:id/approve - Approve a node
router.post('/:id/approve', (req: Request, res: Response) => {
  try {
    const { approved_by, comment } = req.body;
    const userId = approved_by || req.headers['x-user-id'] || 'qa@example.com';

    const result = approveNode(req.params.id, userId as string, comment);

    if (!result.success) {
      res.status(400).json({ error: result.message });
      return;
    }

    res.json({
      success: true,
      node: result.node,
      message: result.message
    });
  } catch (error) {
    console.error('Approve node error:', error);
    res.status(500).json({
      error: 'Failed to approve node',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /v1/nodes/:id/reject - Reject a node
router.post('/:id/reject', (req: Request, res: Response) => {
  try {
    const { rejected_by, reason } = req.body;

    if (!reason) {
      res.status(400).json({ error: 'Reason is required for rejection' });
      return;
    }

    const userId = rejected_by || req.headers['x-user-id'] || 'qa@example.com';
    const result = rejectNode(req.params.id, userId as string, reason);

    if (!result.success) {
      res.status(400).json({ error: result.message });
      return;
    }

    res.json({
      success: true,
      node: result.node,
      message: result.message
    });
  } catch (error) {
    console.error('Reject node error:', error);
    res.status(500).json({
      error: 'Failed to reject node',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
