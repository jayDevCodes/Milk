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
- Realtime: authenticated WebSocket (WSS) with server-authorized subscriptions.
- Maps: MapLibre Native Android + regional PMTiles offline vector map; routing: private Valhalla graph built from buffered OpenStreetMap data.
- Notifications: Firebase Cloud Messaging.
- Offline: Room on Android; durable retry queues and idempotent server writes.

## Autonomous development workflow

Every roadmap milestone follows Research → Build → Verify → Commit. Official technology documentation is checked first, findings are saved, implementation starts automatically and verified changes are committed. A separate Build prompt is not required.

- **Continue** runs the next incomplete milestone.
- **Status** reports evidence-backed progress.
- **Research step N** intentionally performs research only.

Progress is recorded in [docs/PIPELINE_STATE.md](docs/PIPELINE_STATE.md). See [the autonomous development pipeline](docs/AI_DEVELOPMENT_PIPELINE.md).

## Start with the design documents

1. [System architecture](docs/ARCHITECTURE.md)
2. [20-step implementation roadmap](docs/IMPLEMENTATION_ROADMAP.md)
3. [Technology stack research and decisions](docs/TECH_STACK_DECISIONS.md)
4. [Autonomous research/build pipeline](docs/AI_DEVELOPMENT_PIPELINE.md)
5. [Pipeline progress and acceptance status](docs/PIPELINE_STATE.md)

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

- [Regional offline map and routing strategy](docs/OFFLINE_MAP_STRATEGY.md)
