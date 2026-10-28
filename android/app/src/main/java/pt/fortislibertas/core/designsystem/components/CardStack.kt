package pt.fortislibertas.core.designsystem.components

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
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

/**
 * Pilha de cartões encostada à direita, como no wireframe do Home.
 * Desenha até 3 cartões, cada um desviado [step] para a direita.
 * A parte que sai do ecrã fica cortada de propósito ("há mais para ver").
 *
 * Toda a pilha é um único botão.
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
            // Ainda sem cartões: um cartão cinzento com "+"
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

        // O primeiro da lista fica atrás; o último fica à frente
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
