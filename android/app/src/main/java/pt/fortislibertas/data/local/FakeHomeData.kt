package pt.fortislibertas.data.local

import pt.fortislibertas.data.model.CardPreview
import pt.fortislibertas.data.model.DayTotals
import pt.fortislibertas.data.model.HomeSummary
import pt.fortislibertas.data.model.RecordType
import pt.fortislibertas.data.model.TransactionItem
import java.math.BigDecimal
import java.time.DayOfWeek
import java.time.LocalDate
import java.time.temporal.TemporalAdjusters

/**
 * Dados de teste do Home. As datas são calculadas a partir de hoje,
 * por isso "Hoje" e "Ontem" aparecem sempre certos.
 */
object FakeHomeData {

    fun build(today: LocalDate = LocalDate.now()): HomeSummary {
        val monday = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY))

        // (receitas, despesas) de segunda a domingo
        val amounts = listOf(
            "0" to "42.30",
            "50.00" to "18.90",
            "0" to "64.10",
            "1200.00" to "35.00",
            "0" to "88.75",
            "25.00" to "52.40",
            "0" to "12.00",
        )
        val week = amounts.mapIndexed { i, (income, expense) ->
            val date = monday.plusDays(i.toLong())
            // Dias que ainda não chegaram ficam a zero
            if (date.isAfter(today)) DayTotals(date, BigDecimal.ZERO, BigDecimal.ZERO)
            else DayTotals(date, BigDecimal(income), BigDecimal(expense))
        }

        return HomeSummary(
            totalBalance = BigDecimal("350.00"),
            balanceChange = BigDecimal("100.00"),
            balanceChangePercent = BigDecimal("40"),
            currency = "EUR",
            cards = listOf(
                CardPreview("card-1", "#FFE761"),   // Pineapple
                CardPreview("card-2", "#2092E9"),   // Curious Blue
                CardPreview("card-3", "#76C352"),   // Oasis
            ),
            week = week,
            recent = listOf(
                TransactionItem("t1", "Compras do mês", "Supermercado", "#06B6D4",
                    RecordType.EXPENSE, BigDecimal("24.68"), "EUR", today),
                TransactionItem("t2", "Netflix", "Subscrições", "#EC4899",
                    RecordType.EXPENSE, BigDecimal("13.99"), "EUR", today),
                TransactionItem("t3", "Pagamento de um serviço", "Freelance", "#6366F1",
                    RecordType.INCOME, BigDecimal("50.00"), "EUR", today.minusDays(1)),
                TransactionItem("t4", "Almoço", "Restaurantes", "#F97316",
                    RecordType.EXPENSE, BigDecimal("9.50"), "EUR", today.minusDays(3)),
            ),
        )
    }
}
