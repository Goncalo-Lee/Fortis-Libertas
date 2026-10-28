package pt.fortislibertas.data.local

import pt.fortislibertas.data.model.Category
import pt.fortislibertas.data.model.ColorOption
import pt.fortislibertas.data.model.InstalmentPlanOption
import pt.fortislibertas.data.model.PaymentMethod
import pt.fortislibertas.data.model.RecordFormOptions
import pt.fortislibertas.data.model.RecordType
import pt.fortislibertas.data.model.Tag

/** Dados de teste dos formulários do Register (modo local). */
object FakeRecordData {

    val colors = listOf(
        ColorOption("orange", "#F97316"),
        ColorOption("cyan", "#06B6D4"),
        ColorOption("blue", "#3B82F6"),
        ColorOption("pink", "#EC4899"),
        ColorOption("yellow", "#EAB308"),
        ColorOption("teal", "#14B8A6"),
        ColorOption("indigo", "#6366F1"),
        ColorOption("gray", "#94A3B8"),
    )

    fun options() = RecordFormOptions(
        categories = listOf(
            Category("cat-restaurants", "Restaurantes", RecordType.EXPENSE, "#F97316"),
            Category("cat-groceries", "Supermercado", RecordType.EXPENSE, "#06B6D4"),
            Category("cat-transport", "Transportes", RecordType.EXPENSE, "#3B82F6"),
            Category("cat-home", "Casa", RecordType.EXPENSE, "#EAB308"),
            Category("cat-salary", "Salário", RecordType.INCOME, "#14B8A6"),
            Category("cat-freelance", "Freelance", RecordType.INCOME, "#6366F1"),
            Category("cat-stocks", "Ações", RecordType.INVESTMENT, "#EC4899"),
        ),
        tags = listOf(
            Tag("tag-lunch", "Almoço", setOf("cat-restaurants")),
            Tag("tag-dinner", "Jantar", setOf("cat-restaurants")),
            Tag("tag-fuel", "Combustível", setOf("cat-transport")),
            Tag("tag-pass", "Passe", setOf("cat-transport")),
            Tag("tag-work", "Trabalho", setOf("cat-salary", "cat-freelance", "cat-restaurants")),
            Tag("tag-monthly", "Mensal"),
            Tag("tag-holidays", "Férias"),
        ),
        paymentMethods = listOf(
            PaymentMethod("pm-cash", "Dinheiro"),
            PaymentMethod("pm-debit", "Cartão de débito"),
            PaymentMethod("pm-credit", "Cartão de crédito"),
            PaymentMethod("pm-mbway", "MB WAY"),
        ),
        instalmentPlans = listOf(
            InstalmentPlanOption("plan-phone", "Telemóvel (12x)"),
        ),
        colors = colors,
    )
}
