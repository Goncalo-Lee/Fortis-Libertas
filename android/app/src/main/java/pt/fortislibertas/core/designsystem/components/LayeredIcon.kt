package pt.fortislibertas.core.designsystem.components

import androidx.annotation.DrawableRes
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.material3.Icon
import androidx.compose.material3.LocalContentColor
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import pt.fortislibertas.R
import pt.fortislibertas.core.designsystem.preview.FortisPreviewTheme
import pt.fortislibertas.core.designsystem.preview.FortisPreviews

/**
 * Icon made of 2 stacked layers.
 * - base: uses the inherited colour (LocalContentColor), so it follows the theme and the bar state
 * - accent: uses accentColor; if it is null, it also inherits the colour
 */
@Composable
fun LayeredIcon(
    @DrawableRes base: Int,
    @DrawableRes accent: Int?,
    accentColor: Color?,
    modifier: Modifier = Modifier,
    size: Dp = 24.dp,
) {
    Box(modifier.size(size)) {
        Icon(
            painter = painterResource(base),
            contentDescription = null,
            modifier = Modifier.size(size),
            // no tint → uses LocalContentColor
        )
        if (accent != null) {
            Icon(
                painter = painterResource(accent),
                contentDescription = null,
                modifier = Modifier.size(size),
                tint = accentColor ?: LocalContentColor.current,
            )
        }
    }
}

@FortisPreviews
@Composable
private fun LayeredIconPreview() {
    FortisPreviewTheme {
        LayeredIcon(
            base = R.drawable.ic_nav_home_base,
            accent = R.drawable.ic_nav_home_accent,
            accentColor = MaterialTheme.colorScheme.secondary,
            size = 48.dp,
            modifier = Modifier.padding(16.dp),
        )
    }
}
