RFC-001: ROSIE Data Standard (The "Truth-in-Repo" Schema)

| Field | Value |
| --- | --- |
| RFC ID | 001 |
| Title | ROSIE Data Standard: Schema for GxP Traceability in Source Control |
| Status | Draft |
| Focus | Data Structures, Tagging Syntax, Manifest Schema |

1. Scope

This RFC defines the universal syntax and structure for embedding GxP (Good Practice) validation metadata within Git repositories. It establishes the "Truth-in-Repo" protocol, ensuring that any ROSIE-compliant engine can parse a repository to reconstruct a multidimensional traceability graph spanning requirements, design, and verification.

2. The Repository Manifest (gxp-product.md)

Every compliant repository must contain a YAML-frontmatter manifest at the root. This file establishes the regulatory boundaries and the namespace for all IDs.

2.1 Schema Definition

```yaml
product_name: "LabData-Processor-Core"
version: "2.1.0"
product_code: "LDPC"
id_schema: "URS | FRS | DS | TC" # Defines the hierarchy
sync:
  mode: "repo-first"
  system_of_record: "Nexus-QMS"
dependencies:
  - repo: "[github.com/org/shared-auth](https://github.com/org/shared-auth)"
    id_prefix: "AUTH-"
gxp_metadata:
  gamp_category: 5
  risk_impact: "High"
```

3. Requirement Schema (Markdown)

Requirements are authored in .md files located within a /specs or /docs directory. ROSIE-compliant engines must parse the Markdown Abstract Syntax Tree (AST) to extract traceable nodes.

3.1 Header Formatting

Every traceable requirement must follow the bracketed ID pattern in the header:

```md
## [ID] Title
```

3.2 Metadata Block

Directly beneath the header, a YAML block enclosed in --- is mandatory for synchronization with the System of Record (SoR).

```md
## [LDPC-URS-101] Data Integrity Check
---
sor_id: "urs:8c0b-ff21"
status: "Approved"
approved_by: "qa_lead@example.com"
approved_at: "2026-02-01T10:00:00Z"
risk_level: "High"
gxp_type: "Part11-Audit"
---

The system shall verify the checksum of every incoming JSON payload.
```

4. Annotation Syntax (Source Code)

Annotations are language-agnostic comments. The engine must support standard comment delimiters (e.g., #, //, /* */, /** */).

4.1 Tag Definition Table

| Tag | Format | Description |
| --- | --- | --- |
| @gxp-id | STRING | The unique ID of the specific code block or test. |
| @gxp-traces | CSV<ID> | References to parent IDs (e.g., FRS or DS). |
| @gxp-type | ENUM | Category: DS (Design), IQ, OQ, PQ. |
| @gxp-desc | STRING | (Optional) Human-readable intent of the code. |

4.2 Language Examples

TypeScript (Functional Design):

```ts
/**
 * @gxp-id: LDPC-DS-001
 * @gxp-traces: LDPC-FRS-205
 * @gxp-type: DS
 */
export const validateChecksum = (data: string): boolean => { ... };
```

Python (OQ Test):

```py
# @gxp-id: LDPC-OQ-05
# @gxp-traces: LDPC-DS-001
# @gxp-type: OQ
def test_checksum_failure():
    assert validateChecksum("corrupt-data") == False
```

4.3 Filename Fallback Rules

If explicit @gxp-type tags are missing in a test file, the engine shall infer the type based on path conventions:

- /tests/unit/ or *.spec.* $\rightarrow$ OQ
- /tests/e2e/ or /tests/pq/ $\rightarrow$ PQ
- *.tf, Dockerfile, *.yaml $\rightarrow$ IQ

5. Taxonomy & Mathematical Mapping

The ROSIE Data Standard represents traceability as a Directed Acyclic Graph (DAG) $G = (V, E)$.

5.1 Entity Mapping

| Entity Name | Standard ID Pattern | RFC Entity |
| --- | --- | --- |
| User Requirement | {CODE}-URS-{N} | Requirement Node |
| Functional Req | {CODE}-FRS-{N} | Requirement Node |
| Design Spec | {CODE}-DS-{N} | Implementation Node |
| Qualification Test | {CODE}-{IQ|OQ|PQ}-{N} | Verification Node |

5.2 Edge Rules

Trace-Up: An implementation node $V_{impl}$ must have at least one edge $E$ pointing to a requirement node $V_{req}$.

Verification-Link: A verification node $V_{ver}$ must have at least one edge $E$ pointing to either an implementation node or a requirement node.

Refer to RFC-002 for the engine requirements used to process and synchronize this data standard.
