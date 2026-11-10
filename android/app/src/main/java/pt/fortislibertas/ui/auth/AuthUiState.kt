package pt.fortislibertas.ui.auth

import androidx.annotation.StringRes

/** Which form is showing. */
enum class AuthMode { SignIn, SignUp }

/** Fields that can have a validation error. */
enum class AuthField { Name, Email, Password, ConfirmPassword }

/** Everything the Auth screen needs to draw itself. */
data class AuthUiState(
    val mode: AuthMode = AuthMode.SignIn,
    val name: String = "",                         // "Username" in the UI, sent as name to the API
    val email: String = "",
    val password: String = "",
    val confirmPassword: String = "",
    val rememberMe: Boolean = true,
    val errors: Map<AuthField, Int> = emptyMap(),   // field → @StringRes of the message
    @StringRes val formError: Int? = null,          // error that is not about one field (wrong password, no network…)
    val isLoading: Boolean = false,
)

/** Things that happen only once. */
sealed interface AuthEvent {
    data object SignedIn : AuthEvent
}
