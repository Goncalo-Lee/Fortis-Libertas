package pt.fortislibertas.data.repository

import java.math.BigDecimal
import java.math.RoundingMode
import java.time.DayOfWeek
import java.time.Duration
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.async
import kotlinx.coroutines.coroutineScope
import pt.fortislibertas.data.model.CardPreview
import pt.fortislibertas.data.model.DayTotals
import pt.fortislibertas.data.model.HomeSummary
import pt.fortislibertas.data.model.RecordType
import pt.fortislibertas.data.remote.FinanceApi
import pt.fortislibertas.data.remote.loadLookup

/** Statuses that count on the Home (everything except cancelled). */
private const val ACTIVE_STATUSES = "active,settled,pending,paid,late"

/** Statuses that change the balance (same rule as GET /balance). */
private val BALANCE_STATUSES = setOf("paid", "settled")

/**
 * API mode. GET /dashboards/{id}/home gives the balance and the recent records; the week chart and
 * the 7-day change come from the records of the last days, and the card stack from the wallet.
 */
class RemoteHomeRepository(
    private val api: FinanceApi,
    private val walletRepository: WalletRepository,
    private val activeDashboardId: suspend () -> String?,
) : HomeRepository {

    override suspend fun getHome(): HomeSummary = apiCall {
        val dashboardId = requireDashboard(activeDashboardId)
        val zone = ZoneId.systemDefault()
        val today = LocalDate.now(zone)
        val monday = today.with(DayOfWeek.MONDAY)
        val from = minOf(monday, today.minusDays(7))
        val to = monday.plusWeeks(1).atStartOfDay(zone).minusSeconds(1)

        coroutineScope {
            val home = async { api.getHome(dashboardId).data }
            val lookup = async { api.loadLookup(dashboardId) }
            val records = async {
                api.getRecords(
                    dashboardId,
                    from = from.atStartOfDay(zone).toInstant().toString(),
                    to = to.toInstant().toString(),
                    status = ACTIVE_STATUSES,
                ).data
            }
            // The card stack is decoration: if the wallet fails, the Home still opens
            val cards = async {
                try {
                    walletRepository.getWallet().cards
                } catch (e: CancellationException) {
                    throw e
                } catch (_: Exception) {
                    emptyList()
                }
            }

            val types = lookup.await()
            val all = records.await()
            val balance = home.await().balance.toBigDecimalOrNull() ?: BigDecimal.ZERO

            // Week chart: income and expense per day, Monday to Sunday (profile currency)
            val week = (0L..6L).map { offset ->
                val day = monday.plusDays(offset)
                val ofDay = all.filter { it.localDate(zone) == day }
                DayTotals(
                    date = day,
                    income = ofDay.filter { types.type(it.recordTypeId) == RecordType.INCOME }.sumOf { it.profileAmount },
                    expense = ofDay.filter { types.type(it.recordTypeId) == RecordType.EXPENSE }.sumOf { it.profileAmount },
                )
            }

            // Change: net of the paid records of the last 7 days (what moved the balance)
            val now = Instant.now()
            val weekAgo = now.minus(Duration.ofDays(7))
            val change = all
                .filter { it.status in BALANCE_STATUSES && it.instant > weekAgo && it.instant <= now }
                .sumOf {
                    when (types.type(it.recordTypeId)) {
                        RecordType.INCOME -> it.profileAmount
                        RecordType.EXPENSE -> it.profileAmount.negate()
                        RecordType.INVESTMENT -> BigDecimal.ZERO
                    }
                }
            val before = balance - change
            val percent = if (before.signum() == 0) null
            else change.multiply(BigDecimal(100)).divide(before.abs(), 1, RoundingMode.HALF_UP)

            HomeSummary(
                totalBalance = balance,
                balanceChange = change,
                balanceChangePercent = percent,
                currency = home.await().currency,
                cards = cards.await().map { CardPreview(it.id, it.colorHex) },
                week = week,
                recent = home.await().recentRecords.map { types.toItem(it) },
            )
        }
    }
}
