package pt.fortislibertas.core.designsystem.components

import androidx.annotation.DrawableRes
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.size
import androidx.compose.material3.Icon
import androidx.compose.material3.LocalContentColor
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp

/**
 * Ícone feito de 2 camadas sobrepostas.
 * - base: usa a cor herdada (LocalContentColor), por isso segue o tema e o estado da barra
 * - accent: usa accentColor; se for null, também herda a cor
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
            // sem tint → usa LocalContentColor
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