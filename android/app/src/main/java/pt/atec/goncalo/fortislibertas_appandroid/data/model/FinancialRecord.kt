package pt.atec.goncalo.fortislibertas_appandroid.data.model

// Data em formato ISO (yyyy-MM-dd) para evitar exigir minSdk 26 (java.time)
data class FinancialRecord(
    val id: Long,
    val title: String,
    val amount: Double,
    val categoryId: Long,
    val date: String,
    val isIncome: Boolean
)
