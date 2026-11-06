package pt.fortislibertas.core.designsystem.preview

import android.content.res.Configuration
import androidx.compose.ui.tooling.preview.Preview

/**
 * Shows a preview twice: light and dark theme.
 * Works because FortisLibertasTheme follows the system theme (isSystemInDarkTheme) by default,
 * so do not pass darkTheme = ... inside a preview that uses this annotation.
 *
 * Use it on small components.
 */
@Preview(name = "Light", showBackground = true, backgroundColor = 0xFFFAFBFC)
@Preview(
    name = "Dark",
    showBackground = true,
    backgroundColor = 0xFF171717,
    uiMode = Configuration.UI_MODE_NIGHT_YES or Configuration.UI_MODE_TYPE_NORMAL,
)
annotation class FortisPreviews

/**
 * Same as [FortisPreviews] but tall enough to show a whole scrolling screen.
 *
 * Use it on <Feature>Content previews.
 */
@Preview(name = "Light", showBackground = true, backgroundColor = 0xFFFAFBFC, heightDp = 1400)
@Preview(
    name = "Dark",
    showBackground = true,
    backgroundColor = 0xFF171717,
    heightDp = 1400,
    uiMode = Configuration.UI_MODE_NIGHT_YES or Configuration.UI_MODE_TYPE_NORMAL,
)
annotation class FortisScreenPreviews
