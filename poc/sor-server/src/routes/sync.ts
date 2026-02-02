import { Router, type Request, type Response } from 'express';
import { syncManifest, getCurrentManifest, type SyncPayload } from '../services/manifest.js';

const router = Router();

// POST /v1/sync/manifest - Sync a manifest from the repository
router.post('/manifest', (req: Request, res: Response) => {
  try {
    const payload: SyncPayload = req.body;

    // Validate required fields
    if (!payload.product_code || !payload.version || !payload.commit_sha || !payload.manifest_hash) {
      res.status(400).json({
        error: 'Missing required fields',
        required: ['product_code', 'version', 'commit_sha', 'manifest_hash', 'nodes', 'edges']
      });
      return;
    }

    if (!Array.isArray(payload.nodes) || !Array.isArray(payload.edges)) {
      res.status(400).json({
        error: 'nodes and edges must be arrays'
      });
      return;
    }

    const userId = req.headers['x-user-id'] as string | undefined;
    const result = syncManifest(payload, userId);

    res.status(201).json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({
      error: 'Failed to sync manifest',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /v1/sync/current - Get current manifest with graph
router.get('/current', (_req: Request, res: Response) => {
  try {
    const data = getCurrentManifest();

    if (!data) {
      res.status(404).json({
        error: 'No manifest found'
      });
      return;
    }

    res.json(data);
  } catch (error) {
    console.error('Get manifest error:', error);
    res.status(500).json({
      error: 'Failed to get manifest',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
