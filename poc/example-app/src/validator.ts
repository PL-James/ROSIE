/**
 * ROSIE Reference Implementation - Validator Module
 *
 * This module demonstrates ROSIE-compliant code with @gxp-* annotations.
 */

import { createHash } from 'crypto';

// ============================================================================
// JWT Token Implementation
// @gxp-id: REF-DS-001
// @gxp-type: DS
// @gxp-title: JWT Token Generation
// @gxp-traces: REF-FRS-001
// @gxp-risk: Medium
// ============================================================================

export interface JWTPayload {
  sub: string;
  role: string;
  iat: number;
  exp: number;
}

const JWT_SECRET = process.env.JWT_SECRET || 'demo-secret-key-for-rosie-poc';
const JWT_EXPIRY = parseInt(process.env.JWT_EXPIRY || '86400', 10);

/**
 * Generate a JWT token for the given user
 */
export function generateToken(userId: string, role: string = 'user'): string {
  const header = {
    alg: 'HS256',
    typ: 'JWT',
  };

  const now = Math.floor(Date.now() / 1000);
  const payload: JWTPayload = {
    sub: userId,
    role,
    iat: now,
    exp: now + JWT_EXPIRY,
  };

  const headerB64 = Buffer.from(JSON.stringify(header)).toString('base64url');
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');

  const signature = createHash('sha256')
    .update(`${headerB64}.${payloadB64}.${JWT_SECRET}`)
    .digest('base64url');

  return `${headerB64}.${payloadB64}.${signature}`;
}

/**
 * Validate a JWT token and return the payload
 */
export function validateToken(token: string): JWTPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const [headerB64, payloadB64, signature] = parts;

    // Verify signature
    const expectedSignature = createHash('sha256')
      .update(`${headerB64}.${payloadB64}.${JWT_SECRET}`)
      .digest('base64url');

    if (signature !== expectedSignature) {
      return null;
    }

    // Decode payload
    const payload: JWTPayload = JSON.parse(
      Buffer.from(payloadB64, 'base64url').toString()
    );

    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

// ============================================================================
// SHA-256 Checksum Implementation
// @gxp-id: REF-DS-002
// @gxp-type: DS
// @gxp-title: SHA-256 Checksum Validation
// @gxp-traces: REF-FRS-002
// @gxp-risk: High
// ============================================================================

export interface DataRecord {
  id: string;
  data: unknown;
  checksum: string;
  created_at: string;
  modified_at: string;
}

/**
 * Deterministically serialize a value with sorted object keys (recursive)
 */
function deterministicSerialize(value: unknown): string {
  if (value === null || value === undefined) {
    return JSON.stringify(value);
  }

  if (typeof value !== 'object') {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    const items = value.map(item => deterministicSerialize(item));
    return '[' + items.join(',') + ']';
  }

  // Object: sort keys and recurse
  const obj = value as Record<string, unknown>;
  const sortedKeys = Object.keys(obj).sort();
  const pairs = sortedKeys.map(key => {
    const serializedKey = JSON.stringify(key);
    const serializedValue = deterministicSerialize(obj[key]);
    return serializedKey + ':' + serializedValue;
  });
  return '{' + pairs.join(',') + '}';
}

/**
 * Calculate SHA-256 checksum for data
 */
export function calculateChecksum(data: unknown): string {
  const serialized = deterministicSerialize(data);
  return createHash('sha256').update(serialized).digest('hex');
}

/**
 * Create a data record with checksum
 */
export function createRecord(id: string, data: unknown): DataRecord {
  const now = new Date().toISOString();
  const checksum = calculateChecksum(data);

  return {
    id,
    data,
    checksum,
    created_at: now,
    modified_at: now,
  };
}

/**
 * Verify checksum of a data record
 */
export function verifyChecksum(record: DataRecord): {
  valid: boolean;
  computed: string;
  stored: string;
} {
  const computed = calculateChecksum(record.data);
  return {
    valid: computed === record.checksum,
    computed,
    stored: record.checksum,
  };
}

// ============================================================================
// Exports
// ============================================================================

export default {
  generateToken,
  validateToken,
  calculateChecksum,
  createRecord,
  verifyChecksum,
};
