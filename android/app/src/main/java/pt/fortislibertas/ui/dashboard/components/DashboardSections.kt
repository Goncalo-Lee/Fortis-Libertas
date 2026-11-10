package pt.fortislibertas.ui.dashboard.components

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowDropDown
import androidx.compose.material.icons.filled.ArrowDropUp
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import java.math.BigDecimal
import java.math.RoundingMode
import pt.fortislibertas.R
import pt.fortislibertas.core.designsystem.components.ColorDot
import pt.fortislibertas.core.designsystem.components.FortisCard
import pt.fortislibertas.core.designsystem.components.SegmentedToggle
import pt.fortislibertas.core.designsystem.components.charts.DonutChart
import pt.fortislibertas.core.designsystem.components.charts.DonutSlice
import pt.fortislibertas.core.designsystem.components.charts.LineChart
import pt.fortislibertas.core.designsystem.components.colorFromHex
import pt.fortislibertas.core.designsystem.preview.FortisPreviewTheme
import pt.fortislibertas.core.designsystem.preview.FortisPreviews
import pt.fortislibertas.core.designsystem.theme.FortisTheme
import pt.fortislibertas.core.designsystem.util.MoneyFormatter
import pt.fortislibertas.data.model.CategoryTotal
import pt.fortislibertas.data.model.RecordKind
import pt.fortislibertas.data.model.RecordTypeTotal
import pt.fortislibertas.ui.dashboard.DashboardPeriod

/** Top 5 categories on the cards row; the rest only in "View all". */
const val DASHBOARD_TOP_CATEGORIES = 5

/** "Total spent in November", the big amount, "▲ 50 € vs last period" and the spending per month. */
@Composable
fun DashboardSpentHeader(
    periodLabel: String,
    spent: BigDecimal,
    previousSpent: BigDecimal,
    currency: String,
    perMonth: List<BigDecimal>,
    monthLabels: List<String>,
    modifier: Modifier = Modifier,
) {
    val change = spent - previousSpent
    // Spending more is bad → red; spending less → green
    val trendColor = when (change.signum()) {
        1 -> FortisTheme.colors.expense
        -1 -> FortisTheme.colors.income
        else -> MaterialTheme.colorScheme.onSurfaceVariant
    }
    Column(modifier.fillMaxWidth(), horizontalAlignment = Alignment.CenterHorizontally) {
        Text(
            stringResource(R.string.dash_total_spent, periodLabel),
            style = MaterialTheme.typography.labelLarge,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
        Text(
            MoneyFormatter.format(spent, currency),
            style = MaterialTheme.typography.displaySmall.copy(fontWeight = FontWeight.Bold),
        )
        Row(verticalAlignment = Alignment.CenterVertically) {
            when (change.signum()) {
                1 -> Icon(Icons.Filled.ArrowDropUp, contentDescription = null, tint = trendColor)
                -1 -> Icon(Icons.Filled.ArrowDropDown, contentDescription = null, tint = trendColor)
            }
            Text(MoneyFormatter.format(change.abs(), currency), style = MaterialTheme.typography.labelLarge, color = trendColor)
            Text(
                "  " + stringResource(R.string.dash_vs_last),
                style = MaterialTheme.typography.labelLarge,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
        Spacer(Modifier.height(12.dp))
        LineChart(
            values = perMonth.map { it.toFloat() },
            labels = monthLabels,
            contentDescription = stringResource(R.string.dash_chart_spent),
            color = FortisTheme.colors.expense,
        )
    }
}

/** "Spending by category" with the top 5 cards in a row and "View all >". */
@Composable
fun DashboardCategoryCards(
    categories: List<CategoryTotal>,
    currency: String,
    onViewAll: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Column(modifier.fillMaxWidth()) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text(
                stringResource(R.string.dash_by_category),
                style = MaterialTheme.typography.titleMedium,
                modifier = Modifier.weight(1f),
            )
            if (categories.size > DASHBOARD_TOP_CATEGORIES) {
                TextButton(onClick = onViewAll) { Text(stringResource(R.string.dash_view_all) + " >") }
            }
        }

        Spacer(Modifier.height(8.dp))

        if (categories.isEmpty()) {
            EmptyNote()
        } else {
            LazyRow(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                items(categories.take(DASHBOARD_TOP_CATEGORIES), key = { it.id }) { category ->
                    FortisCard(modifier = Modifier.width(132.dp)) {
                        ColorDot(color = colorFromHex(category.colorHex), size = 28.dp)
                        Spacer(Modifier.height(8.dp))
                        Text(category.name, style = MaterialTheme.typography.bodyMedium, maxLines = 1, overflow = TextOverflow.Ellipsis)
                        Text(
                            MoneyFormatter.format(category.total, currency),
                            style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.SemiBold),
                        )
                    }
                }
            }
        }
    }
}

/**
 * Two donuts side by side: categories of the chosen kind ("Expenses ▾") and the
 * share of each record type in the period, with the Month / Year toggle.
 */
@Composable
fun DashboardBreakdown(
    kind: RecordKind,
    categories: List<CategoryTotal>,
    types: List<RecordTypeTotal>,
    period: DashboardPeriod,
    periodLabel: String,
    onKindChange: (RecordKind) -> Unit,
    onPeriodChange: (DashboardPeriod) -> Unit,
    modifier: Modifier = Modifier,
) {
    val other = stringResource(R.string.dash_other)
    Row(modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(16.dp)) {
        // ── Categories of one kind ──
        Column(Modifier.weight(1f), horizontalAlignment = Alignment.CenterHorizontally) {
            // Pill on the left of the column (like the wireframe); the donut stays centred
            DashboardDropdown(
                options = listOf(RecordKind.EXPENSE, RecordKind.INCOME),
                selected = kind,
                optionLabel = { stringResource(if (it == RecordKind.EXPENSE) R.string.dash_expenses else R.string.dash_income) },
                onSelect = onKindChange,
                optionColorHex = { if (it == RecordKind.EXPENSE) "#EF4444" else "#22C55E" },
                modifier = Modifier.align(Alignment.Start),
            )
            Spacer(Modifier.height(12.dp))
            // Top 3 + "Other", like the reference design
            val top = categories.take(3)
            val rest = categories.drop(3).sumOf { it.total }
            val legend = top.map { Triple(it.name, it.colorHex, it.total) } +
                (if (rest.signum() > 0) listOf(Triple(other, "#8A8F98", rest)) else emptyList())
            val total = legend.sumOf { it.third }
            DonutChart(
                slices = legend.map { DonutSlice(it.third.toFloat(), colorFromHex(it.second)) },
                contentDescription = stringResource(R.string.dash_chart_categories),
                centerText = legend.firstOrNull()?.let { percent(it.third, total) },
                centerColor = legend.firstOrNull()?.let { colorFromHex(it.second) } ?: MaterialTheme.colorScheme.onSurface,
            )
            Spacer(Modifier.height(12.dp))
            legend.forEach { (name, hex, value) -> DashboardLegendRow(name, hex, percent(value, total)) }
        }

        // ── Record types ──
        Column(Modifier.weight(1f), horizontalAlignment = Alignment.CenterHorizontally) {
            SegmentedToggle(
                options = listOf(stringResource(R.string.dash_month), stringResource(R.string.dash_year)),
                selectedIndex = period.ordinal,
                onSelect = { onPeriodChange(DashboardPeriod.entries[it]) },
                height = 40.dp,
            )
            Spacer(Modifier.height(12.dp))
            Text(periodLabel, style = MaterialTheme.typography.titleMedium, textAlign = TextAlign.Center)
            Spacer(Modifier.height(8.dp))
            val total = types.sumOf { it.total }
            DonutChart(
                slices = types.map { DonutSlice(it.total.toFloat(), colorFromHex(it.colorHex)) },
                contentDescription = stringResource(R.string.dash_chart_types),
                size = 120.dp,
                thickness = 28.dp,
            )
            Spacer(Modifier.height(12.dp))
            types.forEach { DashboardLegendRow(it.name, it.colorHex, percent(it.total, total)) }
        }
    }
}

/** Bottom chart: one record type (dropdown) month by month, with the latest value highlighted. */
@Composable
fun DashboardTrend(
    types: List<RecordTypeTotal>,
    selected: RecordTypeTotal?,
    perMonth: List<BigDecimal>,
    monthLabels: List<String>,
    currency: String,
    onSelect: (String) -> Unit,
    modifier: Modifier = Modifier,
) {
    if (selected == null) return
    val color = colorFromHex(selected.colorHex)
    Column(modifier.fillMaxWidth()) {
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            DashboardDropdown(
                options = types,
                selected = selected,
                optionLabel = { it.name },
                onSelect = { onSelect(it.id) },
                optionColorHex = { it.colorHex },
            )
            Spacer(Modifier.weight(1f))
            Text(
                MoneyFormatter.format(perMonth.lastOrNull() ?: BigDecimal.ZERO, currency),
                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                color = color,
            )
        }
        Spacer(Modifier.height(8.dp))
        LineChart(
            values = perMonth.map { it.toFloat() },
            labels = monthLabels,
            contentDescription = stringResource(R.string.dash_chart_trend),
            color = color,
        )
    }
}

/** ● Name  36% */
@Composable
fun DashboardLegendRow(label: String, colorHex: String, percent: String, modifier: Modifier = Modifier) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .padding(vertical = 2.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        ColorDot(color = colorFromHex(colorHex), size = 10.dp)
        Text(label, style = MaterialTheme.typography.bodySmall, maxLines = 1, overflow = TextOverflow.Ellipsis, modifier = Modifier.weight(1f))
        Text(percent, style = MaterialTheme.typography.labelLarge.copy(fontWeight = FontWeight.SemiBold))
    }
}

@Composable
private fun EmptyNote() {
    Text(
        stringResource(R.string.dash_no_data),
        style = MaterialTheme.typography.bodyMedium,
        color = MaterialTheme.colorScheme.onSurfaceVariant,
        modifier = Modifier.padding(vertical = 16.dp),
    )
}

/** 36.4 → "36%". */
fun percent(value: BigDecimal, total: BigDecimal): String =
    if (total.signum() == 0) "0%"
    else value.multiply(BigDecimal(100)).divide(total, 0, RoundingMode.HALF_UP).toPlainString() + "%"

@FortisPreviews
@Composable
private fun DashboardLegendRowPreview() {
    FortisPreviewTheme {
        Column(Modifier.padding(16.dp)) {
            DashboardLegendRow("Restaurantes", "#F97316", "36%")
            DashboardLegendRow("Supermercado", "#22C55E", "24%")
        }
    }
}
