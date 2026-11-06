package pt.fortislibertas.data.remote.dto

import kotlinx.serialization.Serializable
import pt.fortislibertas.data.model.FilterOptions
import java.math.BigDecimal

/** Response of GET /api/v1/records (reuses the Home TransactionDto). */
@Serializable
data class TransactionListDto(val items: List<TransactionDto>)

/** Response of GET /api/v1/records/filter-options. */
@Serializable
data class FilterOptionsDto(
    val categories: List<CategoryDto>,
    val tags: List<TagDto>,
    val maxAmount: String = "0",
) {
    fun toModel() = FilterOptions(
        categories = categories.map { it.toModel() },
        tags = tags.map { it.toModel() },
        maxAmount = maxAmount.toBigDecimalOrNull() ?: BigDecimal.ZERO,
    )
}
