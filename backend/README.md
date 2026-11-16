# Milk backend

Node.js + TypeScript + Express modular monolith backed by PostgreSQL/PostGIS. The initial foundation intentionally contains process/DB health, structured request logging, environment validation and forward-only SQL migrations. Authentication and business modules belong to later roadmap steps.

## Local development

From the repository root:

    cp .env.example .env
    docker compose --env-file .env -f infra/docker-compose.yml up

The Compose stack starts PostgreSQL 18 with PostGIS 3.7, waits for the database health check, applies pending SQL migrations and starts the API in watch mode.

- API: http://localhost:3000
- Process liveness: GET /health
- Database readiness: GET /health/ready

The /health endpoint reports only whether the HTTP process is responding. Readiness returns HTTP 503 until PostgreSQL is reachable and the PostGIS extension is installed. It does not expose connection strings or database errors.

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

SQL files in src/database/migrations are applied in filename order. Each migration runs in its own transaction under a PostgreSQL advisory lock. The runner stores a SHA-256 checksum and refuses to silently accept edits to an already-applied migration. Add a new numbered SQL file for every schema change; never rewrite an applied migration.

The first migrations enable PostGIS and create the dairy tenant root. User/session/role tables are deliberately introduced in Step 4; sellers, drivers, vehicles and assignments follow in Step 5.

## Configuration

Copy the root .env.example to .env. The API can start without DATABASE_URL so liveness remains observable during a database outage; readiness remains 503 until a database is configured and PostGIS is available. Production must use TLS for PostgreSQL and a dedicated least-privilege database role.
