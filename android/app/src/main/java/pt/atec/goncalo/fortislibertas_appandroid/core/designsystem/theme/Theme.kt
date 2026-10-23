package pt.atec.goncalo.fortislibertas_appandroid.core.designsystem.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable

private val LightColors = lightColorScheme(
    primary = FortisPrimary,
    onPrimary = FortisOnPrimary,
    background = FortisBackground,
    surface = FortisSurface,
    error = FortisError
)

private val DarkColors = darkColorScheme(
    primary = FortisPrimaryDark,
    background = FortisBackgroundDark,
    surface = FortisSurfaceDark,
    error = FortisError
)

@Composable
fun FortisTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    MaterialTheme(
        colorScheme = if (darkTheme) DarkColors else LightColors,
        typography = FortisTypography,
        shapes = FortisShapes,
        content = content
    )
}
