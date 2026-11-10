package pt.fortislibertas.data.repository

import java.math.BigDecimal
import java.time.LocalDate
import kotlinx.coroutines.delay
import pt.fortislibertas.data.fake.FakeRecordData
import pt.fortislibertas.data.fake.FakeTransactionData
import pt.fortislibertas.data.model.FilterOptions
import pt.fortislibertas.data.model.TransactionDetail
import pt.fortislibertas.data.model.TransactionFilter
import pt.fortislibertas.data.model.TransactionItem

/** Local mode: filters the test list in memory, like the server would. */
class FakeTransactionRepository : TransactionRepository {

    /** Records deleted while the app is open (local mode has no database). */
    private val deletedIds = mutableSetOf<String>()

    override suspend fun getTransactions(filter: TransactionFilter): List<TransactionItem> {
        delay(250)
        val query = filter.query.trim()
        return FakeTransactionData.build()
            .asSequence()
            .filter { it.item.id !in deletedIds }
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

    override suspend fun getDetail(summary: TransactionItem): TransactionDetail {
        delay(300)
        val options = FakeRecordData.options()
        val entry = FakeTransactionData.build().firstOrNull { it.item.id == summary.id }
        val tagNames = entry?.tagIds.orEmpty().mapNotNull { id -> options.tags.firstOrNull { it.id == id }?.name }
        return TransactionDetail(
            id = summary.id,
            name = summary.name,
            description = FakeTransactionData.descriptions[summary.id],
            type = summary.type,
            amount = summary.amount,
            currency = summary.currency,
            date = summary.date,
            status = if (summary.date.isAfter(LocalDate.now())) "pending" else "paid",
            categoryName = summary.categoryName,
            categoryColorHex = summary.categoryColorHex,
            // Always the same method for the same record
            paymentMethodName = options.paymentMethods[Math.floorMod(summary.id.hashCode(), options.paymentMethods.size)].name,
            tagNames = tagNames,
            instalmentPlanName = null,
        )
    }

    override suspend fun delete(recordId: String) {
        delay(400)
        deletedIds += recordId
    }
}
