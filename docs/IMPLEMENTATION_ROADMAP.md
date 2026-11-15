# Milk — 20-Step Implementation Roadmap

**Goal:** Build three independent Android apps (Driver, Seller, Owner) backed by one secure API and one PostgreSQL/PostGIS database.  
**Delivery approach:** One vertical milestone at a time. Each step ends with working code and an acceptance check.  
**Important:** Steps are ordered by dependency, not by how visually impressive the feature is.

## Step 1 — Repository foundation and engineering rules

**Build**
- Keep this single GitHub repository as the monorepo.
- Add README, architecture, roadmap and environment-template documentation.
- Add .gitignore, .editorconfig and contribution/branch conventions.
- Decide package IDs, API base path, naming rules, timestamp/timezone policy and UUID policy.
- Create a lightweight ADR log for decisions that change later.

**Files**
- Root README.md, .gitignore, .editorconfig.
- docs/ARCHITECTURE.md, docs/IMPLEMENTATION_ROADMAP.md.
- docs/adr/ for future architecture decision records.

**Acceptance**
- New contributor can understand the product and intended folder boundaries.
- No API keys, signing files, production data or credentials are committed.

## Step 2 — Bootstrap Android monorepo and three installable app shells

**Build**
- Create a Kotlin Gradle project with a version catalog and shared build conventions.
- Create driver, seller and owner Android application modules.
- Set distinct application IDs: in.dairylivetrack.driver, in.dairylivetrack.seller and in.dairylivetrack.owner.
- Add shared core modules only for common models, network, auth, design system, database, maps, location and notifications.
- Add Compose Material 3, navigation, dependency injection, coroutines and Flow using compatible stable versions.
- Each app gets a minimal launch screen, role-specific theme/navigation shell and app metadata.

**Files**
- android/settings.gradle.kts, root build files, gradle/libs.versions.toml.
- android/apps/driver, android/apps/seller, android/apps/owner.
- android/shared/core-common, core-model, core-network, core-auth, core-database, core-design-system.

**Acceptance**
- All three APK debug variants build independently.
- Installing one app does not overwrite another.
- Shared modules compile without circular dependencies.

## Step 3 — Backend bootstrap and database/migration foundation

**Build**
- Create Node.js + TypeScript + Express backend with lint, typecheck, test and development scripts.
- Add config validation, structured logging, centralized error handling and request IDs.
- Connect PostgreSQL through a pooled pg client.
- Enable PostGIS in the database.
- Add forward-only SQL migrations and test-database setup.
- Add /health and /health/ready endpoints.
- Add Docker Compose for local PostgreSQL/PostGIS and backend development.

**Files**
- backend/package.json, tsconfig.json, src/app.ts, src/server.ts.
- backend/src/config, common, database/migrations.
- infra/docker-compose.yml, backend/tests.

**Acceptance**
- Backend starts locally and connects to the database.
- Migrations can create a fresh database from zero.
- Health/readiness correctly distinguish process health from database readiness.

## Step 4 — Identity, login, roles and dairy-level security

**Build**
- Define owner, driver and seller identities and role permissions.
- Implement login, short-lived access token, rotating refresh token, logout and session revocation.
- Create owner-provisioned driver and seller activation flows.
- Seller code plus a secure activation PIN/secret; seller code by itself is never accepted as a password.
- Hash passwords/PINs and refresh tokens; add rate limits and account lockout/backoff.
- Add dairy_id tenancy to business data and a centralized authorization guard.
- Enforce resource ownership on every endpoint; introduce PostgreSQL RLS only with correctly scoped transaction-local tenant context and non-bypass application DB roles.

**Files**
- backend/src/modules/auth, users, dairies.
- backend/src/common/authorization and middleware.
- SQL migrations for users, dairy, refresh_sessions and tenant constraints.
- android/shared/core-auth.

**Acceptance**
- Owner A cannot read Owner B's dairy.
- Driver cannot access a different vehicle or another driver's route.
- Seller cannot access another seller or arbitrary vehicle by changing an ID.
- Reused/expired/revoked refresh tokens fail.
- Login/activation brute-force attempts are throttled.

## Step 5 — Owner master data: dairy, depot, sellers, drivers and vehicles

**Build**
- Create dairy profile and fixed depot coordinates.
- Add seller CRUD with permanent unique seller code and registered home point.
- Add optional road-access point separately from the precise home pin.
- Add driver and vehicle master data.
- Add time-bounded seller-to-vehicle and driver-to-vehicle assignments.
- Keep assignment history and validate no conflicting active assignment.
- Add owner screens to create/search/edit/deactivate these records.

**Files**
- Backend modules: dairies, sellers, drivers, vehicles, assignments.
- Database migrations and repositories for master data.
- Owner app features: dairy setup, seller list/form, drivers, vehicles, assignments.

**Acceptance**
- Owner can create the full master data set.
- Seller codes are unique within a dairy.
- Invalid/cross-dairy assignments are rejected.
- Seller home coordinates come from owner-managed data, not seller phone GPS.

## Step 6 — Route domain, route versions and immutable trip snapshots

**Build**
- Implement routes, route_versions, route_stops and route_segment_shapes.
- Support draft, published and archived route versions.
- Give every stop a stable UUID; derive pickup number from sort_order.
- Add transaction-safe stop insert/delete/reorder operations.
- Snapshot seller coordinates into the route version at publication.
- Lock published versions from direct mutation.
- Ensure a trip will always reference exactly one published route version.

**Files**
- backend/src/modules/routes.
- SQL migrations for routes, route_versions, route_stops, route_segment_shapes.
- docs/ROUTE_LIFECYCLE.md and database schema documentation.

**Acceptance**
- Inserting a stop between pickup 3 and 4 renumbers following stops transactionally.
- Seller identity does not change when pickup order changes.
- Published route versions cannot be edited in place.
- A test can prove that a route edit does not alter an older version.

## Step 7 — Driver route builder: create and edit a daily route

**Build**
- Driver fetches assigned vehicle and its existing published route.
- First-time driver can create a draft from dairy depot through seller codes and back to depot.
- Add sellers by code and verify the selected seller/coordinate before insertion.
- Insert at beginning, between any two stops or before return to depot.
- Reorder/remove stops with clear confirmation.
- Keep depot fixed as origin and destination.
- Add validation for duplicate seller, inactive seller, wrong-vehicle assignment and missing coordinates.
- Create route edit mode only behind an explicit “Edit Route” action.

**Files**
- Backend route draft and stop APIs.
- Driver app: route dashboard, seller lookup, route builder, stop editor.
- Shared route models and API client.

**Acceptance**
- Driver can create and save a draft route.
- App restart does not create a new route.
- Driver can add a seller at a selected sequence position and see correct new numbering.
- Invalid sellers cannot be published.

## Step 8 — Route calculation and optimization

**Build**
- Add server-side Google Maps Routes API adapter.
- Calculate driving geometry, distance and per-leg duration.
- For supported small routes, request waypoint-order optimization and capture the returned optimized order.
- Keep the dairy depot as fixed origin/destination.
- Present before/after sequence and distance/time comparison to the driver.
- Save the proposed order in the draft; require driver approval before publish.
- Add route calculation cache and usage/quota logging.
- Define escalation to Route Optimization API for more than 25 intermediate waypoints or multi-vehicle/time-window constraints.

**Files**
- backend/src/integrations/google-maps.
- backend/src/modules/route-optimization.
- Driver app: optimization preview and approval UI.
- Server environment template with placeholder key names only.

**Acceptance**
- Optimized sequence matches returned API indices and still contains each required seller once.
- Depot remains first and last.
- More-than-limit input gets a clear escalation/error path, not a misleading partial optimization.
- API failure leaves the draft intact and editable.

## Step 9 — Manual segment shaping and route preview

**Build**
- Allow driver to select a segment between two consecutive pickup stops.
- Add/move/remove road-shaping via-points on that segment.
- Treat via-points as geometry constraints only; they never become sellers or pickup stops.
- Recalculate the selected segment separately from stop-order optimization.
- Preview old/new segment and full route distance/duration before saving.
- Save changes into a new draft version and audit the actor.
- Publish a new immutable version after validation.

**Files**
- Backend route segment shape APIs and validation.
- Driver app: segment selector, map shaping tool, preview and publish flow.
- Docs on route optimization limitations.

**Acceptance**
- Via-points do not alter pickup count/order or receive dwell time.
- A route with manual shapes can be previewed and published.
- Existing published versions remain unchanged.

## Step 10 — Saved route restoration and offline route cache

**Build**
- On driver login/app open, fetch route assignment and current published version.
- Immediately render last cached route from Room while network reconciliation happens.
- Show a visible offline/stale state if server cannot be reached.
- Do not prompt for route creation when a saved route exists.
- Add explicit Edit Route action; only a new published route version replaces the default route for future trips.
- Keep the current trip pinned to its route version even after a newer route is published.
- Cache route metadata, stops, geometry and version identity.

**Files**
- Android shared/core-database Room entities/DAOs/migrations.
- Driver app: saved-route dashboard and offline state.
- Backend route read/version endpoints.

**Acceptance**
- Kill/reopen app and login again: same published route appears.
- Airplane mode: cached route map/stop list still loads.
- Publish a new route: it becomes the next default but does not alter an active trip.

## Step 11 — Trip lifecycle and pickup operations

**Build**
- Implement trip states: planned, active, completed, cancelled.
- Validate one active trip per vehicle and assigned driver.
- Start trip using a published route version snapshot.
- Track each stop as pending, completed or skipped with reason and timestamp.
- Use stable idempotency keys for start/end and pickup operations.
- Support resume after app process death.
- End trip at dairy depot or via authorized owner exception; stop sharing after end.
- Add owner-side trip timeline and audit events.

**Files**
- backend/src/modules/trips.
- Driver app: trip start/resume/end and stop status.
- SQL migrations for trips and trip_stop_events.

**Acceptance**
- Repeated taps/retries do not create duplicate trips or pickup events.
- A trip cannot switch route version silently.
- Completed/skipped status survives app restart and offline retry.

## Step 12 — Reliable driver GPS foreground service and offline queue

**Build**
- Request location permission with clear user explanation.
- Start the location foreground service only after driver taps Start Trip while app is visible.
- Declare required location service type/permissions for target Android versions.
- Show ongoing notification during active trip.
- Collect coordinates, time, accuracy, bearing and speed where available.
- Adaptive best-effort sample rate while moving/stopped.
- Persist unsent samples in Room with stable IDs.
- Retry upload with backoff; prevent out-of-order samples overwriting latest location.
- Stop foreground service when trip ends/cancels; handle permission revoked and GPS disabled.

**Files**
- Android shared/core-location.
- Driver app service, notification channel, permission education and GPS diagnostics.
- Backend location batch endpoint and validation.

**Acceptance**
- Location is shared while active trip is running, including screen-off use supported by foreground service.
- Notification is visible and service stops after trip end.
- Network loss queues data and later synchronizes it.
- No false “live” status when GPS is stale or permission is missing.

## Step 13 — Live tracking backend and authorized realtime delivery

**Build**
- Store latest vehicle location separately from append-only history.
- Validate GPS batches against assigned driver, assigned vehicle and active trip.
- Add recorded_at/received_at, accuracy and basic jump/out-of-order checks.
- Implement authenticated WebSocket upgrade using the current access token.
- Server derives and authorizes subscription membership; clients never choose arbitrary tenant or vehicle channels.
- Broadcast vehicle.location.updated and trip.progress.updated.
- Add stale-location calculation and reconnect resync from REST.
- Keep Redis adapter optional until multiple backend instances are deployed.

**Files**
- backend/src/modules/tracking.
- backend/src/realtime/websocket-server, subscriptions, events.
- contracts/events.md and WebSocket protocol, authentication, reconnect and resync integration tests.

**Acceptance**
- Owner, assigned driver and assigned seller receive only permitted events.
- A seller cannot subscribe to another seller's vehicle.
- REST snapshot after reconnect reconciles missed socket events.
- Old queued GPS cannot replace a newer location.

## Step 14 — Seller live tracking and compass map

**Build**
- Implement seller activation/login and own profile context.
- Fetch the seller's own assigned vehicle, home point and active trip progress.
- Render map, vehicle location, seller home pin, heading-up map and last-updated state.
- Use rotation-vector sensor/orientation to rotate map with the phone; smooth heading changes and offer north-up fallback.
- Show road distance and ETA once the route data is available.
- Display only pickup numbers/count before this seller's stop, not other seller names/addresses.
- Cache own home pin and last known route context without pretending old vehicle coordinates are live.

**Files**
- Seller app auth, dashboard, live-tracking, compass map.
- Android shared/core-maps and sensor helper.
- Backend GET /seller/me/tracking and authorized vehicle event subscription.

**Acceptance**
- Seller can use the app away from home; home pin remains the registered master-data coordinate.
- Phone rotation rotates the map as requested.
- Seller cannot infer other sellers' private details from API payloads or sockets.
- Stale location is clearly indicated.

## Step 15 — Correct remaining-stop count, ETA and notifications

**Build**
- Calculate pickup count from the trip's route version and trip_stop_events.
- Estimate seller arrival using current vehicle position, next pending stop, road legs and service durations of earlier pending stops.
- Refresh ETA on meaningful progress and at a controlled interval, not on every raw GPS ping.
- Recalculate road legs when location/progress changes materially or traffic refresh is due.
- Use FCM for trip started, vehicle nearing pickup (optional), delay and trip completed notifications.
- Request Android 13+ notification permission with clear context.
- Add push-token lifecycle and invalid-token cleanup.

**Files**
- Backend ETA service and notification module.
- Seller app ETA/count/notifications UI.
- Firebase integration and Android notification setup.

**Acceptance**
- Remaining count changes only when valid stop events change.
- ETA is labelled estimated and shows last calculation/update time.
- FCM failure does not break live tracking; REST/socket state remains authoritative.

## Step 16 — Owner fleet dashboard and vehicle detail map

**Build**
- Fleet list with vehicle, driver, trip state, last GPS update and stale/offline indicator.
- Select vehicle to open full route map, depot, numbered seller stops and vehicle position.
- Show completed/current/pending/skipped pickup states.
- Show progress, next stops, route distance and estimated remaining time.
- Add vehicle filters and refresh/reconnect behaviour.
- Ensure owner sees only their dairy fleet.
- Add route and assignment detail screens.

**Files**
- Owner app dashboard, fleet management, vehicle tracking, route monitoring.
- Backend /owner/fleet and /owner/vehicles/:id/live endpoints.
- Shared map marker and route presentation components.

**Acceptance**
- Owner can switch among vehicles and sees the correct active route/trip.
- Map progress matches trip stop events.
- Cross-dairy vehicle IDs return access denied/not found according to API policy.

## Step 17 — History, reports, audit and owner operations

**Build**
- Trip history with date/vehicle/driver filters.
- Pickup completion/skipped reports and missed-stop reasons.
- Route version history and who published each version.
- Assignment history and seller coordinate correction audit.
- Export basic CSV first; avoid heavy analytics until operational data exists.
- Define GPS history retention and archival/partition strategy.
- Add owner controls to correct master seller locations and publish future route versions.

**Files**
- Backend audit module, history endpoints and aggregate queries.
- Owner app trip history, route version history and basic reports.
- docs/OPERATIONS.md.

**Acceptance**
- Owner can investigate a past trip and identify its exact route version.
- Critical changes show actor and timestamp.
- New seller coordinate does not rewrite historical route snapshots.

## Step 18 — Security, reliability, device and end-to-end testing

**Build**
- Backend unit/integration/authorization tests and OpenAPI contract checks.
- Android ViewModel/repository/Room/UI tests.
- Location/foreground-service lifecycle and permission tests.
- Sensor compass and map rotation tests on physical devices.
- End-to-end owner → driver route → trip GPS → seller live map → owner fleet flow.
- Test network loss, delayed/out-of-order GPS, duplicate requests, app process death, low battery, approximate location, denied notification permission and expired login.
- Add rate limits, payload limits, audit review, dependency scanning and secret scanning.
- Load-test socket fan-out and location ingestion with realistic sample sizes.

**Files**
- backend/tests, android test source sets, .github/workflows checks.
- Security test cases and release checklist under docs.

**Acceptance**
- No cross-role/cross-dairy data leak in tests.
- Retry operations are idempotent.
- App recovers from process death/network interruption without corrupting trip state.
- Critical flows have automated tests before pilot.

## Step 19 — CI/CD, backend deployment and APK distribution

**Build**
- GitHub Actions backend workflow: install from lockfile, lint, typecheck, test, migration validation.
- Separate Android workflows for Driver, Seller and Owner.
- Build signed release APKs using protected secrets; never store keystore/password in repository.
- Deploy backend to an HTTPS host and PostgreSQL/PostGIS to managed service or securely operated database.
- Add health/readiness checks, structured logs, monitoring, alerts and automated backups.
- Configure Google Maps key restrictions, quota alerts and environment-specific keys.
- Publish three APK assets in a GitHub Release with checksums and installation notes.
- Test database restore and app upgrade/Room migration before rollout.

**Files**
- .github/workflows/backend-ci.yml.
- .github/workflows/android-driver.yml.
- .github/workflows/android-seller.yml.
- .github/workflows/android-owner.yml.
- .github/workflows/release-apks.yml.
- infra/deployment and docs/OPERATIONS.md.

**Acceptance**
- A clean commit produces passing CI and the three expected APKs.
- Production secrets exist only in secure deployment settings.
- Android release installs/upgrades successfully.
- Backend is reachable over HTTPS and backups are restorable.

## Step 20 — Real dairy pilot, measured tuning and launch

**Build**
- Pilot with one dairy, one depot, a small number of vehicles/drivers/sellers and real routes.
- Verify every seller pin and road-access point physically before route publication.
- Run supervised collection trips and compare ETA/route distance against actual operation.
- Observe GPS staleness, battery drain, mobile data, missed uploads and socket reconnects.
- Tune location sampling, ETA refresh frequency, map loading and history retention based on measurements.
- Train owner and drivers; provide seller installation/help instructions.
- Record pilot issues and resolve critical safety/privacy/data issues before wider rollout.
- Expand to more vehicles only after stability and cost per trip are understood.

**Acceptance**
- Driver's saved route persists across app restarts and days.
- Route changes only after deliberate edit/publication.
- Active trips remain pinned to their route version.
- Seller sees only their assigned vehicle and own pickup context.
- Owner sees the full authorized fleet and correct progress.
- GPS stops after trip end and stale/offline states are honest.
- Pilot users can install updates and support can diagnose problems.

---

## Cross-step release gates

A step is not complete merely because a screen exists. It must include:
1. Backend/API behaviour where the feature needs server truth.
2. Database migration and constraints where data is persisted.
3. Authorization and tenant checks.
4. Error, loading, empty and offline states.
5. Automated tests for the critical path.
6. Short documentation update and a passing CI run.

## What not to build too early

- Do not split the backend into microservices.
- Do not create separate databases/backends for each Android app.
- Do not use Firebase Realtime Database as a second source of truth for trip/location state.
- Do not use MongoDB alongside PostgreSQL for the same core entities.
- Do not request always-on background location just to avoid implementing a proper trip foreground service.
- Do not recompute route optimization on every GPS sample.
- Do not make seller app show every seller's name/address.
- Do not let a published route mutate under an active trip.
- Do not build milk accounting, billing or inventory until the tracking flow is stable.

## Suggested milestone sequence

- Foundation: Steps 1–5.
- Route authoring: Steps 6–10.
- Real trip and GPS: Steps 11–13.
- Seller and owner product experience: Steps 14–17.
- Production readiness: Steps 18–20.
