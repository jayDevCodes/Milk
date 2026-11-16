# Step 03 Research and Build: backend and database foundation

- Research checked: 2026-11-16
- Repository: https://github.com/jayDevCodes/Milk
- Implementation commit: 9400425e779d69b417563b86e08c8fe1862a7730
- Reproducible lockfile/CI commit: 2ed8052905c73cd59d6392f80aa67002934c5aea

## Research decisions

The project keeps the planned modular-monolith design and the developer's familiar TypeScript/Express stack. The exact backend pins are Node.js 26.13.1 LTS, TypeScript 7.0.2, Express 5.3.0, Zod 4.6.7, Pino 10.4.0 and node-postgres 8.23.1. Direct dependencies and the transitive npm graph are locked in backend/package-lock.json. The TypeScript compiler uses strict NodeNext ESM settings.

PostgreSQL 18.7 + PostGIS 3.7.0 is selected for relational integrity, transactional route operations and spatial indexes/queries. Local development and GitHub Actions use the official postgis/postgis:18-3.7 image. The PostgreSQL 18 image stores persistent data under /var/lib/postgresql; Compose pins linux/amd64 because the upstream image advertises amd64 support. Apple Silicon machines therefore run the database container through Docker's x86 emulation; the Node 26 API container remains native to the host Docker platform.

No ORM is added. Explicit parameterized SQL remains visible for future PostGIS operations and route/trip transactions. Migrations are forward-only SQL, each applied transactionally under a PostgreSQL advisory lock and tracked with SHA-256 checksums. Rewriting an already-applied migration is rejected.

## Build implementation

- Added backend/package.json, package-lock.json, strict tsconfig.json and Node 26 .nvmrc.
- Added Zod environment parsing, Pino structured logging/redaction, request IDs and a centralized HTTP error envelope.
- Added Express process liveness at GET /health and PostgreSQL/PostGIS readiness at GET /health/ready.
- Added a bounded pg pool with connection/statement timeouts and configurable TLS enforcement.
- Added graceful SIGINT/SIGTERM shutdown.
- Added migrations to enable PostGIS and create the dairy tenant root table. Authentication/users/roles remain Step 4; sellers/drivers/vehicles/assignments remain Step 5.
- Added a checksum-aware, advisory-locked, transactional SQL migration runner and compiled migration packaging.
- Added infra/docker-compose.yml for local PostGIS + API development and backend/README.md setup instructions.
- Added backend unit and PostGIS integration tests plus immutable-action GitHub Actions workflow with locked npm install and caching.

## Verification evidence

Backend CI passed on the final lockfile-backed commit 2ed8052905c73cd59d6392f80aa67002934c5aea:

- Workflow: https://github.com/jayDevCodes/Milk/actions/runs/43801167056
- Repository guardrails: https://github.com/jayDevCodes/Milk/actions/runs/43801167240
- npm ci installed 109 packages from the committed package-lock.json.
- Strict TypeScript type-check succeeded.
- Fresh PostgreSQL 18.7/PostGIS 3.7 database accepted migrations from an empty schema.
- All 8 tests passed (7 HTTP/error/readiness tests and 1 fresh-PostGIS migration/idempotency integration test); 0 failed.
- Production TypeScript build and compiled migration rerun both succeeded.
- The production server smoke test returned HTTP 200 with { "status": "ready", "dependencies": { "database": "ready" } }.
- Repository guardrails passed.

An earlier backend CI run (https://github.com/jayDevCodes/Milk/actions/runs/43800667344) also passed before the generated lockfile was committed. The lockfile-backed rerun is the final acceptance evidence.

## Step 3 acceptance

The CI-verifiable backend/database foundation is complete: a fresh PostGIS database can be constructed entirely from committed migrations; the backend passes strict type-checking, eight tests, production compilation and the database-readiness smoke test.

Deferred to later milestones:
- Step 4: identity, login, sessions, roles and tenant/resource authorization.
- Step 5: dairy profile details, depot, seller/driver/vehicle master data and assignments.
- Step 13: authenticated realtime WebSocket events.
- Step 19: production deployment, managed database, production secrets/TLS provisioning, backups and monitoring.

The local Compose password is only a development placeholder. No production credentials, personal seller data or production database have been added.
