import { Router, type Request, type Response } from 'express';
import { getLatestManifest } from '../db/sqlite.js';
import { approveAllPending } from '../services/approval.js';

const router = Router();

// POST /v1/demo/approve-all - Approve all pending nodes (demo helper)
router.post('/approve-all', (req: Request, res: Response) => {
  try {
    const manifest = getLatestManifest();
    if (!manifest) {
      res.status(404).json({ error: 'No manifest found' });
      return;
    }

    const userId = req.body.approved_by || req.headers['x-user-id'] || 'qa@example.com';
    const result = approveAllPending(manifest.id, userId as string);

    res.json({
      success: true,
      approved: result.approved,
      nodes: result.nodes.map(n => n.gxp_id)
    });
  } catch (error) {
    console.error('Approve all error:', error);
    res.status(500).json({
      error: 'Failed to approve all',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /v1/demo/reset - Reset the database (demo helper)
router.post('/reset', (_req: Request, res: Response) => {
  try {
    // Import db and reset tables
    const db = require('../db/sqlite.js').default;
    db.exec(`
      DELETE FROM audit_log;
      DELETE FROM evidence;
      DELETE FROM edges;
      DELETE FROM nodes;
      DELETE FROM manifests;
    `);

    res.json({
      success: true,
      message: 'Database reset successfully'
    });
  } catch (error) {
    console.error('Reset error:', error);
    res.status(500).json({
      error: 'Failed to reset database',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
