plugins {
    alias(libs.plugins.android.library)
    alias(libs.plugins.kotlin.compose)
}

android {
    namespace = "in.dairylivetrack.core.appshell"
    compileSdk = 37
    defaultConfig { minSdk = 24 }
    buildFeatures { compose = true }
}

dependencies {
    implementation(project(":core:design"))
    implementation(project(":core:maps"))
    implementation(platform(libs.androidx.compose.bom))
    implementation(libs.androidx.compose.runtime)
    implementation(libs.androidx.compose.ui)
    implementation(libs.androidx.compose.animation)
    implementation(libs.androidx.compose.material3)
    implementation(libs.androidx.compose.material.icons.core)
    implementation(libs.androidx.navigation3.runtime)
    implementation(libs.androidx.navigation3.ui)
    testImplementation(libs.junit)
}
