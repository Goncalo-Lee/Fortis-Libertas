package pt.fortislibertas.ui.newrecord

import androidx.annotation.StringRes
import pt.fortislibertas.data.model.RecordFormOptions
import pt.fortislibertas.data.model.RecordStatus
import pt.fortislibertas.data.model.RecordType
import java.time.LocalDate

/** Qual formulário está aberto no painel de baixo. */
enum class RegisterSheet { FinancialRecord, InstalmentPlan }

/** Qual seletor (diálogo com blur) está aberto. */
enum class PickerDialog { Category, Tags }

/** Campos que podem ter erro de validação. */
enum class FormField {
    Name, Type, Price, PaymentDate, Category,
    TotalAmount, TotalInstalments, FirstDueDate,
}

/** O que o utilizador já escreveu no formulário de registo. */
data class RecordFormState(
    val name: String = "",
    val description: String = "",
    val type: RecordType? = null,
    val price: String = "",                       // texto: o utilizador pode escrever "12,5"
    val currency: String = "EUR",
    val paymentMethodId: String? = null,
    val paymentDate: LocalDate? = LocalDate.now(),
    val status: RecordStatus = RecordStatus.PAID,
    val categoryId: String? = null,
    val tagIds: Set<String> = emptySet(),
    val instalmentPlanId: String? = null,
    val errors: Map<FormField, Int> = emptyMap(),  // campo → @StringRes da mensagem
)

/** O que o utilizador já escreveu no formulário do plano de prestações. */
data class InstalmentFormState(
    val name: String = "",
    val description: String = "",
    val totalAmount: String = "",
    val currency: String = "EUR",
    val totalInstalments: String = "",
    val firstDueDate: LocalDate? = null,
    val paymentMethodId: String? = null,
    val categoryId: String? = null,
    val tagIds: Set<String> = emptySet(),
    val errors: Map<FormField, Int> = emptyMap(),
)

data class NewRecordUiState(
    val avatarName: String? = null,
    val avatarUrl: String? = null,
    val options: RecordFormOptions? = null,
    val isLoadingOptions: Boolean = true,
    @StringRes val optionsError: Int? = null,
    val openSheet: RegisterSheet? = null,
    val openPicker: PickerDialog? = null,
    val record: RecordFormState = RecordFormState(),
    val plan: InstalmentFormState = InstalmentFormState(),
    val isSaving: Boolean = false,
    val isCreatingOption: Boolean = false,          // a criar tag ou categoria
) {
    /** Os seletores trabalham sobre o formulário que estiver aberto. */
    val activeCategoryId: String?
        get() = when (openSheet) {
            RegisterSheet.FinancialRecord -> record.categoryId
            RegisterSheet.InstalmentPlan -> plan.categoryId
            null -> null
        }

    val activeTagIds: Set<String>
        get() = when (openSheet) {
            RegisterSheet.FinancialRecord -> record.tagIds
            RegisterSheet.InstalmentPlan -> plan.tagIds
            null -> emptySet()
        }

    /** Um plano de prestações é sempre uma despesa. */
    val activeType: RecordType?
        get() = when (openSheet) {
            RegisterSheet.FinancialRecord -> record.type
            RegisterSheet.InstalmentPlan -> RecordType.EXPENSE
            null -> null
        }
}

sealed interface NewRecordEvent {
    data class ShowMessage(@StringRes val messageRes: Int) : NewRecordEvent
}
