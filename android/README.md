# Milk Android workspace

## Separate applications

| Role | Gradle project | Application ID |
|---|---|---|
| Driver | :apps:driver | in.dairylivetrack.driver |
| Seller | :apps:seller | in.dairylivetrack.seller |
| Owner | :apps:owner | in.dairylivetrack.owner |

These are three APKs sharing libraries and one future API, not three backends. The existing `in.dairylivetrack.*` application IDs remain unchanged; Kotlin source escapes the hard-keyword package segment as `` `in` ``.

## Pinned toolchain

- Android Gradle Plugin 9.3.1
- Gradle 9.7.0 (pinned URL and SHA-256)
- JDK 17
- Kotlin 2.4.21; AGP 9 built-in Kotlin support
- Compose BOM 2026.09.00
- Navigation 3 1.2.1
- MapLibre Native Android 13.7.1 OpenGL

The selected Kotlin/Gradle/AGP versions are within the current Kotlin compatibility table. Android 17's API 37 platform is still a preview package; the app modules compile against API 37 but retain targetSdk 36 until runtime behaviour changes are reviewed.

The POSIX/Windows bootstrap scripts download the Gradle distribution over HTTPS, verify its published SHA-256 and cache it under GRADLE_USER_HOME. A binary wrapper JAR is not required by these scripts.

## Build

Run from this directory:

```bash
./gradlew :apps:driver:assembleDebug
./gradlew :apps:seller:assembleDebug
./gradlew :apps:owner:assembleDebug
./gradlew :core:app-shell:testDebugUnitTest
```

## CI SDK setup

GitHub Actions installs the Android command-line tools and platform-tools, then uses Google's Android CLI for the API 37 preview platform and stable Build Tools:

```bash
android --sdk="$ANDROID_HOME" sdk install --canary platforms/android-37.0
android --sdk="$ANDROID_HOME" sdk install build-tools/36.0.0
```

Use the API 37 preview package identifier platforms/android-37.0; do not substitute the old bare android-37 path. The Android CLI is Google's recommended replacement for the deprecated sdkmanager command.

The initial MapLibre style is a local renderer/lifecycle proof. It is not the regional OSM/PMTiles map package.
