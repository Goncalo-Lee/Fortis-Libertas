package pt.fortislibertas.ui.newrecord

import androidx.annotation.StringRes
import pt.fortislibertas.data.model.RecordFormOptions
import pt.fortislibertas.data.model.RecordStatus
import pt.fortislibertas.data.model.RecordType
import java.time.LocalDate

/** Which form is open in the bottom sheet. */
enum class RegisterSheet { FinancialRecord, InstalmentPlan }

/** Which picker (blurred dialog) is open. */
enum class PickerDialog { Category, Tags }

/** Fields that can have a validation error. */
enum class FormField {
    Name, Type, Price, PaymentDate, Category, PaymentMethod,
    TotalAmount, TotalInstalments, FirstDueDate,
}

/** What the user has typed so far in the record form. */
data class RecordFormState(
    val name: String = "",
    val description: String = "",
    val type: RecordType? = null,
    val price: String = "",                       // text: the user may type "12,5"
    val currency: String = "EUR",
    val paymentMethodId: String? = null,
    val paymentDate: LocalDate? = LocalDate.now(),
    val status: RecordStatus = RecordStatus.PAID,
    val categoryId: String? = null,
    val tagIds: Set<String> = emptySet(),
    val instalmentPlanId: String? = null,
    val errors: Map<FormField, Int> = emptyMap(),  // field → @StringRes of the message
)

/** What the user has typed so far in the instalment plan form. */
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
    val isCreatingOption: Boolean = false,          // creating a tag or category
) {
    /** The pickers work on whichever form is open. */
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

    /** An instalment plan is always an expense. */
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
