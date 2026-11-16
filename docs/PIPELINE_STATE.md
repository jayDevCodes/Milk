# Milk pipeline state

Last reconciled: 2026-11-16  
Default branch: main  
Execution: one Continue command runs Research → Build → Verify → Commit for one complete milestone.

| Step | Milestone | Status | Exit evidence |
|---:|---|---|---|
| 01 | Repository foundation and engineering rules | IN PROGRESS | Root hygiene, contribution/security docs, CI and state tracking committed; CI and repository security settings still require verification |
| 02 | Android monorepo and three app shells | PENDING | Three installable Compose app shells and shared foundations build |
| 03 | Backend and database foundation | PENDING | TypeScript API, PostgreSQL/PostGIS and migrations verified |
| 04 | Authentication, roles and tenant security | PENDING | Auth and cross-dairy authorization tests pass |
| 05 | Dairy master data and assignments | PENDING | Dairy, depot, seller, driver, vehicle and assignment flows verified |
| 06 | Route domain and immutable versions | PENDING | Versioned routes and immutable published snapshots verified |
| 07 | Driver route builder | PENDING | Draft route creation, reordering and validation work |
| 08 | Route calculation and optimization | PENDING | Regional routing and fixed depot endpoints verified |
| 09 | Manual segment shaping and route preview | PENDING | Via-points and route preview work without changing seller stops |
| 10 | Saved route restoration and offline route cache | PENDING | Published route restores after restart/offline |
| 11 | Trip lifecycle and pickup operations | PENDING | Durable, idempotent trip and pickup operations |
| 12 | Driver GPS service and offline queue | PENDING | Active-trip location service, retry queue and privacy/battery checks |
| 13 | Live tracking backend and realtime delivery | PENDING | Authenticated realtime fan-out, reconnect and tenant isolation |
| 14 | Seller live tracking and compass map | PENDING | Seller sees assigned vehicle and own pickup context only |
| 15 | Remaining stops, ETA and notifications | PENDING | Correct stop count/ETA and clear stale/offline state |
| 16 | Owner fleet dashboard | PENDING | Owner fleet state and role-safe controls |
| 17 | History, reports and audit | PENDING | Trip history, reports and audit trail |
| 18 | Security, reliability and end-to-end tests | PENDING | Threat model, recovery, offline, GPS and device checks |
| 19 | CI/CD, deployment and APK distribution | PENDING | Verified deployment, signed releases, backups and monitoring |
| 20 | Real dairy pilot and launch | PENDING | Field routes, privacy, battery and incident thresholds accepted |

Statuses: PENDING = no implementation evidence; IN PROGRESS = active work; PARTIAL = committed scope with checks outstanding; COMPLETE = every acceptance criterion verified; BLOCKED = required external dependency prevents safe progress.

Never mark a milestone complete from documentation or a commit alone. Record actual command output, CI links, device validation and remaining owner-only actions.
