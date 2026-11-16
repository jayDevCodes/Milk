# Milk — Dairy Live Vehicle Tracking

Milk is one repository containing three separately installable Android applications and one shared backend.

## Applications
- **Driver** — saved daily collection route, trip lifecycle, active-trip GPS sharing and pickup outcomes.
- **Seller** — assigned vehicle, own registered home pin, vehicle position, road ETA and pickups remaining.
- **Owner** — dairy master data, sellers, drivers, vehicles, published routes and fleet monitoring.

## Platform
- Android: Kotlin, Jetpack Compose, MVVM, Room, DataStore, WorkManager and native location/sensor APIs.
- Backend: Node.js, TypeScript, Express modular monolith.
- Data: PostgreSQL + PostGIS.
- Realtime: authenticated WebSocket (WSS) with server-authorized subscriptions.
- Maps: MapLibre Native Android + regional PMTiles offline vector map; routing: private Valhalla graph built from buffered OpenStreetMap data.
- Notifications: Firebase Cloud Messaging.

## Autonomous development workflow
Every roadmap milestone follows **Research → Build → Verify → Commit**. Current official technology documentation is checked first, findings are saved, implementation starts automatically and verified changes are committed. A separate Build prompt is not required.

- **Continue** runs the next incomplete milestone.
- **Status** reports evidence-backed progress.
- **Research step N** intentionally performs research only.

Progress is recorded in [docs/PIPELINE_STATE.md](docs/PIPELINE_STATE.md). The full operating process is in [docs/AI_DEVELOPMENT_PIPELINE.md](docs/AI_DEVELOPMENT_PIPELINE.md).

## Design and implementation documents
1. [System architecture](docs/ARCHITECTURE.md)
2. [20-step implementation roadmap](docs/IMPLEMENTATION_ROADMAP.md)
3. [Technology stack decisions](docs/TECH_STACK_DECISIONS.md)
4. [Autonomous research/build pipeline](docs/AI_DEVELOPMENT_PIPELINE.md)
5. [Regional offline map and routing strategy](docs/OFFLINE_MAP_STRATEGY.md)

## Android workspace
The Gradle monorepo is under `android/`:
- `apps/driver` — `in.dairylivetrack.driver`
- `apps/seller` — `in.dairylivetrack.seller`
- `apps/owner` — `in.dairylivetrack.owner`
- `core/design` — shared Material 3 visual foundation
- `core/app-shell` — shared role-aware Compose navigation and screens
- `core/maps` — shared MapLibre AndroidView/lifecycle bridge

Build all debug APKs from the repository root:

```bash
cd android
./gradlew :apps:driver:assembleDebug :apps:seller:assembleDebug :apps:owner:assembleDebug
```

The first map screen is a **local renderer/lifecycle preview**, not a populated regional offline map pack. PMTiles and Valhalla data are intentionally not committed to Git.

## Core product rules
- A driver saves a route once. The published route is restored after login/app restart until the driver explicitly edits and publishes a new version.
- Every trip is pinned to an immutable route version.
- Seller codes identify sellers but are not authentication credentials.
- Seller home coordinates are master data, not taken from the seller phone's current GPS.
- Sellers can see their own pickup context, not other sellers' names or exact home addresses.
- Driver location sharing begins after a visible Start Trip action and ends when the trip ends.
- Every business record is scoped to a dairy; authorization is checked for each resource and action.

## Current status
Repository foundations and the first Android app shells are committed. GitHub Actions repository guardrails passed. Android CI is now being added; there is no live backend, production credential, real seller data, regional PMTiles package or Valhalla graph yet.

## Development policy
- Never commit API keys, signing keys, service-account files, production tokens or real seller personal data.
- Use environment templates with placeholders only.
- Keep database changes in versioned migrations and API contracts documented/tested.
- Keep generated APK/AAB, OSM extracts, PMTiles archives and Valhalla graphs out of normal source commits.


## Autonomous development

The roadmap follows a Research → Build → Verify → Commit cycle. Say **Continue** to execute the next incomplete milestone; research is saved before implementation, and Build starts automatically without another prompt. See [the pipeline](docs/AI_DEVELOPMENT_PIPELINE.md) and [live progress](docs/PIPELINE_STATE.md).
