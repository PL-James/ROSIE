/**
 * ROSIE Reference Implementation - E2E Workflow Tests
 *
 * @gxp-id: REF-PQ-001
 * @gxp-type: PQ
 * @gxp-title: Full Workflow E2E Test
 * @gxp-traces: REF-DS-001, REF-DS-002
 * @gxp-risk: High
 */

import { describe, it, expect } from 'vitest';
import {
  generateToken,
  validateToken,
  createRecord,
  verifyChecksum,
} from '../../src/validator';

describe('Full Workflow E2E', () => {
  it('should complete authentication and data integrity workflow', () => {
    // Step 1: Authenticate user and get token
    const userId = 'e2e-user-001';
    const token = generateToken(userId, 'admin');

    expect(token).toBeDefined();
    expect(token.split('.')).toHaveLength(3);

    // Step 2: Validate token
    const payload = validateToken(token);

    expect(payload).not.toBeNull();
    expect(payload?.sub).toBe(userId);
    expect(payload?.role).toBe('admin');

    // Step 3: Create data record with integrity checksum
    const sensitiveData = {
      patient_id: 'PAT-12345',
      medication: 'Test Drug 100mg',
      dosage: '1 tablet daily',
      prescriber: userId,
    };

    const record = createRecord('rx-001', sensitiveData);

    expect(record.id).toBe('rx-001');
    expect(record.checksum).toHaveLength(64);

    // Step 4: Verify data integrity
    const verification = verifyChecksum(record);

    expect(verification.valid).toBe(true);

    // Step 5: Simulate data retrieval and re-verification
    const retrievedRecord = { ...record }; // Simulate DB fetch
    const reVerification = verifyChecksum(retrievedRecord);

    expect(reVerification.valid).toBe(true);
    expect(reVerification.computed).toBe(reVerification.stored);
  });

  it('should detect integrity violation in workflow', () => {
    // Create authenticated session
    const token = generateToken('auditor-001', 'auditor');
    const payload = validateToken(token);

    expect(payload?.role).toBe('auditor');

    // Create audit record
    const auditData = {
      action: 'REVIEW_COMPLETED',
      reviewer: payload?.sub,
      timestamp: new Date().toISOString(),
    };

    const record = createRecord('audit-001', auditData);

    // Verify original integrity
    expect(verifyChecksum(record).valid).toBe(true);

    // Simulate tampering (e.g., unauthorized modification)
    const tamperedRecord = {
      ...record,
      data: {
        ...auditData,
        action: 'REVIEW_BYPASSED', // Tampered!
      },
    };

    // Integrity check should fail
    const tamperCheck = verifyChecksum(tamperedRecord);

    expect(tamperCheck.valid).toBe(false);
    expect(tamperCheck.computed).not.toBe(tamperCheck.stored);
  });

  it('should maintain session throughout workflow', () => {
    // Simulate multi-step regulated workflow
    const steps: string[] = [];

    // Step 1: Login
    const token = generateToken('operator-001', 'operator');
    steps.push('LOGIN');

    // Step 2: Create batch record
    const batchData = {
      batch_id: 'BATCH-2024-001',
      product: 'Reference Drug',
      quantity: 10000,
      created_by: 'operator-001',
    };

    const batchRecord = createRecord('batch-001', batchData);
    steps.push('BATCH_CREATED');

    // Step 3: Verify batch integrity before release
    const batchVerification = verifyChecksum(batchRecord);
    expect(batchVerification.valid).toBe(true);
    steps.push('BATCH_VERIFIED');

    // Step 4: Token still valid at end of workflow
    const finalPayload = validateToken(token);
    expect(finalPayload).not.toBeNull();
    steps.push('SESSION_VALID');

    // Verify all steps completed
    expect(steps).toEqual([
      'LOGIN',
      'BATCH_CREATED',
      'BATCH_VERIFIED',
      'SESSION_VALID',
    ]);
  });
});
