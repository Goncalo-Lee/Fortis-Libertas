package pt.fortislibertas.core.designsystem.components

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import pt.fortislibertas.core.designsystem.theme.CuriousBlue
import pt.fortislibertas.core.designsystem.theme.FortisLibertasTheme

/** Cartão quadrado grande com ícone e texto (os "+" do ecrã Register). */
@Composable
fun ActionTile(
    icon: ImageVector,
    title: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Surface(
        onClick = onClick,
        modifier = modifier.aspectRatio(1f),
        shape = RoundedCornerShape(24.dp),
        color = CuriousBlue.copy(alpha = 0.12f),
        contentColor = MaterialTheme.colorScheme.primary,
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp, Alignment.CenterVertically),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Icon(icon, contentDescription = null, modifier = Modifier.size(48.dp))
            Text(
                text = title,
                style = MaterialTheme.typography.titleSmall,
                textAlign = TextAlign.Center,
            )
        }
    }
}

@Preview(showBackground = true)
@Composable
private fun ActionTilePreview() {
    FortisLibertasTheme {
        ActionTile(
            icon = Icons.Default.Add,
            title = "Nova Transação",
            onClick = {},
            modifier = Modifier.size(140.dp),
        )
    }
}