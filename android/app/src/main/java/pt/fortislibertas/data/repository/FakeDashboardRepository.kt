package pt.fortislibertas.data.repository

import kotlinx.coroutines.delay
import pt.fortislibertas.data.fake.FakeDashboardData
import pt.fortislibertas.data.fake.FakeRecordData
import pt.fortislibertas.data.fake.FakeTransactionData
import pt.fortislibertas.data.model.CategoryTotal
import pt.fortislibertas.data.model.Dashboard
import pt.fortislibertas.data.model.RecordKind
import pt.fortislibertas.data.model.RecordType
import pt.fortislibertas.data.model.RecordTypeTotal
import java.math.BigDecimal
import java.math.RoundingMode
import java.time.LocalDate

/**
 * Local mode: totals come from FakeTransactionData (which only has recent days).
 * Older months get the same records scaled by a fixed factor per month,
 * so the charts have a believable shape.
 */
class FakeDashboardRepository : DashboardRepository {

    override suspend fun getDashboards(): List<Dashboard> {
        delay(250)
        return FakeDashboardData.dashboards
    }

    override suspend fun getRecordTypeTotals(dashboardId: String, from: LocalDate, to: LocalDate): List<RecordTypeTotal> {
        delay(200)
        val entries = entriesFor(from, to, dashboardId)
        return RecordType.entries.map { type ->
            RecordTypeTotal(
                id = type.name.lowercase(),
                name = TYPE_NAMES.getValue(type),
                kind = type.kind(),
                colorHex = TYPE_COLORS.getValue(type),
                total = entries.filter { it.first.type == type }.sumOf { it.second },
            )
        }
    }

    override suspend fun getCategoryTotals(
        dashboardId: String,
        from: LocalDate,
        to: LocalDate,
        kind: RecordKind,
    ): List<CategoryTotal> {
        delay(200)
        val categories = FakeRecordData.options().categories.associateBy { it.name }
        return entriesFor(from, to, dashboardId)
            .filter { it.first.type.kind() == kind }
            .groupBy { it.first.categoryName }
            .map { (name, items) ->
                CategoryTotal(
                    id = categories[name]?.id ?: name,
                    name = name,
                    colorHex = items.first().first.categoryColorHex,
                    total = items.sumOf { it.second },
                )
            }
            .sortedByDescending { it.total }
    }

    /** (record, amount) pairs of the period: real dates for the current month, scaled copies for older ones. */
    private fun entriesFor(from: LocalDate, to: LocalDate, dashboardId: String) =
        generateSequence(from.withDayOfMonth(1)) { it.plusMonths(1) }
            .takeWhile { !it.isAfter(to) }
            .flatMap { month ->
                // The second dashboard has smaller numbers, so switching is visible
                val factor = monthFactor(month) * (if (dashboardId == "dash-home") 0.4 else 1.0)
                FakeTransactionData.build().map { it.item }.map { item ->
                    item to item.amount.multiply(BigDecimal(factor)).setScale(2, RoundingMode.HALF_UP)
                }
            }
            .toList()

    private fun monthFactor(month: LocalDate): Double {
        val now = LocalDate.now().withDayOfMonth(1)
        if (month == now) return 1.0
        return FACTORS[Math.floorMod(month.monthValue * 7 + month.year, FACTORS.size)]
    }

    private fun RecordType.kind() = when (this) {
        RecordType.INCOME -> RecordKind.INCOME
        RecordType.EXPENSE -> RecordKind.EXPENSE
        RecordType.INVESTMENT -> RecordKind.NEUTRAL
    }

    private companion object {
        val FACTORS = listOf(0.7, 1.15, 0.9, 1.3, 0.8, 1.05, 0.95, 1.2)
        val TYPE_NAMES = mapOf(RecordType.EXPENSE to "Despesa", RecordType.INCOME to "Receita", RecordType.INVESTMENT to "Investimento")
        val TYPE_COLORS = mapOf(RecordType.EXPENSE to "#EF4444", RecordType.INCOME to "#22C55E", RecordType.INVESTMENT to "#2092E9")
    }
}
