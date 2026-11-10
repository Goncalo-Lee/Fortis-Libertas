package pt.fortislibertas.ui.cards.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.AcUnit
import androidx.compose.material.icons.outlined.CreditCard
import androidx.compose.material.icons.outlined.Settings
import androidx.compose.material3.Icon
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import pt.fortislibertas.core.designsystem.preview.FortisPreviewTheme
import pt.fortislibertas.core.designsystem.preview.FortisPreviews
import pt.fortislibertas.core.designsystem.theme.CodGray
import pt.fortislibertas.core.designsystem.theme.CuriousBlue

/**
 * Round icon button with a "glass" look and a grey border (card buttons and the page toggle).
 * The glass is a translucent white layer: the card behind is a solid colour, so a real
 * backdrop blur would look the same and cost more.
 */
@Composable
fun CardsActionButton(
    icon: ImageVector,
    contentDescription: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    size: Dp = 48.dp,                                   // 48 dp = minimum touch area
    containerColor: Color = Color.White.copy(alpha = 0.35f),
    contentColor: Color = CodGray,
    borderColor: Color = Color(0xFF8A8F98),
) {
    Box(
        modifier = modifier
            .size(size)
            .alpha(if (enabled) 1f else 0.5f)
            .clip(CircleShape)
            .background(containerColor)
            .border(BorderStroke(1.5.dp, borderColor), CircleShape)
            .clickable(enabled = enabled, role = Role.Button, onClick = onClick),
        contentAlignment = Alignment.Center,
    ) {
        Icon(icon, contentDescription = contentDescription, tint = contentColor, modifier = Modifier.size(size * 0.45f))
    }
}

@FortisPreviews
@Composable
private fun CardsActionButtonPreview() {
    FortisPreviewTheme {
        Row(
            Modifier
                .background(CuriousBlue)
                .padding(16.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            CardsActionButton(Icons.Outlined.AcUnit, "Freeze", onClick = {})
            CardsActionButton(Icons.Outlined.Settings, "Edit", onClick = {})
            CardsActionButton(Icons.Outlined.CreditCard, "Details", onClick = {}, enabled = false)
        }
    }
}
