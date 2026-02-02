import { Router, type Request, type Response } from 'express';
import { checkReleaseReadiness } from '../services/rrt.js';

const router = Router();

// GET /v1/release/readiness/:sha - Check release readiness for a commit
router.get('/readiness/:sha', (req: Request, res: Response) => {
  try {
    const { sha } = req.params;

    if (!sha || sha.length < 6) {
      res.status(400).json({
        error: 'Invalid commit SHA',
        details: 'SHA must be at least 6 characters'
      });
      return;
    }

    const result = checkReleaseReadiness(sha);
    res.json(result);
  } catch (error) {
    console.error('Release readiness error:', error);
    res.status(500).json({
      error: 'Failed to check release readiness',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
