# RFC-003: ROSIE Evidence Standard (Artifact Packaging)

## Metadata

| Field   | Value                                                                |
| ------- | -------------------------------------------------------------------- |
| RFC ID  | 003                                                                  |
| Title   | ROSIE Evidence Standard: Schema for Automated Qualification Evidence |
| Version | 1.1.0                                                                |
| Status  | Draft                                                                |
| Focus   | 21 CFR Part 11 compliance, evidence schemas, immutable logs          |

## 1. Scope

This RFC defines the structure of the `gxp-execution.json` artifact. It ensures that automated test outputs (OQ/PQ) are captured in a format that satisfies regulatory requirements for electronic records, including environment state, visual evidence, and execution telemetry.

## 2. Evidence package structure

The evidence package is a JSON-LD compliant object that aggregates execution metadata.

### 2.1 `gxp-execution.json` schema

```json
{
  "execution_id": "uuid-v4",
  "timestamp": "ISO-8601",
  "commit_sha": "git-sha",
  "environment": {
    "os": "ubuntu-22.04",
    "runtime": "node-v18.1.0",
    "container_digest": "sha256:...",
    "sbom_ref": "path/to/sbom.json"
  },
  "results": [
    {
      "gxp_id": "AL-OQ-AUTH-01",
      "status": "PASS",
      "duration_ms": 120,
      "logs": ["..."],
      "attachments": [
        {
          "type": "screenshot",
          "hash": "sha256:...",
          "uri": "s3://bucket/evidence/PQ-05.png"
        }
      ]
    }
  ],
  "signature": {
    "signed_by": "BuildAgent-01",
    "hash_method": "SHA-256",
    "value": "..."
  }
}
```

## 3. Evidence collection rules

- Visual evidence (MUST): For PQ tests involving a UI, capture at least one screenshot of the terminal state or success criteria.
- Log sanitization (SHOULD): Scrub PII or secrets from logs before attachment.
- Immutability (MUST): Once generated, the evidence package must be hashed; the hash is sent to the SoR for permanent archival.

Refer to RFC-002 for the engine logic that triggers evidence capture.
