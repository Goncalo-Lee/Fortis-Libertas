package pt.fortislibertas.data.model

import java.math.BigDecimal
import java.time.LocalDate

/**
 * Full data of one financial record, for the transaction details dialog.
 * [status] is the API key: active, settled, cancelled, pending, paid, late.
 */
data class TransactionDetail(
    val id: String,
    val name: String,
    val description: String?,
    val type: RecordType,
    val amount: BigDecimal,
    val currency: String,
    val date: LocalDate,
    val status: String,
    val categoryName: String,
    val categoryColorHex: String,
    val paymentMethodName: String?,
    val tagNames: List<String>,
    val instalmentPlanName: String?,
)

/** Everything that narrows the transaction list. Empty = show everything. */
data class TransactionFilter(
    val query: String = "",
    val type: RecordType? = null,
    val categoryIds: Set<String> = emptySet(),
    val tagIds: Set<String> = emptySet(),
    val minAmount: BigDecimal? = null,
    val maxAmount: BigDecimal? = null,
) {
    /** How many dialog filters are active (for the number on the button). */
    val activeCount: Int
        get() = listOf(
            categoryIds.isNotEmpty(),
            tagIds.isNotEmpty(),
            minAmount != null || maxAmount != null,
        ).count { it }
}

/** What the filter dialog needs to draw itself. */
data class FilterOptions(
    val categories: List<Category>,
    val tags: List<Tag>,
    val maxAmount: BigDecimal,         // highest amount among the transactions (end of the slider)
)
