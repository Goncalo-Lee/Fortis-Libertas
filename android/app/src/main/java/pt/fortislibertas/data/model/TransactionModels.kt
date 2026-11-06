package pt.fortislibertas.data.model

import java.math.BigDecimal

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
