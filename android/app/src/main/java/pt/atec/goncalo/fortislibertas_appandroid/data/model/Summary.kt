package pt.atec.goncalo.fortislibertas_appandroid.data.model

data class Summary(
    val totalIncome: Double,
    val totalExpense: Double
) {
    val balance: Double
        get() = totalIncome - totalExpense
}
