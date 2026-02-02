/**
 * ROSIE Reference Implementation - Token Unit Tests
 *
 * @gxp-id: REF-OQ-001
 * @gxp-type: OQ
 * @gxp-title: JWT Token Unit Tests
 * @gxp-traces: REF-DS-001
 * @gxp-risk: Medium
 */

import { describe, it, expect } from 'vitest';
import { generateToken, validateToken } from '../../src/validator';

describe('JWT Token Generation', () => {
  it('should generate a valid JWT token', () => {
    const token = generateToken('user-123', 'admin');

    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3);
  });

  it('should include correct claims in token', () => {
    const token = generateToken('user-456', 'reader');
    const payload = validateToken(token);

    expect(payload).not.toBeNull();
    expect(payload?.sub).toBe('user-456');
    expect(payload?.role).toBe('reader');
    expect(payload?.iat).toBeDefined();
    expect(payload?.exp).toBeDefined();
  });

  it('should set correct expiration time', () => {
    const token = generateToken('user-789');
    const payload = validateToken(token);

    expect(payload).not.toBeNull();
    const expectedExpiry = payload!.iat + 86400; // Default 24 hours
    expect(payload?.exp).toBe(expectedExpiry);
  });
});

describe('JWT Token Validation', () => {
  it('should validate a valid token', () => {
    const token = generateToken('test-user');
    const payload = validateToken(token);

    expect(payload).not.toBeNull();
    expect(payload?.sub).toBe('test-user');
  });

  it('should reject an invalid token', () => {
    const payload = validateToken('invalid.token.here');

    expect(payload).toBeNull();
  });

  it('should reject a tampered token', () => {
    const token = generateToken('test-user');
    const parts = token.split('.');
    parts[1] = 'tampered-payload';
    const tamperedToken = parts.join('.');

    const payload = validateToken(tamperedToken);

    expect(payload).toBeNull();
  });

  it('should reject malformed tokens', () => {
    expect(validateToken('')).toBeNull();
    expect(validateToken('single-part')).toBeNull();
    expect(validateToken('two.parts')).toBeNull();
  });
});
