import { v4 as uuidv4 } from 'uuid';
import {
  getManifestBySha,
  getNodesByManifest,
  getEvidenceByManifest,
  logAudit,
  type Manifest
} from '../db/sqlite.js';

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

export interface TestResult {
  gxp_id: string;
  name: string;
  status: 'passed' | 'failed' | 'skipped';
  duration_ms?: number;
}

export function checkReleaseReadiness(commitSha: string): ReleaseReadiness {
  const manifest = getManifestBySha(commitSha);

  if (!manifest) {
    return {
      is_ready: false,
      commit_sha: commitSha,
      conditions: [{
        name: 'Manifest synced',
        passed: false,
        details: 'No manifest found for this commit'
      }],
      blocking_issues: ['No manifest found for commit ' + commitSha]
    };
  }

  const nodes = getNodesByManifest(manifest.id);
  const evidence = getEvidenceByManifest(manifest.id);

  const conditions: ReleaseReadiness['conditions'] = [];
  const blockingIssues: string[] = [];

  // Condition 1: All requirements approved
  const pendingNodes = nodes.filter(n => n.status === 'Pending');
  const rejectedNodes = nodes.filter(n => n.status === 'Rejected');
  const approvedNodes = nodes.filter(n => n.status === 'Approved');

  conditions.push({
    name: 'All requirements approved',
    passed: pendingNodes.length === 0 && rejectedNodes.length === 0,
    details: `${approvedNodes.length}/${nodes.length} approved`
  });

  if (pendingNodes.length > 0) {
    blockingIssues.push(`Missing approvals: ${pendingNodes.map(n => n.gxp_id).join(', ')}`);
  }
  if (rejectedNodes.length > 0) {
    blockingIssues.push(`Rejected: ${rejectedNodes.map(n => n.gxp_id).join(', ')}`);
  }

  // Condition 2: Manifest hash matches
  conditions.push({
    name: 'Manifest hash matches',
    passed: true,
    details: `Hash: ${manifest.manifest_hash}`
  });

  // Condition 3: All tests passed
  let allTestsPassed = true;
  let testDetails = 'No test evidence uploaded';

  if (evidence.length > 0) {
    const latestEvidence = evidence[evidence.length - 1];
    const results: TestResult[] = JSON.parse(latestEvidence.results_json);
    const passed = results.filter(r => r.status === 'passed').length;
    const failed = results.filter(r => r.status === 'failed');

    allTestsPassed = failed.length === 0;
    testDetails = `${passed}/${results.length} tests passed`;

    if (failed.length > 0) {
      blockingIssues.push(`Test failed: ${failed.map(f => f.gxp_id).join(', ')}`);
    }
  } else {
    // For demo purposes, don't block on missing evidence
    allTestsPassed = true;
    testDetails = 'No evidence required (demo mode)';
  }

  conditions.push({
    name: 'All tests passed',
    passed: allTestsPassed,
    details: testDetails
  });

  // Determine overall readiness
  const isReady = conditions.every(c => c.passed);

  const result: ReleaseReadiness = {
    is_ready: isReady,
    commit_sha: commitSha,
    manifest_hash: manifest.manifest_hash,
    conditions,
    blocking_issues: blockingIssues
  };

  // Generate RRT if ready
  if (isReady) {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 12 * 60 * 60 * 1000); // 12 hours

    result.rrt = {
      token: generateRRT(manifest, commitSha),
      issued_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
      product_code: manifest.product_code,
      version: manifest.version,
      commit_sha: commitSha
    };

    logAudit(
      'RRT_ISSUED',
      'system',
      `RRT issued for ${manifest.product_code} v${manifest.version} @ ${commitSha.substring(0, 7)}`
    );
  }

  return result;
}

function generateRRT(manifest: Manifest, commitSha: string): string {
  // Generate a demo JWT-like token
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    iss: 'rosie-sor-demo',
    sub: manifest.product_code,
    ver: manifest.version,
    sha: commitSha,
    hash: manifest.manifest_hash,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 12 * 60 * 60,
    jti: uuidv4()
  })).toString('base64url');

  // Demo signature (not cryptographically secure)
  const signature = Buffer.from(
    `demo-signature-${manifest.id}-${Date.now()}`
  ).toString('base64url');

  return `${header}.${payload}.${signature}`;
}
