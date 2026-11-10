package pt.fortislibertas.ui.password

import androidx.annotation.StringRes

enum class PasswordField { Current, New, Confirm }

/** The change password form. Errors are string resources, per field. */
data class ChangePasswordUiState(
    val currentPassword: String = "",
    val newPassword: String = "",
    val confirmPassword: String = "",
    val revokeOtherSessions: Boolean = false,
    val errors: Map<PasswordField, Int> = emptyMap(),
    @StringRes val formError: Int? = null,      // errors that are not about one field (network...)
    val isSaving: Boolean = false,
)

sealed interface ChangePasswordEvent {
    data object Saved : ChangePasswordEvent
}
