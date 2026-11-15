# Milk — Dairy Live Vehicle Tracking

Milk is a single-repository platform for a dairy fleet with three separately installable Android applications and one shared backend.

## Applications

- **Driver** — uses a saved, versioned daily collection route; manages route drafts; starts and ends trips; shares live GPS only during an active trip; records pickup outcomes.
- **Seller** — sees only their assigned vehicle, their own registered home pin, the vehicle's live position, road ETA, and pickups remaining before their stop.
- **Owner** — manages the dairy, sellers, drivers, vehicles, assignments and published routes; monitors the entire fleet and trip progress.

## Platform shape

- Android: Kotlin, Jetpack Compose, MVVM, repositories, coroutines and Flow.
- Backend: Node.js, TypeScript and Express as a modular monolith.
- Data: PostgreSQL + PostGIS.
- Realtime: Socket.IO with server-authorized rooms.
- Maps and routing: Google Maps Platform Maps SDK, Routes API and (for larger/constrained fleet optimization) Route Optimization API.
- Notifications: Firebase Cloud Messaging.
- Offline: Room on Android; durable retry queues and idempotent server writes.

## Start with the design documents

1. [System architecture](docs/ARCHITECTURE.md)
2. [20-step implementation roadmap](docs/IMPLEMENTATION_ROADMAP.md)
3. [Technology stack research and decisions](docs/TECH_STACK_DECISIONS.md)

## Core product rules

- A driver saves a route once. The same published route is loaded after every login/app restart until the driver explicitly edits and publishes a new version.
- Every trip is pinned to an immutable route version. Editing a future route must not silently alter an active trip.
- Seller codes identify sellers but are not authentication credentials.
- Seller home coordinates are master data. They are not taken from the seller phone's current GPS.
- A seller can see their own pickup context, not other sellers' names or exact home addresses.
- Driver location sharing starts from a visible user action when a trip begins and ends when the trip ends.
- Every business record is scoped to a dairy. Authorization is checked for each resource and action.

## Current status

This repository began empty. The initial commits establish the architecture and implementation plan. Application code is intentionally not scaffolded yet; follow the roadmap in order so contracts, data ownership and trip semantics are settled before UI implementation.

## Development policy

- Never commit API keys, signing keys, service-account files, production tokens or real seller personal data.
- Use environment templates with placeholder names only.
- Keep database changes in versioned migrations.
- Keep API contracts documented and tested.
- Prefer small pull requests or milestone commits with passing checks.
