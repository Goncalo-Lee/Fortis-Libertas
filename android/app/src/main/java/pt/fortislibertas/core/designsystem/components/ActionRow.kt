package pt.fortislibertas.core.designsystem.components

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.KeyboardArrowRight
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.dp
import pt.fortislibertas.core.designsystem.theme.CodGray
import pt.fortislibertas.core.designsystem.theme.CuriousBlue
import pt.fortislibertas.core.designsystem.theme.FortisTheme

/** Tom da linha: normal, aviso (desativar) ou perigo (apagar). */
enum class ActionTone { Default, Warning, Danger }

/**
 * Linha clicável: quadrado com ícone + título + descrição + seta.
 * Usada no Profile (Password, Banks, Dashboards, Apagar conta…) e reutilizável
 * noutros ecrãs, como Definições.
 */
@Composable
fun ActionRow(
    icon: ImageVector,
    title: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    description: String? = null,
    tone: ActionTone = ActionTone.Default,
    showChevron: Boolean = true,
) {
    val colors = actionToneColors(tone)

    FortisCard(
        modifier = modifier,
        onClick = onClick,
        contentPadding = PaddingValues(horizontal = 16.dp, vertical = 14.dp),
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            IconTile(
                icon = icon,
                containerColor = colors.tileContainer,
                contentColor = colors.tileContent,
            )
            Column(Modifier.weight(1f)) {
                Text(
                    text = title,
                    style = MaterialTheme.typography.titleSmall,
                    color = colors.title,
                )
                if (description != null) {
                    Text(
                        text = description,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.padding(top = 2.dp),
                    )
                }
            }
            if (showChevron) {
                Icon(
                    imageVector = Icons.AutoMirrored.Outlined.KeyboardArrowRight,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
        }
    }
}

private data class ActionToneColors(
    val title: Color,
    val tileContainer: Color,
    val tileContent: Color,
)

@Composable
private fun actionToneColors(tone: ActionTone): ActionToneColors = when (tone) {
    ActionTone.Default -> ActionToneColors(
        title = MaterialTheme.colorScheme.primary,
        tileContainer = CuriousBlue.copy(alpha = 0.15f),
        tileContent = MaterialTheme.colorScheme.primary,
    )
    ActionTone.Warning -> ActionToneColors(
        title = MaterialTheme.colorScheme.onSurface,
        tileContainer = FortisTheme.colors.warning,      // Pineapple: só como fundo
        tileContent = CodGray,
    )
    ActionTone.Danger -> ActionToneColors(
        title = MaterialTheme.colorScheme.error,
        tileContainer = MaterialTheme.colorScheme.error.copy(alpha = 0.12f),
        tileContent = MaterialTheme.colorScheme.error,
    )
}
