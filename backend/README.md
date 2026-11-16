# Milk backend

Node.js + TypeScript + Express modular monolith backed by PostgreSQL/PostGIS. The backend includes process/DB health, structured request logging, validated configuration, forward-only SQL migrations, and the first tenant-scoped authentication foundation.

## Local development

From the repository root:

    cp .env.example .env
    docker compose --env-file .env -f infra/docker-compose.yml up

The Compose stack starts PostgreSQL 18 with PostGIS 3.7, waits for the database health check, applies pending SQL migrations and starts the API in watch mode.

- API: http://localhost:3000
- Process liveness: GET /health
- Database readiness: GET /health/ready
- Owner registration: POST /api/v1/auth/register
- Login: POST /api/v1/auth/login
- Current identity: GET /api/v1/auth/me
- Logout: POST /api/v1/auth/logout

## Authentication contract

Create the first dairy owner with POST /api/v1/auth/register and a JSON body containing dairyName, displayName, email and password. The password must contain at least 12 characters. The endpoint creates the dairy, owner identity, membership and session atomically.

The response returns a 256-bit opaque bearer token. Store it in Android Keystore-backed secure storage; never place it in URLs or logs. Send it as Authorization: Bearer <accessToken>. Tokens expire after 30 days and are stored in PostgreSQL only as SHA-256 hashes. Logout revokes the server-side session immediately.

Login accepts email/password and an optional dairyId. If an account belongs to multiple active dairies, the API returns 409 DAIRY_SELECTION_REQUIRED with the available dairy IDs and roles; retry with the selected dairyId.

Passwords are hashed with Node.js native asynchronous Argon2id (19 MiB memory, 2 passes, parallelism 1, 16-byte random salt, 32-byte output). The PHC-encoded hash stores the algorithm and parameters so future cost upgrades can be introduced. The password is never returned or logged.

Roles are OWNER, MANAGER, DRIVER and SELLER. Membership status and user status are checked on every authenticated request. The requireRoles(...) helper provides deny-by-default role gates for later business modules.

## Tenant isolation

Every tenant-scoped repository operation must use withTenantTransaction(pool, { dairyId, userId }, callback). It starts a transaction and uses transaction-local PostgreSQL settings (app.dairy_id, app.user_id). The dairy root table has forced Row-Level Security; a query with no tenant context sees no dairy rows, and a tenant context sees only that dairy. Add equivalent RLS policies to every tenant-owned table as it is introduced. Never rely on a caller-provided dairy ID without deriving it from the authenticated session and checking membership.

The token is returned once; only its hash is stored. Register creates the dairy, owner identity, membership and session in one transaction. Duplicate emails return a conflict.

## Host-based development

Use Node.js 26.13.1 (see .nvmrc) and Docker Compose for the database. Then run:

    cd backend
    npm install
    npm run db:migrate
    npm run dev

In another terminal:

    cd backend
    npm run typecheck
    npm test
    npm run build
    npm run db:migrate:prod

## Migrations

SQL files in src/database/migrations are applied in filename order. Each migration runs in its own transaction under a PostgreSQL advisory lock. The migration runner stores a SHA-256 checksum and refuses to silently accept edits to an already-applied migration. Add a new numbered SQL file for every schema change; never rewrite an applied migration.

The migrations enable PostGIS, create the dairy tenant root, then create users, dairy memberships, revocable sessions and forced tenant Row-Level Security. Sellers, drivers, vehicles and assignments follow in Step 5.

## Production hardening still required

Before public onboarding, add distributed login/register rate limits, verified-email or phone-OTP workflows, password reset, audit events, and a dedicated non-owner database role with least-privilege grants. The current 30-day bearer session is a revocable session foundation, not a complete high-assurance refresh-token lifecycle.

Production must use TLS for PostgreSQL and a dedicated least-privilege database role.
