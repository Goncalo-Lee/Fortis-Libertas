package pt.fortislibertas.data.remote.dto

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import pt.fortislibertas.data.model.Dashboard
import pt.fortislibertas.data.model.RecordKind

/** JSON of a dashboard (endpoints.md §8.2). */
@Serializable
data class DashboardDto(
    @SerialName("dashboard_id") val id: String,
    val name: String,
    @SerialName("is_active") val isActive: Boolean = true,
    val role: String = "viewer",
) {
    fun toModel() = Dashboard(id = id, name = name, isActive = isActive, role = role)
}

/** JSON of reports/summary (endpoints.md §16.3). */
@Serializable
data class ReportSummaryDto(
    val currency: String,
    val groups: List<ReportGroupDto> = emptyList(),
    val total: String = "0",
)

@Serializable
data class ReportGroupDto(
    val key: String,
    val label: String,
    val total: String,
    val count: Int = 0,
)

/** Record type (§10.2): only what the dashboard needs (kind and colour). */
@Serializable
data class RecordTypeDto(
    @SerialName("record_type_id") val id: String,
    val name: String,
    val kind: String,
    val color: ColorRefDto? = null,
) {
    val recordKind: RecordKind
        get() = when (kind) {
            "income" -> RecordKind.INCOME
            "expense" -> RecordKind.EXPENSE
            else -> RecordKind.NEUTRAL
        }
}

/** Category (§11.2): only the name and colour. */
@Serializable
data class CategoryRefDto(
    @SerialName("category_id") val id: String,
    val name: String,
    val color: ColorRefDto? = null,
)

/** Colour object of the catalog: { color_id, name, code_color }. */
@Serializable
data class ColorRefDto(@SerialName("code_color") val codeColor: String)
