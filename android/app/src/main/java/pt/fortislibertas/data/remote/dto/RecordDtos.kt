package pt.fortislibertas.data.remote.dto

import kotlinx.serialization.Serializable
import pt.fortislibertas.data.model.Category
import pt.fortislibertas.data.model.ColorOption
import pt.fortislibertas.data.model.InstalmentPlanOption
import pt.fortislibertas.data.model.PaymentMethod
import pt.fortislibertas.data.model.RecordFormOptions
import pt.fortislibertas.data.model.RecordType
import pt.fortislibertas.data.model.Tag

// ── Respostas ───────────────────────────────────────────

@Serializable
data class ColorDto(val key: String, val hexLight: String, val hexDark: String) {
    fun toModel() = ColorOption(key = key, hex = hexLight)
}

@Serializable
data class CategoryDto(
    val id: String,
    val name: String,
    val type: String,                  // "expense" | "income" | "investment"
    val color: ColorDto,
) {
    fun toModel() = Category(
        id = id,
        name = name,
        type = recordTypeFrom(type),
        colorHex = color.hexLight,
    )
}

@Serializable
data class TagDto(
    val id: String,
    val name: String,
    val categoryIds: List<String> = emptyList(),
) {
    fun toModel() = Tag(id = id, name = name, categoryIds = categoryIds.toSet())
}

@Serializable
data class OptionDto(val id: String, val name: String)

@Serializable
data class FormOptionsDto(
    val categories: List<CategoryDto>,
    val tags: List<TagDto>,
    val paymentMethods: List<OptionDto>,
    val instalmentPlans: List<OptionDto>,
    val colors: List<ColorDto>,
    val currencies: List<String> = listOf("EUR"),
) {
    fun toModel() = RecordFormOptions(
        categories = categories.map { it.toModel() },
        tags = tags.map { it.toModel() },
        paymentMethods = paymentMethods.map { PaymentMethod(it.id, it.name) },
        instalmentPlans = instalmentPlans.map { InstalmentPlanOption(it.id, it.name) },
        colors = colors.map { it.toModel() },
        currencies = currencies,
    )
}

// ── Pedidos ─────────────────────────────────────────────
// Dinheiro como String ("12.50") e datas em ISO ("2026-10-27"),
// para não perder precisão nem depender do fuso horário.

@Serializable
data class CreateRecordRequest(
    val name: String,
    val description: String?,
    val type: String,
    val price: String,
    val currency: String,
    val paymentMethodId: String?,
    val paymentDate: String,
    val status: String,               // "paid" | "pending"
    val categoryId: String,
    val tagIds: List<String>,
    val instalmentPlanId: String?,
)

@Serializable
data class CreateInstalmentPlanRequest(
    val name: String,
    val description: String?,
    val totalAmount: String,
    val currency: String,
    val totalInstalments: Int,
    val firstDueDate: String,
    val paymentMethodId: String?,
    val categoryId: String,
    val tagIds: List<String>,
)

@Serializable
data class CreateTagRequest(val name: String, val categoryId: String?)

@Serializable
data class CreateCategoryRequest(val name: String, val type: String, val colorKey: String)

fun recordTypeFrom(value: String): RecordType =
    RecordType.entries.firstOrNull { it.name.equals(value, ignoreCase = true) } ?: RecordType.EXPENSE
