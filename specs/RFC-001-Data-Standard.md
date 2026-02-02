# RFC-001: ROSIE Data Standard ("Truth-in-Repo" Schema)

## Metadata

| Field   | Value                                                              |
| ------- | ------------------------------------------------------------------ |
| RFC ID  | 001                                                                |
| Title   | ROSIE Data Standard: Schema for GxP Traceability in Source Control |
| Version | 1.1.0                                                              |
| Status  | Draft                                                              |
| Focus   | Data structures, tagging syntax, manifest schema, multi-repo       |

## 1. Scope

This RFC defines the universal syntax and structure for embedding GxP (Good Practice) validation metadata within Git repositories. It establishes the Truth-in-Repo protocol, ensuring that any ROSIE-compliant engine can parse a repository to reconstruct a multidimensional traceability graph spanning requirements, design, and verification.

## 2. Repository manifest (`gxp-product.md`)

Every compliant repository must contain a YAML front matter manifest at the root. This file establishes the regulatory boundaries and namespace for all IDs.

### 2.1 Schema definition

```yaml
product_name: "LabData-Processor-Core"
version: "2.1.0"
product_code: "LDPC"
id_schema: "URS | FRS | DS | TC" # Defines the hierarchy
sync:
  mode: "repo-first"
  system_of_record_id: "nexus-qms-prod" # Identifier, not implementation
gxp_metadata:
  gamp_category: 5
  risk_impact: "High"
```

### 2.2 Multi-repository composition (optional)

For products spanning multiple repositories, the manifest declares composition:

```yaml
product_name: "LabData-Platform"
version: "3.0.0"
product_code: "LDP"
id_schema: "URS | FRS | DS | TC"
sync:
  mode: "repo-first"
  system_of_record_id: "nexus-qms-prod"
composition:
  - repo: "github.com/org/labdata-core"
    product_code: "LDC"
    version: "2.1.0"          # Pinned version (exact match)
    rrt_required: true        # Must have valid RRT at this version
  - repo: "github.com/org/labdata-auth"
    product_code: "LDA"
    version_constraint: "^1.5.0"  # SemVer range (latest matching)
    rrt_required: true
gxp_metadata:
  gamp_category: 5
  risk_impact: "High"
```

### 2.3 Manifest field reference

| Field | Required | Description |
|-------|----------|-------------|
| `product_name` | Yes | Human-readable product name |
| `version` | Yes | SemVer version string |
| `product_code` | Yes | Short uppercase code, prefix for all IDs |
| `id_schema` | Yes | Pipe-delimited hierarchy of artifact types |
| `sync.mode` | Yes | `repo-first` or `sor-first` |
| `sync.system_of_record_id` | Yes | Logical identifier for the SoR instance |
| `composition` | No | Array of sub-repository dependencies |
| `composition[].repo` | Yes | Repository URL or identifier |
| `composition[].product_code` | Yes | The dependency's product code |
| `composition[].version` | No | Exact version pin |
| `composition[].version_constraint` | No | SemVer range constraint |
| `composition[].rrt_required` | No | Whether a valid RRT is required (default: true) |
| `gxp_metadata.gamp_category` | No | GAMP 5 software category (1-5) |
| `gxp_metadata.risk_impact` | No | Risk classification |

## 3. Requirement schema (Markdown)

Requirements are authored in `.md` files within a `/specs` or `/docs` directory. ROSIE-compliant engines parse the Markdown AST to extract traceable nodes.

### 3.1 Header formatting

Every traceable requirement must follow the bracketed ID pattern in the header:

```md
## [ID] Title
```

### 3.2 Metadata block

Directly beneath the header, a YAML block enclosed in `---` is mandatory for synchronization with the System of Record (SoR).

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

## 4. Annotation syntax (source code)

Annotations are language-agnostic comments. The engine must support standard comment delimiters (e.g., `#`, `//`, `/* */`, `/** */`).

### 4.1 Tag definition table

| Tag           | Format  | Description                                   |
| ------------- | ------- | --------------------------------------------- |
| `@gxp-id`     | STRING  | Unique ID of the specific code block or test. |
| `@gxp-traces` | CSV<ID> | References to parent IDs (e.g., FRS or DS).   |
| `@gxp-type`   | ENUM    | Category: DS (Design), IQ, OQ, PQ.            |
| `@gxp-desc`   | STRING  | Optional human-readable intent.               |

### 4.2 Language examples

TypeScript (functional design):

```ts
/**
 * @gxp-id: LDPC-DS-001
 * @gxp-traces: LDPC-FRS-205
 * @gxp-type: DS
 */
export const validateChecksum = (data: string): boolean => {
  // ...
  return true;
};
```

Python (OQ test):

```py
# @gxp-id: LDPC-OQ-05
# @gxp-traces: LDPC-DS-001
# @gxp-type: OQ

def test_checksum_failure():
    assert validateChecksum("corrupt-data") is False
```

### 4.3 Filename fallback rules

If explicit `@gxp-type` tags are missing in a test file, the engine shall infer the type based on path conventions:

- `/tests/unit/` or `*.spec.*` -> OQ
- `/tests/e2e/` or `/tests/pq/` -> PQ
- `*.tf`, `Dockerfile`, `*.yaml` -> IQ

## 5. Taxonomy and mathematical mapping

The ROSIE data standard represents traceability as a directed acyclic graph (DAG), `G = (V, E)`.

### 5.1 Entity mapping

| Entity name            | Standard ID pattern      | RFC entity          |
| ---------------------- | ---------------------- | ------------------- |
| User Requirement       | `{CODE}-URS-{N}`       | Requirement node    |
| Functional Requirement | `{CODE}-FRS-{N}`       | Requirement node    |
| Design Spec            | `{CODE}-DS-{N}`        | Implementation node |
| Qualification Test     | `{CODE}-{IQ|OQ|PQ}-{N}`| Verification node   |

### 5.2 Edge rules

- Trace-Up: An implementation node `V_impl` must have at least one edge `E` pointing to a requirement node `V_req`.
- Verification-Link: A verification node `V_ver` must have at least one edge `E` pointing to either an implementation node or a requirement node.

### 5.3 Cross-repository edges

For multi-repo products, edges can reference nodes in other repositories using fully-qualified IDs:

```
{PRODUCT_CODE}-{TYPE}-{N}
```

Example: `LDA-FRS-101` references requirement 101 in the `LDA` (LabData-Auth) repository.

The engine resolves cross-repo references by:

1. Looking up the dependency in `composition`
2. Fetching the manifest at the pinned version
3. Validating the referenced node exists
4. Including the dependency's RRT hash in the parent manifest hash

---

## 6. Deterministic ordering (for hash computation)

To ensure manifest hashes are reproducible across implementations, all collections must be sorted before hashing.

### 6.1 Ordering rules

| Collection | Sort Key | Order |
|------------|----------|-------|
| Nodes | `@gxp-id` | Lexicographic ascending |
| Edges | `(source_id, target_id)` | Lexicographic ascending, source first |
| Composition | `product_code` | Lexicographic ascending |
| Attachments | `hash` | Lexicographic ascending |

### 6.2 Whitespace normalization

Before hashing text content:

1. Convert all line endings to `\n` (Unix-style)
2. Trim leading and trailing whitespace from each line
3. Collapse multiple consecutive blank lines to a single blank line
4. Remove trailing whitespace at end of file

### 6.3 Hash computation pseudocode

```
manifest_hash = SHA256(
  canonical_json({
    "product_code": product_code,
    "version": version,
    "nodes": sorted([
      {
        "id": node.id,
        "type": node.type,
        "content_hash": SHA256(normalize(node.content))
      }
      for node in nodes
    ], key=lambda n: n.id),
    "edges": sorted([
      {"source": edge.source, "target": edge.target}
      for edge in edges
    ], key=lambda e: (e.source, e.target)),
    "composition_hashes": sorted([
      {"product_code": dep.product_code, "rrt_hash": dep.rrt_hash}
      for dep in composition
    ], key=lambda d: d.product_code)
  })
)
```

---

## 7. Error states and validation

### 7.1 Graph validation errors

| Error Code | Condition | Severity |
|------------|-----------|----------|
| `ORPHAN_NODE` | Node has no incoming or outgoing edges | Warning |
| `ORPHAN_TEST` | Verification node traces to non-existent ID | Error |
| `CIRCULAR_TRACE` | Cycle detected in trace graph | Error |
| `DUPLICATE_ID` | Same `@gxp-id` appears multiple times | Error |
| `MISSING_REQUIREMENT` | Implementation traces to non-existent requirement | Error |
| `UNRESOLVED_XREF` | Cross-repo reference cannot be resolved | Error |

### 7.2 Manifest validation errors

| Error Code | Condition | Severity |
|------------|-----------|----------|
| `INVALID_VERSION` | Version string not valid SemVer | Error |
| `MISSING_RRT` | Composed dependency lacks valid RRT | Error |
| `VERSION_MISMATCH` | Dependency version outside constraint | Error |
| `SCHEMA_VIOLATION` | Required field missing or wrong type | Error |

Refer to RFC-002 for the engine requirements used to process and synchronize this data standard.
