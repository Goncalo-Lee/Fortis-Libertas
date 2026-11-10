package pt.fortislibertas.data.model

import java.math.BigDecimal
import java.time.LocalDate

/** Everything the Home shows, from a single request. */
data class HomeSummary(
    val totalBalance: BigDecimal,
    val balanceChange: BigDecimal,            // today's balance − balance 7 days ago
    val balanceChangePercent: BigDecimal?,    // null when the balance 7 days ago was 0
    val currency: String,
    val cards: List<CardPreview>,
    val week: List<DayTotals>,                // 7 days, Monday to Sunday
    val recent: List<TransactionItem>,        // newest first
)

/** Only what is needed to draw the card in the stack. */
data class CardPreview(val id: String, val colorHex: String)

data class DayTotals(
    val date: LocalDate,
    val income: BigDecimal,
    val expense: BigDecimal,
)

data class TransactionItem(
    val id: String,
    val name: String,
    val categoryName: String,
    val categoryColorHex: String,
    val type: RecordType,
    val amount: BigDecimal,                   // always positive; the sign comes from the type
    val currency: String,
    val date: LocalDate,
)
