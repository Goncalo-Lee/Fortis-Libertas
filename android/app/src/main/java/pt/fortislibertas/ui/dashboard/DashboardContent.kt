package pt.fortislibertas.ui.dashboard

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import java.math.BigDecimal
import java.time.LocalDate
import java.time.YearMonth
import java.time.format.TextStyle
import java.util.Locale
import pt.fortislibertas.R
import pt.fortislibertas.core.designsystem.components.ErrorContent
import pt.fortislibertas.core.designsystem.components.FortisTopBar
import pt.fortislibertas.core.designsystem.components.LoadingContent
import pt.fortislibertas.core.designsystem.preview.FortisPreviewTheme
import pt.fortislibertas.core.designsystem.preview.FortisScreenPreviews
import pt.fortislibertas.data.model.CategoryTotal
import pt.fortislibertas.data.model.Dashboard
import pt.fortislibertas.data.model.RecordKind
import pt.fortislibertas.data.model.RecordTypeTotal
import pt.fortislibertas.ui.dashboard.components.DashboardBreakdown
import pt.fortislibertas.ui.dashboard.components.DashboardCategoryCards
import pt.fortislibertas.ui.dashboard.components.DashboardSpentHeader
import pt.fortislibertas.ui.dashboard.components.DashboardTrend

/**
 * Stateless Dashboard tab: spent this period + chart, spending by category,
 * the two donuts (categories / record types) and the evolution of one record type.
 */
@Composable
fun DashboardContent(
    state: DashboardUiState,
    contentPadding: PaddingValues,
    onOpenNotifications: () -> Unit,
    onRetry: () -> Unit,
    onViewAllCategories: () -> Unit,
    onKindChange: (RecordKind) -> Unit,
    onPeriodChange: (DashboardPeriod) -> Unit,
    onTrendTypeChange: (String) -> Unit,
    modifier: Modifier = Modifier,
) {
    val locale = Locale.getDefault()
    val today = LocalDate.now()
    val periodLabel = when (state.period) {
        DashboardPeriod.Month -> today.month.getDisplayName(TextStyle.FULL_STANDALONE, locale).replaceFirstChar { it.titlecase(locale) }
        DashboardPeriod.Year -> today.year.toString()
    }
    // "nov" → "Nov"
    val monthLabels = state.months.map {
        it.month.month.getDisplayName(TextStyle.SHORT, locale).removeSuffix(".").replaceFirstChar { c -> c.titlecase(locale) }
    }

    Column(
        modifier = modifier
            .verticalScroll(rememberScrollState())
            .padding(contentPadding)
            .padding(horizontal = 20.dp, vertical = 16.dp),
        verticalArrangement = Arrangement.spacedBy(24.dp),
    ) {
        FortisTopBar(
            title = state.activeDashboard?.name ?: stringResource(R.string.dash_title),
            avatarName = state.userName,
            avatarUrl = state.avatarUrl,
            notificationCount = 0,                      // TODO: connect to the notifications count
            notificationsLabel = stringResource(R.string.notifications),
            onNotificationsClick = onOpenNotifications,
        )

        when {
            state.isLoading && state.months.isEmpty() -> LoadingContent(Modifier.height(300.dp))
            state.errorMessage != null -> ErrorContent(
                message = stringResource(state.errorMessage),
                retryLabel = stringResource(R.string.action_retry),
                onRetry = onRetry,
                modifier = Modifier.height(300.dp),
            )
            state.dashboards.isEmpty() -> Text(
                stringResource(R.string.dash_no_dashboard),
                textAlign = TextAlign.Center,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.fillMaxWidth().padding(vertical = 48.dp),
            )
            else -> {
                // Thin bar while reloading data that is already on screen
                if (state.isLoading) LinearProgressIndicator(Modifier.fillMaxWidth())

                DashboardSpentHeader(
                    periodLabel = periodLabel,
                    spent = state.spent,
                    previousSpent = state.previousSpent,
                    currency = state.currency,
                    perMonth = state.spentPerMonth,
                    monthLabels = monthLabels,
                )
                DashboardCategoryCards(
                    categories = state.categoryTotals,
                    currency = state.currency,
                    onViewAll = onViewAllCategories,
                )
                HorizontalDivider()
                DashboardBreakdown(
                    kind = state.breakdownKind,
                    categories = state.categoryTotals,
                    types = state.typeTotals,
                    period = state.period,
                    periodLabel = periodLabel,
                    onKindChange = onKindChange,
                    onPeriodChange = onPeriodChange,
                )
                HorizontalDivider()
                DashboardTrend(
                    types = state.typeTotals,
                    selected = state.trendType,
                    perMonth = state.trendPerMonth,
                    monthLabels = monthLabels,
                    currency = state.currency,
                    onSelect = onTrendTypeChange,
                )
            }
        }
    }
}

// ── Previews ────────────────────────────────────────────

@FortisScreenPreviews
@Composable
private fun DashboardContentPreview() {
    val expense = RecordTypeTotal("expense", "Despesa", RecordKind.EXPENSE, "#EF4444", BigDecimal("350.00"))
    val income = RecordTypeTotal("income", "Receita", RecordKind.INCOME, "#22C55E", BigDecimal("1250.00"))
    val now = YearMonth.now()
    FortisPreviewTheme {
        DashboardContent(
            state = DashboardUiState(
                dashboards = listOf(Dashboard("d", "Pessoal", true, "owner")),
                activeDashboardId = "d",
                isLoading = false,
                typeTotals = listOf(expense, income),
                previousSpent = BigDecimal("300.00"),
                categoryTotals = listOf(
                    CategoryTotal("a", "Restaurantes", "#F97316", BigDecimal("97.90")),
                    CategoryTotal("b", "Supermercado", "#22C55E", BigDecimal("61.88")),
                    CategoryTotal("c", "Transportes", "#2092E9", BigDecimal("100.00")),
                ),
                months = (5 downTo 0).map { back ->
                    MonthTotals(
                        now.minusMonths(back.toLong()),
                        listOf(
                            expense.copy(total = BigDecimal(200 + back * 30)),
                            income.copy(total = BigDecimal(1000 + back * 50)),
                        ),
                    )
                },
            ),
            contentPadding = PaddingValues(),
            onOpenNotifications = {}, onRetry = {}, onViewAllCategories = {},
            onKindChange = {}, onPeriodChange = {}, onTrendTypeChange = {},
        )
    }
}
