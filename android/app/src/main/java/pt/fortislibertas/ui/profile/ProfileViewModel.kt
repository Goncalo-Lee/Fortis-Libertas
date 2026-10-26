package pt.fortislibertas.ui.profile

import androidx.annotation.StringRes
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider.AndroidViewModelFactory.Companion.APPLICATION_KEY
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.Job
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.receiveAsFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import pt.fortislibertas.FortisApplication
import pt.fortislibertas.R
import pt.fortislibertas.data.local.AccountStore
import pt.fortislibertas.data.repository.NetworkException
import pt.fortislibertas.data.repository.ProfileRepository
import pt.fortislibertas.data.repository.SessionExpiredException

class ProfileViewModel(
    private val repository: ProfileRepository,
    private val accountStore: AccountStore,
) : ViewModel() {

    private val _state = MutableStateFlow(ProfileUiState())
    val state: StateFlow<ProfileUiState> = _state.asStateFlow()

    private val _events = Channel<ProfileEvent>(Channel.BUFFERED)
    val events = _events.receiveAsFlow()

    private var loadJob: Job? = null

    init {
        // Sempre que a lista de contas ou a conta ativa mudar, o ecrã acompanha
        viewModelScope.launch {
            combine(accountStore.accounts, accountStore.activeAccountId) { accounts, activeId ->
                accounts to activeId
            }.collect { (accounts, activeId) ->
                val accountChanged = activeId != _state.value.activeAccountId
                _state.update { it.copy(accounts = accounts, activeAccountId = activeId) }

                when {
                    activeId == null -> {
                        loadJob?.cancel()
                        _state.update { it.copy(isLoading = false, profile = null, errorMessage = null) }
                    }
                    accountChanged -> loadProfile()
                }
            }
        }
    }

    fun loadProfile() {
        loadJob?.cancel()
        loadJob = viewModelScope.launch {
            _state.update { it.copy(isLoading = true, errorMessage = null) }
            try {
                val profile = repository.getProfile()
                _state.update { it.copy(isLoading = false, profile = profile) }
                accountStore.updateDetails(profile)   // mantém o seletor de contas atualizado
            } catch (e: CancellationException) {
                throw e
            } catch (e: Exception) {
                _state.update { it.copy(isLoading = false, errorMessage = e.toMessageRes()) }
            }
        }
    }

    // ── Trocar de conta ────────────────────────────────────

    fun openAccountSwitcher() = _state.update { it.copy(showAccountSwitcher = true) }

    fun closeAccountSwitcher() = _state.update { it.copy(showAccountSwitcher = false) }

    fun switchAccount(accountId: String) {
        _state.update { it.copy(showAccountSwitcher = false) }
        if (accountId == _state.value.activeAccountId) return
        viewModelScope.launch {
            _state.update { it.copy(profile = null) }   // evita mostrar os dados da conta anterior
            accountStore.switchTo(accountId)
        }
    }

    fun addAccount() {
        _state.update { it.copy(showAccountSwitcher = false) }
        viewModelScope.launch { _events.send(ProfileEvent.NavigateToSignIn) }
    }

    // ── Sair / desativar / apagar ─────────────────────────

    fun openDialog(dialog: ProfileDialog) = _state.update { it.copy(dialog = dialog) }

    fun closeDialog() {
        if (_state.value.isWorking) return   // não fecha a meio do pedido
        _state.update { it.copy(dialog = null) }
    }

    fun confirmDialog() {
        val dialog = _state.value.dialog ?: return
        if (_state.value.isWorking) return

        viewModelScope.launch {
            _state.update { it.copy(isWorking = true) }
            try {
                val message = when (dialog) {
                    ProfileDialog.SignOut -> {
                        repository.signOut()
                        R.string.msg_signed_out
                    }
                    ProfileDialog.Deactivate -> {
                        repository.deactivateAccount()
                        R.string.msg_deactivated
                    }
                    ProfileDialog.Delete -> {
                        repository.deleteAccount()
                        R.string.msg_deleted
                    }
                }
                leaveActiveAccount(message)
            } catch (e: CancellationException) {
                throw e
            } catch (e: Exception) {
                _events.send(ProfileEvent.ShowMessage(e.toMessageRes()))
            } finally {
                _state.update { it.copy(isWorking = false, dialog = null) }
            }
        }
    }

    /** Remove a conta do dispositivo. Se não sobrar nenhuma, vai para o login. */
    private suspend fun leaveActiveAccount(@StringRes message: Int) {
        val activeId = _state.value.activeAccountId ?: return
        _state.update { it.copy(profile = null) }
        accountStore.remove(activeId)
        _events.send(ProfileEvent.ShowMessage(message))
        if (accountStore.activeAccountId.first() == null) {
            _events.send(ProfileEvent.NavigateToSignIn)
        }
    }

    @StringRes
    private fun Exception.toMessageRes(): Int = when (this) {
        is SessionExpiredException -> R.string.error_session_expired
        is NetworkException -> R.string.error_network
        else -> R.string.error_generic
    }

    companion object {
        val Factory = viewModelFactory {
            initializer {
                val app = this[APPLICATION_KEY] as FortisApplication
                ProfileViewModel(
                    repository = app.container.profileRepository,
                    accountStore = app.container.accountStore,
                )
            }
        }
    }
}
