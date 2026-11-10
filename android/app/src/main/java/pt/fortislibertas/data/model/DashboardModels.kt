package pt.fortislibertas.data.model

import java.math.BigDecimal

/** A dashboard the user belongs to (endpoints.md §8). Almost every record lives inside one. */
data class Dashboard(
    val id: String,
    val name: String,
    val isActive: Boolean,
    val role: String,                      // owner, editor, viewer
)

/** What records of a type do to a balance (Record_Type.kind). */
enum class RecordKind { INCOME, EXPENSE, NEUTRAL }

/** Total of one record type in a period (reports/summary?group_by=record_type). */
data class RecordTypeTotal(
    val id: String,
    val name: String,
    val kind: RecordKind,
    val colorHex: String,
    val total: BigDecimal,
)

/** Total of one category in a period (reports/summary?group_by=category). */
data class CategoryTotal(
    val id: String,
    val name: String,
    val colorHex: String,
    val total: BigDecimal,
)
