pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}

dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "Milk"

include(
    ":core:design",
    ":core:maps",
    ":core:app-shell",
    ":apps:driver",
    ":apps:seller",
    ":apps:owner",
)
