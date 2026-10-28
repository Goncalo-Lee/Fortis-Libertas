package pt.fortislibertas.data.model

import java.math.BigDecimal
import java.time.LocalDate

/** Tipo de registo (tabela Record_Type). */
enum class RecordType { EXPENSE, INCOME, INVESTMENT }

/** Estado do pagamento (enum status do Financial_Record). */
enum class RecordStatus { PAID, PENDING }

data class Category(
    val id: String,
    val name: String,
    val type: RecordType,
    val colorHex: String,
)

data class Tag(
    val id: String,
    val name: String,
    val categoryIds: Set<String> = emptySet(),   // tabela Tag__Category
)

data class PaymentMethod(val id: String, val name: String)

data class InstalmentPlanOption(val id: String, val name: String)

/** Cor da paleta fechada (tabela Color). */
data class ColorOption(val key: String, val hex: String)

/** Tudo o que os formulários precisam para preencher as listas. */
data class RecordFormOptions(
    val categories: List<Category>,
    val tags: List<Tag>,
    val paymentMethods: List<PaymentMethod>,
    val instalmentPlans: List<InstalmentPlanOption>,
    val colors: List<ColorOption>,
    val currencies: List<String> = listOf("EUR", "USD", "GBP"),
)

/** O que é enviado ao guardar um registo financeiro. */
data class NewFinancialRecord(
    val name: String,
    val description: String?,
    val type: RecordType,
    val price: BigDecimal,
    val currency: String,
    val paymentMethodId: String?,
    val paymentDate: LocalDate,
    val status: RecordStatus,
    val categoryId: String,
    val tagIds: Set<String>,
    val instalmentPlanId: String?,
)

/** O que é enviado ao guardar um plano de prestações. */
data class NewInstalmentPlan(
    val name: String,
    val description: String?,
    val totalAmount: BigDecimal,
    val currency: String,
    val totalInstalments: Int,
    val firstDueDate: LocalDate,
    val paymentMethodId: String?,
    val categoryId: String,
    val tagIds: Set<String>,
)
