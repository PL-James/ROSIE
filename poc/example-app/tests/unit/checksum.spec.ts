/**
 * ROSIE Reference Implementation - Checksum Unit Tests
 *
 * @gxp-id: REF-OQ-002
 * @gxp-type: OQ
 * @gxp-title: SHA-256 Checksum Unit Tests
 * @gxp-traces: REF-DS-002
 * @gxp-risk: High
 */

import { describe, it, expect } from 'vitest';
import { calculateChecksum, createRecord, verifyChecksum } from '../../src/validator';

describe('Checksum Calculation', () => {
  it('should calculate consistent checksums', () => {
    const data = { name: 'test', value: 42 };

    const checksum1 = calculateChecksum(data);
    const checksum2 = calculateChecksum(data);

    expect(checksum1).toBe(checksum2);
  });

  it('should produce 64-character hex string', () => {
    const data = { foo: 'bar' };
    const checksum = calculateChecksum(data);

    expect(checksum).toHaveLength(64);
    expect(checksum).toMatch(/^[a-f0-9]+$/);
  });

  it('should produce different checksums for different data', () => {
    const data1 = { value: 1 };
    const data2 = { value: 2 };

    const checksum1 = calculateChecksum(data1);
    const checksum2 = calculateChecksum(data2);

    expect(checksum1).not.toBe(checksum2);
  });

  it('should handle nested objects', () => {
    const data = {
      level1: {
        level2: {
          value: 'deep',
        },
      },
    };

    const checksum = calculateChecksum(data);

    expect(checksum).toBeDefined();
    expect(checksum).toHaveLength(64);
  });
});

describe('Data Record Creation', () => {
  it('should create a record with checksum', () => {
    const data = { name: 'Test Record', count: 100 };
    const record = createRecord('rec-001', data);

    expect(record.id).toBe('rec-001');
    expect(record.data).toEqual(data);
    expect(record.checksum).toHaveLength(64);
    expect(record.created_at).toBeDefined();
    expect(record.modified_at).toBeDefined();
  });
});

describe('Checksum Verification', () => {
  it('should verify valid checksum', () => {
    const data = { name: 'Valid Data' };
    const record = createRecord('rec-002', data);

    const result = verifyChecksum(record);

    expect(result.valid).toBe(true);
    expect(result.computed).toBe(result.stored);
  });

  it('should detect corrupted data', () => {
    const data = { name: 'Original Data' };
    const record = createRecord('rec-003', data);

    // Corrupt the data
    (record.data as { name: string }).name = 'Corrupted Data';

    const result = verifyChecksum(record);

    expect(result.valid).toBe(false);
    expect(result.computed).not.toBe(result.stored);
  });

  it('should detect tampered checksum', () => {
    const data = { name: 'Test Data' };
    const record = createRecord('rec-004', data);

    // Tamper with checksum
    record.checksum = 'invalid-checksum-value';

    const result = verifyChecksum(record);

    expect(result.valid).toBe(false);
  });
});
