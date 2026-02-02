RFC-004: ROSIE API Interface (The SoR Connector)

1. Core Endpoints

POST /v1/sync/manifest: Transmit repository state to SoR.

GET /v1/release/readiness/{sha}: Verify release status and retrieve RRT.

POST /v1/evidence/upload: Archive execution evidence (RFC-003).
