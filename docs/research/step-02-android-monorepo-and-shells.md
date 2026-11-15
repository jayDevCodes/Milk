# Step 02 Research and Build: Android monorepo and app shells

- Research checked: 2026-11-15
- Repository: https://github.com/jayDevCodes/Milk
- Research commit: f1a805ad7e9e3c2bb02866d9478923d4b0dd3601

## Research decision

The selected compatibility matrix is AGP 9.3.1 + Gradle 9.7.0 + JDK 17 + Kotlin 2.4.21, Compose BOM 2026.09.00, Navigation 3 1.2.1 and MapLibre Android 13.7.1 OpenGL. Kotlin's compatibility window caps KGP 2.4.21 at AGP 9.3.1 and Gradle 9.7.0; newer AGP 9.4/9.5 and Gradle 9.9.1 are not combined with this Kotlin line. Compose 1.12 requires compileSdk 37 and AGP 9 or later. Full references and comparison notes are in docs/TECH_STACK_DECISIONS.md and the Step 2 research history.

## Build implementation

- Created the Gradle monorepo under android/.
- Added separately installable Driver, Seller and Owner application modules with the existing package IDs.
- Added shared core/design, core/app-shell and core/maps Android libraries.
- Added a dark Material 3 visual foundation and role-specific overview screens without fabricated operational counts.
- Added Navigation 3 and a local MapLibre style/AndroidView preview with native lifecycle forwarding.
- Added Gradle bootstrap scripts with an official pinned SHA-256 distribution checksum.
- Added GitHub Actions to build all three debug APKs and run shared unit tests using immutable action commit references.

## Verification status

The Android CI workflow is committed; its first run must be inspected before compilation is treated as verified. This environment cannot run Gradle or Android emulators locally. Real PMTiles display, offline pan/zoom, low-end GPU behaviour, foreground location and battery tests are not part of this shell milestone.

## Remaining Step 2 acceptance

- Confirm the Android CI workflow builds all three APKs and passes the shared role tests; repair failures found.
- Verify MapLibre local renderer on physical Android hardware.
- Check actual driver/seller phone inventory before locking minSdk 24.
- Add real regional PMTiles only after OSM coverage generation and licence/attribution checks.
