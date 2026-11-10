package pt.fortislibertas.data.repository

import java.io.IOException
import java.math.BigDecimal
import java.time.LocalDate
import java.time.ZoneId
import kotlinx.coroutines.async
import kotlinx.coroutines.coroutineScope
import pt.fortislibertas.data.model.CategoryTotal
import pt.fortislibertas.data.model.Dashboard
import pt.fortislibertas.data.model.RecordKind
import pt.fortislibertas.data.model.RecordTypeTotal
import pt.fortislibertas.data.remote.DashboardApi
import pt.fortislibertas.data.remote.dto.CreateDashboardDto
import retrofit2.HttpException

/**
 * API mode: reports/summary gives totals by key and label; the record types and
 * categories lists add what the summary does not have (kind and colour).
 */
class RemoteDashboardRepository(
    private val api: DashboardApi,
) : DashboardRepository {

    override suspend fun getDashboards(): List<Dashboard> = call { api.getDashboards().data.map { it.toModel() } }

    override suspend fun createDashboard(name: String): Dashboard =
        call { api.createDashboard(CreateDashboardDto(name.trim())).data.toModel() }

    override suspend fun getRecordTypeTotals(dashboardId: String, from: LocalDate, to: LocalDate) = call {
        coroutineScope {
            val types = async { api.getRecordTypes(dashboardId).data.associateBy { it.id } }
            val summary = async { api.getSummary(dashboardId, from.startIso(), to.endIso(), "record_type").data }
            val byId = types.await()
            summary.await().groups.map { group ->
                val type = byId[group.key]
                RecordTypeTotal(
                    id = group.key,
                    name = group.label,
                    kind = type?.recordKind ?: RecordKind.NEUTRAL,
                    colorHex = type?.color?.codeColor ?: "#8A8F98",
                    total = group.total.toBigDecimalOrNull() ?: BigDecimal.ZERO,
                )
            }
        }
    }

    override suspend fun getCategoryTotals(dashboardId: String, from: LocalDate, to: LocalDate, kind: RecordKind) = call {
        coroutineScope {
            val categories = async { api.getCategories(dashboardId).data.associateBy { it.id } }
            // TODO: filter by kind when reports/summary accepts a record type filter (see plano-api-cartoes)
            val summary = async { api.getSummary(dashboardId, from.startIso(), to.endIso(), "category").data }
            val byId = categories.await()
            summary.await().groups
                .map { group ->
                    CategoryTotal(
                        id = group.key,
                        name = group.label,
                        colorHex = byId[group.key]?.color?.codeColor ?: "#8A8F98",
                        total = group.total.toBigDecimalOrNull() ?: BigDecimal.ZERO,
                    )
                }
                .sortedByDescending { it.total }
        }
    }

    private suspend fun <T> call(block: suspend () -> T): T =
        try {
            block()
        } catch (e: HttpException) {
            if (e.code() == 401) throw SessionExpiredException() else throw e
        } catch (e: IOException) {
            throw NetworkException(e)
        }
}

// reports/summary needs full ISO date-times, not only dates (a plain "2026-10-01" is rejected).
// The period is in the phone's time zone: from 00:00:00 of the first day to 23:59:59 of the last.
private fun LocalDate.startIso(): String = atStartOfDay(ZoneId.systemDefault()).toInstant().toString()

private fun LocalDate.endIso(): String =
    plusDays(1).atStartOfDay(ZoneId.systemDefault()).minusSeconds(1).toInstant().toString()
