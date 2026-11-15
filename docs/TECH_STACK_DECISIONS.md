# Milk — Technology Stack Research & Decisions

**Research date:** 15 November 2026  
**Scope:** Next foundation milestones: Step 2 (Android monorepo) and Step 3 (backend/database).  
**Selection rule:** Choose maintained stable releases that fit this product. Do not use preview/RC builds in production merely because they are newer.

## 1. Recommended stack

### Android apps

| Layer | Selection | Why it fits Milk |
|---|---|---|
| IDE | Android Studio Rabbit 2, 2026.2.2 Patch 1 | Current stable IDE; use the Apple Silicon download on the M1 Mac |
| Build | AGP 9.5.0, Gradle 9.6.0, JDK 17 | Official AGP 9.5 compatibility baseline |
| Language | Kotlin 2.4.21 stable | Current stable Kotlin line on research date |
| UI | Jetpack Compose + Material 3, Compose BOM 2026.09.00 | Native Android UI with consistent components |
| Architecture | MVVM + repositories + unidirectional state + Coroutines/Flow | Separates screens, business rules and data sources |
| Dependency injection | Dagger Hilt 2.60.1 | Mature Android DI; use KSP where supported |
| Navigation | Navigation Compose 2.10.2 | Stable Compose-first navigation; avoid Navigation 3 RC for v1 |
| Offline database | Room 3.0.3 stable | Cache saved routes and persist GPS/pickup outbox operations |
| Small settings | DataStore 1.3.0 | Preferences and encrypted serializer integration options |
| Deferred sync | WorkManager 2.12.0 | Retry deferred/offline work; not a repeating active GPS timer |
| Map renderer | MapLibre Native Android 13.7.1 + PMTiles | Local vector map, route lines, numbered stops and moving vehicle without tile API calls |
| Location | Google Play services Fused Location Provider + Android location foreground service | Active-trip location with visible service notification |
| Heading | Android Rotation Vector sensor | Seller app's requested heading-up map |
| REST client | Retrofit + OkHttp + kotlinx.serialization 1.13.0 | Typed API calls and JSON serialization |
| Live updates | OkHttp WebSocket over WSS | Native WebSocket transport; see section 5 |

Use three independent app modules:
- Driver: in.dairylivetrack.driver
- Seller: in.dairylivetrack.seller
- Owner: in.dairylivetrack.owner

Shared Android Gradle libraries:
- core-common, core-model, core-network, core-auth, core-database
- core-maps, core-location, core-designsystem, core-notifications

Each app owns its navigation graph, permissions and role-specific screens. Share models, API clients, repositories where truly reusable, design tokens and map primitives. Do not collapse the three apps into one installable application.

### Backend and database

| Layer | Selection | Why it fits Milk |
|---|---|---|
| Runtime | Node.js 26 LTS line | Production LTS; Node 25 is EOL |
| Language | TypeScript, strict mode | Safer service and API contracts |
| HTTP | Express 5.3.0 | User already knows Node/Express; no need to learn a new backend framework |
| Validation | Zod 4.6.7 | Runtime validation of every untrusted path/query/body |
| Logging | Pino | Structured logs with redaction for secrets/location data |
| Database driver | node-postgres (pg) | Direct SQL, pooling and transaction control |
| Schema changes | Versioned SQL migrations | Reproducible database setup |
| Geospatial | PostgreSQL 18.7 + PostGIS 3.7.0 | Spatial points, distances, GiST indexes and route/location queries |
| Realtime | Node ws server over WSS | Standard WebSocket event transport; server-authorized subscriptions |
| API contract | OpenAPI 3.x | Keeps all three apps aligned with backend endpoints |
| Hosting | One long-running Node service + managed PostgreSQL/PostGIS | Supports persistent WebSocket connections and simple operations |

Use a modular monolith, not microservices. Use pg with parameterized SQL and explicit transactions; PostGIS queries, route-version transactions, tenant constraints and GPS idempotency should remain easy to inspect. Avoid adding an ORM just to hide SQL.

## 2. Exact version baseline checked on 15 November 2026

| Component | Version / line | Research note |
|---|---:|---|
| Android Studio | Rabbit 2 2026.2.2 Patch 1 | Stable IDE line; use Apple Silicon build on M1 |
| Android Gradle Plugin | 9.3.1 | Stable patch line; API 37 and JDK 17 supported |
| Gradle | 9.7.0 | Meets AGP 9.3 minimum 9.5 and Kotlin 2.4.21 documented maximum 9.7 |
| JDK | 17 | AGP 9.3 baseline |
| Kotlin | 2.4.21 | Stable; officially tested with AGP through 9.3.1 and Gradle through 9.7 |
| Compose BOM | 2026.09.00 | Stable BOM; Compose 1.12 requires compileSdk 37 and AGP 9 |
| Navigation 3 | 1.2.1 | Stable since 4 November 2026; 1.3.0-alpha04 deliberately excluded |
| MapLibre Native Android | 13.7.1 OpenGL artifact | Stable; OpenGL flavour has widest device compatibility; APK-asset PMTiles supported |
| MapLibre Compose wrapper | Not selected for v1 | Host native MapView through Compose AndroidView; keep native lifecycle ownership |
| Room | 3.0.3 | Stable Room 3 release |
| DataStore | 1.3.0 | Stable |
| WorkManager | 2.12.0 | Stable |
| Activity Compose | 1.13.0 | Stable |
| Dagger Hilt | 2.60.1 | Version shown in current official setup guide |
| kotlinx.serialization | 1.13.0 | Stable release dated 10 November 2026 |
| Node.js | 26 LTS | Production LTS; avoid Node 25 EOL |
| Express | 5.3.0 | Current Express 5 release found |
| Zod | 4.6.7 | Current Zod 4 release found |
| PostgreSQL | 18.7 | Stable release dated 12 November 2026 |
| PostGIS | 3.7.0 | Stable release dated 30 October 2026 |

This is a dated baseline, not a reason to upgrade dependencies blindly on every build. Pin exact versions in Gradle version catalogs and package-lock.json. Avoid dynamic plugin versions, latest tags and unpinned Docker images.

## 3. Important Android build decision: AGP 9 compatibility

AGP 9 provides built-in Kotlin support. Do not also apply the legacy org.jetbrains.kotlin.android plugin. Apply org.jetbrains.kotlin.plugin.compose at the same Kotlin version as the selected compiler (2.4.21). The official Kotlin compatibility matrix lists Kotlin Gradle Plugin 2.4.20–2.4.21 as fully compatible through AGP 9.3.1 and Gradle 9.7.0. Newer AGP 9.4/9.5 and Gradle 9.9.1 are outside that published compatibility range for this Kotlin line; do not combine them merely because each is individually current.

Compose BOM 2026.09.00 requires compileSdk 37 and AGP 9 or later. Use compileSdk 37, targetSdk 36 and provisional minSdk 24. Revisit minSdk using the actual driver/seller phone inventory before field pilot. Navigation 3.1.2 is stable; the 1.3 alpha line remains preview.

Use one Gradle version catalog at android/gradle/libs.versions.toml. Prove AGP, built-in Kotlin, Compose compiler, Compose BOM, Navigation 3 and MapLibre together before adding DI, Room, WorkManager and later-step dependencies.

## 4. Why native Kotlin, not Flutter or React Native?

Milk relies on Android-specific behaviour: active-trip location foreground service, location permission/start restrictions, Rotation Vector sensor, durable Room queue and WorkManager. Kotlin + Compose gives direct access to these APIs and native UI. Flutter/React Native could build it, but would add plugin/native-bridge complexity around the most critical features. Since all three clients are Android-only today, Kotlin Multiplatform/Compose Multiplatform are unnecessary extra complexity. Keep code reuse in regular Android Gradle library modules.

### Offline-first behaviour

Room is a local cache/outbox, not a second server of record:
- Cache the last published driver route version, stop order, geometry and version ID.
- Persist unsent GPS samples and pickup actions with unique client operation IDs.
- Retry writes with bounded exponential backoff and jitter.
- Mark an operation synced only after server acknowledgement.
- Prevent late/offline GPS samples replacing a newer current location.
- On app open, show cached route immediately and reconcile against the server.
- Never allow a new route version to rewrite an active trip's pinned route version.

WorkManager handles deferred retry/sync. Active GPS must run in a location foreground service started while the app is visible after the driver taps Start Trip. Show an ongoing notification and stop the service when the trip ends. Do not use WorkManager as a precise repeating 5-second location timer.

## 5. Realtime decision: standard WebSocket instead of Socket.IO

The Socket.IO JavaScript server is current, but the native Java/Android client release line is older: the latest release found was 2.1.2. That creates an additional protocol-compatibility decision between a current JS server and the Android client. Since Milk has native Android clients and a small set of event types, standard WebSocket is a cleaner cross-stack contract.

Decision:
- Backend: Node ws server, only exposed over wss://.
- Android: OkHttp WebSocket.
- REST remains the source of truth for route/trip changes, GPS batch uploads and recovery snapshots.
- WSS delivers server-pushed vehicle locations, trip progress and route-publication events.

Implement and test:
1. Authenticate the WebSocket upgrade using the current session/access token.
2. Derive subscriptions on the server; never let a client choose arbitrary dairy/vehicle/seller channels.
3. Ping/pong heartbeat and dead-connection cleanup.
4. Reconnect with exponential backoff and jitter.
5. Event IDs/sequence numbers and REST snapshot after reconnect to recover missed events.
6. Message-size limits, client throttling and event schema validation.
7. Recheck permissions on reconnect and assignment changes.

Example events: vehicle.location.updated, trip.progress.updated, trip.started, trip.completed and route.version.published. Never emit other sellers' names or exact home addresses to a seller client. Add Redis pub/sub or a message broker only when multiple backend instances are needed; it is not an MVP requirement.

## 6. Maps and routing decision

For the first pilot:
- Render the regional PMTiles vector basemap locally with MapLibre Native Android.
- Generate the map from a buffered 15 km dairy area using OSM PBF + Protomaps Basemap/Planetiler; include local style, sprites and glyphs.
- Build a private Valhalla graph from the same buffered regional OSM data for routes, matrices and depot-fixed optimized seller sequence.
- Keep the Node backend as the public API; Android clients do not call Valhalla directly.
- Cache route geometry/order by route version; never recompute route order on every GPS ping.
- ETA is model-based from OSM road graph and is refreshed only on meaningful progress changes or a controlled interval.

Cost and key safety:
- Local PMTiles rendering and a self-hosted Valhalla graph avoid repeated third-party tile/routing API charges for the selected service region; hosting, map generation, storage and maintenance still have operational costs.
- Keep OSM attribution visible and follow ODbL obligations for the generated/distributed regional map.
- Do not bulk-download public OSM tile servers; build from licensed OSM PBF data or a provider that permits offline packaging.
- Verify actual rural roads in the dairy collection area; missing OSM features do not appear just because the zoom level is higher.

Future alternative:
- MapLibre Native + OpenStreetMap data and a routing engine such as OSRM/Valhalla/GraphHopper can reduce dependence on Google.
- This transfers tile hosting/provider, map-data updates, geocoding, routing operations, monitoring and rural-road validation to the project.
- Do not self-host this in the first milestone. Keep a RoutingProvider interface so it can be evaluated later against measured Google cost and real-road accuracy.

## 7. Backend structure

    backend/src/
      app.ts
      server.ts
      config/
      common/
        errors/
        middleware/
        authorization/
        validation/
        logging/
      modules/
        auth/
        dairies/
        users/
        sellers/
        drivers/
        vehicles/
        assignments/
        routes/
        route-optimization/
        trips/
        tracking/
        notifications/
        audit/
      integrations/
        google-maps/
        firebase/
      realtime/
        websocket-server/
        subscriptions/
        events/
      database/
        migrations/
        repositories/
      jobs/

Request flow:
1. Express receives request.
2. Zod validates path, query and body.
3. Authentication validates identity/session.
4. Authorization checks role, dairy ownership and resource assignment.
5. Controller calls a service.
6. Service uses a repository/transaction and integration adapter.
7. API returns documented response/error codes.

Use OpenAPI as the REST contract. Keep API DTOs distinct from database row shapes. Use Zod at runtime and contract tests to prevent mobile/backend drift.

## 8. Database and deployment

- Use PostgreSQL 18.7 + PostGIS 3.7.0. PostgreSQL 19 is still an RC on the research date; do not use it in production.
- Use managed PostgreSQL or a properly administered database with automated backups and restore tests.
- For local development, run PostgreSQL/PostGIS in Docker and run Node on the host.
- Use one pg pool per backend process; pool size must account for the total number of deployed instances.
- Use connection/statement timeouts, TLS in production and least-privilege database roles.
- Keep route history and GPS history separate; define retention/partitioning before history becomes large.
- Deploy the backend on a long-running host that supports WebSocket upgrades, HTTPS and health checks.
- Never commit .env, Firebase private keys, Google server keys, keystores or seller personal data.

## 9. Step 2 — Android foundation checklist

1. Create Gradle root project, wrapper and version catalog.
2. Verify Android Studio/AGP/Gradle/JDK compatibility on Apple Silicon.
3. Add three independent app modules with separate application IDs.
4. Add the shared core modules listed in section 1.
5. Configure Compose BOM, Material 3, Navigation Compose, Hilt, Room3, DataStore and WorkManager.
6. Add one minimal role-specific home screen per app.
7. Add shared Retrofit/OkHttp and Kotlin serialization network module.
8. Add shared Maps Compose module and load a map with a restricted development key from local properties/environment.
9. Add Room schema export and a cache test.
10. Build/install each APK on a physical Android device and verify package IDs.

Step 2 is complete only when all three apps sync, compile, install and launch independently.

## 10. Step 3 — Backend/database foundation checklist

1. Set Node 26 LTS locally and in CI; declare the supported engine range.
2. Initialize TypeScript + Express 5.3 and commit package-lock.json.
3. Add strict TypeScript, Zod, Pino, CORS policy, request IDs and central error handling.
4. Add pg pool and validated environment configuration.
5. Run PostgreSQL 18 + PostGIS 3.7 locally with Docker Compose.
6. Add versioned SQL migrations and enable PostGIS.
7. Add /health and /health/ready.
8. Create initial dairy/users/sellers/drivers/vehicles migrations after reviewing the schema.
9. Add integration tests against disposable PostgreSQL/PostGIS.
10. Document placeholders in .env.example only.

Step 3 is complete only when a fresh database can be built entirely through migrations and backend health/integration tests pass.

## 11. Explicitly defer

Do not add Kubernetes, microservices, Kafka, Redis cluster, GraphQL, MongoDB, Firebase Realtime Database, Flutter, React Native, KMP, PostgreSQL 19 RC, preview Android libraries or self-hosted OSM routing in the first foundation sprint. Defer milk billing, weighing, fat/SNF, inventory and payment accounting until core live tracking is stable.

## 12. Official research references

### Android/Kotlin
- Android Studio releases: https://developer.android.com/studio/releases
- AGP 9.5.0 release notes: https://developer.android.com/build/releases/agp-9-5-0-release-notes
- AGP/Gradle compatibility: https://developer.android.com/build/releases/about-agp
- AGP built-in Kotlin migration: https://developer.android.com/build/migrate-to-built-in-kotlin
- Kotlin releases: https://kotlinlang.org/docs/releases.html
- Compose BOM: https://developer.android.com/develop/ui/compose/bom
- Navigation: https://developer.android.com/jetpack/androidx/releases/navigation
- Room 3: https://developer.android.com/jetpack/androidx/releases/room3
- DataStore: https://developer.android.com/jetpack/androidx/releases/datastore
- WorkManager: https://developer.android.com/jetpack/androidx/releases/work
- Location foreground service: https://developer.android.com/develop/background-work/services/fgs/service-types
- Location permission: https://developer.android.com/develop/sensors-and-location/location/permissions
- Maps SDK Android releases: https://developers.google.com/maps/documentation/android-sdk/release-notes
- Maps Compose releases: https://github.com/googlemaps/android-maps-compose/releases
- Hilt setup: https://dagger.dev/hilt/gradle-setup

### Backend/data/realtime
- Node.js releases: https://nodejs.org/en/about/previous-releases
- Express releases: https://github.com/expressjs/express/releases
- Zod releases: https://github.com/colinhacks/zod/releases
- PostgreSQL 18.7 announcement: https://www.postgresql.org/about/news/postgresql-187-1712-1616-1520-1425-and-19-rc-2-released-3442/
- PostgreSQL support policy: https://www.postgresql.org/support/versioning/
- PostGIS 3.7.0 announcement: https://postgis.net/2026/10/PostGIS-3.7.0/
- PostGIS compatibility/releases: https://postgis.net/documentation/getting_started/install_windows/released_versions/
- Socket.IO Java client releases (comparison): https://github.com/socketio/socket.io-client-java/releases
- Socket.IO server releases (comparison): https://github.com/socketio/socket.io/releases
- WebSocket API: https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API

### Maps/routing
- Valhalla routing API: https://valhalla.github.io/valhalla/api/
- Valhalla optimized route API: https://valhalla.github.io/valhalla/api/optimized_route/
- Valhalla regional graph build: https://valhalla.github.io/valhalla/building/
- OpenStreetMap tile usage policy: https://operations.osmfoundation.org/policies/tiles/
- PostGIS ST_DWithin: https://postgis.net/docs/ST_DWithin.html

Recheck versions and billing before locking dependencies for the actual Step 2/3 build.
