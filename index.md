---
layout: default
title: Home
---

<div class="hero">
  <div class="hero-content">
    <pre class="hero-ascii">
██████╗  ██████╗ ███████╗██╗███████╗
██╔══██╗██╔═══██╗██╔════╝██║██╔════╝
██████╔╝██║   ██║███████╗██║█████╗
██╔══██╗██║   ██║╚════██║██║██╔══╝
██║  ██║╚██████╔╝███████║██║███████╗
╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚═╝╚══════╝
    </pre>
    <h1 class="hero-title">
      <span class="gradient-text">Compliance as Code</span><br>
      for GxP Systems
    </h1>
    <p class="hero-subtitle">
      ROSIE treats the GxP SDLC as a graph-based data problem, not a document-heavy administrative task.
    </p>
    <div class="hero-badges">
      <span class="badge">GAMP 5</span>
      <span class="badge">CSA</span>
      <span class="badge">21 CFR Part 11</span>
    </div>
  </div>
</div>

<div class="features">
  <div class="feature-card">
    <div class="feature-icon">&#9881;</div>
    <h3 class="feature-title">Truth-in-Code</h3>
    <p class="feature-description">
      All requirements and design artifacts live in the repository. URS, FRS, and design specs in Markdown. No shadow documents. No drift.
    </p>
  </div>
  <div class="feature-card">
    <div class="feature-icon">&#9878;</div>
    <h3 class="feature-title">Dual-Ledger Model</h3>
    <p class="feature-description">
      Git stores what was built and why. System of Record stores who approved it and when. Cryptographic handshake ensures immutability.
    </p>
  </div>
  <div class="feature-card">
    <div class="feature-icon">&#9888;</div>
    <h3 class="feature-title">Hard Gates</h3>
    <p class="feature-description">
      Deployment is cryptographically blocked unless integrity checks pass. No green check, no release.
    </p>
  </div>
  <div class="feature-card">
    <div class="feature-icon">&#10003;</div>
    <h3 class="feature-title">Self-Validating Pipeline</h3>
    <p class="feature-description">
      Every CI/CD run proves system integrity. Compliance is continuously re-proven, not assumed.
    </p>
  </div>
</div>

## The Trace Model

```
URS ──┬──▶ FRS ──┬──▶ DESIGN ──┬──▶ TEST ──┬──▶ RELEASE
      └──────────┴─────────────┴───────────┴── HASHED ── SIGNED
```

Traceability is treated as a **first-class graph**, not a spreadsheet.

---

## Integrity Guard

```
commit → hash → sign → verify → attest → GATE → deploy
                                      │
                             BLOCK IF CHECK FAILS
```

The Integrity Guard enforces:

- Deterministic builds
- Immutable artifacts
- Cryptographic traceability
- Signature enforcement
- Release gating

---

## Philosophy

> If it isn't in the repo, it isn't real.
> If it isn't signed, it isn't trusted.
> If it can't be traced, it can't be released.

---

## What ROSIE Enforces

- Co-located compliance artifacts
- Markdown-native specifications
- Graph traceability
- Cryptographic artifact identity
- Dual-ledger audit model
- Deterministic release gates
- Continuous integrity proof

---

## Status

```
SELF-VALIDATING PIPELINE .............. ENABLED
CRYPTO SIGNATURE CHECKS .............. ENFORCED
ARTIFACT CO-LOCATION ................ REQUIRED
DOCUMENT DRIFT ...................... IMPOSSIBLE
```

---

## The RFC Stack

| RFC | Title | Focus |
|-----|-------|-------|
| [RFC-001](/specs/rfc-001/) | Data Standard | Tagging syntax, manifest schema |
| [RFC-002](/specs/rfc-002/) | Engine Spec | Hard-gates, AI protocols, sync logic |
| [RFC-003](/specs/rfc-003/) | Evidence Standard | Artifact packaging, 21 CFR Part 11 |
| [RFC-004](/specs/rfc-004/) | API Interface | SoR connector, REST contracts |
| [RFC-005](/specs/rfc-005/) | TQ Baseline | Self-validation, product archetypes |

---

## Project Mascots

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
