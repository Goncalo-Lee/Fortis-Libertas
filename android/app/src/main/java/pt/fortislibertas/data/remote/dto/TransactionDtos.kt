package pt.fortislibertas.data.remote.dto

import kotlinx.serialization.Serializable
import pt.fortislibertas.data.model.FilterOptions
import java.math.BigDecimal

/** Resposta de GET /api/v1/records (reutiliza o TransactionDto do Home). */
@Serializable
data class TransactionListDto(val items: List<TransactionDto>)

/** Resposta de GET /api/v1/records/filter-options. */
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
