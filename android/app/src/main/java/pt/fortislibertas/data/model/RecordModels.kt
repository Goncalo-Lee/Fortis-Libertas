package pt.fortislibertas.data.model

import java.math.BigDecimal
import java.time.LocalDate

/** Record type (Record_Type table). */
enum class RecordType { EXPENSE, INCOME, INVESTMENT }

/** Payment status (status enum of Financial_Record). */
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
    val categoryIds: Set<String> = emptySet(),   // Tag__Category table
)

data class PaymentMethod(val id: String, val name: String)

data class InstalmentPlanOption(val id: String, val name: String)

/** Colour from the closed palette (Color table). */
data class ColorOption(val key: String, val hex: String)

/** Everything the forms need to fill their lists. */
data class RecordFormOptions(
    val categories: List<Category>,
    val tags: List<Tag>,
    val paymentMethods: List<PaymentMethod>,
    val instalmentPlans: List<InstalmentPlanOption>,
    val colors: List<ColorOption>,
    val currencies: List<String> = listOf("EUR", "USD", "GBP"),
)

/** What is sent when saving a financial record. */
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

/** What is sent when saving an instalment plan. */
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
