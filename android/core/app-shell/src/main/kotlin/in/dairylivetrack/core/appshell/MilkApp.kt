package `in`.dairylivetrack.core.appshell

import androidx.compose.runtime.Composable
import `in`.dairylivetrack.core.design.MilkTheme

@Composable
fun MilkApp(role: MilkRole) {
    MilkTheme {
        MilkNavigationShell(role = role)
    }
}
