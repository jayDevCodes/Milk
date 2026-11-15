# Step 02 Research: Android monorepo and three app shells

- Research checked: 2026-11-15
- Repository: https://github.com/jayDevCodes/Milk
- Starting commit: eb9c7ce3186834cebac0be7b42961825bee76835

## Live repository findings

There is no Android Gradle project, wrapper, version catalog, app module, shared Android module, Android manifest, UI source or Android CI workflow. The architecture already fixes the application IDs: in.dairylivetrack.driver, in.dairylivetrack.seller and in.dairylivetrack.owner. The shared backend is outside this milestone.

The Step 1 repository guardrail workflow passed on push: https://github.com/jayDevCodes/Milk/actions/runs/43740459888. Step 1 remains PARTIAL only because GitHub security settings require a manual maintainer check.

## Version compatibility

| Component | Selected baseline | Evidence / reason |
|---|---|---|
| IDE | Android Studio Rabbit 2 / 2026.2.2 Patch 1 | Current stable IDE line |
| AGP | 9.3.1 | Stable patch line; API 37 supported; JDK 17 |
| Gradle | 9.7.0 | AGP 9.3 requires >=9.5; Kotlin 2.4.21 documented max is 9.7 |
| JDK | 17 | AGP 9.3 baseline |
| Kotlin | 2.4.21 | Stable release |
| Compose compiler | org.jetbrains.kotlin.plugin.compose 2.4.21 | Plugin follows Kotlin compiler version |
| Compose BOM | 2026.09.00 | Stable; Compose 1.12 requires compileSdk 37 and AGP 9 |
| Navigation 3 | 1.2.1 | Stable on 4 Nov 2026; 1.3.0-alpha04 is preview |
| MapLibre Native | 13.7.1 | Stable Android Native release/API docs |
| Renderer | android-sdk-opengl | Stable, widest device compatibility |
| compile/target/min SDK | 37 / 36 / 24 provisional | Compose requires 37; minSdk needs fleet-device validation |

Kotlin's compatibility matrix lists KGP 2.4.20–2.4.21 as fully compatible with AGP through 9.3.1 and Gradle through 9.7.0. AGP 9.3 requires Gradle 9.5.0 minimum and JDK 17. Therefore newer Gradle 9.9.1 and AGP 9.4/9.5 are deliberately not combined with this Kotlin line until their compatibility is documented. The highest version is not automatically the safest combination.

AGP 9 has built-in Kotlin support. Do not also apply org.jetbrains.kotlin.android. Apply org.jetbrains.kotlin.plugin.compose matching Kotlin 2.4.21 and pin plugins/libraries in one version catalog.

## Alternatives and selected libraries

- Compose + Material 3: stable native UI and coherent shared components; use the Compose BOM.
- Navigation 3 1.2.1: Compose-first entry model. Navigation 2.10.2 is still stable, but Navigation 3 is selected for a new Compose-first app. Do not use the 1.3 alpha line in production.
- MapLibre native MapView hosted via Compose AndroidView: avoids an unstable third-party Compose wrapper and retains native lifecycle control.
- MapLibre OpenGL artifact: widest device compatibility for rural/low-cost phones with unknown GPU mix. Vulkan may perform better on modern devices; multiBackend adds native size and should wait for device benchmarks.
- Defer DI, Room, DataStore, WorkManager, fused location, REST and notifications. They belong to later steps and add little to a bare shell.

## Role UI and motion direction

Use one shared Milk design system: dark ink/navy foundation, dairy-white surfaces, restrained green accent, clear semantic status. Driver gets large high-contrast controls and clear trip/route state; Seller gets a calm privacy-limited tracking shell; Owner gets an information-dense overview.

Use Material 3 building blocks. Add short spring-based navigation transitions and AnimatedContent for meaningful state changes. Keep transitions interruptible and respect system animation duration. Avoid continuous decoration, motion while driving, or animations that conceal stale GPS. Shared-element transitions, haptics and live marker interpolation belong with their actual data flows in later steps.

## Map proof boundary

The first map screen loads a local MapLibre style asset only. This proves the native renderer can be embedded and lifecycle-managed; it is not a populated offline map. No PMTiles archive, PBF extract, glyph pack, routing graph, depot coordinates or seller locations exist in the repository. Do not label the blank local preview a finished offline basemap. Later offline-map work must generate/measure regional PMTiles, bundle offline style assets, display © OpenStreetMap contributors attribution and validate rural roads.

MapLibre's Android PMTiles path supports APK assets and byte-range loading. Keep the map view behind a shared Compose wrapper so all three APKs share the same lifecycle implementation.

## CI and performance

- Use GitHub Actions with contents:read, immutable full-SHA action references and no secrets.
- Set up JDK 17, Android SDK platform 37/build tools and Gradle 9.7.0.
- Build Driver, Seller and Owner debug variants and run shared unit tests on push/PR.
- Cache Gradle dependencies; do not sign or publish release APKs in this step.
- Limit local Gradle workers on the developer's M1 MacBook Air with 8 GB RAM.
- Add Macrobenchmark/Baseline Profiles when the app has stable critical journeys.

## Risks and open validation

- minSdk 24 is provisional until actual driver/seller phone inventory is known.
- CI compile does not prove MapLibre rendering or GPU compatibility on low-end phones.
- The local preview style is not regional road data.
- No keystore, Play Console, Firebase key, map pack or paid service is needed in this step.

## Official references

- Android Studio / AGP compatibility: https://developer.android.com/build/releases/about-agp
- AGP 9.3 notes: https://developer.android.com/build/releases/agp-9-3-0-release-notes
- Kotlin releases: https://kotlinlang.org/docs/releases.html
- Kotlin/Gradle/AGP compatibility: https://kotlinlang.org/docs/gradle-configure-project.html
- Compose BOM: https://developer.android.com/develop/ui/compose/bom
- Compose compiler / AGP 9: https://developer.android.com/develop/ui/compose/setup-compose-dependencies-and-compiler
- Compose animation releases: https://developer.android.com/jetpack/androidx/releases/compose-animation
- Navigation 3 release notes: https://developer.android.com/jetpack/androidx/releases/navigation3
- Navigation 3 basic DSL: https://developer.android.com/guide/navigation/navigation-3/recipes/basicdsl
- MapLibre Native releases/API: https://github.com/maplibre/maplibre-native/releases and https://maplibre.org/maplibre-native/android/api/
- MapLibre APK style URI: https://maplibre.org/maplibre-native/android/api/-map-libre%20-native%20-android/org.maplibre.android.maps/-style/-builder/from-uri.html
- MapLibre rendering backends: https://maplibre.org/maplibre-native/docs/book/platforms/android/android-rendering-backends.html
- MapLibre PMTiles: https://maplibre.org/maplibre-native/android/examples/data/PMTiles/

## Build plan and acceptance

Create the Gradle monorepo, pinned catalog, three role app modules using the fixed application IDs, shared design/map libraries, role-specific entry shells, local MapLibre style proof and Android CI. The milestone is PARTIAL until all three debug APKs are built by CI and real Android hardware verifies renderer/lifecycle; minSdk also needs a fleet-device check.
