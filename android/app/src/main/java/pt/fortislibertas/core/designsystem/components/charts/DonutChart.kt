package pt.fortislibertas.core.designsystem.components.charts

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import pt.fortislibertas.core.designsystem.preview.FortisPreviewTheme
import pt.fortislibertas.core.designsystem.preview.FortisPreviews

/** One slice of the donut: its value and colour. */
data class DonutSlice(val value: Float, val color: Color)

/**
 * Donut chart with rounded slices and a small gap between them (like the reference design).
 * [centerText] is drawn in the middle (e.g. the share of the biggest slice).
 */
@Composable
fun DonutChart(
    slices: List<DonutSlice>,
    contentDescription: String,
    modifier: Modifier = Modifier,
    size: Dp = 140.dp,
    thickness: Dp = 16.dp,
    centerText: String? = null,
    centerColor: Color = MaterialTheme.colorScheme.onSurface,
) {
    val empty = MaterialTheme.colorScheme.surfaceVariant
    Box(
        modifier = modifier
            .size(size)
            .clearAndSetSemantics { this.contentDescription = contentDescription },
        contentAlignment = Alignment.Center,
    ) {
        Canvas(Modifier.fillMaxSize().padding(thickness / 2)) {
            val stroke = Stroke(width = thickness.toPx(), cap = StrokeCap.Round)
            val total = slices.sumOf { it.value.toDouble() }.toFloat()
            if (total <= 0f) {
                drawArc(empty, 0f, 360f, useCenter = false, style = stroke)
                return@Canvas
            }
            // Gap between slices (in degrees) so the rounded ends do not touch
            val gap = if (slices.count { it.value > 0f } > 1) 14f else 0f
            var start = -90f
            slices.filter { it.value > 0f }.forEach { slice ->
                val sweep = slice.value / total * 360f
                drawArc(slice.color, start + gap / 2, (sweep - gap).coerceAtLeast(1f), useCenter = false, style = stroke)
                start += sweep
            }
        }
        centerText?.let {
            Text(it, style = MaterialTheme.typography.headlineSmall.copy(fontWeight = FontWeight.Bold), color = centerColor)
        }
    }
}

@FortisPreviews
@Composable
private fun DonutChartPreview() {
    FortisPreviewTheme {
        DonutChart(
            slices = listOf(
                DonutSlice(36f, Color(0xFF7FC4F0)),
                DonutSlice(24f, Color(0xFF6B73FF)),
                DonutSlice(22f, Color(0xFF5BA86B)),
                DonutSlice(14f, Color(0xFF555555)),
            ),
            contentDescription = "Expenses by category",
            centerText = "36%",
            modifier = Modifier.padding(16.dp),
        )
    }
}
