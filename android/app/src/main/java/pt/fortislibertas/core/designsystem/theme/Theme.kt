package pt.fortislibertas.core.designsystem.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.Immutable
import androidx.compose.runtime.ReadOnlyComposable
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.graphics.Color

// ── Cores do Material 3 ──────────────────────────────
private val LightColors = lightColorScheme(
    primary = DeepBlue,
    onPrimary = White,
    secondary = CuriousBlue,
    onSecondary = CodGray,
    tertiary = Oasis,
    onTertiary = CodGray,
    error = UltraRed,
    onError = White,
    background = PaleWhite,
    onBackground = CodGray,
    surface = White,
    onSurface = CodGray,
    surfaceVariant = LightSurfaceVariant,
    onSurfaceVariant = LightOnSurfaceVariant,
    surfaceContainer = LightSurfaceContainer,
    outline = LightOutline,
)

private val DarkColors = darkColorScheme(
    primary = CuriousBlue,
    onPrimary = CodGray,
    secondary = DeepBlue,
    onSecondary = PaleWhite,
    tertiary = Oasis,
    onTertiary = CodGray,
    error = UltraRedLight,
    onError = CodGray,
    background = CodGray,
    onBackground = PaleWhite,
    surface = DarkSurface,
    onSurface = PaleWhite,
    surfaceVariant = DarkSurfaceVariant,
    onSurfaceVariant = DarkOnSurfaceVariant,
    surfaceContainer = DarkSurfaceContainer,
    outline = DarkOutline,
)

// ── Cores próprias da app (o Material não tem "receita") ──
@Immutable
data class FortisExtendedColors(
    val income: Color,
    val expense: Color,
    val warning: Color,
    val onWarning: Color,
)

private val LightExtended = FortisExtendedColors(
    income = OasisDark,
    expense = UltraRed,
    warning = Pineapple,
    onWarning = CodGray,
)

private val DarkExtended = FortisExtendedColors(
    income = Oasis,
    expense = UltraRedLight,
    warning = Pineapple,
    onWarning = CodGray,
)

private val LocalFortisColors = staticCompositionLocalOf { LightExtended }

// ── Tema ──────────────────────────────────────────────
@Composable
fun FortisLibertasTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit,
) {
    val colors = if (darkTheme) DarkColors else LightColors
    val extended = if (darkTheme) DarkExtended else LightExtended

    CompositionLocalProvider(LocalFortisColors provides extended) {
        MaterialTheme(
            colorScheme = colors,
            typography = Typography,   // vem do Type.kt do template
            content = content,
        )
    }
}

// Acesso às cores próprias: FortisTheme.colors.income
object FortisTheme {
    val colors: FortisExtendedColors
        @Composable @ReadOnlyComposable
        get() = LocalFortisColors.current
}