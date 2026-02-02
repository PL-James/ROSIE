---
product_name: "ROSIE Reference Implementation"
version: "1.0.0"
product_code: "REF"
id_schema: "URS | FRS | DS | TC"
sync:
  mode: "repo-first"
  system_of_record_id: "rosie-demo-sor"
gxp_metadata:
  gamp_category: 5
  risk_impact: "Medium"
---

# ROSIE Reference Implementation

This is a demonstration application that showcases ROSIE framework compliance.

## Overview

This reference implementation demonstrates:

- **User Requirements (URS)**: High-level user needs
- **Functional Requirements (FRS)**: Detailed functional specifications
- **Design Specifications (DS)**: Technical implementation details
- **Test Cases (OQ/PQ)**: Verification and validation tests

## Trace Matrix

The traceability flows as follows:

```
URS-001 (Authentication) → FRS-001 (JWT Tokens) → DS-001 (Token Generation) → OQ-001 (Unit Test)
URS-002 (Data Integrity) → FRS-002 (Checksums)  → DS-002 (SHA-256)         → OQ-002 (Unit Test)
                                                                            → PQ-001 (E2E Test)
```

## GxP Compliance

This implementation follows GAMP 5 guidelines for Category 5 software (custom applications).
