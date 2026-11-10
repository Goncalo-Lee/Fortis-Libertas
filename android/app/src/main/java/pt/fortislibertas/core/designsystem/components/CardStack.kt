package pt.fortislibertas.core.designsystem.components

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Add
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import pt.fortislibertas.core.designsystem.preview.FortisPreviewTheme
import pt.fortislibertas.core.designsystem.preview.FortisPreviews

/**
 * Stack of cards against the right edge, like in the Home wireframe.
 * Draws up to 3 cards, each one shifted [step] to the right.
 * The part that goes off-screen is cut on purpose ("there is more to see").
 *
 * The whole stack is a single button.
 */
@Composable
fun CardStack(
    colors: List<Color>,
    onClick: () -> Unit,
    onClickLabel: String,
    modifier: Modifier = Modifier,
    cardWidth: Dp = 100.dp,
    cardHeight: Dp = 150.dp,
    step: Dp = 14.dp,
) {
    val shown = colors.take(3)
    val count = maxOf(shown.size, 1)
    val shape = RoundedCornerShape(16.dp)

    Box(
        modifier = modifier
            .width(cardWidth + step * (count - 1))
            .height(cardHeight)
            .clip(shape)
            .clickable(role = Role.Button, onClickLabel = onClickLabel, onClick = onClick),
    ) {
        if (shown.isEmpty()) {
            // No cards yet: one grey card with a "+"
            Box(
                modifier = Modifier
                    .width(cardWidth)
                    .fillMaxHeight()
                    .clip(shape)
                    .background(MaterialTheme.colorScheme.surfaceVariant),
                contentAlignment = Alignment.CenterStart,
            ) {
                Icon(
                    imageVector = Icons.Outlined.Add,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.padding(start = 16.dp),
                )
            }
        }

        // The first in the list is at the back; the last is at the front
        shown.forEachIndexed { index, color ->
            Box(
                Modifier
                    .offset(x = step * index)
                    .width(cardWidth)
                    .fillMaxHeight()
                    .clip(shape)
                    .background(color),
            )
        }
    }
}

@FortisPreviews
@Composable
private fun CardStackPreview() {
    FortisPreviewTheme {
        Row(Modifier.padding(16.dp), horizontalArrangement = Arrangement.spacedBy(48.dp)) {
            CardStack(
                colors = listOf(Color(0xFFFFE761), Color(0xFF2092E9), Color(0xFF76C352)),
                onClick = {},
                onClickLabel = "Banks and cards",
            )
            CardStack(colors = emptyList(), onClick = {}, onClickLabel = "Add a card")
        }
    }
}
