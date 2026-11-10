package pt.fortislibertas.ui.editaccount

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider.AndroidViewModelFactory.Companion.APPLICATION_KEY
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import java.time.LocalDate
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.async
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.receiveAsFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import pt.fortislibertas.FortisApplication
import pt.fortislibertas.R
import pt.fortislibertas.data.model.AccountDetails
import pt.fortislibertas.data.repository.NetworkException
import pt.fortislibertas.data.repository.ProfileRepository
import pt.fortislibertas.data.repository.SessionExpiredException
import pt.fortislibertas.data.repository.UserNameTakenException
import pt.fortislibertas.data.repository.WalletRepository

/** Same rules as the API (endpoints.md §3.4 and §3.5). */
private val USER_NAME_REGEX = Regex("^[A-Za-z0-9._-]{3,254}$")
private val PHONE_REGEX = Regex("^\\+?[0-9 ]{6,20}$")

class EditAccountViewModel(
    private val repository: ProfileRepository,
    private val walletRepository: WalletRepository,
) : ViewModel() {

    private val _state = MutableStateFlow(EditAccountUiState())
    val state: StateFlow<EditAccountUiState> = _state.asStateFlow()

    private val _events = Channel<EditAccountEvent>(Channel.BUFFERED)
    val events = _events.receiveAsFlow()

    init {
        load()
    }

    fun load() {
        viewModelScope.launch {
            _state.update { it.copy(isLoading = true, loadError = null) }
            try {
                // Banks are only for the "primary bank" field: if they fail, the form still opens
                val banks = async { runCatching { walletRepository.getWallet().banks }.getOrDefault(emptyList()) }
                val details = repository.getAccountDetails()
                _state.update {
                    it.copy(
                        isLoading = false,
                        original = details,
                        fullName = details.fullName,
                        userName = details.userName.orEmpty(),
                        phone = details.phone.orEmpty(),
                        birthDate = details.birthDate,
                        currency = details.currency,
                        primaryBankAccountId = details.primaryBankAccountId,
                        banks = banks.await(),
                    )
                }
            } catch (e: CancellationException) {
                throw e
            } catch (e: Exception) {
                _state.update { it.copy(isLoading = false, loadError = e.toMessageRes()) }
            }
        }
    }

    fun onFullNameChange(v: String) = edit(AccountField.FullName) { it.copy(fullName = v) }
    fun onUserNameChange(v: String) = edit(AccountField.UserName) { it.copy(userName = v.trim()) }
    fun onPhoneChange(v: String) = edit(AccountField.Phone) { it.copy(phone = v) }
    fun onBirthDateChange(v: LocalDate) = edit(AccountField.BirthDate) { it.copy(birthDate = v) }
    fun onCurrencyChange(v: String) = _state.update { it.copy(currency = v) }
    fun onPrimaryBankChange(id: String?) = _state.update { it.copy(primaryBankAccountId = id) }

    fun save() {
        val s = _state.value
        val original = s.original ?: return
        if (s.isSaving) return
        val errors = validate(s)
        if (errors.isNotEmpty()) {
            _state.update { it.copy(errors = errors) }
            return
        }
        val edited = AccountDetails(
            fullName = s.fullName.trim(),
            userName = s.userName.ifBlank { null },
            email = original.email,
            imageUrl = original.imageUrl,
            phone = s.phone.trim().ifBlank { null },
            birthDate = s.birthDate,
            currency = s.currency,
            primaryBankAccountId = s.primaryBankAccountId,
        )
        if (edited == original) {                     // nothing changed: just go back
            viewModelScope.launch { _events.send(EditAccountEvent.Saved) }
            return
        }
        viewModelScope.launch {
            _state.update { it.copy(isSaving = true, formError = null) }
            try {
                repository.updateAccount(original, edited)
                _state.update { it.copy(isSaving = false, original = edited) }
                _events.send(EditAccountEvent.Saved)
            } catch (e: CancellationException) {
                throw e
            } catch (e: UserNameTakenException) {
                _state.update {
                    it.copy(isSaving = false, errors = mapOf(AccountField.UserName to R.string.account_error_username_taken))
                }
            } catch (e: Exception) {
                _state.update { it.copy(isSaving = false, formError = e.toMessageRes()) }
            }
        }
    }

    private fun validate(s: EditAccountUiState): Map<AccountField, Int> = buildMap {
        if (s.fullName.isBlank()) put(AccountField.FullName, R.string.auth_error_required)
        if (s.userName.isNotEmpty() && !USER_NAME_REGEX.matches(s.userName)) {
            put(AccountField.UserName, R.string.account_error_username)
        }
        if (s.phone.isNotBlank() && !PHONE_REGEX.matches(s.phone.trim())) put(AccountField.Phone, R.string.account_error_phone)
        if (s.birthDate?.isAfter(LocalDate.now()) == true) put(AccountField.BirthDate, R.string.account_error_birth_date)
    }

    private fun edit(field: AccountField, change: (EditAccountUiState) -> EditAccountUiState) =
        _state.update { change(it).copy(errors = it.errors - field, formError = null) }

    private fun Exception.toMessageRes(): Int = when (this) {
        is SessionExpiredException -> R.string.error_session_expired
        is NetworkException -> R.string.error_network
        else -> R.string.error_generic
    }

    companion object {
        val Factory = viewModelFactory {
            initializer {
                val app = this[APPLICATION_KEY] as FortisApplication
                EditAccountViewModel(app.container.profileRepository, app.container.walletRepository)
            }
        }
    }
}
