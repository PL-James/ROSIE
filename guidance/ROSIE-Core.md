# ROSIE Core

ROSIE: Real-time Oversight & Systematic Integrity Evidence

The "Validation-as-Code" Framework for Regulated Software Engineering

## Standard metadata

| Field             | Value                                                              |
| ----------------- | ------------------------------------------------------------------ |
| Framework Version | 1.1.0                                                              |
| Principles        | GAMP 5 (2nd Ed), CSA (Critical Thinking), 21 CFR Part 11, Annex 11 |
| Philosophy        | Native Compliance, Dual-Ledger, Self-Validating                    |
| Scope             | Connected environments (air-gapped deployments out of scope)       |

## 1. Basic premise

ROSIE mandates that compliance artifacts be co-located with source code. It treats the Software Development Life Cycle (SDLC) as a graph-based data problem rather than a document-based administrative problem.

### 1.1 Developer experience (DevEx)

Under ROSIE, developers do not "write validation documents." Instead, they:

- Define intent: Author requirements in Markdown (RFC-001).
- Tag design: Annotate implementation logic with `@gxp-id` (RFC-001).
- Prove execution: Bind tests to requirements via `@gxp-traces`.
- Assure integrity: Commit changes through the Integrity Guard (RFC-002).

## 2. Core SDLC mapping (code-to-artifact)

ROSIE maps traditional GxP documents to specific code-based artifacts:

| Traditional document    | ROSIE code artifact  | Mechanism                           |
| ----------------------- | -------------------- | ----------------------------------- |
| User Requirements (URS) | `/specs/*.md`        | YAML front matter + Markdown AST    |
| Design Spec (DS)        | `@gxp-id` in source  | Docstring or comment annotations    |
| Trace Matrix (RTM)      | ROSIE graph          | Automatic DAG generation from tags  |
| IQ/OQ/PQ protocols      | Test suites          | `@gxp-type` tags in test frameworks |
| Validation report       | `gxp-execution.json` | Aggregated evidence from RFC-003    |

## 3. Dual-Ledger logic

ROSIE operates on the principle that intent lives in Git, but approval lives in a System of Record (SoR).

- Repo ledger: Contains the "what" and the "how."
- SoR ledger: Contains the "who," the signature, and the audit evidence.
- Handshake: A cryptographic manifest hash (RFC-002) ensures the SoR only approves a specific, immutable repo state.

### 3.1 ROSIE boundary (what's in scope)

ROSIE defines:

- **Data formats**: How to tag code and structure requirements (RFC-001)
- **Hash computation**: How to generate deterministic integrity fingerprints (RFC-002)
- **Evidence schema**: How to package test execution artifacts (RFC-003)
- **API contract**: The interface any SoR must implement (RFC-004)
- **Qualification protocol**: How to validate a ROSIE-compliant engine (RFC-005)

### 3.2 SoR responsibility (what's out of scope)

The System of Record is responsible for:

- **User authentication and authorization**: Who can approve what
- **Approval workflows**: Sequential, parallel, role-based, or custom
- **Electronic signatures**: 21 CFR Part 11 compliant signature capture
- **Audit trail storage**: Immutable record retention
- **Notification and escalation**: Alerting stakeholders of pending approvals

Any system that implements RFC-004's API contract can serve as the SoR: commercial QMS platforms, PLM systems, or custom-built approval applications.

### 3.3 Out of scope

- **Air-gapped environments**: ROSIE assumes network connectivity between the CI/CD pipeline and the SoR
- **Offline approval workflows**: All approvals must be recorded in the SoR before release gates can pass

## 4. Validation models

### 4.1 Point-in-time (milestone) validation

For traditional waterfall-style releases, ROSIE allows a validation freeze:

- The engine scans a specific Git tag.
- The SoR generates a static RTM and summary report.
- Electronic signatures are collected on the frozen artifact bundle.

### 4.2 Continuous validation (streaming)

For modern CI/CD, ROSIE enables a living validation state:

- Per-PR validation: Every pull request triggers a delta trace.
- Hard-Gate: Merging is blocked unless the AI agent verifies semantic consistency and the SoR confirms all linked requirements are pre-approved.
- Release Readiness Token (RRT): A time-bound credential that allows software to execute in a production environment.

## 5. CSA and GAMP 5 alignment

- GAMP 5 (V-model): ROSIE provides the vertical and horizontal links of the V-model in real time.
- CSA (Computer Software Assurance): ROSIE uses AI agents (RFC-002) to highlight high-risk changes, allowing humans to focus on approvals for critical logic.

## 6. Multi-repository products

Many GxP products span multiple repositories (e.g., shared libraries, microservices, frontend/backend splits). ROSIE supports this through product composition.

### 6.1 Product manifest linking

The root product declares its dependencies in `gxp-product.md`:

```yaml
product_name: "LabData-Platform"
product_code: "LDP"
composition:
  - repo: "github.com/org/labdata-core"
    product_code: "LDC"
    version_constraint: "^2.0.0"
  - repo: "github.com/org/labdata-auth"
    product_code: "LDA"
    version_constraint: "^1.5.0"
```

### 6.2 Aggregated traceability

When validating a composed product:

1. Each sub-repository must have a valid Release Readiness Token (RRT) for its declared version
2. The root product's trace graph includes edges to sub-repository requirement nodes
3. The manifest hash incorporates sub-repository hashes (see RFC-002 for ordering rules)

### 6.3 Cross-repository tracing

Requirements can trace across repository boundaries using fully-qualified IDs:

```python
# @gxp-id: LDP-DS-001
# @gxp-traces: LDC-FRS-101, LDA-URS-005
```

The engine resolves these references by fetching the linked repository's manifest at the pinned version.

---

## 7. The "Watchdog" (self-validation)

As defined in RFC-005, the framework is self-validating. The tool that generates compliance evidence must prove its own integrity (via recursive self-tests) during every execution, ensuring the evidence has not been tampered with or corrupted by the tool itself.

## The ROSIE ecosystem (RFC stack)

- RFC-001: Data Standard (tagging and manifests)
- RFC-002: Engine Spec (hard-gates and AI protocols)
- RFC-003: Evidence Standard (artifact packaging)
- RFC-004: API Interface (the SoR connector)
- RFC-005: TQ Baseline (self-validation and archetypes)
