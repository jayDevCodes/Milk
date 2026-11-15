# Milk — Pipeline State

**Last reconciled:** 2026-11-15  
**Repository:** [jayDevCodes/Milk](https://github.com/jayDevCodes/Milk)  
**Branch:** main  
**Mode:** One Continue command executes Research → Build → Verify → Commit for the first incomplete step.

## Current checkpoint

**Step 01 — PARTIAL.** Repository foundations are committed and CI run [#1](https://github.com/jayDevCodes/Milk/actions/runs/43740459888) passed. The maintainer still needs to check GitHub security settings in Settings → Security and analysis.

**Step 02 — PARTIAL.** The Gradle monorepo, three role APK modules, shared Compose design/navigation/map libraries and Android CI are committed. Android CI, physical-device MapLibre testing and the minSdk decision remain to be verified.

## Milestone register

| Step | Milestone | Status | Exit evidence |
|---:|---|---|---|
| 01 | Repository foundation and engineering rules | PARTIAL | Root guardrails CI passed; GitHub security settings owner check remains |
| 02 | Android monorepo and three app shells | PARTIAL | Three app modules, shared shells, local MapLibre style and Android CI committed; CI/device verification pending |
| 03 | Backend and database foundation | PENDING | Strict TypeScript API, validated environment, Postgres/PostGIS and clean migrations |
| 04 | Authentication, roles and tenant security | PENDING | Owner/driver/seller auth and cross-dairy authorization tests pass |
| 05 | Dairy master data and assignments | PENDING | Master data flows and server-side 15 km seller rule |
| 06 | Route domain and immutable versions | PENDING | Versioned routes and immutable published snapshots |
| 07 | Driver route builder | PENDING | Create, reorder, validate and save draft route |
| 08 | Route calculation and optimization | PENDING | Private regional routing, fixed depot endpoints and stop mapping |
| 09 | Manual segment shaping and route preview | PENDING | Via-points without mutating seller stop records |
| 10 | Saved route restoration and offline route cache | PENDING | Route restores after restart and offline cache remains consistent |
| 11 | Trip lifecycle and pickup operations | PENDING | Durable, idempotent trip/pickup transitions |
| 12 | Driver GPS service and offline queue | PENDING | Visible active-trip service and retry/privacy/battery tests |
| 13 | Live tracking backend and realtime delivery | PENDING | Authenticated WSS, reconnect/resync and tenant-isolation tests |
| 14 | Seller live tracking and compass map | PENDING | Seller sees only assigned vehicle and own pickup context |
| 15 | Remaining-stop count, ETA and notifications | PENDING | Correct count/ETA and clear stale/offline state |
| 16 | Owner fleet dashboard | PENDING | Role-safe live fleet map and progress controls |
| 17 | History, reports, audit and owner operations | PENDING | Trip history, reports and audit trails |
| 18 | Security, reliability and end-to-end testing | PENDING | Threat model, recovery, offline/GPS and device checks |
| 19 | CI/CD, backend deployment and APK distribution | PENDING | Deployment, signed artifacts, backups and monitoring verified |
| 20 | Real dairy pilot and launch | PENDING | Field validation and accepted accuracy/privacy/battery thresholds |

## Status definitions

- **PENDING:** no implementation evidence.
- **IN PROGRESS:** scoped implementation underway.
- **PARTIAL:** files are committed, but acceptance checks remain.
- **COMPLETE:** all criteria have evidence from committed files and executed checks.
- **BLOCKED:** an external dependency, permission, credential or device test prevents safe completion.

A commit does not prove a build. A CI pass does not replace physical-device tests. Record the exact check, date and link before marking a milestone complete.
