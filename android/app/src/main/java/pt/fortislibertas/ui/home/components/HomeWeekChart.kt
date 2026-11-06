package pt.fortislibertas.ui.home.components

import androidx.compose.runtime.Composable
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.tooling.preview.Preview
import java.math.BigDecimal
import java.text.NumberFormat
import java.time.format.TextStyle
import java.util.Currency
import java.util.Locale
import pt.fortislibertas.R
import pt.fortislibertas.core.designsystem.components.charts.BarGroup
import pt.fortislibertas.core.designsystem.components.charts.GroupedBarChart
import pt.fortislibertas.core.designsystem.theme.FortisLibertasTheme
import pt.fortislibertas.core.designsystem.theme.FortisTheme
import pt.fortislibertas.core.designsystem.util.MoneyFormatter
import pt.fortislibertas.data.fake.FakeHomeData
import pt.fortislibertas.data.model.HomeSummary

/** Bar chart with the income and expenses of each day of the week. */
@Composable
fun HomeWeekChart(summary: HomeSummary) {
    val locale = Locale.getDefault()
    val totalIncome = summary.week.fold(BigDecimal.ZERO) { acc, d -> acc + d.income }
    val totalExpense = summary.week.fold(BigDecimal.ZERO) { acc, d -> acc + d.expense }

    GroupedBarChart(
        groups = summary.week.map { day ->
            BarGroup(
                // "seg." → "Seg" (short day name, capitalised)
                label = day.date.dayOfWeek.getDisplayName(TextStyle.SHORT, locale)
                    .removeSuffix(".")
                    .replaceFirstChar { it.titlecase(locale) },
                income = day.income.toFloat(),
                expense = day.expense.toFloat(),
            )
        },
        incomeColor = FortisTheme.colors.income,
        expenseColor = FortisTheme.colors.expense,
        axisLabel = { value -> shortMoney(value, summary.currency, locale) },
        contentDescription = stringResource(
            R.string.chart_week_description,
            MoneyFormatter.format(totalIncome, summary.currency),
            MoneyFormatter.format(totalExpense, summary.currency),
        ),
    )
}

/** Axis values without decimals: "100 €". */
private fun shortMoney(value: Float, currencyCode: String, locale: Locale): String {
    val nf = NumberFormat.getCurrencyInstance(locale).apply {
        currency = Currency.getInstance(currencyCode)
        maximumFractionDigits = 0
    }
    return nf.format(value)
}

@Preview(showBackground = true)
@Composable
private fun HomeWeekChartPreview() {
    FortisLibertasTheme {
        HomeWeekChart(FakeHomeData.build())
    }
}
