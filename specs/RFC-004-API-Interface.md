# RFC-004: ROSIE API Interface (SoR Connector)

## Metadata

| Field   | Value                                                                        |
| ------- | ---------------------------------------------------------------------------- |
| RFC ID  | 004                                                                          |
| Title   | ROSIE API Interface: Standard Contract for System of Record Interoperability |
| Version | 1.1.0                                                                        |
| Status  | Draft                                                                        |
| Focus   | API contracts, REST/gRPC, authentication, webhooks                           |

## 1. Scope

This RFC defines the RESTful API contract that any System of Record (SoR) must implement to support the ROSIE Engine. This prevents vendor lock-in and enables cross-platform compliance synchronization.

### 1.1 Purpose

ROSIE does not prescribe a specific SoR implementation. Instead, this RFC defines the **interface contract** that any SoR must fulfill. Compliant SoRs may include:

- Commercial QMS platforms (with adapter/plugin)
- PLM systems (with API gateway)
- Custom-built approval applications
- Regulatory SaaS products

### 1.2 What the SoR provides

The SoR is responsible for functionality outside ROSIE's boundary:

| Capability | Description |
|------------|-------------|
| User management | Authentication, roles, permissions |
| Approval workflows | Configurable approval chains, delegation, escalation |
| Electronic signatures | 21 CFR Part 11 compliant signature capture and storage |
| Audit trail | Immutable, timestamped record of all actions |
| Retention | Long-term storage per regulatory requirements |
| Notifications | Email, Slack, or other alerting mechanisms |

### 1.3 What this RFC defines

This RFC specifies only the API endpoints the ROSIE Engine calls. How the SoR implements these endpoints internally is outside scope.

## 2. Core endpoints

### 2.1 `POST /v1/sync/manifest`

Submits the extracted repository state to the SoR.

- Payload: Includes `gxp-product.md` data and the list of extracted `@gxp-` nodes.
- Behavior: Upserts nodes into the SoR graph and flags drift if requirements have changed.

### 2.2 `GET /v1/release/readiness/{sha}`

Checks if a specific commit is ready for deployment.

- Returns: JSON object containing `is_ready` (boolean), `pending_signatures` (array), and `release_token` (string, RRT).

### 2.3 `POST /v1/evidence/upload`

Submits `gxp-execution.json` (defined in RFC-003) to the SoR.

- Behavior: Links test results to specific `@gxp-id` nodes in the trace graph.

## 3. Security and authentication

- Auth (MUST): All requests must use mTLS or OAuth2 (bearer token).
- Non-repudiation (MUST): Every request must include an `X-ROSIE-Signature` header, which is a hash of the payload signed by the engine's private key.

Refer to RFC-002 for the engine sequence diagrams utilizing these endpoints.
