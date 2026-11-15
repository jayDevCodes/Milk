package in.dairylivetrack.core.design

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Typography
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val MilkColors = darkColorScheme(
    primary = Color(0xFF92E8B5),
    onPrimary = Color(0xFF073820),
    primaryContainer = Color(0xFF174B35),
    onPrimaryContainer = Color(0xFFC2F6D5),
    secondary = Color(0xFFB6DCD0),
    onSecondary = Color(0xFF163B34),
    background = Color(0xFF071B17),
    onBackground = Color(0xFFE8F3ED),
    surface = Color(0xFF102720),
    onSurface = Color(0xFFE8F3ED),
    surfaceVariant = Color(0xFF1B3830),
    onSurfaceVariant = Color(0xFFB9D0C5),
    outline = Color(0xFF58766A),
    error = Color(0xFFFFB4AB),
)

@Composable
fun MilkTheme(content: @Composable () -> Unit) {
    MaterialTheme(colorScheme = MilkColors, typography = Typography(), content = content)
}
