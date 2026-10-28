package pt.fortislibertas.core.designsystem.components

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import kotlin.math.floor
import kotlin.math.log10
import kotlin.math.pow

/** Um grupo do gráfico: o rótulo por baixo e os dois valores. */
data class BarGroup(val label: String, val income: Float, val expense: Float)

private val LabelHeight = 24.dp

/**
 * Gráfico de barras agrupadas (despesa + receita por dia), feito só com
 * Box e Row: sem biblioteca, sem Canvas. Cada barra é uma Box cuja altura
 * é uma fração da altura disponível (valor ÷ máximo).
 */
@Composable
fun GroupedBarChart(
    groups: List<BarGroup>,
    incomeColor: Color,
    expenseColor: Color,
    axisLabel: (Float) -> String,
    contentDescription: String,
    modifier: Modifier = Modifier,
    chartHeight: Dp = 180.dp,
) {
    val rawMax = groups.maxOfOrNull { maxOf(it.income, it.expense) } ?: 0f
    val max = niceMax(rawMax)
    val lineColor = MaterialTheme.colorScheme.outline

    // As barras crescem desde 0 na primeira vez que o gráfico aparece
    var visible by remember { mutableStateOf(false) }
    LaunchedEffect(Unit) { visible = true }

    Row(
        modifier = modifier
            .fillMaxWidth()
            .height(chartHeight)
            // O TalkBack lê um resumo em vez de 14 barras soltas
            .clearAndSetSemantics { this.contentDescription = contentDescription },
    ) {
        // Eixo Y: máximo, metade, zero
        Column(
            modifier = Modifier
                .fillMaxHeight()
                .padding(end = 8.dp, bottom = LabelHeight),
            verticalArrangement = Arrangement.SpaceBetween,
            horizontalAlignment = Alignment.End,
        ) {
            listOf(max, max / 2, 0f).forEach {
                Text(
                    text = axisLabel(it),
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
        }

        Row(Modifier.weight(1f).fillMaxHeight()) {
            groups.forEach { group ->
                Column(
                    modifier = Modifier.weight(1f).fillMaxHeight(),
                    horizontalAlignment = Alignment.CenterHorizontally,
                ) {
                    Row(
                        modifier = Modifier
                            .weight(1f)
                            .fillMaxWidth()
                            .drawBehind {
                                // Linha de base por baixo das barras
                                drawLine(
                                    color = lineColor,
                                    start = Offset(0f, size.height),
                                    end = Offset(size.width, size.height),
                                    strokeWidth = 1.dp.toPx(),
                                )
                            },
                        verticalAlignment = Alignment.Bottom,
                        horizontalArrangement = Arrangement.spacedBy(3.dp, Alignment.CenterHorizontally),
                    ) {
                        Bar(if (visible) group.expense / max else 0f, expenseColor)
                        Bar(if (visible) group.income / max else 0f, incomeColor)
                    }
                    Box(Modifier.height(LabelHeight), contentAlignment = Alignment.Center) {
                        Text(
                            text = group.label,
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun Bar(fraction: Float, color: Color) {
    val animated by animateFloatAsState(
        targetValue = fraction.coerceIn(0f, 1f),
        animationSpec = tween(durationMillis = 600),
        label = "barHeight",
    )
    Box(
        Modifier
            .width(10.dp)
            .fillMaxHeight(animated)
            .clip(RoundedCornerShape(topStart = 4.dp, topEnd = 4.dp))
            .background(color),
    )
}

/**
 * Arredonda o máximo para um valor "bonito" no eixo:
 * 88 → 100 · 112 → 200 · 1 250 → 2 000 · 0 → 100
 */
private fun niceMax(value: Float): Float {
    if (value <= 0f) return 100f
    val magnitude = 10.0.pow(floor(log10(value.toDouble())))
    val normalized = value / magnitude
    val nice = when {
        normalized <= 1.0 -> 1.0
        normalized <= 2.0 -> 2.0
        normalized <= 5.0 -> 5.0
        else -> 10.0
    }
    return (nice * magnitude).toFloat()
}
