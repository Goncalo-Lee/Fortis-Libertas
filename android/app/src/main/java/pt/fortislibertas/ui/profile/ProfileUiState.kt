package pt.fortislibertas.ui.profile

import androidx.annotation.StringRes
import pt.fortislibertas.data.model.SavedAccount
import pt.fortislibertas.data.model.UserProfile

/** Everything the screen needs to draw itself. */
data class ProfileUiState(
    val isLoading: Boolean = true,
    val profile: UserProfile? = null,
    @StringRes val errorMessage: Int? = null,
    val accounts: List<SavedAccount> = emptyList(),
    val activeAccountId: String? = null,
    val showAccountSwitcher: Boolean = false,
    val dialog: ProfileDialog? = null,
    val isWorking: Boolean = false,            // sign out/deactivate/delete request running
)

/** Which confirmation dialog is open. */
enum class ProfileDialog { SignOut, Deactivate, Delete }

/** Things that happen only once (navigate, show a message). */
sealed interface ProfileEvent {
    data object NavigateToSignIn : ProfileEvent
    data class ShowMessage(@StringRes val messageRes: Int) : ProfileEvent
}
