# RFC-004: ROSIE API Interface (SoR Connector)

## Metadata

| Field  | Value                                                                        |
| ------ | ---------------------------------------------------------------------------- |
| RFC ID | 004                                                                          |
| Title  | ROSIE API Interface: Standard Contract for System of Record Interoperability |
| Status | Draft                                                                        |
| Focus  | API contracts, REST/gRPC, authentication, webhooks                           |

## 1. Scope

This RFC defines the RESTful API contract that any System of Record (SoR) must implement to support the ROSIE Engine. This prevents vendor lock-in and enables cross-platform compliance synchronization.

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
