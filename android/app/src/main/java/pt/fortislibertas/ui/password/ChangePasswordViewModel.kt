package pt.fortislibertas.ui.password

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider.AndroidViewModelFactory.Companion.APPLICATION_KEY
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.receiveAsFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import pt.fortislibertas.FortisApplication
import pt.fortislibertas.R
import pt.fortislibertas.data.repository.AuthRepository
import pt.fortislibertas.data.repository.NetworkException
import pt.fortislibertas.data.repository.SessionExpiredException
import pt.fortislibertas.data.repository.WrongPasswordException

/** Same limits as Better Auth (src/lib/auth.ts) and the Sign Up form. */
private val PASSWORD_LENGTH = 8..32

class ChangePasswordViewModel(private val repository: AuthRepository) : ViewModel() {

    private val _state = MutableStateFlow(ChangePasswordUiState())
    val state: StateFlow<ChangePasswordUiState> = _state.asStateFlow()

    private val _events = Channel<ChangePasswordEvent>(Channel.BUFFERED)
    val events = _events.receiveAsFlow()

    fun onCurrentChange(value: String) = edit(PasswordField.Current) { it.copy(currentPassword = value) }
    fun onNewChange(value: String) = edit(PasswordField.New) { it.copy(newPassword = value) }
    fun onConfirmChange(value: String) = edit(PasswordField.Confirm) { it.copy(confirmPassword = value) }
    fun onRevokeChange(value: Boolean) = _state.update { it.copy(revokeOtherSessions = value) }

    /** Clears the form (the sheet was closed or the password was saved). */
    fun reset() {
        if (!_state.value.isSaving) _state.value = ChangePasswordUiState()
    }

    fun save() {
        val s = _state.value
        if (s.isSaving) return
        val errors = validate(s)
        if (errors.isNotEmpty()) {
            _state.update { it.copy(errors = errors) }
            return
        }
        viewModelScope.launch {
            _state.update { it.copy(isSaving = true, formError = null) }
            try {
                repository.changePassword(s.currentPassword, s.newPassword, s.revokeOtherSessions)
                _state.value = ChangePasswordUiState()          // passwords never stay in memory
                _events.send(ChangePasswordEvent.Saved)
            } catch (e: CancellationException) {
                throw e
            } catch (e: WrongPasswordException) {
                _state.update {
                    it.copy(isSaving = false, errors = mapOf(PasswordField.Current to R.string.password_error_wrong))
                }
            } catch (e: Exception) {
                _state.update { it.copy(isSaving = false, formError = e.toMessageRes()) }
            }
        }
    }

    private fun validate(s: ChangePasswordUiState): Map<PasswordField, Int> = buildMap {
        if (s.currentPassword.isEmpty()) put(PasswordField.Current, R.string.auth_error_required)
        when {
            s.newPassword.isEmpty() -> put(PasswordField.New, R.string.auth_error_required)
            s.newPassword.length !in PASSWORD_LENGTH -> put(PasswordField.New, R.string.auth_error_password_length)
            s.newPassword == s.currentPassword -> put(PasswordField.New, R.string.password_error_same)
        }
        if (s.confirmPassword != s.newPassword) put(PasswordField.Confirm, R.string.auth_error_password_mismatch)
    }

    /** Changing a field clears its error. */
    private fun edit(field: PasswordField, change: (ChangePasswordUiState) -> ChangePasswordUiState) =
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
                ChangePasswordViewModel(app.container.authRepository)
            }
        }
    }
}
