package pt.fortislibertas.data.local

import pt.fortislibertas.data.model.RecordType
import pt.fortislibertas.data.model.TransactionItem
import java.math.BigDecimal
import java.time.LocalDate

/**
 * Transações de teste. Usam as categorias e tags de FakeRecordData,
 * para os filtros do diálogo baterem certo com a lista.
 */
object FakeTransactionData {

    /** A transação + o que é preciso para filtrar (não aparece na UI). */
    data class Entry(
        val item: TransactionItem,
        val categoryId: String,
        val tagIds: Set<String>,
    )

    fun build(today: LocalDate = LocalDate.now()): List<Entry> {
        val categories = FakeRecordData.options().categories.associateBy { it.id }

        fun tx(
            id: String,
            name: String,
            categoryId: String,
            type: RecordType,
            amount: String,
            daysAgo: Long,
            vararg tags: String,
        ): Entry {
            val category = categories.getValue(categoryId)
            return Entry(
                item = TransactionItem(
                    id = id,
                    name = name,
                    categoryName = category.name,
                    categoryColorHex = category.colorHex,
                    type = type,
                    amount = BigDecimal(amount),
                    currency = "EUR",
                    date = today.minusDays(daysAgo),
                ),
                categoryId = categoryId,
                tagIds = tags.toSet(),
            )
        }

        return listOf(
            tx("t1", "Compras do mês", "cat-groceries", RecordType.EXPENSE, "24.68", 0, "tag-monthly"),
            tx("t2", "Almoço com colegas", "cat-restaurants", RecordType.EXPENSE, "12.50", 0, "tag-lunch", "tag-work"),
            tx("t3", "Pagamento de um serviço", "cat-freelance", RecordType.INCOME, "50.00", 1, "tag-work"),
            tx("t4", "Gasóleo", "cat-transport", RecordType.EXPENSE, "60.00", 2, "tag-fuel"),
            tx("t5", "Passe mensal", "cat-transport", RecordType.EXPENSE, "40.00", 3, "tag-pass", "tag-monthly"),
            tx("t6", "Jantar de aniversário", "cat-restaurants", RecordType.EXPENSE, "85.40", 4, "tag-dinner"),
            tx("t7", "Salário", "cat-salary", RecordType.INCOME, "1200.00", 5, "tag-work", "tag-monthly"),
            tx("t8", "ETF mensal", "cat-stocks", RecordType.INVESTMENT, "100.00", 6, "tag-monthly"),
            tx("t9", "Renda", "cat-home", RecordType.EXPENSE, "450.00", 8, "tag-monthly"),
            tx("t10", "Supermercado", "cat-groceries", RecordType.EXPENSE, "37.20", 9),
            tx("t11", "Viagem ao Porto", "cat-transport", RecordType.EXPENSE, "32.90", 12, "tag-holidays"),
            tx("t12", "Projeto site", "cat-freelance", RecordType.INCOME, "300.00", 13, "tag-work"),
        )
    }
}
