import express from 'express';
import cors from 'cors';

import syncRoutes from './routes/sync.js';
import releaseRoutes from './routes/release.js';
import evidenceRoutes from './routes/evidence.js';
import nodesRoutes from './routes/nodes.js';
import auditRoutes from './routes/audit.js';
import demoRoutes from './routes/demo.js';
import { getLatestManifest, getStats } from './db/sqlite.js';

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Request logging
app.use((req, _res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    service: 'rosie-sor',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Dashboard data endpoint
app.get('/v1/dashboard', (_req, res) => {
  try {
    const manifest = getLatestManifest();

    if (!manifest) {
      res.json({
        hasData: false,
        stats: { total: 0, approved: 0, pending: 0, rejected: 0 },
        manifest: null
      });
      return;
    }

    const stats = getStats(manifest.id);

    res.json({
      hasData: true,
      stats,
      manifest: {
        id: manifest.id,
        product_code: manifest.product_code,
        version: manifest.version,
        commit_sha: manifest.commit_sha,
        synced_at: manifest.synced_at
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to get dashboard data' });
  }
});

// API routes
app.use('/v1/sync', syncRoutes);
app.use('/v1/release', releaseRoutes);
app.use('/v1/evidence', evidenceRoutes);
app.use('/v1/nodes', nodesRoutes);
app.use('/v1/audit', auditRoutes);
app.use('/v1/demo', demoRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    details: err.message
  });
});

app.listen(port, () => {
  console.log(`
  ╔═══════════════════════════════════════════════════════╗
  ║                                                       ║
  ║   ROSIE System of Record (SoR) API                   ║
  ║   ─────────────────────────────────────────────────  ║
  ║                                                       ║
  ║   Status:    Running                                  ║
  ║   Port:      ${String(port).padEnd(39)}║
  ║   Database:  ${(process.env.DATABASE_PATH || './rosie.db').padEnd(39)}║
  ║                                                       ║
  ║   Endpoints:                                          ║
  ║   ├─ POST /v1/sync/manifest                          ║
  ║   ├─ GET  /v1/sync/current                           ║
  ║   ├─ GET  /v1/release/readiness/:sha                 ║
  ║   ├─ POST /v1/evidence/upload                        ║
  ║   ├─ GET  /v1/nodes                                  ║
  ║   ├─ POST /v1/nodes/:id/approve                      ║
  ║   ├─ GET  /v1/audit                                  ║
  ║   └─ POST /v1/demo/approve-all                       ║
  ║                                                       ║
  ╚═══════════════════════════════════════════════════════╝
  `);
});
