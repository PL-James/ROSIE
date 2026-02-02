import { Router, type Request, type Response } from 'express';
import {
  createEvidence,
  getLatestManifest,
  getEvidenceByManifest,
  logAudit
} from '../db/sqlite.js';

const router = Router();

export interface EvidencePayload {
  execution_id: string;
  commit_sha?: string;
  environment?: string;
  executed_at?: string;
  results: Array<{
    gxp_id: string;
    name: string;
    status: 'passed' | 'failed' | 'skipped';
    duration_ms?: number;
    logs?: string[];
  }>;
}

// POST /v1/evidence/upload - Upload test execution evidence
router.post('/upload', (req: Request, res: Response) => {
  try {
    const payload: EvidencePayload = req.body;

    if (!payload.execution_id || !Array.isArray(payload.results)) {
      res.status(400).json({
        error: 'Missing required fields',
        required: ['execution_id', 'results']
      });
      return;
    }

    const manifest = getLatestManifest();
    if (!manifest) {
      res.status(404).json({
        error: 'No manifest found. Please sync a manifest first.'
      });
      return;
    }

    const evidence = createEvidence({
      manifest_id: manifest.id,
      execution_id: payload.execution_id,
      commit_sha: payload.commit_sha,
      environment: payload.environment,
      executed_at: payload.executed_at || new Date().toISOString(),
      results_json: JSON.stringify(payload.results)
    });

    const passed = payload.results.filter(r => r.status === 'passed').length;
    const failed = payload.results.filter(r => r.status === 'failed').length;

    const userId = req.headers['x-user-id'] as string | undefined;
    logAudit(
      'EVIDENCE_UPLOAD',
      userId || 'ci-agent@rosie.local',
      `Uploaded execution evidence (${passed} passed, ${failed} failed)`
    );

    res.status(201).json({
      success: true,
      evidence_id: evidence.id,
      manifest_id: manifest.id,
      summary: {
        total: payload.results.length,
        passed,
        failed,
        skipped: payload.results.filter(r => r.status === 'skipped').length
      }
    });
  } catch (error) {
    console.error('Evidence upload error:', error);
    res.status(500).json({
      error: 'Failed to upload evidence',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /v1/evidence - Get evidence for current manifest
router.get('/', (_req: Request, res: Response) => {
  try {
    const manifest = getLatestManifest();
    if (!manifest) {
      res.status(404).json({
        error: 'No manifest found'
      });
      return;
    }

    const evidence = getEvidenceByManifest(manifest.id);
    const parsed = evidence.map(e => ({
      ...e,
      results: JSON.parse(e.results_json)
    }));

    res.json({
      manifest_id: manifest.id,
      evidence: parsed
    });
  } catch (error) {
    console.error('Get evidence error:', error);
    res.status(500).json({
      error: 'Failed to get evidence',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
