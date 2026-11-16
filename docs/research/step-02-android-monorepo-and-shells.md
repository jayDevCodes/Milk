# Step 02 Research and Build: Android monorepo and app shells

- Research checked: 2026-11-16
- Repository: https://github.com/jayDevCodes/Milk
- Initial research commit: f1a805ad7e9e3c2bb02866d9478923d4b0dd3601

## Research decision

The selected compatibility matrix remains AGP 9.3.1 + Gradle 9.7.0 + JDK 17 + Kotlin 2.4.21, Compose BOM 2026.09.00, Navigation 3 1.2.1 and MapLibre Android 13.7.1 OpenGL.

The current Kotlin compatibility table lists KGP 2.4.20–2.4.21 as fully supported with Gradle 7.6.3–9.7.0 and AGP 8.5.2–9.3.1. AGP 9.3 requires at least Gradle 9.5.0, supports API level 37, and uses JDK 17. The repository's selected versions therefore align at the upper supported boundary rather than combining unverified versions.

Android 17 uses API 37. Google's SDK setup page still identifies the Android 17 SDK as a Preview package. The three app modules therefore keep compileSdk 37 for the selected Compose/AGP line while targetSdk remains 36; do not raise targetSdk until Android 17 behaviour changes have been reviewed.

Google now marks sdkmanager deprecated and recommends the Android CLI command android sdk. The CI bootstrap uses the Android CLI included with the installed Android command-line tools and installs the Android 17 preview platform from the Canary channel. It installs Build Tools 36.0.0 separately from the stable channel.

## Build implementation

- Created the Gradle monorepo under android/.
- Added separately installable Driver, Seller and Owner application modules with the existing package IDs.
- Added shared core/design, core/app-shell and core/maps Android libraries.
- Added a dark Material 3 visual foundation and role-specific overview screens without fabricated operational counts.
- Added Navigation 3 and a local MapLibre style/AndroidView preview with native lifecycle forwarding.
- Added Gradle bootstrap scripts with an official pinned SHA-256 distribution checksum.
- Added GitHub Actions to build all three debug APKs and run shared unit tests using immutable action commit references.

## CI diagnosis and correction

Two initial Android CI runs were inspected by downloading the actual job logs:

1. Run 43742506723 failed because the setup action received both SDK package names as one multiline package argument. That was corrected in commit 8e440de by moving package installation into an explicit shell step.
2. Run 43742653560 then failed because the workflow requested platforms;android-37, which the SDK repository did not expose under that identifier. Android 17 is still a Preview/Canary SDK, and its platform package uses the versioned identifier platforms/android-37.0. The workflow now uses Google's recommended Android CLI with --canary for that platform and installs stable Build Tools 36.0.0 separately.

A fresh CI run on the updated SDK workflow reached Kotlin compilation and exposed another source issue: the Kotlin package root was named `in`, which is a hard Kotlin keyword. The package root is retained for the existing Android application IDs, but Kotlin package declarations and imports now escape it as `` `in` ``. Kotlin's language specification explicitly permits hard keywords as escaped identifiers.

## Verification status

The three app modules, shared libraries, role test, Gradle configuration and MapLibre preview are committed. The earlier CI failures happened before Gradle was invoked, so they do not indicate an app-source compilation failure. This environment cannot run Gradle or Android emulators locally. CI verification succeeded on 2026-11-16 in run [43796684275](https://github.com/jayDevCodes/Milk/actions/runs/43796684275), commit 6e125a8035d023d0c292bef43d3ac194a9f81d23. All three debug APK tasks (`:apps:driver:assembleDebug`, `:apps:seller:assembleDebug`, `:apps:owner:assembleDebug`) passed with `BUILD SUCCESSFUL in 1m 36s`; the shared `:core:app-shell:testDebugUnitTest` task passed with `BUILD SUCCESSFUL in 22s`. Repository guardrails also passed on the same commit in run [43796684303](https://github.com/jayDevCodes/Milk/actions/runs/43796684303).

Real PMTiles display, offline pan/zoom, low-end GPU behaviour, foreground location and battery tests still require physical-device validation.

## Step 2 acceptance

The Android monorepo/app-shell milestone is complete for the CI-verifiable scope: three role-specific debug APKs assemble and the shared role tests pass. Device-specific acceptance is tracked separately so this milestone does not falsely claim physical-device verification.

- Step 18: verify MapLibre local rendering and offline pan/zoom on physical Android hardware; confirm representative driver/seller handset inventory supports minSdk 24.
- Step 10: integrate regional PMTiles only after OSM coverage generation and licence/attribution checks.

## Current official references

- Android 17 SDK setup: https://developer.android.com/about/versions/17/setup-sdk
- Android CLI SDK commands and Canary channel: https://developer.android.com/tools/agents/android-cli
- Android SDK Manager deprecation notice: https://developer.android.com/tools/sdkmanager
- Android Gradle Plugin 9.3 release notes: https://developer.android.com/build/releases/agp-9-3-0-release-notes
- Kotlin Gradle Plugin compatibility table: https://kotlinlang.org/docs/gradle-configure-project.html
- Android Actions setup: https://github.com/android-actions/setup-android
- Kotlin escaped identifiers and hard-keyword rules: https://kotlinlang.org/spec/syntax-and-grammar.html
