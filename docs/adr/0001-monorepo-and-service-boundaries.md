# ADR 0001: One monorepo, three Android apps and one backend

- Status: Accepted
- Date: 2026-11-15

## Context

Driver, Seller and Owner have different permissions, but use the same dairy, vehicle, route and trip records. Separate backends would duplicate authorization and weaken consistency.

## Decision

Keep one Git repository with three separately installable apps:
- Driver: in.dairylivetrack.driver
- Seller: in.dairylivetrack.seller
- Owner: in.dairylivetrack.owner

Use one Node.js/TypeScript modular-monolith API, one PostgreSQL + PostGIS database, shared API contracts and versioned migrations. Initial API prefix: /api/v1.

The backend is authoritative for identities, dairy ownership, assignments, route publication, trip state and authorization. Role-specific UI stays in each app; shared modules contain only common code.

## Consequences

Client releases must remain compatible with the API. Every REST request and WebSocket subscription must enforce role, dairy and resource ownership. The three APKs remain distinct applications.
