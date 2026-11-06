package pt.fortislibertas.core.designsystem.components

import androidx.activity.compose.BackHandler
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.spring
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Add
import androidx.compose.material.icons.outlined.CalendarMonth
import androidx.compose.material.icons.outlined.Close
import androidx.compose.material.icons.outlined.PostAdd
import androidx.compose.material.icons.outlined.Savings
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.dp
import kotlin.math.cos
import kotlin.math.roundToInt
import kotlin.math.sin
import pt.fortislibertas.core.designsystem.preview.FortisPreviewTheme
import pt.fortislibertas.core.designsystem.preview.FortisPreviews

/** One arc shortcut: icon + text + what it does. */
data class ArcAction(
    val icon: ImageVector,
    val label: String,
    val onClick: () -> Unit,
)

/**
 * Floating button that opens shortcuts in an arc above it.
 * Place it on top of the screen content (inside a Box that fills the screen).
 */
@Composable
fun ArcMenu(
    actions: List<ArcAction>,
    triggerIcon: ImageVector,
    triggerLabel: String,
    modifier: Modifier = Modifier,
    radius: Dp = 140.dp,
    startAngle: Float = 165f,   // left
    endAngle: Float = 15f,      // right
) {
    var expanded by rememberSaveable { mutableStateOf(false) }

    // 0 = closed, 1 = open; with a "spring" for a more natural effect
    val progress by animateFloatAsState(
        targetValue = if (expanded) 1f else 0f,
        animationSpec = spring(dampingRatio = 0.7f, stiffness = Spring.StiffnessMediumLow),
        label = "arcProgress",
    )

    // The Android back button closes the menu instead of leaving the screen
    BackHandler(enabled = expanded) { expanded = false }

    Box(modifier.fillMaxSize()) {
        // Dark background: tapping outside closes it
        if (progress > 0f) {
            Box(
                Modifier
                    .fillMaxSize()
                    .graphicsLayer { alpha = progress }
                    .background(Color.Black.copy(alpha = 0.35f))
                    .clickable(
                        interactionSource = remember { MutableInteractionSource() },
                        indication = null,
                    ) { expanded = false },
            )
        }

        Box(
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .padding(bottom = 16.dp),
            contentAlignment = Alignment.Center,
        ) {
            // The shortcuts start under the button and "come out" of it
            if (progress > 0f) {
                actions.forEachIndexed { index, action ->
                    val angle = if (actions.size == 1) 90.0
                    else startAngle - index * (startAngle - endAngle) / (actions.size - 1).toDouble()
                    val rad = Math.toRadians(angle)

                    ArcItem(
                        action = action,
                        enabled = expanded,
                        onClick = {
                            expanded = false
                            action.onClick()
                        },
                        modifier = Modifier
                            // offset also moves the touch area
                            .offset {
                                val r = radius.toPx() * progress
                                IntOffset(
                                    x = (r * cos(rad)).roundToInt(),
                                    y = -(r * sin(rad)).roundToInt(),   // negative = up
                                )
                            }
                            .graphicsLayer {
                                alpha = progress
                                scaleX = 0.6f + 0.4f * progress
                                scaleY = 0.6f + 0.4f * progress
                            },
                    )
                }
            }

            FloatingActionButton(
                onClick = { expanded = !expanded },
                shape = CircleShape,
                containerColor = MaterialTheme.colorScheme.primary,
                contentColor = MaterialTheme.colorScheme.onPrimary,
            ) {
                Icon(
                    imageVector = if (expanded) Icons.Outlined.Close else triggerIcon,
                    contentDescription = triggerLabel,
                    modifier = Modifier.graphicsLayer { rotationZ = 90f * progress },
                )
            }
        }
    }
}

@Composable
private fun ArcItem(
    action: ArcAction,
    enabled: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Column(
        modifier = modifier,
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(4.dp),
    ) {
        Surface(
            onClick = onClick,
            enabled = enabled,
            shape = CircleShape,
            color = MaterialTheme.colorScheme.surface,
            contentColor = MaterialTheme.colorScheme.primary,
            shadowElevation = 4.dp,
            modifier = Modifier.size(48.dp),
        ) {
            Box(contentAlignment = Alignment.Center) {
                Icon(action.icon, contentDescription = action.label)
            }
        }
        Text(
            text = action.label,
            style = MaterialTheme.typography.labelSmall,
            color = MaterialTheme.colorScheme.onSurface,
            modifier = Modifier
                .background(MaterialTheme.colorScheme.surface, RoundedCornerShape(8.dp))
                .padding(horizontal = 6.dp, vertical = 2.dp),
        )
    }
}

@FortisPreviews
@Composable
private fun ArcMenuPreview() {
    FortisPreviewTheme {
        Box(Modifier.size(width = 360.dp, height = 320.dp)) {
            ArcMenu(
                actions = listOf(
                    ArcAction(Icons.Outlined.PostAdd, "Record") {},
                    ArcAction(Icons.Outlined.CalendarMonth, "Plan") {},
                    ArcAction(Icons.Outlined.Savings, "Savings") {},
                ),
                triggerIcon = Icons.Outlined.Add,
                triggerLabel = "Add",
            )
        }
    }
}
