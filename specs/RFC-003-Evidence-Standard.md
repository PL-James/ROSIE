RFC-003: ROSIE Evidence Standard (Artifact Packaging)MetadataDetailsRFC ID003TitleROSIE Evidence Standard: Schema for Automated Qualification EvidenceStatusDraftFocus21 CFR Part 11 Compliance, Evidence Schemas, Immutable Logs1. ScopeThis RFC defines the structure of the gxp-execution.json artifact. It ensures that automated test outputs (OQ/PQ) are captured in a format that satisfies regulatory requirements for "Electronic Records," including environment state, visual evidence, and execution telemetry.2. Evidence Package StructureThe Evidence Package is a JSON-LD compliant object that aggregates execution metadata.2.1 The gxp-execution.json Schema{
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
3. Evidence Collection RulesVisual Evidence (MUST): For PQ tests involving a UI, at least one screenshot of the terminal state or success criteria must be captured.Log Sanitization (SHOULD): The engine must scrub PII or secrets from logs before attachment.Immutability (MUST): Once generated, the Evidence Package must be hashed. This hash is then sent to the SoR for permanent archival.Refer to RFC-002 for the engine logic that triggers this evidence capture.
