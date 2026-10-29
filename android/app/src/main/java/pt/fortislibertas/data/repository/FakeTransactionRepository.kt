package pt.fortislibertas.data.repository

import kotlinx.coroutines.delay
import pt.fortislibertas.data.local.FakeRecordData
import pt.fortislibertas.data.local.FakeTransactionData
import pt.fortislibertas.data.model.FilterOptions
import pt.fortislibertas.data.model.TransactionFilter
import pt.fortislibertas.data.model.TransactionItem
import java.math.BigDecimal

/** Modo local: filtra a lista de teste em memória, como faria o servidor. */
class FakeTransactionRepository : TransactionRepository {

    override suspend fun getTransactions(filter: TransactionFilter): List<TransactionItem> {
        delay(250)
        val query = filter.query.trim()
        return FakeTransactionData.build()
            .asSequence()
            .filter {
                query.isEmpty() ||
                        it.item.name.contains(query, ignoreCase = true) ||
                        it.item.categoryName.contains(query, ignoreCase = true)
            }
            .filter { filter.type == null || it.item.type == filter.type }
            .filter { filter.categoryIds.isEmpty() || it.categoryId in filter.categoryIds }
            .filter { filter.tagIds.isEmpty() || it.tagIds.any { tag -> tag in filter.tagIds } }
            .filter { filter.minAmount == null || it.item.amount >= filter.minAmount }
            .filter { filter.maxAmount == null || it.item.amount <= filter.maxAmount }
            .sortedByDescending { it.item.date }
            .map { it.item }
            .toList()
    }

    override suspend fun getFilterOptions(): FilterOptions {
        delay(150)
        val options = FakeRecordData.options()
        return FilterOptions(
            categories = options.categories,
            tags = options.tags,
            maxAmount = FakeTransactionData.build().maxOfOrNull { it.item.amount } ?: BigDecimal.ZERO,
        )
    }
}
