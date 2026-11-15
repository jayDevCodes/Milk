# Milk — System Architecture

**Status:** Initial architecture baseline  
**Repository:** jayDevCodes/Milk  
**Architecture style:** Single monorepo, three Android applications, one modular-monolith backend, one PostgreSQL/PostGIS database.

## 1. Product objective

Milk helps a dairy coordinate regular milk collection using vehicles and drivers who follow saved daily routes. It has three role-specific Android apps:

1. Driver app — route creation and editing, daily trip operations, GPS sharing and pickup status.
2. Seller app — privacy-limited live tracking of the assigned vehicle relative to the seller's registered home.
3. Owner app — fleet-wide monitoring and master-data administration.

The apps are separately installable and have distinct Android application IDs. They do not each get their own backend. They use one API, one identity/authorization model and one canonical database.

Out of scope for the first release: milk weighing, fat/SNF, payment accounting, inventory, billing, public self-registration, customer delivery and multi-dairy public marketplace. The design should not block later modules, but they must not delay the tracking MVP.

## 2. Architecture at a glance

- Driver Android app ─┐
- Seller Android app ─┼── HTTPS REST API + authenticated Socket.IO ── Express modular monolith
- Owner Android app ──┘                                              │
                                                                      ├── PostgreSQL + PostGIS
                                                                      ├── Google Maps Platform
                                                                      └── Firebase Cloud Messaging

Android local storage:
- Room stores the last published route, route metadata, active trip state and durable pending operations.
- DataStore stores non-sensitive preferences and small settings.
- Android Keystore-backed secure storage protects refresh-token material where supported.

Backend external integrations:
- Google Maps SDK is used by Android clients for map rendering. Restrict mobile keys to the correct Android package names and signing certificate fingerprints.
- Google Routes API is called from the backend for route geometry, road distance, duration and supported waypoint ordering. Do not expose an unrestricted server key in an APK.
- Google Route Optimization API is the escalation path for large stop lists, multiple vehicles, time windows or richer fleet constraints.
- Firebase Cloud Messaging is for push notifications only. PostgreSQL remains the source of truth.

## 3. Technology decisions

| Area | Decision | Reason |
|---|---|---|
| Android language | Kotlin | Native Android APIs and strong type safety |
| Android UI | Jetpack Compose + Material 3 | Modern native UI and reusable role-specific screens |
| Android architecture | MVVM, repository pattern, unidirectional data flow, coroutines and Flow | Testable separation of UI, domain and data |
| Local persistence | Room + DataStore | Offline route cache and durable trip operation queue |
| Backend | Node.js + TypeScript + Express | Fits the project owner's existing Node/Express experience; a modular monolith is simpler to operate than microservices |
| API validation | Zod (or an equivalent runtime schema validator) | Validate all untrusted request bodies and parameters |
| API contract | OpenAPI 3.x | Generate/verify clients and prevent app/backend contract drift |
| Primary database | PostgreSQL | Transactions, constraints and relational integrity |
| Geospatial database | PostGIS extension | Geographic points, distance checks and spatial indexing |
| Database access | pg with a repository/service layer and SQL migrations | Explicit SQL for PostGIS and transaction-sensitive route operations |
| Realtime | Socket.IO | Authenticated event delivery and role-scoped rooms |
| Push | Firebase Cloud Messaging | Push alerts; not live-location transport |
| Maps | Google Maps Platform | Map tiles, road network, routes and ETA calculations |
| CI | GitHub Actions | Separate checks and APK build jobs per app, plus backend checks |

Pin exact dependency versions only when implementation begins, using current stable compatible releases and a committed Gradle version catalog / package lockfile. Do not guess old version numbers in this architecture document.

## 4. Monorepo layout

The initial directory layout should be:

    Milk/
      android/
        settings.gradle.kts
        build.gradle.kts
        gradle/
          libs.versions.toml
        apps/
          driver/
          seller/
          owner/
        shared/
          core-common/
          core-model/
          core-network/
          core-auth/
          core-database/
          core-maps/
          core-location/
          core-design-system/
          core-notifications/
      backend/
        src/
          app.ts
          server.ts
          config/
          common/
            errors/
            middleware/
            validation/
            authorization/
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
            socket-server/
            rooms/
            events/
          database/
            migrations/
            seeds/
            repositories/
        tests/
        package.json
        tsconfig.json
      contracts/
        openapi.yaml
        events.md
      docs/
        ARCHITECTURE.md
        IMPLEMENTATION_ROADMAP.md
        DATABASE_SCHEMA.md
        API_CONTRACTS.md
        GPS_AND_PRIVACY.md
        ROUTE_LIFECYCLE.md
        OPERATIONS.md
      infra/
        docker-compose.yml
        deployment/
      .github/
        workflows/
          backend-ci.yml
          android-driver.yml
          android-seller.yml
          android-owner.yml
          release-apks.yml
      .editorconfig
      .gitignore
      README.md

The exact Gradle module boundaries can be adjusted after a small proof of concept. Do not create dozens of modules before there is code that justifies them. Shared modules must contain genuinely reusable primitives; app-specific screens and business rules remain in their own app modules.

Android application IDs:
- Driver: in.dairylivetrack.driver
- Seller: in.dairylivetrack.seller
- Owner: in.dairylivetrack.owner

## 5. Android application design

Each app follows the same broad layers:

- UI: Compose screens, navigation and UI state.
- Presentation: ViewModels and screen events.
- Domain: use cases and role-specific business rules.
- Data: repositories, remote data sources and Room data sources.
- Platform adapters: location, sensors, maps, notifications and secure storage.

Do not let a Composable call Retrofit, Room, GPS providers or Socket.IO directly. A ViewModel observes repository Flows and exposes one screen state. UI events call ViewModel methods.

### 5.1 Driver app

Main areas:
- Login and assigned driver/vehicle summary.
- Saved route dashboard.
- Route builder and seller-code search.
- Stop insertion, reorder and removal.
- Route optimization preview and approval.
- Segment shaping editor for road via-points.
- Start trip / resume active trip / end trip.
- Pickup completed / skipped with reason.
- Offline/sync state, GPS permission state and last upload time.
- Profile and explicit route settings.

Saved-route rule:
- After login, fetch the driver's current published route version.
- If the server is reachable, reconcile it with Room. If offline, immediately show the most recent cached published route and show its sync/stale status.
- Do not create a new route just because the app restarted or a new day began.
- A route changes only after an explicit route-edit workflow produces and publishes a new version.
- The active trip retains its route-version ID even if a newer version is published.

### 5.2 Seller app

Main areas:
- Activate/login using seller code plus a secure owner-issued PIN or another verified credential. Seller code alone is never sufficient authentication.
- Show only the seller's own profile/pickup context and assigned vehicle.
- Show the seller's fixed home pin from the server.
- Show the assigned vehicle's live position, last update time and stale/offline indicator.
- Show road distance and ETA to the seller's pickup.
- Show only the count/numbered progress of pickups before the seller's stop. Do not reveal other sellers' names, phone numbers or exact addresses.
- Compass/heading-up map: use Android's rotation-vector/orientation sensor to update camera bearing. Smooth noisy sensor readings, show sensor accuracy, and offer a north-up fallback. The user's phone heading controls map orientation; the vehicle marker remains positioned relative to that heading.
- Explain when GPS is stale or location permission/network is unavailable.

### 5.3 Owner app

Main areas:
- Owner login and dairy profile.
- Fleet list with vehicle, assigned driver, active/idle/offline/stale state.
- Vehicle detail map showing the full published route and trip progress.
- Numbered seller stops with completed, current, pending and skipped states.
- Driver, seller, vehicle and assignment management.
- Route publication and route-version history.
- Trip history, pickup exceptions and operational reports.
- Audit history for important master-data and route edits.

## 6. Backend design — modular monolith

Run a single deployable API process initially. Modules have separate routes/controllers, schemas, services, repositories and tests, but share one database connection pool and deployment unit.

Module responsibilities:
- auth: login, credential activation, access/refresh tokens, session revocation.
- dairies: tenant profile, depot and configuration.
- users: identity and role mapping.
- sellers: seller code, registered home point and status.
- drivers: driver profile and account status.
- vehicles: vehicle master and active driver association.
- assignments: seller-to-vehicle and driver-to-vehicle assignments with history.
- routes: route drafts, versions, stops, segment shapes and publication.
- route-optimization: Google Maps adapter, limits, optimization jobs and result validation.
- trips: trip lifecycle, route snapshot and stop events.
- tracking: GPS ingestion, current location and location history.
- notifications: FCM token registration and notification dispatch.
- audit: security-sensitive changes and actor/action records.

Use controller → service → repository separation. Controllers should not contain SQL or business rules. External Google/Firebase integrations must be behind adapter interfaces so they can be mocked in tests.

## 7. Multi-dairy tenancy and authorization

Every business-owned row carries dairy_id directly or is reachable through a parent row that carries dairy_id. Validate tenant ownership on every operation.

Role capabilities:
- Owner: only their own dairy's sellers, drivers, vehicles, assignments, routes, trips and fleet.
- Driver: own driver profile, assigned vehicle, routes assigned to that vehicle, route-edit permissions granted by the dairy, and active trip operations.
- Seller: their own profile, assigned vehicle's permitted live state, and their own pickup status/progress.
- No client may pick a dairy_id or role and gain permissions by sending it in the request body.

Authorization must be checked on every REST request and every Socket.IO room join. Use PostgreSQL constraints and, where correctly implemented, Row-Level Security as defense in depth. The application database role must not be a superuser or have BYPASSRLS. Set tenant context transaction-locally and test that pooled connections cannot leak one tenant's context to another request.

Use deny-by-default authorization. Check both role and ownership of the specific record; role checks alone are insufficient. Use UUID identifiers for externally addressed resources.

## 8. Authentication model

No public self-registration in the initial dairy pilot.

- Owner account: provisioned securely during setup; strong password or verified phone login.
- Driver account: created/activated by owner; driver gets an individual credential.
- Seller account: activated by owner using seller code and an owner-issued one-time activation secret/PIN. Store only a salted password hash; never store a reusable plaintext PIN.
- Access token: short-lived.
- Refresh token: rotate on use, store hashed server-side, revoke on logout/device removal.
- Rate limit login, seller activation, PIN reset and refresh endpoints.
- Never place long-lived secrets in Android source code or the Git repository.

SMS OTP can be added with an approved provider after the budget and delivery requirements are known. Do not make the MVP depend on a provider without validating its India coverage, pricing and sender/template requirements.

## 9. Database model

Use UUID primary keys, created_at/updated_at timestamps, foreign keys, check constraints and explicit indexes. Store location coordinates as PostGIS geography(Point, 4326) or a consistently chosen geometry type with documented SRID. Use GiST indexes for spatial queries.

Core tables:
- dairies: id, name, owner_user_id, depot_location, timezone, status.
- users: id, dairy_id, role, name, phone/email, credential/status fields.
- sellers: id, dairy_id, user_id nullable until activation, seller_code, home_location, optional road_access_location, status.
- drivers: id, dairy_id, user_id, status.
- vehicles: id, dairy_id, registration_number, display_name, status.
- vehicle_driver_assignments: id, dairy_id, vehicle_id, driver_id, valid_from, valid_to.
- seller_vehicle_assignments: id, dairy_id, seller_id, vehicle_id, valid_from, valid_to.
- routes: id, dairy_id, vehicle_id, name, active_published_version_id.
- route_versions: id, route_id, version_number, status (draft/published/archived), created_by, published_at, route_geometry, total_distance_m, estimated_duration_s.
- route_stops: id, route_version_id, seller_id, sort_order, stop_location_snapshot, expected_service_seconds.
- route_segment_shapes: id, route_version_id, from_stop_id, to_stop_id, ordered_via_points.
- trips: id, dairy_id, vehicle_id, driver_id, route_version_id, status, started_at, ended_at.
- trip_stop_events: id, trip_id, route_stop_id, status (pending/completed/skipped), occurred_at, reason, actor_user_id, idempotency_key.
- vehicle_live_locations: vehicle_id, dairy_id, trip_id, point, bearing, accuracy_m, speed_mps, recorded_at, received_at.
- vehicle_location_history: id, vehicle_id, dairy_id, trip_id, point, bearing, accuracy_m, recorded_at, received_at.
- refresh_sessions: id, user_id, token_hash, device_label, expires_at, revoked_at.
- device_push_tokens: id, user_id, token, platform, updated_at.
- audit_logs: id, dairy_id, actor_user_id, action, entity_type, entity_id, metadata, created_at.

Important integrity rules:
- Unique seller_code within a dairy.
- Unique vehicle registration number within the agreed dairy scope.
- One active driver assignment per vehicle at a time.
- One active vehicle assignment per seller at a time unless the owner explicitly supports temporary reassignment.
- Unique route version number per route.
- Unique sort_order per route version.
- Unique idempotency key per trip operation.
- A trip references exactly one published route version.
- A seller stop must belong to the same dairy as the route.

Route stop coordinates are snapshots at publication time so later seller master-data corrections do not silently move old trips. New route versions can use the corrected location. Keep the seller's master home pin separately editable by authorized owner actions.

Pickup number is not permanent seller identity. The stable route_stop ID identifies a stop in a route version; sort_order is its sequence. Inserting a seller creates a new draft version and renumbers sort_order transactionally.

## 10. Route lifecycle and saved-route behaviour

Route lifecycle:
1. Driver opens assigned vehicle route.
2. If no route exists, create a draft.
3. Add seller codes and verify coordinates.
4. Set dairy depot as both start and end.
5. Optimize the ordered seller stops.
6. Review/approve suggested order.
7. Optionally shape a road segment using via-points.
8. Preview and validate the full route.
9. Publish a new immutable route version.
10. Every ordinary login/app open loads that published version.
11. Driver explicitly chooses Edit Route to make a new draft.
12. Start trip; trip stores the published route_version_id.
13. Record pickup events against the trip's stop IDs.
14. End trip; stop GPS sharing.

Do not mutate a published route version. Draft edits create a new version. A trip always follows its pinned snapshot. If an emergency in-trip reroute is later added, it must be a deliberate action with an audit record and a new trip route revision; it must not happen silently.

The seller's exact home point and vehicle road access point may differ. Keep the precise home pin as master data; optionally use a separate road-access point for safe route calculation when a house is away from a motorable road.

## 11. Routing and ETA strategy

### First release
- Backend calls Google Routes API, not individual Android apps.
- For a modest route, use Compute Routes with driving mode, stopovers and waypoint order optimization.
- Save returned order, route geometry/polyline, leg distances and durations with the draft route version.
- Return the estimated route for driver approval before publishing.
- Keep depot fixed as origin and destination.

### Important Google Routes API constraints
- Compute Routes supports up to 25 intermediate waypoints per request.
- Waypoint-order optimization requires all intermediate waypoints to be stopovers (not via points) and has routing-preference restrictions; do not combine optimization and manual via-point shaping in the same request.
- Requests with 11–25 intermediate waypoints can have higher billing.
- For lists beyond the supported simple Compute Routes limit, or for multiple vehicles, time windows and more complex fleet constraints, evaluate Route Optimization API. Do not silently split a large optimization into arbitrary chunks and call it globally optimal.
- Manual road-shaping via points are route geometry constraints, not pickup stops. They never receive pickup numbers, dwell time or pickup status.
- After optimization, calculate/shape selected segments separately with via points, then preview the complete route.
- Cache route results by route-version inputs and avoid recomputing on every map refresh.

ETA:
- Use road-route leg duration, current trip position and remaining stop sequence.
- ETA to a seller = current leg to next stop + durations/service times for all preceding pending stops + road duration to the seller.
- Remaining-stop count is derived from the trip's pinned route version and pickup events, not guessed from nearby GPS.
- Traffic-aware ETA can be refreshed periodically and on meaningful events, with a quota/cost guard. Do not call Routes API for every GPS ping.

## 12. Driver GPS and offline behaviour

Location sharing is active-trip-only:
- Driver taps Start Trip while the app is visible.
- App checks location services and fine/coarse permissions.
- Start a location foreground service with the required location service type and a persistent notification.
- Send samples while trip is active; stop the service when the trip ends or is cancelled.
- Do not request always-on background location unless a later, specifically justified feature truly needs it. Android has additional permission and start restrictions, especially on Android 14+.
- If permission is denied, explain the impact and do not pretend tracking is active.

GPS reliability:
- Include recorded_at (device sample time), received_at (server time), accuracy, bearing and speed where available.
- Reject invalid coordinates, implausible jumps and out-of-order samples; keep validation thresholds configurable and log rejected samples without treating them as trusted truth.
- Use adaptive sampling (for example, more frequent while moving and less frequent while stopped). Intervals are best-effort, not guaranteed OS timers.
- Room keeps a durable offline queue. Retry with exponential backoff and jitter.
- Each upload batch has stable IDs/idempotency keys. The backend safely deduplicates retries.
- On reconnect, upload older samples in order and latest sample promptly. Do not let a late queued sample replace a newer current location.
- Show GPS accuracy and last update time; mark locations stale after a configurable age.
- Store the latest location separately from append-only history. Partition/retention policy for location history should be introduced before the table grows significantly.

WorkManager is for deferred/retryable sync work, not a substitute for the active-trip location foreground service.

## 13. Realtime events and Socket.IO

REST remains the source of truth for login, route data, trip lifecycle and pickup writes. Socket.IO distributes updates.

Example event names:
- vehicle.location.updated
- trip.started
- trip.progress.updated
- trip.completed
- route.version.published
- notification.created

Server-controlled rooms:
- dairy:{dairyId}:owners — owner membership only after tenant check.
- vehicle:{vehicleId}:owners — authorized owner subscriptions.
- vehicle:{vehicleId}:driver — the assigned driver's own vehicle.
- seller:{sellerId} — the seller's own subscription, if needed.

Clients cannot choose arbitrary rooms. The server derives room membership from the authenticated principal and database assignments. Recheck permissions on reconnect and assignment changes. Do not emit seller names/addresses into seller tracking events.

Socket authentication uses the same access-token validation as REST. Validate input events, throttle noisy clients and do not accept location writes from the seller or owner app. Driver GPS writes must be authorized against the driver, assigned vehicle and active trip. If the service later runs multiple instances, add a shared Socket.IO adapter such as Redis; it is not a mandatory MVP dependency.

## 14. API surface (initial contract)

Base path: /api/v1

Auth:
- POST /auth/login
- POST /auth/refresh
- POST /auth/logout
- POST /auth/seller/activate

Owner/master data:
- GET/POST/PATCH /dairy
- GET/POST/PATCH /sellers
- GET/POST/PATCH /drivers
- GET/POST/PATCH /vehicles
- POST /assignments/sellers
- POST /assignments/drivers

Routes:
- GET /vehicles/:vehicleId/route
- POST /vehicles/:vehicleId/routes/drafts
- POST /routes/:routeId/versions
- POST /route-versions/:versionId/stops
- PATCH /route-versions/:versionId/stops/reorder
- DELETE /route-versions/:versionId/stops/:stopId
- POST /route-versions/:versionId/optimize
- PUT /route-versions/:versionId/segments/:segmentId/shapes
- POST /route-versions/:versionId/preview
- POST /route-versions/:versionId/publish

Trips/tracking:
- POST /vehicles/:vehicleId/trips
- GET /trips/:tripId
- POST /trips/:tripId/start
- POST /trips/:tripId/stops/:stopId/complete
- POST /trips/:tripId/stops/:stopId/skip
- POST /trips/:tripId/location-batches
- POST /trips/:tripId/end
- GET /seller/me/tracking
- GET /owner/fleet
- GET /owner/vehicles/:vehicleId/live

All endpoints require validated inputs, authenticated identity, role authorization, tenant ownership checks, rate limiting where appropriate, and structured error responses. Use pagination for lists. Use idempotency keys for trip start/end, pickup events and GPS batch writes.

## 15. Maps and credential protection

- Android Maps SDK keys must be restricted to Android package names and signing certificate fingerprints, and only to the APIs needed by each app.
- Backend Routes API credentials must be server-only, held in deployment secrets/secret manager, and restricted to the backend's intended API usage.
- Never place a server API key in the Android app or commit any real key.
- Configure quota alerts and budgets. Monitor requests by feature and avoid route recalculation per GPS update.
- Display required map/provider attribution and follow Google Maps Platform terms for storage, caching and display of returned content.

## 16. Privacy, audit and operational safeguards

- Driver GPS is collected only during an active trip, with a visible foreground notification.
- Seller tracking exposes only the assigned vehicle and the seller's own pickup data.
- Do not show seller identity or exact locations to other sellers.
- Restrict owner access to their dairy.
- Use HTTPS everywhere; encrypt backups and secrets; hash credentials and refresh tokens.
- Audit route publication, route replacement, seller coordinate correction, assignment changes, pickup overrides and account/security actions.
- Define a location-history retention policy with the dairy before production. Retain only as long as needed for operational and legal purposes.
- Provide an owner-visible GPS stale/offline state; never label an old coordinate as live.
- Avoid logging passwords, activation PINs, tokens, precise seller coordinates or full location payloads.

## 17. Testing strategy

Backend:
- Unit tests for route versioning, stop ordering, ETA remaining-stop logic and authorization.
- Integration tests against a real disposable PostgreSQL/PostGIS database.
- Tests for tenant isolation, role boundaries, object-level access, route publishing, trip snapshots and GPS idempotency.
- Contract tests against OpenAPI.
- Google Maps and FCM adapters mocked in ordinary CI; optional controlled integration checks separately.

Android:
- ViewModel/repository tests for route restore, offline cache, sync and trip states.
- Compose UI tests for role-specific navigation and error states.
- Instrumented tests for Room migrations, sensor heading and location-service lifecycle.
- Test permission denial, approximate location, GPS disabled, loss of network, process death, battery saver and notification denial.
- Test on supported Android versions and at least one low-memory device.

End-to-end:
- Owner creates a dairy and master data.
- Driver creates and publishes a route.
- Close/reopen driver app and verify same route loads.
- Start trip; verify location updates reach backend and owner/seller.
- Seller sees only their assigned vehicle and own pickup details.
- Complete/skip stops and verify remaining count/ETA.
- End trip and verify GPS sharing stops.
- Publish a newer route during a trip and verify the current trip remains pinned to its original version.

## 18. Deployment and releases

- Backend: deploy one HTTPS API service and managed PostgreSQL/PostGIS. Keep dev, staging and production isolated.
- Add health and readiness endpoints, structured logs, error monitoring, database backups and restore drills.
- Configure CORS narrowly; mobile apps do not need permissive browser CORS.
- GitHub Actions: backend lint/typecheck/test/migration validation; separate Android build/test jobs for driver, seller and owner.
- Store Android signing credentials only in GitHub environment secrets or a secure release system.
- Create a GitHub Release with three signed APKs and checksums. Direct APK installation is possible, but users must allow installation from the source; Play Store distribution is not required for the first pilot.
- A backend public HTTPS endpoint is required for remote tracking. A custom domain is optional initially if the hosting provider supplies a stable HTTPS URL.

## 19. Build order

Follow docs/IMPLEMENTATION_ROADMAP.md. Do not start by drawing all screens. First freeze requirements, contracts and data model; then build authentication/tenancy, route versioning, trip lifecycle and reliable GPS. The seller and owner maps should be built once those core data flows are real.

## 20. Research references

Official documentation reviewed for this baseline:

- Android architecture recommendations: https://developer.android.com/topic/architecture/recommendations
- Android offline-first architecture: https://developer.android.com/topic/architecture/data-layer/offline-first
- Android location permissions: https://developer.android.com/develop/sensors-and-location/location/permissions
- Android background location: https://developer.android.com/develop/sensors-and-location/location/permissions/background
- Android foreground-service types: https://developer.android.com/develop/background-work/services/fgs/service-types
- Android foreground-service background-start restrictions: https://developer.android.com/develop/background-work/services/fgs/restrictions-bg-start
- Google Routes API waypoint optimization: https://developers.google.com/maps/documentation/routes/opt-way
- Google Routes API usage and limits: https://developers.google.com/maps/documentation/routes/usage-and-billing
- Google Route Optimization API: https://developers.google.com/maps/documentation/route-optimization/overview
- Google Route Matrix: https://developers.google.com/maps/documentation/routes/compute_route_matrix
- PostGIS ST_DWithin: https://postgis.net/docs/ST_DWithin.html
- PostGIS spatial indexes: https://postgis.net/documentation/faq/spatial-indexes/
- Socket.IO rooms: https://socket.io/docs/v4/rooms/
- Socket.IO middleware/authentication: https://socket.io/docs/v4/middlewares/
- Firebase Cloud Messaging Android setup: https://firebase.google.com/docs/cloud-messaging/android/get-started
- PostgreSQL Row Security Policies: https://www.postgresql.org/docs/current/ddl-rowsecurity.html
- OWASP Authorization Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html

These are design references, not a claim that the implementation has already been built or validated. Re-check API versions, pricing, platform requirements and applicable policies when each implementation step begins.
