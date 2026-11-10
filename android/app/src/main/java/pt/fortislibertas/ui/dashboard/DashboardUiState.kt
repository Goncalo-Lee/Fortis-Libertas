package pt.fortislibertas.ui.dashboard

import androidx.annotation.StringRes
import java.math.BigDecimal
import java.time.YearMonth
import pt.fortislibertas.data.model.CategoryTotal
import pt.fortislibertas.data.model.Dashboard
import pt.fortislibertas.data.model.PaymentCard
import pt.fortislibertas.data.model.RecordFormOptions
import pt.fortislibertas.data.model.RecordKind
import pt.fortislibertas.data.model.RecordType
import pt.fortislibertas.data.model.RecordTypeTotal

/** Period of the summary: this month or this year (Month / Year toggle). */
enum class DashboardPeriod { Month, Year }

/** Totals of each record type in one month (for the line charts). */
data class MonthTotals(val month: YearMonth, val types: List<RecordTypeTotal>)

/** The 4 actions of the management button (members are managed on the website). */
enum class ManageDialog { SwitchDashboard, Categories, Tags, PaymentMethods }

/**
 * One management dialog: the current lists (from the record form options) and the
 * "add" form at the bottom. Only list + add in the app; editing/deleting is on the website.
 */
data class ManageState(
    val dialog: ManageDialog,
    val options: RecordFormOptions? = null,
    val isLoading: Boolean = dialog != ManageDialog.SwitchDashboard,
    val newName: String = "",
    val newType: RecordType = RecordType.EXPENSE,          // categories only
    val newColorKey: String? = null,                       // categories only
    val cards: List<PaymentCard> = emptyList(),            // payment methods only
    val newCardId: String? = null,                         // payment methods only (null = no card)
    val isSaving: Boolean = false,
    @StringRes val error: Int? = null,
)

/** Everything the Dashboard tab needs to draw itself. */
data class DashboardUiState(
    val dashboards: List<Dashboard> = emptyList(),
    val activeDashboardId: String? = null,
    val period: DashboardPeriod = DashboardPeriod.Month,
    val breakdownKind: RecordKind = RecordKind.EXPENSE,      // "Expenses ▾ / Income ▾" of the donut
    val trendTypeId: String? = null,                         // record type of the bottom chart
    val isLoading: Boolean = true,
    @StringRes val errorMessage: Int? = null,
    val currency: String = "EUR",
    val typeTotals: List<RecordTypeTotal> = emptyList(),     // current period
    val previousSpent: BigDecimal = BigDecimal.ZERO,         // expenses of the previous period
    val categoryTotals: List<CategoryTotal> = emptyList(),   // current period, of breakdownKind
    val months: List<MonthTotals> = emptyList(),             // oldest first
    val showAllCategories: Boolean = false,
    val manage: ManageState? = null,                         // not null = a management dialog is open
    val userName: String? = null,
    val avatarUrl: String? = null,
) {
    val activeDashboard: Dashboard? get() = dashboards.firstOrNull { it.id == activeDashboardId }

    /** Expenses of the current period. */
    val spent: BigDecimal get() = typeTotals.filter { it.kind == RecordKind.EXPENSE }.sumOf { it.total }

    /** Expenses of each month (top chart). */
    val spentPerMonth: List<BigDecimal>
        get() = months.map { m -> m.types.filter { it.kind == RecordKind.EXPENSE }.sumOf { it.total } }

    /** Record type of the bottom chart: the chosen one, or the first. */
    val trendType: RecordTypeTotal? get() = typeTotals.firstOrNull { it.id == trendTypeId } ?: typeTotals.firstOrNull()

    /** Totals of [trendType] in each month (bottom chart). */
    val trendPerMonth: List<BigDecimal>
        get() = months.map { m -> m.types.firstOrNull { it.id == trendType?.id }?.total ?: BigDecimal.ZERO }
}
