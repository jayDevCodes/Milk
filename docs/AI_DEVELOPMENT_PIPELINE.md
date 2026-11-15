# Milk — AI-Assisted 20-Step Research → Build Pipeline

**Purpose:** Make development repeatable. The project owner should not need to repeat the same instructions before every milestone.  
**Repository:** jayDevCodes/Milk  
**Master scope:** docs/IMPLEMENTATION_ROADMAP.md  
**Research rule:** Every roadmap step passes a dedicated Research gate before any implementation begins.  
**Build rule:** Implementation starts only after the owner says "Build" for the researched step.

## 1. The default interaction contract

The owner may use only these short commands:

- **Next step** — inspect the real repository and research the first incomplete roadmap step. Do not implement app/backend code. Deliver findings and a ready-to-run build brief for the next turn.
- **Build** — implement the exact step that was most recently researched and whose build brief is still current. Do not ask the owner to repeat the brief.
- **Status** — inspect the repository and report completed, partial, blocked and next steps, supported by actual files/commits/tests.
- **Research step N** — research a specific step without implementing it.
- **Build step N** — build a specifically named step only if its research gate is complete; otherwise perform research first.

If the user says "next", "continue" or "aage badho" without specifying a phase, interpret it as **Next step / Research**, never as permission to begin implementation. If the owner says "Build" after the Research response, use the already prepared build brief.

Do not ask the owner to paste the same requirements again. Read these repository documents and the current code first.

## 2. Project context to carry forward

Milk is a dairy fleet product with three separate Android APKs and one shared backend:

- Driver app: persistent saved route; route editing only by explicit action; trip lifecycle; pickup completion/skipped; visible active-trip GPS service.
- Seller app: sees assigned vehicle, own registered home point, road distance/ETA and pickups remaining; compass/heading-up map rotates with phone; must not see other sellers' names or exact addresses.
- Owner app: dairy setup, sellers/drivers/vehicles, routes, full fleet map, stop status, trip history and reports.
- A seller is eligible only when their registered home point is within 15,000 m geodesically of the dairy depot. This business limit is not the offline map's coverage polygon.
- Initial offline map design: MapLibre Native Android + regional OSM vector PMTiles + local style/sprites/glyph assets. Valhalla road graph built from a buffered regional OSM PBF and hosted privately behind the Node API.
- Initial map build coverage target: about 20 km from depot (15 km seller rule + initial 5 km buffer), subject to route connectivity and field validation. Never claim a final package size until generated and measured.
- Android: Kotlin, Jetpack Compose, Room, DataStore, WorkManager, Retrofit/OkHttp and native Android services/sensors.
- Backend: Node.js LTS, TypeScript, Express modular monolith, Zod, Pino, pg, PostgreSQL + PostGIS.
- Realtime: authenticated WSS using Node ws + Android OkHttp WebSocket; REST remains source of truth and provides reconnect/resync snapshots.
- Notifications: Firebase Cloud Messaging.
- Security: dairy-scoped ownership checks; seller code is not a password; secrets never enter source control; driver GPS is active-trip-only.
- User's development machine: MacBook Air M1, 8 GB RAM, 256 GB storage. Avoid unnecessarily heavy local toolchains and benchmark on real Android devices, not only emulator.
- The user values a premium, polished, animated product feel. Every Research phase must explore meaningful modern motion/UI improvements, but animation must never compromise readability, GPS truth, battery, accessibility or low-end-device performance.

The architecture/stack research documents are useful baselines, not eternal truth. Recheck current platform rules and releases when each step begins.

## 3. Phase A — Research gate (mandatory for every step)

Before recommending implementation:

1. **Inspect the live repository**
   - Read README, architecture, roadmap, technology decisions and this pipeline.
   - Inspect the actual branch, folder tree, existing source, package manifests, lockfiles, tests, CI and most recent commits relevant to the step.
   - Identify what is already present, missing, broken or inconsistent. Never assume a file or feature exists based on an old chat.
   - Preserve existing work and IDs/contracts unless a researched migration is needed.

2. **Research current technology**
   - Search official documentation, release notes, support matrices and security advisories for the technologies relevant to this step.
   - Prefer stable releases supported by the chosen toolchain. Explicitly label preview/RC/alpha/beta releases and do not select them for production without a compelling reason.
   - Verify cross-version compatibility as a complete set, not as isolated "latest versions".
   - Compare at least two viable options when a major choice affects maintenance, speed, cost, offline support or the user experience.
   - Check licence, attribution, API pricing, quotas, data retention and vendor lock-in where relevant.
   - Check recent deprecations, EOL status and Android target/permission policy changes.

3. **Research product-specific improvements**
   - Translate the dairy workflow into functional requirements for this exact step.
   - Consider the 15 km service boundary, rural roads, seller privacy, depot-fixed routes, daily route persistence, low/unstable mobile data and driver usability.
   - Separate map rendering, routing, live location, offline persistence and notifications. Do not treat them as the same problem.
   - Identify edge cases and failure states before designing happy paths.

4. **Design the premium interaction**
   - Suggest a distinctive but restrained visual direction consistent across Driver, Seller and Owner.
   - Explore appropriate motion: spring-based transitions, shared-element transitions, animated content/visibility, predictive back, gesture-driven transitions, map camera easing, route progress drawing, marker interpolation, bottom-sheet transitions and responsive feedback.
   - Use the right animation API for the selected stable Compose/MapLibre versions; do not add a library just for decoration.
   - Define motion tokens and state transitions where useful (durations, easing/spring, distance, haptics, loading/empty/success/error states).
   - Include reduced-motion/accessibility behaviour and avoid flashing, excessive parallax, gratuitous loops or animation that obscures operational data.
   - Never fabricate movement: vehicle marker animation must be based on timestamped GPS samples and stop/interpolate honestly when stale.

5. **Check performance and constraints**
   - Consider M1 Mac build memory/disk constraints and the low-end Android phones that drivers/sellers may use.
   - Prefer draw/graphics-layer animation over relayout-heavy animation where appropriate.
   - Define performance measurements: cold start, map load, frame/jank, scrolling, GPS/battery, network payload, memory and APK/map-pack size as relevant.
   - Prefer physical-device measurements for location, sensors, GPU rendering and battery.
   - Consider Baseline Profiles and Macrobenchmark for critical user journeys when the Android apps are mature enough to benchmark.

6. **Produce an implementation-ready design**
   - State the selected technology and why alternatives were not selected.
   - List exact files/modules to create or change.
   - Describe data models, API contracts, permissions, migrations, events and state flows as applicable.
   - Describe security/privacy rules and tenant checks.
   - Define tests and measurable acceptance criteria.
   - Call out unknowns and use explicit placeholders rather than inventing API keys, coordinates, provider IDs, prices or deployment settings.
   - State what can be built now versus what requires real regional OSM data, credentials, devices or a user decision.

7. **Write the Research result**
   - Add/update a step-specific document in docs/research/step-NN-<topic>.md, or update the existing technology/architecture record if that is the cleanest source of truth.
   - Include date checked, official links, stable/preview status, decisions, rejected options, motion design, performance budgets, risks and acceptance criteria.
   - Update ADRs when an architecture decision changes.
   - Do not change application behaviour or implement the feature during Research.

8. **Deliver the next-turn Build brief**
   - End the Research response with one complete, specific Build brief for the exact step.
   - It should list scope, files, code requirements, tests, documentation and acceptance criteria.
   - The user should only need to reply "Build". Do not ask the user to repeat the prompt or choose from a menu.

## 4. Phase B — Build gate (only after "Build")

1. Re-read the latest Research document and inspect the actual current branch/files again.
2. Confirm no newer commit or user change has invalidated the brief.
3. Implement only the researched step. Do not silently pull in later roadmap steps.
4. Keep app-specific functionality inside the correct app; share only genuinely common code.
5. Add backend/API/database work whenever the feature requires server truth. Include versioned migrations and contract updates.
6. Add authorization, tenant ownership, privacy and input validation from the beginning—not as a later patch.
7. Add loading, empty, error, offline, stale and permission-denied states.
8. Add motion/visual polish from the researched motion plan. Keep animations interruptible, accessible, measured and truthful.
9. Add unit/integration/UI/instrumented tests for the critical paths.
10. Run the available formatter, lint, typecheck, migration, tests and build commands where the environment allows. Never claim a command passed if it was not executed.
11. Update the roadmap step status, docs, README and ADRs when needed.
12. Commit to GitHub with a descriptive, scoped commit message. Do not overwrite unrelated concurrent edits. Use current file SHAs for updates.
13. Report exact changed files, commit SHA/link, actual test/build outcomes, remaining setup, secrets/credentials needed and known limitations.
14. Mark the step complete only when its acceptance criteria are verified. Otherwise label it partial/blocked and list the evidence needed to finish.

If repository tools cannot execute local Gradle/npm/Docker/device tests, state that clearly. Do not imply a remote file commit means the app was built or tested.

## 5. Motion and premium-quality standards for every step

A premium feel comes from coherence, responsiveness and clear feedback—not from animating every component.

### Motion language
- Prefer natural spring-based motion for spatial changes, cards, sheets and state transitions.
- Use consistent timing/easing tokens; avoid each screen inventing a different animation.
- Use shared elements for meaningful transitions such as a vehicle card expanding into its detail screen or a seller pickup row opening its location context.
- Use animated content/visibility for pickup-state changes, online/offline status, route publication and progress changes.
- Support Android predictive back and system navigation animations.
- Use gesture-driven transitions only when the action and state are clear and reversible.
- Animate the route line/stop progress and map camera with restraint; never hide the road or pickup numbers.
- Interpolate a vehicle marker only between real, timestamped location samples; show a stale indicator after the threshold.
- Use subtle haptics for meaningful actions (trip start, pickup completion, route publish), respecting system settings.
- Respect system animator-duration scale/reduced-motion preferences; provide a non-motion state change that carries the same information.

### Performance guardrails
- Avoid animation logic that triggers full-screen recomposition on every GPS tick.
- Keep GPS sampling, socket events and map camera updates decoupled from unrelated screen state.
- Prefer graphicsLayer/draw-phase changes where possible instead of expensive relayout during animation.
- Throttle/debounce high-frequency marker/camera updates; do not drop the authoritative raw GPS samples from the data pipeline.
- Avoid continuous decorative motion while the user is driving.
- Benchmark map and animation performance on representative low-memory Android devices.
- Add Baseline Profiles and Macrobenchmark for critical journeys when the project reaches a stable app shell.

### UX and accessibility guardrails
- Large, high-contrast driver controls that can be used quickly and safely while stationary.
- Clear trip state, GPS state, last update timestamp and network state.
- Seller privacy: no other sellers' names, exact home locations or unnecessary personal information.
- Owner maps must distinguish completed/current/pending/skipped stops without relying on colour alone; use icons/labels too.
- Support font scaling, content descriptions, touch target sizes, TalkBack and reduced motion.
- Do not use motion to disguise delays, stale coordinates, route uncertainty or failed sync.

## 6. The 20 roadmap steps, each split into Research and Build

The following pairs are the default task briefs. During Research, refine them against the live repository and current official references. During Build, implement only the accepted brief for that step.

### Step 1 — Repository foundation and engineering rules

**Research prompt**
Inspect the actual GitHub repository for missing root hygiene, folder conventions, security policies, environment templates, branch/commit policy and docs. Research current GitHub repository security, secret scanning, Dependabot and coding-convention practices that fit a small solo project. Check the existing architecture, README and ADR consistency.

**Build prompt**
Complete the repository foundation only: add/update .gitignore, .editorconfig, .env.example with placeholders, docs/adr index and initial ADRs, development/contribution conventions and README links. Do not create app/backend feature code. Verify no secrets or large generated map binaries are committed.

### Step 2 — Android monorepo and three app shells

**Research prompt**
Recheck stable Android Studio, AGP, Gradle, JDK, Kotlin, Compose BOM, Hilt/KSP, Navigation, Room, DataStore, WorkManager and MapLibre compatibility as one tested version matrix. Research MapLibre PMTiles asset loading, Compose AndroidView lifecycle integration, application IDs, APK size and Apple Silicon build limits. Design a cohesive premium motion/design system for the three role apps.

**Build prompt**
Create the Gradle monorepo, version catalog, three separately installable app modules with unique IDs, shared core modules, design tokens and minimal role-specific Compose launch/home shells. Add MapLibre MapView through AndroidView and the offline PMTiles/style asset loading proof of concept. Add baseline navigation transitions, predictive-back handling and a basic map offline-render test. Do not yet build all business screens.

### Step 3 — Backend and database foundation

**Research prompt**
Verify current Node.js LTS, TypeScript, Express, Zod, Pino, pg, PostgreSQL and PostGIS compatibility/security. Compare migration tooling and Docker image availability. Define environment validation, request lifecycle, logging redaction, health checks and dev/prod configuration for one modular monolith.

**Build prompt**
Create backend package/config, strict TypeScript, Express server, validated environment, structured/redacted logging, error middleware, request IDs, pg pool, SQL migration runner, PostgreSQL/PostGIS Docker Compose and health/readiness routes. Add test database setup and verify a fresh database can be migrated from zero.

### Step 4 — Authentication, roles and tenant security

**Research prompt**
Compare current mobile authentication/session strategies, token rotation and password/PIN hashing guidance. Research PostgreSQL RLS and OWASP object-level authorization practices. Model owner/driver/seller account activation securely and threat-model seller-code enumeration, token theft, brute force and cross-dairy access.

**Build prompt**
Implement owner/driver/seller authentication, activation, short-lived access sessions, refresh rotation/revocation, credential hashing, rate limiting and deny-by-default tenant/resource authorization. Add integration tests proving cross-dairy and cross-role access is rejected. Never treat seller code as a password.

### Step 5 — Dairy master data and assignments

**Research prompt**
Review master-data schema, PostGIS coordinate storage, geodesic 15 km seller eligibility, data correction/audit rules, unique codes, active assignment constraints and coordinate accuracy UX. Research any required local geocoding/coordinate-entry approach without assuming a paid service.

**Build prompt**
Implement dairy/depot, sellers, drivers, vehicles, seller-driver/vehicle assignment history, coordinate validation and owner management screens. Enforce seller distance <=15,000 m from depot server-side. Keep exact home point separate from optional road-access point. Add migration, authorization, validation and tests.

### Step 6 — Route domain and immutable versions

**Research prompt**
Research robust route-version modelling, stable stop IDs, atomic reordering, snapshot semantics, active trip pinning, spatial geometry storage and transaction constraints. Review route editing UX and conflict handling.

**Build prompt**
Implement route, route versions, route stops and segment shapes with draft/published/archived lifecycle. Add transactional stop insertion/reorder/delete, coordinate snapshots, unique ordering and published-version immutability. Add tests proving old trips/routes do not mutate.

### Step 7 — Driver route builder

**Research prompt**
Research modern Compose map editing, large seller lists/search, drag/drop or explicit reorder UX, map marker clustering, accessibility and driver-safe interaction. Inspect MapLibre annotation/overlay APIs and performance for the selected stable version.

**Build prompt**
Build driver route create/edit UI: search seller code, verify seller/coordinate, insert at selected position, reorder/remove, fixed depot start/end, numbered stop list/map, validation and save draft. Add elegant but restrained transitions and tests for stop order and duplicate/ineligible sellers.

### Step 8 — Regional offline routing and optimization

**Research prompt**
Research current Valhalla release/build process, OSM PBF regional extraction, optimized-route behavior, matrices, map matching, route graph memory/storage, Docker deployment and Node adapter choices. Test assumptions about keeping depot fixed as first/last, unreachable rural stops, route size and routing graph margins. Compare alternatives (Valhalla/OSRM/GraphHopper) for this single 15 km area.

**Build prompt**
Build the buffered regional OSM-to-Valhalla pipeline and private Valhalla service configuration, Node RoutingProvider adapter, route/matrix/optimized-route operations, fixed depot endpoints, stable seller ID mapping, caching and route review errors. Persist routing-data version with route versions. Add reproducible build instructions and sample integration tests.

### Step 9 — Manual road-shaping and route preview

**Research prompt**
Research MapLibre native map gestures, long-press point placement, draggable via-points, route-segment editing, snap-to-road quality and gesture conflicts with map pan/zoom. Design an undo/redo and preview UX suitable for drivers.

**Build prompt**
Implement select-segment, add/move/remove via-points, recalculate the selected road segment via Valhalla, compare old/new route, undo/redo draft changes and publish a new route version. Via-points must never become pickup stops. Add interaction tests.

### Step 10 — Persistent saved route and offline cache

**Research prompt**
Research current Room migration/schema export, offline-first repository patterns, cache invalidation, app process-death recovery, map bundle storage and safe map-pack updates. Define how the saved published route remains the default after app restart/login and how active trips remain pinned.

**Build prompt**
Implement route caching and reconciliation. Driver app must immediately show its cached saved route, fetch the current published version, and prompt for editing only when the driver explicitly chooses Edit Route. Add offline route/geometry rendering and process-death tests.

### Step 11 — Trip lifecycle and pickup events

**Research prompt**
Research idempotent command handling, trip state machines, transactional event capture, route-stop snapshot references and recovery after process death. Design a clear one-tap pickup workflow with safeguards against accidental completion/skipping.

**Build prompt**
Implement start/resume/end/cancel trip, route-version pinning, pickup completed/skipped with reason, idempotency keys, trip timeline and persistence. Add transaction and retry tests.

### Step 12 — Driver location foreground service

**Research prompt**
Recheck current Android location permissions, foreground-service types/start restrictions, notification runtime permission and OEM battery restrictions. Compare Fused Location Provider options, sampling/battery trade-offs, Room outbox, accuracy filtering and offline retry strategy.

**Build prompt**
Implement permission education, explicit start-trip location foreground service, visible notification, timestamp/accuracy/bearing/speed sample capture, adaptive sampling, Room offline queue, retry and stop-on-trip-end lifecycle. Add device tests for screen-off, permission revoke, GPS disabled and process recovery.

### Step 13 — Backend tracking and realtime

**Research prompt**
Research current Node ws/OkHttp WebSocket compatibility, authentication at upgrade, reconnect/resync protocol, backpressure, rate limits, payload size, event sequence IDs and tenant-scoped subscriptions. Compare when Redis/pub-sub becomes justified.

**Build prompt**
Implement authenticated WSS, server-derived subscriptions, heartbeat, reconnect/resync, event schemas, latest-location storage, history ingestion, idempotent GPS batches, stale calculation and authorization tests. Do not expose internal Valhalla or arbitrary vehicle channels.

### Step 14 — Seller live tracking and compass map

**Research prompt**
Research current sensor APIs, rotation-vector accuracy/filtering, MapLibre camera bearing animation and heading-up UX. Design accessible status indicators and privacy-minimized seller payloads. Research ways to prevent camera jitter and marker animation from conflicting.

**Build prompt**
Implement seller activation, assigned vehicle view, registered home pin, PMTiles map, heading-up map, vehicle marker, last-updated/stale state and privacy-safe stop progress. Add sensor and data-authorization tests.

### Step 15 — ETA, remaining stops and notifications

**Research prompt**
Research ETA estimation using route legs/service times, GPS freshness, map-matching, optional traffic sources and refresh cost. Research FCM current delivery constraints and notification permission UX. Decide explicit accuracy/staleness wording rather than promise precise arrival.

**Build prompt**
Implement remaining-stop calculation from trip events and pinned route version, route-graph ETA estimate, controlled refresh, FCM token registration and relevant notifications. Add tests for skipped/completed stops, delayed GPS and offline recovery.

### Step 16 — Owner fleet and vehicle details

**Research prompt**
Research efficient fleet map rendering, marker clustering, multi-vehicle WSS subscription scale, map camera behaviour, status presentation, accessibility and low-end device performance. Design clear full-route and per-stop status views.

**Build prompt**
Implement owner fleet list, filtering, vehicle details, complete route map, numbered stops, completed/current/pending/skipped state, live status, stale indicators and progress. Add tenant isolation, reconnect and map performance tests.

### Step 17 — History, audit and reporting

**Research prompt**
Research efficient time-series/location retention, PostgreSQL partitioning thresholds, audit immutability, CSV export safety and operational report UX. Identify the minimum useful reports for a dairy owner.

**Build prompt**
Implement trip/route/assignment history, pickup exception reports, audit views, basic CSV export and configurable GPS retention/partitioning. Keep seller personal data and unnecessary precise location exposure out of exports.

### Step 18 — Quality, security, accessibility and performance

**Research prompt**
Research current Android testing, Macrobenchmark, Baseline Profiles, Compose UI testing, backend security scanning, dependency scanning, load testing and accessibility checks. Establish real performance budgets for the target low-memory phones and map use cases.

**Build prompt**
Add unit/integration/instrumented/end-to-end suites, authorization penetration-style tests, offline/device scenarios, Macrobenchmark/Baseline Profiles, frame/jank measurements, accessibility checks and dependency/secret scanning. Fix measured critical issues; do not add unverified performance claims.

### Step 19 — CI/CD, hosting and release

**Research prompt**
Research current GitHub Actions runners, secure signing, cache strategy, Android APK/AAB release options, WebSocket-capable hosting, managed PostGIS options, backups, monitoring, costs and deployment regions. Verify Play Store versus GitHub APK distribution requirements.

**Build prompt**
Implement backend and three-app GitHub Actions workflows, secret-safe signing, HTTPS deployment configuration, PostgreSQL/PostGIS provisioning/migration workflow, health monitoring, backup/restore procedure and versioned APK/map-pack releases. Never commit credentials or generated regional data unless licensing/storage policy allows it.

### Step 20 — Field pilot and production launch

**Research prompt**
Research pilot telemetry, map data update cadence, OSM attribution/licence obligations, road coverage QA, GPS battery/network metrics, incident handling and acceptance thresholds. Create a one-dairy field validation plan using real collection drives.

**Build prompt**
Create pilot configuration/checklists, map/graph bundle manifest and update/rollback procedure, operational dashboards and support runbook. Validate routes and location accuracy against actual trips, tune measured issues, and launch only when privacy, GPS, offline, battery and recovery acceptance checks pass.

## 7. Research/build output format

Every Research response must have:
1. Step number/name and repository status.
2. Product-specific findings.
3. Current stable technology/version compatibility table with official sources.
4. Alternatives considered and final choice.
5. Premium UX/motion concept for this step.
6. Security/privacy/licensing/cost risks.
7. File-by-file implementation plan.
8. Acceptance tests and measurable performance criteria.
9. Research document path/commit.
10. One ready-to-use Build brief and explicit instruction that no code has been implemented yet.

Every Build response must have:
1. Step number/name and exact scope.
2. Files created/changed.
3. Main implementation decisions.
4. Test/build commands actually run and their real outcomes.
5. Git commit(s) and links.
6. Remaining configuration/secrets/device tests.
7. Acceptance checklist and complete/partial/blocked status.
8. The next step number, without starting its research automatically.

## 8. Pipeline state and current checkpoint

- The first architecture, technology and 20-step roadmap documents have been created.
- The regional offline map strategy has been researched and documented separately.
- The repository currently contains architecture/planning documentation; actual Android app and backend feature code have not been scaffolded yet.
- Step 1 is **documentation-started, repository-hygiene acceptance still to audit**. Do not claim it fully complete until the live root tree confirms .gitignore, .editorconfig, env template and ADR conventions.
- The first incomplete step must always be determined from the live GitHub repository, not from conversational assumptions.
- The next "Next step" command should begin with a Step 1 completion audit/research gate. If Step 1's Research gate is still current and no repository changes invalidate it, produce the Step 1 Build brief; otherwise research the missing items first.

## 9. Principles

- One step at a time; never start the next Build before the current step is accepted.
- Research is not implementation. Do not scaffold code during Research.
- Build is not just documentation. Implement the actual feature within the scoped step.
- Do not force technology into the project because it is trendy; justify each dependency by measured product value.
- Prefer official/current documentation over random blog recommendations.
- Do not guess package versions, API keys, service URLs, seller coordinates, regional map size or cloud prices.
- Keep the product's premium visual identity consistent, but operational reliability and driver safety take priority.
- Be explicit whenever work could not be run, tested or verified in the available environment.


## 10. Starter references for motion and performance research

Recheck these official references during every relevant Research gate; they are starting points, not permanent version guarantees.

- Compose animation quick guide and performance guidance: https://developer.android.com/develop/ui/compose/animation/quick-guide
- Shared element transitions: https://developer.android.com/develop/ui/compose/animation/shared-elements
- Predictive back in Compose: https://developer.android.com/develop/ui/compose/system/predictive-back-setup
- Compose animation release notes: https://developer.android.com/jetpack/androidx/releases/compose-animation
- Compose August 2026 release highlights, including interactive two-stage transitions: https://developer.android.com/blog/posts/what-s-new-in-the-jetpack-compose-august-26-release
- Baseline Profiles overview: https://developer.android.com/topic/performance/baselineprofiles/overview
- Macrobenchmark and Baseline Profile generation: https://developer.android.com/topic/performance/baselineprofiles/create-baselineprofile
- MapLibre Native PMTiles Android example: https://maplibre.org/maplibre-native/android/examples/data/PMTiles/

Current findings to carry into future research:
- Compose shared-element APIs are stable in the 1.10 animation line; verify the selected Compose BOM maps to the required artifacts.
- Predictive-back support should be treated as part of navigation polish, not an optional late add-on.
- Newer interactive two-stage transition APIs may enable gesture-driven effects; use only if the selected Compose version is stable and the UX benefits the workflow.
- Compose's own guidance recommends avoiding unnecessary layout work during animation; prefer draw/graphics-layer updates where appropriate.
- Android documents Baseline Profiles as capable of improving code execution speed by about 30% for covered journeys; benchmark Milk's own flows before making any performance claim.
