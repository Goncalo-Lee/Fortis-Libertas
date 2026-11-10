package pt.fortislibertas.ui.editaccount

import androidx.annotation.StringRes
import java.time.LocalDate
import pt.fortislibertas.data.model.AccountDetails
import pt.fortislibertas.data.model.BankAccount

enum class AccountField { FullName, UserName, Phone, BirthDate }

/** The Edit account form. Text fields are kept as typed; they become AccountDetails on save. */
data class EditAccountUiState(
    val isLoading: Boolean = true,
    @StringRes val loadError: Int? = null,
    val original: AccountDetails? = null,
    val fullName: String = "",
    val userName: String = "",
    val phone: String = "",
    val birthDate: LocalDate? = null,
    val currency: String = "EUR",
    val primaryBankAccountId: String? = null,
    val banks: List<BankAccount> = emptyList(),
    val errors: Map<AccountField, Int> = emptyMap(),
    @StringRes val formError: Int? = null,
    val isSaving: Boolean = false,
)

sealed interface EditAccountEvent {
    data object Saved : EditAccountEvent
}
