package pt.fortislibertas.ui.auth

import androidx.annotation.StringRes
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
import pt.fortislibertas.data.local.AccountStore
import pt.fortislibertas.data.repository.AuthRepository
import pt.fortislibertas.data.repository.EmailTakenException
import pt.fortislibertas.data.repository.InvalidCredentialsException
import pt.fortislibertas.data.repository.NetworkException

/** Same limits as Better Auth (src/lib/auth.ts: minPasswordLength / maxPasswordLength). */
private val PASSWORD_LENGTH = 8..32

private val EMAIL_REGEX = Regex("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$")

class AuthViewModel(
    private val repository: AuthRepository,
    private val accountStore: AccountStore,
) : ViewModel() {

    private val _state = MutableStateFlow(AuthUiState())
    val state: StateFlow<AuthUiState> = _state.asStateFlow()

    private val _events = Channel<AuthEvent>(Channel.BUFFERED)
    val events = _events.receiveAsFlow()

    // ── Typing ──────────────────────────────────────────

    /** Switching form keeps the email, clears passwords and errors. */
    fun onModeChange(mode: AuthMode) = _state.update {
        if (it.isLoading) it
        else it.copy(mode = mode, password = "", confirmPassword = "", errors = emptyMap(), formError = null)
    }

    fun onNameChange(value: String) = edit(AuthField.Name) { it.copy(name = value) }
    fun onEmailChange(value: String) = edit(AuthField.Email) { it.copy(email = value) }
    fun onPasswordChange(value: String) = edit(AuthField.Password) { it.copy(password = value) }
    fun onConfirmPasswordChange(value: String) = edit(AuthField.ConfirmPassword) { it.copy(confirmPassword = value) }
    fun onRememberMeChange(value: Boolean) = _state.update { it.copy(rememberMe = value) }

    /** Updates a field and clears its error (and the form error). */
    private fun edit(field: AuthField, change: (AuthUiState) -> AuthUiState) = _state.update {
        change(it).copy(errors = it.errors - field, formError = null)
    }

    // ── Submit ──────────────────────────────────────────

    fun submit() {
        val current = _state.value
        if (current.isLoading) return

        val errors = validate(current)
        if (errors.isNotEmpty()) {
            _state.update { it.copy(errors = errors) }
            return
        }

        viewModelScope.launch {
            _state.update { it.copy(isLoading = true, formError = null) }
            try {
                val account = when (current.mode) {
                    AuthMode.SignIn -> repository.signIn(current.email, current.password, current.rememberMe)
                    // Sign up has no "Remember me" in the design: the new account is always kept
                    AuthMode.SignUp -> repository.signUp(current.name, current.email, current.password, remember = true)
                }
                accountStore.save(account, makeActive = true)
                _state.update { it.copy(isLoading = false, password = "", confirmPassword = "") }
                _events.send(AuthEvent.SignedIn)
            } catch (e: CancellationException) {
                throw e
            } catch (e: Exception) {
                _state.update { it.copy(isLoading = false, formError = e.toMessageRes()) }
            }
        }
    }

    private fun validate(s: AuthUiState): Map<AuthField, Int> = buildMap {
        if (s.mode == AuthMode.SignUp && s.name.isBlank()) put(AuthField.Name, R.string.auth_error_required)

        when {
            s.email.isBlank() -> put(AuthField.Email, R.string.auth_error_required)
            !EMAIL_REGEX.matches(s.email.trim()) -> put(AuthField.Email, R.string.auth_error_email_invalid)
        }

        when {
            s.password.isEmpty() -> put(AuthField.Password, R.string.auth_error_required)
            // On sign in a wrong length is just a wrong password: let the server answer
            s.mode == AuthMode.SignUp && s.password.length !in PASSWORD_LENGTH ->
                put(AuthField.Password, R.string.auth_error_password_length)
        }

        if (s.mode == AuthMode.SignUp && s.confirmPassword != s.password) {
            put(AuthField.ConfirmPassword, R.string.auth_error_password_mismatch)
        }
    }

    @StringRes
    private fun Exception.toMessageRes(): Int = when (this) {
        is InvalidCredentialsException -> R.string.auth_error_invalid_credentials
        is EmailTakenException -> R.string.auth_error_email_taken
        is NetworkException -> R.string.error_network
        else -> R.string.error_generic
    }

    companion object {
        val Factory = viewModelFactory {
            initializer {
                val app = this[APPLICATION_KEY] as FortisApplication
                AuthViewModel(
                    repository = app.container.authRepository,
                    accountStore = app.container.accountStore,
                )
            }
        }
    }
}
