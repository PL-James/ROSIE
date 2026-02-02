# ROSIE Proof-of-Concept Demo

A working demonstration of the **ROSIE** (Regulatory Orchestration for Software Integrity and Evidence) framework for GxP-compliant software development.

---

## What is ROSIE?

ROSIE is a **repo-first compliance framework** that bridges the gap between modern software development practices and regulatory requirements in life sciences (pharma, biotech, medical devices).

### The Problem

Regulated industries require extensive documentation for software validation:
- **User Requirements (URS)** - What users need
- **Functional Requirements (FRS)** - What the system does
- **Design Specifications (DS)** - How it's built
- **Test Cases (OQ/PQ)** - Proof it works

Traditionally, this documentation lives in Word documents and SharePoint, disconnected from actual code. This creates:
- Documentation that drifts from reality
- Manual effort to maintain trace matrices
- Audit nightmares when regulators ask "show me the evidence"

### The ROSIE Solution

ROSIE treats **your repository as the source of truth**:

1. **Requirements live in Markdown** alongside code
2. **Code is annotated** with `@gxp-*` tags linking to requirements
3. **Tests reference** the specifications they verify
4. **A CLI extracts** all this into a trace graph
5. **A System of Record (SoR)** tracks approvals and evidence
6. **Release gates** ensure nothing ships without full traceability

```
┌─────────────────────────────────────────────────────────────────┐
│                        YOUR REPOSITORY                          │
│                                                                 │
│   specs/urs/auth.md ──────┐                                    │
│   specs/frs/jwt.md ───────┼──→ Trace Graph ──→ System of Record│
│   src/auth.ts (@gxp-id) ──┤         │              │           │
│   tests/auth.spec.ts ─────┘         │              ▼           │
│                                     │         Approvals        │
│                                     │              │           │
│                                     └──────→ Release Gate      │
│                                                    │           │
│                                                    ▼           │
│                                          Release Readiness     │
│                                               Token (RRT)      │
└─────────────────────────────────────────────────────────────────┘
```

---

## Key Concepts

### System of Record (SoR)

The SoR is the **authoritative database** that tracks:
- Which requirements exist and their approval status
- Who approved what, and when
- Test evidence proving requirements are met
- Complete audit trail of all actions

In production, this would be a hosted service. In this demo, it's a local SQLite-backed API.

### Trace Graph

A **directed acyclic graph (DAG)** showing how requirements flow:

```
URS-001 (User Need)
    │
    ▼
FRS-001 (Functional Spec)
    │
    ▼
DS-001 (Design Detail)
    │
    ▼
OQ-001 (Test Proof)
```

Every node must be approved. Every edge shows traceability. Regulators love this.

### Release Readiness Token (RRT)

A **cryptographic proof** that a specific commit:
- Has all requirements approved
- Has all tests passing
- Has complete traceability

CI/CD pipelines can gate deployments on valid RRTs. No token = no deploy.

### GxP Annotations

Simple comments in your code that create traceability:

```typescript
/**
 * @gxp-id: REF-DS-001
 * @gxp-type: DS
 * @gxp-traces: REF-FRS-001
 */
function generateToken(userId: string): string {
  // Implementation traces back to requirements
}
```

---

## What This Demo Includes

| Component | Description | Port |
|-----------|-------------|------|
| **SoR Server** | API backend storing manifests, approvals, evidence | 3000 |
| **Dashboard** | Visual UI for QA teams and stakeholders | 8080 |
| **ROSIE CLI** | Command-line tool for developers | - |
| **Example App** | Sample ROSIE-compliant codebase | - |

---

## Quick Start

### Prerequisites

- Docker and Docker Compose, OR
- Node.js 20+ for local development

### Option 1: Docker (Recommended)

```bash
cd poc

# Start all services
docker-compose up -d

# Wait for services to be ready (about 30 seconds)
docker-compose logs -f

# Open the dashboard
open http://localhost:8080
```

### Option 2: Local Development

You'll need three terminal windows:

**Terminal 1 - SoR Server:**
```bash
cd poc/sor-server
npm install
npm run dev
# Server running at http://localhost:3000
```

**Terminal 2 - Dashboard:**
```bash
cd poc/dashboard
npm install
npm run dev
# Dashboard at http://localhost:8080
```

**Terminal 3 - CLI:**
```bash
cd poc/rosie-cli
npm install
# CLI ready to use
```

---

## Step-by-Step Demo Walkthrough

This walkthrough demonstrates the complete ROSIE workflow. Follow along to see how code, requirements, and compliance come together.

### Step 1: Explore the Empty Dashboard

Open http://localhost:8080 in your browser.

You'll see the **Dashboard** page with:
- Empty status cards (0 requirements)
- "No Data Yet" message
- Instructions to sync your first manifest

This represents a fresh System of Record with no projects registered.

### Step 2: Examine the Example Application

The `example-app/` folder contains a ROSIE-compliant project. Let's explore its structure:

```bash
cd poc/example-app
```

**The Manifest** (`gxp-product.md`):
```yaml
---
product_name: "ROSIE Reference Implementation"
version: "1.0.0"
product_code: "REF"
gxp_metadata:
  gamp_category: 5
  risk_impact: "Medium"
---
```

This file identifies the product and its regulatory classification.

**Requirements** (`specs/` folder):
- `specs/urs/` - User Requirements (what users need)
- `specs/frs/` - Functional Requirements (what system does)
- `specs/ds/` - Design Specifications (how it's built)

Each spec file has YAML frontmatter with traceability:
```yaml
---
gxp_id: REF-FRS-001
type: FRS
traces:
  - REF-DS-001
---
```

**Annotated Code** (`src/validator.ts`):
```typescript
// @gxp-id: REF-DS-001
// @gxp-type: DS
// @gxp-traces: REF-FRS-001
export function generateToken(userId: string): string {
```

**Tagged Tests** (`tests/`):
```typescript
/**
 * @gxp-id: REF-OQ-001
 * @gxp-type: OQ
 * @gxp-traces: REF-DS-001
 */
describe('JWT Token Generation', () => {
```

### Step 3: Scan the Project

The ROSIE CLI extracts all requirements and builds a trace graph:

```bash
cd poc/example-app

# Run the scan command
npx tsx ../rosie-cli/src/index.ts scan
```

**Expected Output:**
```
  ╔═══════════════════════════════════════════════════════╗
  ║   ROSIE - Repo-First GxP Compliance Engine            ║
  ╚═══════════════════════════════════════════════════════╝

  ROSIE Scan
  ──────────────────────────────────────────────
  Scanning: /path/to/example-app

  Trace Graph: REF v1.0.0
  Hash: sha256:abc123...
  ──────────────────────────────────────────────

  URS
    ├─ REF-URS-001 (User Authentication...) → REF-FRS-001
    ├─ REF-URS-002 (Data Integrity...) → REF-FRS-002

  FRS
    ├─ REF-FRS-001 (JWT Token Authentication...) → REF-DS-001
    ├─ REF-FRS-002 (Checksum Validation...) → REF-DS-002

  DS
    ├─ REF-DS-001 (JWT Token Implementation...) → REF-OQ-001
    ├─ REF-DS-002 (SHA-256 Checksum...) → REF-OQ-002, REF-PQ-001

  OQ
    ├─ REF-OQ-001 (JWT Token Unit Tests...)
    ├─ REF-OQ-002 (SHA-256 Checksum Unit Tests...)

  PQ
    ├─ REF-PQ-001 (Full Workflow E2E Test...)

  8 nodes, 8 edges
```

This shows the complete traceability chain from user needs to test evidence.

### Step 4: Sync to System of Record

Push the trace graph to the SoR for tracking and approval:

```bash
npx tsx ../rosie-cli/src/index.ts sync --sor-url http://localhost:3000
```

**Expected Output:**
```
  ROSIE Sync
  ──────────────────────────────────────────────
  Project: /path/to/example-app
  SoR URL: http://localhost:3000

  Syncing 8 nodes, 8 edges...

  Sync successful!
  ──────────────────────────────────────────────
  Sync ID:     abc-123-def
  Nodes:       8
  Edges:       8
  Pending:     8 approvals
  Commit:      abc123d
  Hash:        sha256:abc123...

  Pending approvals:
    • REF-URS-001
    • REF-URS-002
    • REF-FRS-001
    • REF-FRS-002
    • REF-DS-001
    ...
```

**Now check the Dashboard** - it updates in real-time!

You should see:
- **Requirements: 8** total
- **Approved: 0/8** (0%)
- **Release: BLOCKED** (8 pending)
- Activity showing "Manifest Sync"

### Step 5: Explore the Trace Graph (Dashboard)

Click **"Trace Graph"** in the sidebar.

You'll see an **interactive visualization** of requirements:
- **Yellow nodes** = Pending approval
- **Green nodes** = Approved
- **Red nodes** = Rejected

Click any node to see details and approve it directly.

The graph shows the flow: `URS → FRS → DS → OQ/PQ`

### Step 6: Approve Requirements

Click **"Approvals"** in the sidebar.

You'll see all 8 pending items listed as cards with:
- Requirement ID and type
- Title and description
- Risk level
- **Approve** and **Reject** buttons

**For the demo, click "Approve All"** at the top right.

Watch the cards turn green and move to the "Approved" section!

**Alternative: CLI approval**
```bash
curl -X POST http://localhost:3000/v1/demo/approve-all
```

### Step 7: Upload Test Evidence

Tests prove your code works. ROSIE tracks this evidence:

```bash
# Upload the pre-configured test results
npx tsx ../rosie-cli/src/index.ts evidence \
  --file ./gxp-execution.json \
  --sor-url http://localhost:3000
```

**Expected Output:**
```
  ROSIE Evidence Upload
  ──────────────────────────────────────────────
  Uploading 3 test results...

  Evidence uploaded successfully!
  ──────────────────────────────────────────────
  Evidence ID: evidence-123
  Passed:      3
  Failed:      0
  Skipped:     0
```

Click **"Evidence"** in the dashboard to see:
- Test execution timestamp
- Environment details
- Pass/fail status for each test
- Expandable logs

### Step 8: Check Release Readiness

Click **"Release"** in the sidebar.

If all requirements are approved and tests pass, you'll see:

```
     ╔═══════════════════════════════════════════╗
     ║                                           ║
     ║   ✓ APPROVED FOR RELEASE                  ║
     ║   All gates passed. RRT issued.           ║
     ║                                           ║
     ╚═══════════════════════════════════════════╝

Gate Conditions:
  ✓ All requirements approved (8/8)
  ✓ Manifest hash matches
  ✓ All tests passed (3/3)

Release Readiness Token:
  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**The RRT is your proof** that this commit is validated and ready to deploy.

**CLI check:**
```bash
npx tsx ../rosie-cli/src/index.ts release --sor-url http://localhost:3000
```

### Step 9: View Audit Trail

Click **"Audit Log"** in the sidebar.

Every action is recorded with:
- Timestamp
- Action type (MANIFEST_SYNC, APPROVAL, EVIDENCE_UPLOAD, RRT_ISSUED)
- User who performed it
- Details
- Cryptographic hash for tamper-evidence

This is your **21 CFR Part 11 compliant audit trail**.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Dashboard                             │
│                    (React + Vite + Tailwind)                │
│                    http://localhost:8080                     │
│                                                              │
│  Pages:                                                      │
│  ├─ Dashboard    (overview cards, activity feed)            │
│  ├─ Trace Graph  (interactive DAG visualization)            │
│  ├─ Approvals    (approval queue with actions)              │
│  ├─ Evidence     (test results viewer)                      │
│  ├─ Audit Log    (immutable action history)                 │
│  └─ Release      (gate status, RRT display)                 │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ REST API
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      SoR Server                              │
│                 (Express + TypeScript)                       │
│                 http://localhost:3000                        │
│                                                              │
│  Endpoints:                                                  │
│  ├─ POST /v1/sync/manifest    (sync trace graph from repo)  │
│  ├─ GET  /v1/nodes            (list all requirements)       │
│  ├─ POST /v1/nodes/:id/approve (approve a requirement)      │
│  ├─ POST /v1/evidence/upload  (upload test execution)       │
│  ├─ GET  /v1/release/readiness/:sha (check if ready)        │
│  └─ GET  /v1/audit            (retrieve audit log)          │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ SQLite
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Database                                │
│                     (SQLite file)                           │
│                                                              │
│  Tables:                                                     │
│  ├─ manifests    (product versions synced)                  │
│  ├─ nodes        (requirements with approval status)        │
│  ├─ edges        (traceability relationships)               │
│  ├─ evidence     (test execution records)                   │
│  └─ audit_log    (immutable action history)                 │
└─────────────────────────────────────────────────────────────┘
```

---

## CLI Command Reference

All commands are run from the `example-app/` directory:

### `rosie scan`

Extracts requirements from the repository and displays the trace graph.

```bash
npx tsx ../rosie-cli/src/index.ts scan [options]

Options:
  --format <type>   Output format: graph (default), table, json
```

### `rosie sync`

Pushes the trace graph to the System of Record.

```bash
npx tsx ../rosie-cli/src/index.ts sync [options]

Options:
  --sor-url <url>   SoR API URL (default: http://localhost:3000)
```

### `rosie status`

Checks approval status without syncing.

```bash
npx tsx ../rosie-cli/src/index.ts status [options]

Options:
  --sor-url <url>   SoR API URL (default: http://localhost:3000)
```

### `rosie evidence`

Uploads test execution results.

```bash
npx tsx ../rosie-cli/src/index.ts evidence [options]

Options:
  --file <path>     Path to gxp-execution.json
  --sor-url <url>   SoR API URL (default: http://localhost:3000)
```

### `rosie release`

Requests a Release Readiness Token.

```bash
npx tsx ../rosie-cli/src/index.ts release [options]

Options:
  --commit-sha <sha>  Git commit SHA (auto-detected if in git repo)
  --sor-url <url>     SoR API URL (default: http://localhost:3000)
```

---

## API Endpoints Reference

### Core Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check, returns service status |
| `GET` | `/v1/dashboard` | Summary data for dashboard cards |
| `POST` | `/v1/sync/manifest` | Sync trace graph from repository |
| `GET` | `/v1/sync/current` | Get currently synced manifest |
| `GET` | `/v1/nodes` | List all nodes with edges |
| `GET` | `/v1/nodes/:id` | Get single node details |
| `POST` | `/v1/nodes/:id/approve` | Approve a node |
| `POST` | `/v1/nodes/:id/reject` | Reject a node with reason |
| `POST` | `/v1/evidence/upload` | Upload test execution results |
| `GET` | `/v1/evidence` | List evidence for current manifest |
| `GET` | `/v1/release/readiness/:sha` | Check release readiness |
| `GET` | `/v1/audit` | Get audit log entries |

### Demo Helpers

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/v1/demo/approve-all` | Bulk approve all pending |
| `POST` | `/v1/demo/reset` | Clear database for fresh start |

---

## Project Structure

```
poc/
├── docker-compose.yml          # One-click deployment
├── README.md                   # This file
│
├── sor-server/                 # System of Record API
│   ├── package.json
│   ├── Dockerfile
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts            # Express server entry
│       ├── routes/
│       │   ├── sync.ts         # Manifest sync endpoint
│       │   ├── nodes.ts        # Node CRUD + approvals
│       │   ├── release.ts      # Release readiness check
│       │   ├── evidence.ts     # Test evidence upload
│       │   ├── audit.ts        # Audit log retrieval
│       │   └── demo.ts         # Demo helper endpoints
│       ├── services/
│       │   ├── manifest.ts     # Manifest processing
│       │   ├── approval.ts     # Approval state machine
│       │   └── rrt.ts          # RRT generation
│       └── db/
│           └── sqlite.ts       # Database schema + queries
│
├── dashboard/                  # Visual frontend
│   ├── package.json
│   ├── Dockerfile
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── src/
│       ├── main.tsx            # React entry
│       ├── App.tsx             # Router + layout
│       ├── api.ts              # API client
│       ├── pages/
│       │   ├── Dashboard.tsx   # Overview with cards
│       │   ├── TraceGraph.tsx  # Interactive DAG
│       │   ├── Approvals.tsx   # Approval queue
│       │   ├── Evidence.tsx    # Test results viewer
│       │   ├── AuditLog.tsx    # Audit trail table
│       │   └── Release.tsx     # Release gate status
│       ├── components/
│       │   ├── StatusBadge.tsx # Colored status indicators
│       │   ├── NodeCard.tsx    # Requirement card
│       │   ├── GraphView.tsx   # ReactFlow visualization
│       │   └── Timeline.tsx    # Activity timeline
│       └── styles/
│           └── globals.css     # Tailwind + dark theme
│
├── example-app/                # ROSIE-compliant demo app
│   ├── package.json
│   ├── gxp-product.md          # Product manifest
│   ├── gxp-execution.json      # Sample test evidence
│   ├── vitest.config.ts
│   ├── specs/
│   │   ├── urs/
│   │   │   ├── urs-001.md      # User Req: Authentication
│   │   │   └── urs-002.md      # User Req: Data Integrity
│   │   ├── frs/
│   │   │   ├── frs-001.md      # Func Req: JWT Tokens
│   │   │   └── frs-002.md      # Func Req: Checksums
│   │   └── ds/
│   │       ├── ds-001.md       # Design: Token impl
│   │       └── ds-002.md       # Design: SHA-256 impl
│   ├── src/
│   │   └── validator.ts        # @gxp-id annotated code
│   └── tests/
│       ├── unit/
│       │   ├── token.spec.ts   # OQ: Token tests
│       │   └── checksum.spec.ts # OQ: Checksum tests
│       └── e2e/
│           └── workflow.spec.ts # PQ: E2E workflow
│
└── rosie-cli/                  # ROSIE CLI tool
    ├── package.json
    ├── tsconfig.json
    └── src/
        ├── index.ts            # Commander.js entry
        ├── commands/
        │   ├── scan.ts         # Extract and display graph
        │   ├── sync.ts         # Push to SoR
        │   ├── status.ts       # Check approvals
        │   ├── evidence.ts     # Upload test results
        │   └── release.ts      # Request RRT
        ├── parser/
        │   ├── manifest.ts     # Parse gxp-product.md
        │   └── annotations.ts  # Extract @gxp-* tags
        └── graph/
            ├── builder.ts      # Build trace DAG
            └── hash.ts         # Compute manifest hash
```

---

## Resetting the Demo

To start fresh:

```bash
# Via API
curl -X POST http://localhost:3000/v1/demo/reset

# Or restart Docker with fresh volume
docker-compose down -v
docker-compose up -d
```

---

## Technology Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| SoR Server | Express + TypeScript | API backend |
| Database | SQLite (better-sqlite3) | Zero-config persistence |
| Dashboard | React 18 + Vite | Modern frontend |
| Styling | Tailwind CSS | Utility-first CSS |
| Graph Viz | ReactFlow + dagre | Interactive DAG |
| CLI | Commander.js | Command parsing |
| Parser | gray-matter | Markdown frontmatter |
| Tests | Vitest | Fast test runner |

---

## Next Steps

This PoC demonstrates the core ROSIE concepts. A production implementation would add:

- **Authentication** - OAuth/OIDC for user identity
- **Role-based access** - QA, Developer, Auditor roles
- **Digital signatures** - Cryptographic signing of approvals
- **Git integration** - Webhooks for automatic sync on push
- **CI/CD integration** - GitHub Actions/GitLab CI for RRT gating
- **Multi-tenant** - Multiple products/teams
- **Hosted SoR** - Cloud service instead of local SQLite

---

## Glossary

| Term | Definition |
|------|------------|
| **GxP** | Good Practice regulations (GMP, GLP, GCP, etc.) |
| **URS** | User Requirement Specification |
| **FRS** | Functional Requirement Specification |
| **DS** | Design Specification |
| **OQ** | Operational Qualification (unit/integration tests) |
| **PQ** | Performance Qualification (E2E/acceptance tests) |
| **SoR** | System of Record |
| **RRT** | Release Readiness Token |
| **Trace Matrix** | Document linking requirements to tests |
| **21 CFR Part 11** | FDA regulation for electronic records |
| **GAMP 5** | ISPE guide for computer system validation |

---

## License

Part of the ROSIE framework demonstration.
