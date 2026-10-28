package pt.fortislibertas.data.model

import java.math.BigDecimal
import java.time.LocalDate

/** Tudo o que o Home mostra, vindo de um só pedido. */
data class HomeSummary(
    val totalBalance: BigDecimal,
    val balanceChange: BigDecimal,            // saldo de hoje − saldo de há 7 dias
    val balanceChangePercent: BigDecimal?,    // null quando o saldo de há 7 dias era 0
    val currency: String,
    val cards: List<CardPreview>,
    val week: List<DayTotals>,                // 7 dias, de segunda a domingo
    val recent: List<TransactionItem>,        // mais recentes primeiro
)

/** Só o necessário para desenhar o cartão na pilha. */
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
    val amount: BigDecimal,                   // sempre positivo; o sinal vem do tipo
    val currency: String,
    val date: LocalDate,
)
