package pt.fortislibertas.data.repository

import java.math.BigDecimal
import kotlinx.coroutines.async
import kotlinx.coroutines.coroutineScope
import pt.fortislibertas.data.model.FilterOptions
import pt.fortislibertas.data.model.TransactionDetail
import pt.fortislibertas.data.model.TransactionFilter
import pt.fortislibertas.data.model.TransactionItem
import pt.fortislibertas.data.remote.FinanceApi
import pt.fortislibertas.data.remote.loadLookup

/** API mode: GET /dashboards/{id}/financial-records; the server filters, the app sends the parameters. */
class RemoteTransactionRepository(
    private val api: FinanceApi,
    private val activeDashboardId: suspend () -> String?,
) : TransactionRepository {

    /** The newest 100 records that match (no "load more" yet). */
    override suspend fun getTransactions(filter: TransactionFilter): List<TransactionItem> = apiCall {
        val dashboardId = requireDashboard(activeDashboardId)
        val lookup = api.loadLookup(dashboardId)
        // The app's type can be several record types of the dashboard
        val typeIds = filter.type?.let { lookup.recordTypeIds(it) }
        if (typeIds != null && typeIds.isEmpty()) return@apiCall emptyList()

        api.getRecords(
            dashboardId,
            query = filter.query.trim().ifEmpty { null },
            recordTypeIds = typeIds?.joinToString(","),
            categoryIds = filter.categoryIds.takeIf { it.isNotEmpty() }?.joinToString(","),
            tagIds = filter.tagIds.takeIf { it.isNotEmpty() }?.joinToString(","),
            minPrice = filter.minAmount?.toPlainString(),
            maxPrice = filter.maxAmount?.toPlainString(),
        ).data.map { lookup.toItem(it) }
    }

    override suspend fun getFilterOptions(): FilterOptions = apiCall {
        val dashboardId = requireDashboard(activeDashboardId)
        coroutineScope {
            val lookup = async { api.loadLookup(dashboardId) }
            val tags = async { api.getTags(dashboardId).data }
            // End of the amount slider: the most expensive record
            val top = async { api.getRecords(dashboardId, sort = "-price", perPage = 1).data }
            val types = lookup.await()
            FilterOptions(
                categories = types.categories.map { types.toCategory(it) },
                tags = tags.await().map { it.toModel() },
                maxAmount = top.await().firstOrNull()?.price?.toBigDecimalOrNull() ?: BigDecimal.ZERO,
            )
        }
    }

    override suspend fun getDetail(summary: TransactionItem): TransactionDetail = apiCall {
        api.getRecord(requireDashboard(activeDashboardId), summary.id).data.toModel(summary)
    }

    override suspend fun delete(recordId: String) = apiCall {
        api.deleteRecord(requireDashboard(activeDashboardId), recordId)
    }
}
