package pt.fortislibertas.data.repository

import pt.fortislibertas.data.model.FilterOptions
import pt.fortislibertas.data.model.TransactionFilter
import pt.fortislibertas.data.model.TransactionItem
import pt.fortislibertas.data.remote.TransactionApi
import retrofit2.HttpException
import java.io.IOException

/** Modo API: o servidor filtra; a app só envia os parâmetros. */
class RemoteTransactionRepository(
    private val api: TransactionApi,
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

    private suspend fun <T> call(block: suspend () -> T): T =
        try {
            block()
        } catch (e: HttpException) {
            if (e.code() == 401) throw SessionExpiredException() else throw e
        } catch (e: IOException) {
            throw NetworkException(e)
        }
}
