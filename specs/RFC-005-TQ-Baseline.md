# RFC-005: ROSIE TQ Baseline and Product Archetype Standards

## Metadata

| Field   | Value                                                                |
| ------- | -------------------------------------------------------------------- |
| RFC ID  | 005                                                                  |
| Title   | ROSIE TQ Baseline: Reference Dataset and Product Archetype Standards |
| Version | 1.1.0                                                                |
| Status  | Draft                                                                |
| Focus   | GAMP 5, tool validation, product archetypes, multi-repo, SVCV        |

## 1. Scope

This RFC provides the standard protocol and reference data required to qualify a ROSIE Engine. It also defines product archetypes, ensuring the ROSIE process adapts its validation rigor to the nature of the software product (e.g., microservices, embedded systems, or data pipelines).

## 2. The golden repository (reference data)

The TQ baseline includes a "Golden Repository" containing:

- Valid patterns: 100+ variations of `@gxp-` tags across five languages (C#, Java, Python, TypeScript, Go).
- Invalid patterns: Purposely broken hashes, circular dependencies, and missing signatures.
- Edge cases: Non-standard Markdown headers and multi-line comments.

## 3. Product archetypes and archetype-specific validation (ASV)

Not all GxP products are built equally. The ROSIE Engine must recognize the product archetype declared in the `gxp-product.md` manifest and adjust the Integrity Guard (RFC-002) accordingly.

### 3.1 Archetype definitions

| Archetype      | Examples              | Validation focus                | Evidence requirements          |
| -------------- | --------------------- | ------------------------------- | ------------------------------ |
| SaaS/Cloud     | Web apps, portals     | Multi-tenancy, session auth     | PQ screenshots, API logs       |
| Embedded/Edge  | Device firmware, IoT  | Memory safety, hardware interop | Unit test coverage, IQ hashes  |
| Data/AI        | Analytics, ML models  | Data lineage, reproducibility   | Model weights, dataset hashes  |
| Infrastructure | Platform-as-a-service | Security guardrails, networking | Terraform state, config drifts |

### 3.2 Product-level inheritance

For products consisting of multiple repositories, the ROSIE Engine must support validation inheritance.

- Shared libraries: If a product depends on a validated internal library, the engine verifies the dependency's Release Readiness Token (RRT) rather than re-validating the library code.
- Aggregated RTM: The engine must generate a master traceability matrix that merges nodes from all sub-component repositories.

## 4. Self-validating continuous validation (SVCV)

To achieve self-validating status, the ROSIE Engine must perform recursive verification of its own integrity during every CI/CD run.

### 4.1 Recursive integrity check

- Tool self-test: The engine runs a subset of the Golden Repository (Section 2) against itself before scanning production code.
- Engine checksum: The engine verifies its own binary or image hash against a known-good hash stored in the SoR.
- Failure mode: If the engine fails its self-test or hash check, the entire CI/CD pipeline is invalidated.

### 4.2 Automated deviation reporting

- Auto-log: Any failure of the Hard-Gate (RFC-002) must automatically generate a deviation report in the SoR.
- Root cause tagging: The AI agent (RFC-002) identifies which requirements (URS/FRS) are breached by the current code state.

## 5. Operational qualification (OQ) protocol

To pass OQ, a ROSIE Engine must achieve:

- Extraction recall: 100% (no tags missed).
- Extraction precision: 100% (no false positives).
- Gate fidelity: Correct rejection of all invalid-pattern commits.
- Archetype awareness: Correct identification and application of ASV rules based on the manifest.

## 6. Performance qualification (PQ) protocol

- Throughput: Process a 1,000-file repo in under 60 seconds.
- Persistence: Verify that the SoR correctly archives the evidence package.
- Latency monitoring: Continuous tracking of the time-to-trace.

## 7. Continuous validation lifecycle

| Stage  | Action                     | Validation artifact           |
| ------ | -------------------------- | ----------------------------- |
| Commit | Sync and semantic check    | Proposed trace graph          |
| Build  | Engine self-test           | Tool health certificate       |
| Test   | Evidence capture (RFC-003) | Execution evidence (JSON)     |
| Merge  | Hard-Gate RRT issue        | Automated release certificate |

This RFC serves as primary evidence for the qualified wrapper gap and establishes the framework for self-validating continuous validation across diverse product archetypes.
