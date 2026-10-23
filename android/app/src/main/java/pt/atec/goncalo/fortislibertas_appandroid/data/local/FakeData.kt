package pt.atec.goncalo.fortislibertas_appandroid.data.local

import pt.atec.goncalo.fortislibertas_appandroid.data.model.Category
import pt.atec.goncalo.fortislibertas_appandroid.data.model.FinancialRecord

object FakeData {
    val categories: List<Category> = listOf(
        Category(1, "Alimentacao", "#F97316"),
        Category(2, "Transportes", "#3B82F6"),
        Category(3, "Salario", "#22C55E")
    )

    val records: List<FinancialRecord> = listOf(
        FinancialRecord(1, "Supermercado", 45.90, 1, "2026-10-20", isIncome = false),
        FinancialRecord(2, "Passe mensal", 40.00, 2, "2026-10-01", isIncome = false),
        FinancialRecord(3, "Salario", 1200.00, 3, "2026-10-01", isIncome = true)
    )
}
