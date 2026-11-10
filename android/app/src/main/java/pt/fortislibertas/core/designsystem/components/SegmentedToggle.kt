package pt.fortislibertas.core.designsystem.components

import androidx.compose.animation.animateColorAsState
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.selection.selectableGroup
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
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
 * Two (or more) options side by side; the selected one is highlighted.
 * Brand colours by default, like the Sign In | Sign Up switch of the wireframe.
 */
@Composable
fun SegmentedToggle(
    options: List<String>,
    selectedIndex: Int,
    onSelect: (Int) -> Unit,
    modifier: Modifier = Modifier,
    height: Dp = 52.dp,
    selectedColor: Color = CuriousBlue,
    unselectedColor: Color = DeepBlue,
    contentColor: Color = White,
) {
    val shape = RoundedCornerShape(12.dp)
    Row(
        modifier = modifier
            .fillMaxWidth()
            .height(height)
            .clip(shape)
            .background(unselectedColor)
            .selectableGroup(),
    ) {
        options.forEachIndexed { index, label ->
            val selected = index == selectedIndex
            val background by animateColorAsState(
                targetValue = if (selected) selectedColor else unselectedColor,
                label = "segmentBackground",
            )
            Box(
                modifier = Modifier
                    .weight(1f)
                    .height(height)
                    .clip(shape)
                    .background(background)
                    .selectable(selected = selected, onClick = { onSelect(index) }, role = Role.Tab),
                contentAlignment = Alignment.Center,
            ) {
                Text(label, color = contentColor, style = MaterialTheme.typography.titleMedium)
            }
        }
    }
}

@FortisPreviews
@Composable
private fun SegmentedTogglePreview() {
    FortisPreviewTheme {
        SegmentedToggle(options = listOf("Sign In", "Sign Up"), selectedIndex = 0, onSelect = {})
    }
}
