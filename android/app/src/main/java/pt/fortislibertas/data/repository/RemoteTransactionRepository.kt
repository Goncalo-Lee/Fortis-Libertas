package pt.fortislibertas.data.repository

import java.io.IOException
import pt.fortislibertas.data.model.FilterOptions
import pt.fortislibertas.data.model.TransactionDetail
import pt.fortislibertas.data.model.TransactionFilter
import pt.fortislibertas.data.model.TransactionItem
import pt.fortislibertas.data.remote.TransactionApi
import retrofit2.HttpException

/** API mode: the server filters; the app only sends the parameters. */
class RemoteTransactionRepository(
    private val api: TransactionApi,
    /** TODO: the active dashboard (see "alinhar a app com a API"); null until the app knows it. */
    private val activeDashboardId: suspend () -> String? = { null },
) : TransactionRepository {

    override suspend fun getTransactions(filter: TransactionFilter): List<TransactionItem> = call {
        api.getRecords(
            search = filter.query.trim().ifEmpty { null },
            type = filter.type?.name?.lowercase(),
            categoryIds = filter.categoryIds.takeIf { it.isNotEmpty() }?.joinToString(","),
            tagIds = filter.tagIds.takeIf { it.isNotEmpty() }?.joinToString(","),
            minAmount = filter.minAmount?.toPlainString(),
            maxAmount = filter.maxAmount?.toPlainString(),
        ).items.map { it.toModel() }
    }

    override suspend fun getFilterOptions(): FilterOptions = call { api.getFilterOptions().toModel() }

    override suspend fun getDetail(summary: TransactionItem): TransactionDetail = call {
        api.getRecord(dashboardId(), summary.id).data.toModel(summary)
    }

    override suspend fun delete(recordId: String) = call { api.deleteRecord(dashboardId(), recordId) }

    private suspend fun dashboardId(): String =
        activeDashboardId() ?: throw IllegalStateException("No active dashboard yet")

    private suspend fun <T> call(block: suspend () -> T): T =
        try {
            block()
        } catch (e: HttpException) {
            if (e.code() == 401) throw SessionExpiredException() else throw e
        } catch (e: IOException) {
            throw NetworkException(e)
        }
}
