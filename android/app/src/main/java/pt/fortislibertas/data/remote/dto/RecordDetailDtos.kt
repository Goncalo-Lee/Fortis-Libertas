package pt.fortislibertas.data.remote.dto

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import pt.fortislibertas.data.model.TransactionDetail
import pt.fortislibertas.data.model.TransactionItem
import java.math.BigDecimal
import java.time.LocalDate

/** JSON of GET .../financial-records/{id}?include=... (endpoints.md §15.2). */
@Serializable
data class RecordDetailDto(
    @SerialName("financial_record_id") val id: String,
    val name: String,
    val description: String? = null,
    val price: String,
    val currency: String,
    @SerialName("payment_date") val paymentDate: String,
    val status: String,
    val tags: List<RecordTagRefDto> = emptyList(),
    val category: NamedRefDto? = null,
    @SerialName("payment_method") val paymentMethod: NamedRefDto? = null,
    @SerialName("installment_plan") val installmentPlan: NamedRefDto? = null,
) {
    /**
     * [summary] is the list item that was tapped: it already has the type and the
     * category colour, which the included summary objects do not have.
     */
    fun toModel(summary: TransactionItem) = TransactionDetail(
        id = id,
        name = name,
        description = description?.takeIf { it.isNotBlank() },
        type = summary.type,
        amount = price.toBigDecimalOrNull() ?: BigDecimal.ZERO,
        currency = currency,
        date = runCatching { LocalDate.parse(paymentDate.take(10)) }.getOrDefault(summary.date),
        status = status,
        categoryName = category?.name ?: summary.categoryName,
        categoryColorHex = summary.categoryColorHex,
        paymentMethodName = paymentMethod?.name,
        tagNames = tags.map { it.name },
        instalmentPlanName = installmentPlan?.name,
    )
}

@Serializable
data class RecordTagRefDto(@SerialName("tag_id") val id: String, val name: String)

/** Summary object of include=... ({ id, name }); only the name is used. */
@Serializable
data class NamedRefDto(val name: String)
