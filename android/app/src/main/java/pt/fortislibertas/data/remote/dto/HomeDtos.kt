package pt.fortislibertas.data.remote.dto

import kotlinx.serialization.Serializable
import pt.fortislibertas.data.model.CardPreview
import pt.fortislibertas.data.model.DayTotals
import pt.fortislibertas.data.model.HomeSummary
import pt.fortislibertas.data.model.TransactionItem
import java.math.BigDecimal
import java.time.LocalDate

/** JSON de GET /api/v1/home. Dinheiro como texto, datas em ISO. */
@Serializable
data class HomeDto(
    val totalBalance: String,
    val balanceChange: String,
    val balanceChangePercent: String? = null,
    val currency: String = "EUR",
    val cards: List<CardPreviewDto> = emptyList(),
    val week: List<DayTotalsDto> = emptyList(),
    val recent: List<TransactionDto> = emptyList(),
) {
    fun toModel() = HomeSummary(
        totalBalance = totalBalance.toMoney(),
        balanceChange = balanceChange.toMoney(),
        balanceChangePercent = balanceChangePercent?.toBigDecimalOrNull(),
        currency = currency,
        cards = cards.map { CardPreview(it.id, it.color.hexLight) },
        week = week.map { DayTotals(LocalDate.parse(it.date), it.income.toMoney(), it.expense.toMoney()) },
        recent = recent.map { it.toModel() },
    )
}

@Serializable
data class CardPreviewDto(val id: String, val color: ColorDto)

@Serializable
data class DayTotalsDto(val date: String, val income: String, val expense: String)

@Serializable
data class CategoryRefDto(val id: String, val name: String, val color: ColorDto)

@Serializable
data class TransactionDto(
    val id: String,
    val name: String,
    val category: CategoryRefDto,
    val type: String,
    val amount: String,
    val currency: String = "EUR",
    val date: String,
) {
    fun toModel() = TransactionItem(
        id = id,
        name = name,
        categoryName = category.name,
        categoryColorHex = category.color.hexLight,
        type = recordTypeFrom(type),
        amount = amount.toMoney(),
        currency = currency,
        date = LocalDate.parse(date),
    )
}

private fun String.toMoney(): BigDecimal = toBigDecimalOrNull() ?: BigDecimal.ZERO
