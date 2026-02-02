# ROSIE: Regulatory and QA Mapping Guide

This guide translates traditional GxP compliance milestones into the ROSIE framework components. It is designed for QA, Regulatory Affairs, and auditors to understand how digital evidence replaces paper artifacts.

## 1. Traditional vs. ROSIE mapping

| Traditional GxP deliverable      | ROSIE digital equivalent      | Why this is better for compliance                                 |
| -------------------------------- | ----------------------------- | ----------------------------------------------------------------- |
| User Requirements (URS)          | `specs/urs/*.md`              | Living specs: requirements are version-controlled alongside code. |
| Functional/Design Specs (FRS/DS) | `specs/ds/*.md` and `@gxp-id` | Direct links: the design is part of the code.                     |
| Traceability Matrix (RTM)        | ROSIE graph (auto-generated)  | Real-time accuracy: derived from code, no manual drift.           |
| Test Protocols (IQ/OQ/PQ)        | `tests/` with `@gxp-type`     | Automated execution: tests run on every change.                   |
| Validation Summary Report        | `gxp-execution.json`          | Immutable evidence: logs, hashes, and screenshots.                |
| Handwritten signatures           | SoR e-signatures              | Part 11 compliant: signatures are linked to a specific Git hash.  |

## 2. Navigating the audit trail

In a traditional audit, you look at a binder. In a ROSIE-enabled audit, you look at the Dual-Ledger.

1. Prove the intent (the repo)
   - Auditor question: "Where did you say the system would do X?"
   - Answer: The Markdown file in `/specs`. Git history shows who wrote it and when.
2. Prove the design (the code)
   - Auditor question: "How did you implement that requirement?"
   - Answer: The ROSIE Engine follows the `@gxp-id` tag to the exact function in code.
3. Prove the verification (the evidence)
   - Auditor question: "How do I know this actually works?"
   - Answer: The `gxp-execution.json` shows test results, evidence attachments, and the RRT.

## 3. Hard-Gate vs. traditional "go-live"

| Traditional "go-live"                                    | ROSIE Hard-Gate                                                                  |
| -------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Human check: a person verifies signed documents.         | Digital check: deployment is blocked if any signature or hash is missing.        |
| Point-in-time: validation is a snapshot from last month. | Continuous: validation is a live status of the current build.                    |
| High friction: releases wait on paperwork routing.       | Low friction: releases proceed because evidence is generated during development. |

## 4. Addressing GAMP 5 and CSA principles

- Critical thinking (CSA): The AI agent flags high-risk changes (e.g., security, data integrity), so QA focuses on the most important areas.
- Fitness for purpose: Self-validation proves the tool works correctly on every run, not just during a one-time validation.

## 5. Summary for auditors

ROSIE supports 21 CFR Part 11 compliance by ensuring:

- Integrity: The manifest hash prevents undetected changes to validated code.
- Traceability: Every requirement is digitally linked to code and tests.
- Accountability: Every approval is a timestamped, cryptographically secure e-signature.
