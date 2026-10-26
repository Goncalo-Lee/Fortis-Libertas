package pt.fortislibertas.ui.profile

import androidx.annotation.StringRes
import pt.fortislibertas.data.model.SavedAccount
import pt.fortislibertas.data.model.UserProfile

/** Tudo o que o ecrã precisa para se desenhar. */
data class ProfileUiState(
    val isLoading: Boolean = true,
    val profile: UserProfile? = null,
    @StringRes val errorMessage: Int? = null,
    val accounts: List<SavedAccount> = emptyList(),
    val activeAccountId: String? = null,
    val showAccountSwitcher: Boolean = false,
    val dialog: ProfileDialog? = null,
    val isWorking: Boolean = false,            // pedido de sair/desativar/apagar a correr
)

/** Qual diálogo de confirmação está aberto. */
enum class ProfileDialog { SignOut, Deactivate, Delete }

/** Acontecimentos que só acontecem uma vez (navegar, mostrar mensagem). */
sealed interface ProfileEvent {
    data object NavigateToSignIn : ProfileEvent
    data class ShowMessage(@StringRes val messageRes: Int) : ProfileEvent
}
