package in.dairylivetrack.core.appshell

import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.safeDrawing
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.navigation3.runtime.entryProvider
import androidx.navigation3.ui.NavDisplay

private data object OverviewDestination
private data object MapDestination

@Composable
fun MilkNavigationShell(role: MilkRole) {
    val backStack = remember { mutableStateListOf<Any>(OverviewDestination) }
    val onMap = backStack.lastOrNull() == MapDestination

    Scaffold(
        modifier = Modifier.fillMaxSize(),
        contentWindowInsets = WindowInsets.safeDrawing,
        bottomBar = {
            NavigationBar {
                NavigationBarItem(
                    selected = !onMap,
                    onClick = {
                        if (onMap) {
                            backStack.clear()
                            backStack.add(OverviewDestination)
                        }
                    },
                    icon = { Icon(Icons.Filled.Home, contentDescription = null) },
                    label = { Text("Overview") },
                )
                NavigationBarItem(
                    selected = onMap,
                    onClick = { if (!onMap) backStack.add(MapDestination) },
                    icon = { Icon(Icons.Filled.LocationOn, contentDescription = null) },
                    label = { Text("Map") },
                )
            }
        },
    ) { innerPadding ->
        NavDisplay(
            backStack = backStack,
            onBack = {
                if (backStack.size > 1) backStack.removeAt(backStack.lastIndex)
            },
            entryProvider = entryProvider {
                entry<OverviewDestination> {
                    MilkOverviewScreen(
                        role = role,
                        onOpenMap = {
                            if (backStack.lastOrNull() != MapDestination) backStack.add(MapDestination)
                        },
                        modifier = Modifier.fillMaxSize(),
                    )
                }
                entry<MapDestination> {
                    MilkMapScreen(
                        onBack = {
                            if (backStack.size > 1) backStack.removeAt(backStack.lastIndex)
                        },
                        modifier = Modifier.fillMaxSize(),
                    )
                }
            },
            modifier = Modifier.fillMaxSize(),
        )
    }
}
