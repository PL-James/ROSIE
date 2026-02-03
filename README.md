# ROSIE — Repo-Oriented Secure Integrity Engine

```
========================================================================================
=                                                                                      =
=   ██████╗  ██████╗ ███████╗██╗███████╗                                              =
=   ██╔══██╗██╔═══██╗██╔════╝██║██╔════╝                                              =
=   ██████╔╝██║   ██║███████╗██║█████╗                                                =
=   ██╔══██╗██║   ██║╚════██║██║██╔══╝                                                =
=   ██║  ██║╚██████╔╝███████║██║███████╗                                              =
=   ╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚═╝╚══════╝                                              =
=                                                                                      =
=   ROSIE :: Repo-Oriented Secure Integrity Engine                                    =
=   VERSION :: 1.1.0                                                                  =
=   MODE  :: GAMP5 + CSA + 21 CFR Part 11                                             =
=   MODEL :: Truth-in-Code / Dual-Ledger / Cryptographic Hard Gates                   =
=                                                                                      =
========================================================================================
```

**Compliance as Code for GxP Systems**

ROSIE is a development framework aligned with:

- GAMP 5
- CSA (Computer Software Assurance)
- 21 CFR Part 11

It treats the GxP SDLC as a **graph-based data problem**, not a document-heavy administrative task.

Instead of disconnected documents, ROSIE enforces **traceable, signed, co-located compliance artifacts directly inside the repository.**

---

## 🚀 Try ROSIE Live

Experience ROSIE in your browser — no installation or GitHub account required!

[![Try Live Demo](https://img.shields.io/badge/🚀_Try-Live_Demo-blue?style=for-the-badge)](https://pl-james.github.io/ROSIE/demo/)

**What you get:**
- ✅ Fully functional ROSIE dashboard
- ✅ Pre-configured System of Record API
- ✅ Example app with sample compliance data
- ✅ 30 minutes of exclusive access
- ✅ Unique URL (your own private environment)
- ✅ No login required

**Single-click access:**
- Visit the [Demo Page](https://pl-james.github.io/ROSIE/demo/)
- Click "Launch Demo Environment"
- Wait ~60 seconds
- Get your unique URL and start exploring

Your demo environment automatically shuts down after 30 minutes to save resources.

> **For developers:** You can also [trigger demos directly via GitHub Actions](https://github.com/PL-James/ROSIE/actions/workflows/create-demo.yml) (requires GitHub login).

---

## 🚀 Core Premise

ROSIE enforces four non-negotiable principles:

### Truth-in-Code

All requirements and design artifacts live in the repository:

- URS in Markdown
- FRS in Markdown
- Design specs in Markdown
- Trace links in code
- Versioned with Git history

No shadow documents. No drift.

---

### Dual-Ledger Model

Two ledgers — two roles:

| Ledger   | Purpose              | System           |
| -------- | -------------------- | ---------------- |
| Intent   | Technical truth      | Git              |
| Approval | Regulatory authority | System of Record |

Git stores **what was built and why**.
SoR stores **who approved it and when**.

> **Boundary note:** ROSIE defines the *interface* to Systems of Record, not the SoR itself. Any QMS, PLM, or custom approval system that implements the ROSIE API contract (RFC-004) can serve as the SoR. Approval workflows, user management, and audit storage are the SoR's responsibility.

---

### Hard Gates

Deployment is **cryptographically blocked** unless integrity checks pass:

- artifact hashes verified
- signatures validated
- trace graph complete
- approvals present
- integrity guard passes

No green check → no release.

---

### Self-Validating Pipeline

Every CI/CD run proves system integrity:

- trace graph rebuilt
- hashes recalculated
- signatures checked
- approvals matched
- deployment gates evaluated

Compliance is continuously re-proven — not assumed.

---

## GRAPH::TRACE::MODEL

```
URS ──┬──▶ FRS ──┬──▶ DESIGN ──┬──▶ TEST ──┬──▶ RELEASE
      └──────────┴─────────────┴───────────┴── HASHED ── SIGNED
```

Traceability is treated as a **first-class graph**, not a spreadsheet.

---

## 🔐 Integrity Guard

```
commit → hash → sign → verify → attest → GATE → deploy
                                      │
                             BLOCK IF CHECK FAILS
```

Integrity Guard enforces:

- deterministic builds
- immutable artifacts
- cryptographic traceability
- signature enforcement
- release gating

---

## 🦄🦩 Project Mascots

```
        /)  (\ 
   .-._((,~~,))_.-.
    `-.  @  @  .-'
       /   ^   \        _
      (  \___/  )     _(o)>
       `-.___.-'     /  \\
          / \       /____\\
         /___\        ||
       Unicorn      Flamingo
```

ROSIE is named for Rose — inspiration officer, unicorn specialist, flamingo enthusiast.

---

## ✅ What ROSIE Enforces

- Co-located compliance artifacts
- Markdown-native specifications
- Graph traceability
- Cryptographic artifact identity
- Dual-ledger audit model
- Deterministic release gates
- Continuous integrity proof

---

## 📦 Philosophy

> If it isn’t in the repo, it isn’t real.  
> If it isn’t signed, it isn’t trusted.  
> If it can’t be traced, it can’t be released.

---

## 🔧 Status

```
SELF-VALIDATING PIPELINE .............. ENABLED
CRYPTO SIGNATURE CHECKS .............. ENFORCED
ARTIFACT CO-LOCATION ................ REQUIRED
DOCUMENT DRIFT ...................... IMPOSSIBLE
```

---

## License

This framework is licensed under CC BY-NC-ND 4.0. See `license.md` for details.
