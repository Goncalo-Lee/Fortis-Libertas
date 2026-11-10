package pt.fortislibertas.core.designsystem.components

import androidx.compose.animation.animateColorAsState
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.LocalContentColor
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import dev.chrisbanes.haze.HazeState
import dev.chrisbanes.haze.hazeChild
import dev.chrisbanes.haze.materials.ExperimentalHazeMaterialsApi
import dev.chrisbanes.haze.materials.HazeMaterials
import pt.fortislibertas.core.designsystem.theme.CuriousBlue
import pt.fortislibertas.core.designsystem.theme.White
import pt.fortislibertas.ui.navigation.TopLevelDestination

@OptIn(ExperimentalHazeMaterialsApi::class)
@Composable
fun FortisBottomBar(
    current: TopLevelDestination?,
    onNavigate: (TopLevelDestination) -> Unit,
    hazeState: HazeState,
    modifier: Modifier = Modifier,
) {
    val barShape = RoundedCornerShape(24.dp)

    Box(
        modifier = modifier
            .fillMaxWidth()
            .navigationBarsPadding()
            .padding(horizontal = 16.dp, vertical = 12.dp),
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .clip(barShape)
                .background(MaterialTheme.colorScheme.surface.copy(alpha = 0.7f))
                .border(1.dp, Color.Gray, barShape)
                .hazeChild(state = hazeState, style = HazeMaterials.thin())
                .padding(6.dp),                       // space between the bar and the square
            horizontalArrangement = Arrangement.spacedBy(4.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            TopLevelDestination.entries.forEach { destination ->
                FortisNavItem(
                    destination = destination,
                    selected = destination == current,
                    onClick = { onNavigate(destination) },
                    modifier = Modifier.weight(1f),   // the 5 items with the same width
                )
            }
        }
    }
}

@Composable
private fun FortisNavItem(
    destination: TopLevelDestination,
    selected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    // Smooth animation when switching tabs
    val contentColor by animateColorAsState(
        targetValue = if (selected) CuriousBlue else MaterialTheme.colorScheme.onSurfaceVariant,
        label = "navContentColor",
    )
    val backgroundColor by animateColorAsState(
        targetValue = if (selected) White else White.copy(alpha = 0f),
        label = "navBackground",
    )
    val itemShape = RoundedCornerShape(16.dp)

    Column(
        modifier = modifier
            .clip(itemShape)                          // the touch ripple also gets rounded corners
            .background(backgroundColor)
            .selectable(
                selected = selected,
                onClick = onClick,
                role = Role.Tab,                      // TalkBack announces it as a tab
            )
            .padding(vertical = 8.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(4.dp),
    ) {
        // The icon inherits this colour (base layer of LayeredIcon)
        CompositionLocalProvider(LocalContentColor provides contentColor) {
            LayeredIcon(
                base = destination.baseIcon,
                accent = destination.accentIcon,
                accentColor = null,                   // whole icon in CuriousBlue when active
                size = 24.dp,
            )
        }
        Text(
            text = stringResource(destination.labelRes),
            style = MaterialTheme.typography.labelSmall,
            color = contentColor,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
        )
    }
}