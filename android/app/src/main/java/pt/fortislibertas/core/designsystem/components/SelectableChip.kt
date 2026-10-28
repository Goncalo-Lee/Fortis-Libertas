package pt.fortislibertas.core.designsystem.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Check
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import pt.fortislibertas.core.designsystem.theme.CuriousBlue

/** Chip que se liga e desliga, com visto quando está selecionado (tags). */
@Composable
fun SelectableChip(
    label: String,
    selected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    FilterChip(
        selected = selected,
        onClick = onClick,
        label = { Text(label) },
        modifier = modifier,
        leadingIcon = if (selected) {
            { Icon(Icons.Outlined.Check, contentDescription = null, modifier = Modifier.size(18.dp)) }
        } else null,
        colors = FilterChipDefaults.filterChipColors(
            selectedContainerColor = CuriousBlue.copy(alpha = 0.15f),
            selectedLabelColor = MaterialTheme.colorScheme.primary,
            selectedLeadingIconColor = MaterialTheme.colorScheme.primary,
        ),
    )
}

/** Bolinha de cor; com contorno quando está escolhida (cores das categorias). */
@Composable
fun ColorDot(
    color: Color,
    modifier: Modifier = Modifier,
    size: Dp = 12.dp,
    selected: Boolean = false,
    onClick: (() -> Unit)? = null,
) {
    Box(
        modifier = modifier
            .size(size)
            .clip(CircleShape)
            .background(color)
            .then(
                if (selected) Modifier.border(3.dp, MaterialTheme.colorScheme.onSurface, CircleShape)
                else Modifier,
            )
            .then(
                if (onClick != null) Modifier.clickable(role = Role.RadioButton, onClick = onClick)
                else Modifier,
            ),
        contentAlignment = Alignment.Center,
    ) {}
}

/** "#F97316" → Color. Se o texto vier mal formado, devolve cinzento. */
fun colorFromHex(hex: String): Color =
    runCatching { Color(android.graphics.Color.parseColor(hex)) }.getOrDefault(Color.Gray)
