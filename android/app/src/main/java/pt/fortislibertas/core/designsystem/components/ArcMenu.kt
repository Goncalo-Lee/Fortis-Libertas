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
import androidx.compose.material.icons.outlined.Close
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

/** Um atalho do arco: ícone + texto + o que faz. */
data class ArcAction(
    val icon: ImageVector,
    val label: String,
    val onClick: () -> Unit,
)

/**
 * Botão flutuante que abre atalhos em arco por cima dele.
 * Põe-se por cima do conteúdo do ecrã (dentro de um Box que ocupa o ecrã todo).
 */
@Composable
fun ArcMenu(
    actions: List<ArcAction>,
    triggerIcon: ImageVector,
    triggerLabel: String,
    modifier: Modifier = Modifier,
    radius: Dp = 140.dp,
    startAngle: Float = 165f,   // esquerda
    endAngle: Float = 15f,      // direita
) {
    var expanded by rememberSaveable { mutableStateOf(false) }

    // 0 = fechado, 1 = aberto; com "mola" para um efeito mais natural
    val progress by animateFloatAsState(
        targetValue = if (expanded) 1f else 0f,
        animationSpec = spring(dampingRatio = 0.7f, stiffness = Spring.StiffnessMediumLow),
        label = "arcProgress",
    )

    // O botão "voltar" do Android fecha o menu em vez de sair do ecrã
    BackHandler(enabled = expanded) { expanded = false }

    Box(modifier.fillMaxSize()) {
        // Fundo escuro: tocar fora fecha
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
            // Os atalhos ficam por baixo do botão e "saem" dele
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
                            // offset move também a zona de toque
                            .offset {
                                val r = radius.toPx() * progress
                                IntOffset(
                                    x = (r * cos(rad)).roundToInt(),
                                    y = -(r * sin(rad)).roundToInt(),   // negativo = para cima
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