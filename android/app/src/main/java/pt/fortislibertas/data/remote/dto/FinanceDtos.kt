package pt.fortislibertas.data.remote.dto

import java.math.BigDecimal
import java.time.Instant
import java.time.LocalDate
import java.time.OffsetDateTime
import java.time.ZoneId
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import pt.fortislibertas.data.model.Tag

// JSON of the dashboard resources used by Home, Transactions and New record (endpoints.md §10–§18).
// Only the fields the app uses; the rest is ignored (Json { ignoreUnknownKeys = true }).

// ── Responses ───────────────────────────────────────

/** Category (§11.2) with its colour and the record types it can be used with. */
@Serializable
data class CategoryApiDto(
    @SerialName("category_id") val id: String,
    val name: String,
    val color: ColorRefDto? = null,
    @SerialName("record_types") val recordTypes: List<RecordTypeRefDto> = emptyList(),
)

@Serializable
data class RecordTypeRefDto(@SerialName("record_type_id") val id: String)

/** Tag (§12.2); [categories] only comes with include=categories. */
@Serializable
data class TagApiDto(
    @SerialName("tag_id") val id: String,
    val name: String,
    val categories: List<CategoryIdDto> = emptyList(),
) {
    fun toModel() = Tag(id = id, name = name, categoryIds = categories.map { it.id }.toSet())
}

@Serializable
data class CategoryIdDto(@SerialName("category_id") val id: String)

/** Installment plan (§14.2): only what the "Instalment plan" field shows. */
@Serializable
data class InstallmentPlanApiDto(
    @SerialName("installment_plan_id") val id: String,
    val name: String,
)

/** Colour of the catalog (§17.2). [inUse] only comes with dashboard_id + scope. */
@Serializable
data class CatalogColorDto(
    @SerialName("color_id") val id: String,
    @SerialName("code_color") val codeColor: String,
    @SerialName("is_reserved") val isReserved: Boolean = false,
    @SerialName("in_use") val inUse: Boolean = false,
)

@Serializable
data class IconDto(@SerialName("icon_id") val id: String)

@Serializable
data class CurrencyDto(val code: String)

/** GET /dashboards/{id}/balance. */
@Serializable
data class BalanceDto(val balance: String, val currency: String)

/** GET /dashboards/{id}/home (§18.3): only the parts the Android Home uses. */
@Serializable
data class HomeResponseDto(
    val currency: String = "EUR",
    val balance: String = "0",
    @SerialName("recent_records") val recentRecords: List<FinancialRecordDto> = emptyList(),
)

/** Amount in the caller's profile currency (§1.8); null when it is already in that currency. */
@Serializable
data class ConvertedDto(val amount: String, val currency: String)

/** Financial record (§15.2), as it comes in lists. */
@Serializable
data class FinancialRecordDto(
    @SerialName("financial_record_id") val id: String,
    @SerialName("record_type_id") val recordTypeId: String,
    @SerialName("category_id") val categoryId: String,
    val name: String,
    val price: String,
    val currency: String,
    val converted: ConvertedDto? = null,
    @SerialName("payment_date") val paymentDate: String,
    val status: String,
) {
    /** Amount in the profile currency, for totals that mix currencies. */
    val profileAmount: BigDecimal
        get() = (converted?.amount ?: price).toBigDecimalOrNull() ?: BigDecimal.ZERO

    val instant: Instant get() = OffsetDateTime.parse(paymentDate).toInstant()

    fun localDate(zone: ZoneId = ZoneId.systemDefault()): LocalDate = instant.atZone(zone).toLocalDate()
}

// ── Requests ────────────────────────────────────────
// Nulls and empty lists with a default are not sent (encodeDefaults = false).

/** POST /financial-records (§15.3). In a plan, type and category come from the plan. */
@Serializable
data class CreateFinancialRecordDto(
    @SerialName("record_type_id") val recordTypeId: String? = null,
    @SerialName("category_id") val categoryId: String? = null,
    @SerialName("payment_method_id") val paymentMethodId: String,
    @SerialName("installment_plan_id") val installmentPlanId: String? = null,
    val name: String,
    val description: String? = null,
    val price: String,
    val currency: String,
    @SerialName("payment_date") val paymentDate: String,
    val status: String,
    @SerialName("tag_ids") val tagIds: List<String> = emptyList(),
)

/** POST /installment-plans (§14.3). [dueDate] is the final due date of the whole plan. */
@Serializable
data class CreateInstallmentPlanDto(
    val name: String,
    val description: String? = null,
    @SerialName("category_id") val categoryId: String,
    val currency: String,
    @SerialName("tag_ids") val tagIds: List<String> = emptyList(),
    @SerialName("total_amount") val totalAmount: String,
    @SerialName("total_installments") val totalInstallments: Int,
    @SerialName("due_date") val dueDate: String,
)

@Serializable
data class CreateTagDto(val name: String)

/** POST /categories (§11.3). */
@Serializable
data class CreateCategoryDto(
    val name: String,
    @SerialName("record_type_ids") val recordTypeIds: List<String>,
    @SerialName("color_id") val colorId: String,
    @SerialName("icon_id") val iconId: String,
)
