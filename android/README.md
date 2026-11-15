# Milk Android workspace

## Separate applications

| Role | Gradle project | Application ID |
|---|---|---|
| Driver | :apps:driver | in.dairylivetrack.driver |
| Seller | :apps:seller | in.dairylivetrack.seller |
| Owner | :apps:owner | in.dairylivetrack.owner |

These are three APKs sharing libraries and one future API, not three backends.

## Pinned toolchain

- Android Gradle Plugin 9.3.1
- Gradle 9.7.0 (pinned URL and SHA-256)
- JDK 17
- Kotlin 2.4.21; AGP 9 built-in Kotlin support
- Compose BOM 2026.09.00
- Navigation 3 1.2.1
- MapLibre Native Android 13.7.1 OpenGL

The POSIX/Windows bootstrap scripts download the Gradle distribution over HTTPS, verify its published SHA-256 and cache it under GRADLE_USER_HOME. A binary wrapper JAR is not required by these scripts.

## Build

Run from this directory:

```bash
./gradlew :apps:driver:assembleDebug
./gradlew :apps:seller:assembleDebug
./gradlew :apps:owner:assembleDebug
./gradlew :core:app-shell:testDebugUnitTest
```

The initial MapLibre style is a local renderer/lifecycle proof. It is not the regional OSM/PMTiles map package.
