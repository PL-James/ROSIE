import { Router, type Request, type Response } from 'express';
import { getAuditLog } from '../db/sqlite.js';

const router = Router();

// GET /v1/audit - Get audit log
router.get('/', (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const entries = getAuditLog(Math.min(limit, 500));

    res.json({
      entries,
      count: entries.length
    });
  } catch (error) {
    console.error('Get audit log error:', error);
    res.status(500).json({
      error: 'Failed to get audit log',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
