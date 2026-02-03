```
 ____   ___  ____ ___ _____
|  _ \ / _ \/ ___|_ _| ____|
| |_) | | | \___ \| ||  _|
|  _ <| |_| |___) | || |___
|_| \_\\___/|____/___|_____|

Regulated Object Structure for Intelligent Evidence
```

**A framework for self-validating AI-generated software in regulated industries (GxP compliance)**

## Overview

ROSIE enables autonomous AI agents to maintain GxP compliance (21 CFR Part 11, EU GMP) by treating validation artifacts as first-class, version-controlled objects. It provides:

- **Machine-readable repository structure** for quality management
- **Hierarchical documentation model** with traceability chains (REQ → US → SPEC)
- **Cryptographic evidence protocol** using JSON Web Signatures (JWS)
- **Continuous validation** where agents act as trusted maintainers of the V-Model

## Key Concepts

### Repository Structure

```
/
├── .gxp/                    # Quality Management System Root
│   ├── system_context.md    # Apex Document (Desired State)
│   ├── risk_assessment.log  # Deterministic Risk Log
│   ├── adr/                 # Architecture Decisions
│   └── evidence/            # Signed Validation Artifacts
├── docs/                    # V-Model Requirements
└── src/                     # Implementation & Design Specs
```

### Risk-Based Classification

- **HIGH**: Direct impact on patient safety, product quality, or PHI
- **MEDIUM**: Indirect impact; manages critical metadata or workflow
- **LOW**: No impact on GxP data integrity (e.g., UI formatting)

### Verification Tiers (IQ/OQ/PQ)

- **IQ**: Installation/Infrastructure verification
- **OQ**: Operational/Functional (Unit/Integration) testing
- **PQ**: Performance/E2E testing against Intended Use

## Specification

The complete ROSIE framework specification is available in:

**[RFC-001: ROSIE Framework](rfcs/RFC-001-ROSIE.xml)**

This RFC defines:
- Repository structure and state consistency requirements
- The Apex Document (system_context.md) schema
- Traceability chain requirements and link validation
- Cryptographic evidence protocol (JWS format)
- Security considerations including adversarial agent mitigation
- Multi-Party Authorization (MPA) model for HIGH risk systems

## Use Cases

ROSIE is designed for AI-led development in regulated industries:

- **Pharmaceutical software** (GxP, 21 CFR Part 11, EU GMP)
- **Medical device software** (IEC 62304, ISO 13485)
- **Clinical systems** (HIPAA, GDPR)
- Any domain requiring validated software with audit trails

## Core Principles

1. **Read the State First**: Always start by reading `.gxp/system_context.md`
2. **The V-Model is Law**: Never write code without a corresponding User Story and Tech Spec
3. **Traceability is Mandatory**: Every source file and test must link to a requirement or spec ID
4. **Risk Awareness**: Update `gxp_risk_rating` when changes impact data integrity or privacy
5. **Evidence over Assurance**: Verify test outputs are captured as signed artifacts

## Status

**Draft Specification** - RFC-001 is currently in draft status and under active development.

## Meet the Mascots

### Ruby the Unicorn - Validation Guardian
```
       \
        \
         \\
          \\
           >\/7
       _.-(6'  \
      (=___._/` \
           )  \ |
          /   / |
         /    > /
        j    < _\
    _.-' :      ``.
    \ r=._\        `.
   <`\\_  \         .`-.
    \ r-7  `-. ._  ' .  `\
     \`,      `-.`7  7)   )
      \/         \|  \'  / `-._
                 ||    .'
                  \\  (
                   >\  >
               ,.-' >.'
              <.'_.''
                <'
```
*"Every commit is validated, every test is traced!"*

### Flavia the Flamingo - Compliance Advocate
```
                          .="=.
                        _/.-.-.\_
                       ( ( o o ) )
                        |/  "  \|
          .-------.      \'---'/
         _|~~ ~~  |_      /`"""`\
       =(_|_______|_)=   / /_,_\ \
         |:::::::::|    \_\\_'__/ /
         |:::::::[]|     /`  /`~\  |
         |o=======.|    /   /    \  \
         `"""""""""`  ,--`,--'\/\    \
                      '-- "--'  '--'  '-
```
*"Pink today, compliant tomorrow, GxP forever!"*

## License

To be determined
