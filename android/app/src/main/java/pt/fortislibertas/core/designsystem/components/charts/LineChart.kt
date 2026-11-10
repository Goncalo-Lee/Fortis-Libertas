package pt.fortislibertas.core.designsystem.components.charts

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import pt.fortislibertas.core.designsystem.preview.FortisPreviewTheme
import pt.fortislibertas.core.designsystem.preview.FortisPreviews
import pt.fortislibertas.core.designsystem.theme.CuriousBlue

/**
 * Smooth line chart (one point per label), drawn with Canvas.
 * The last point gets a dot, like "this month" in the wireframe.
 */
@Composable
fun LineChart(
    values: List<Float>,
    labels: List<String>,
    contentDescription: String,
    modifier: Modifier = Modifier,
    color: Color = CuriousBlue,
    chartHeight: Dp = 120.dp,
) {
    val baseline = MaterialTheme.colorScheme.outline
    Column(modifier.clearAndSetSemantics { this.contentDescription = contentDescription }) {
        Canvas(
            Modifier
                .fillMaxWidth()
                .height(chartHeight)
                .padding(vertical = 8.dp),
        ) {
            if (values.isEmpty()) return@Canvas
            val max = values.max().coerceAtLeast(1f)
            val stepX = if (values.size > 1) size.width / (values.size - 1) else 0f
            val points = values.mapIndexed { i, v -> Offset(i * stepX, size.height - (v / max) * size.height) }

            // Smooth curve: each segment is a cubic with control points halfway on X
            val path = Path().apply {
                moveTo(points.first().x, points.first().y)
                for (i in 1 until points.size) {
                    val prev = points[i - 1]
                    val cur = points[i]
                    val midX = (prev.x + cur.x) / 2
                    cubicTo(midX, prev.y, midX, cur.y, cur.x, cur.y)
                }
            }
            drawLine(baseline, Offset(0f, size.height), Offset(size.width, size.height), strokeWidth = 1.dp.toPx())
            drawPath(path, color, style = Stroke(width = 3.dp.toPx(), cap = StrokeCap.Round))
            drawCircle(color, radius = 5.dp.toPx(), center = points.last())
        }
        Row(Modifier.fillMaxWidth()) {
            labels.forEachIndexed { i, label ->
                Text(
                    text = label,
                    style = MaterialTheme.typography.labelSmall,
                    color = if (i == labels.lastIndex) color else MaterialTheme.colorScheme.onSurfaceVariant,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.weight(1f),
                )
            }
        }
    }
}

@FortisPreviews
@Composable
private fun LineChartPreview() {
    FortisPreviewTheme {
        LineChart(
            values = listOf(120f, 180f, 150f, 210f, 170f, 320f),
            labels = listOf("Jun", "Jul", "Aug", "Sep", "Oct", "Nov"),
            contentDescription = "Spending",
            modifier = Modifier.padding(16.dp),
        )
    }
}
