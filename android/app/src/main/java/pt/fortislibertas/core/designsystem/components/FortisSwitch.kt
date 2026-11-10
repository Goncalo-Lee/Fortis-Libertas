package pt.fortislibertas.core.designsystem.components

import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.animateDpAsState
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.selection.toggleable
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import pt.fortislibertas.core.designsystem.preview.FortisPreviewTheme
import pt.fortislibertas.core.designsystem.preview.FortisPreviews
import pt.fortislibertas.core.designsystem.theme.CuriousBlue
import pt.fortislibertas.core.designsystem.theme.DeepBlue
import pt.fortislibertas.core.designsystem.theme.White

/**
 * Square switch from the wireframe: the track stays white and only the thumb changes,
 * Deep Blue on the left (off) → Curious Blue on the right (on). The thumb slides between them.
 *
 * With [onCheckedChange] = null the switch is not clickable by itself:
 * use that when a whole row (label + switch) is the toggle.
 */
@Composable
fun FortisSwitch(
    checked: Boolean,
    onCheckedChange: ((Boolean) -> Unit)?,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    width: Dp = 52.dp,
    thumbSize: Dp = 24.dp,
    trackColor: Color = White,
    checkedThumbColor: Color = CuriousBlue,
    uncheckedThumbColor: Color = DeepBlue,
) {
    val padding = 4.dp
    val thumbOffset by animateDpAsState(
        targetValue = if (checked) width - thumbSize - padding * 2 else 0.dp,
        label = "thumbOffset",
    )
    val thumbColor by animateColorAsState(
        targetValue = if (checked) checkedThumbColor else uncheckedThumbColor,
        label = "thumbColor",
    )

    val toggle = if (onCheckedChange != null) {
        Modifier.toggleable(value = checked, enabled = enabled, role = Role.Switch, onValueChange = onCheckedChange)
    } else Modifier

    Box(
        modifier = modifier
            .then(toggle)
            .alpha(if (enabled) 1f else 0.5f)
            .size(width = width, height = thumbSize + padding * 2)
            .clip(RoundedCornerShape(8.dp))
            .background(trackColor)
            .padding(padding),
        contentAlignment = Alignment.CenterStart,
    ) {
        Box(
            modifier = Modifier
                .offset(x = thumbOffset)
                .size(thumbSize)
                .clip(RoundedCornerShape(6.dp))
                .background(thumbColor),
        )
    }
}

@FortisPreviews
@Composable
private fun FortisSwitchPreview() {
    FortisPreviewTheme {
        Row(Modifier.padding(16.dp), horizontalArrangement = Arrangement.spacedBy(16.dp)) {
            FortisSwitch(checked = false, onCheckedChange = {})
            FortisSwitch(checked = true, onCheckedChange = {})
            FortisSwitch(checked = true, onCheckedChange = {}, enabled = false)
        }
    }
}
