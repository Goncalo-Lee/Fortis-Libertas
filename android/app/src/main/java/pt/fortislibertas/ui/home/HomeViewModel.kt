package pt.fortislibertas.ui.home

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider.AndroidViewModelFactory.Companion.APPLICATION_KEY
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import pt.fortislibertas.FortisApplication
import pt.fortislibertas.R
import pt.fortislibertas.data.local.AccountStore
import pt.fortislibertas.data.repository.HomeRepository
import pt.fortislibertas.data.repository.NetworkException
import pt.fortislibertas.data.repository.SessionExpiredException

class HomeViewModel(
    private val repository: HomeRepository,
    accountStore: AccountStore,
) : ViewModel() {

    private val _state = MutableStateFlow(HomeUiState())
    val state: StateFlow<HomeUiState> = _state.asStateFlow()

    private var loadJob: Job? = null
    private var currentAccountId: String? = null

    init {
        // Acompanha a conta ativa: nome/foto no topo e recarrega ao trocar de conta
        viewModelScope.launch {
            combine(accountStore.accounts, accountStore.activeAccountId) { accounts, activeId ->
                accounts.firstOrNull { it.id == activeId }
            }.collect { account ->
                _state.update {
                    it.copy(
                        isSignedIn = account != null,
                        userName = account?.fullName,
                        avatarUrl = account?.imageUrl,
                    )
                }
                if (account == null) {
                    loadJob?.cancel()
                    currentAccountId = null
                    _state.update { it.copy(isLoading = false, summary = null) }
                } else if (account.id != currentAccountId) {
                    currentAccountId = account.id
                    _state.update { it.copy(summary = null) }   // não mostra dados da conta anterior
                    refresh()
                }
            }
        }
    }

    /**
     * Carrega o Home. Se já houver dados no ecrã, atualiza sem mostrar
     * o indicador de carregamento (os dados antigos ficam até chegarem os novos).
     */
    fun refresh() {
        if (currentAccountId == null) return
        loadJob?.cancel()
        loadJob = viewModelScope.launch {
            val silent = _state.value.summary != null
            if (!silent) _state.update { it.copy(isLoading = true, errorMessage = null) }
            try {
                val summary = repository.getHome()
                _state.update { it.copy(isLoading = false, summary = summary, errorMessage = null) }
            } catch (e: CancellationException) {
                throw e
            } catch (e: Exception) {
                // Numa atualização silenciosa, mantém os dados antigos e não mostra erro
                if (!silent) {
                    _state.update { it.copy(isLoading = false, errorMessage = e.toMessageRes()) }
                }
            }
        }
    }

    /** Chamado sempre que o separador Home volta a aparecer. */
    fun onScreenShown() {
        if (_state.value.summary != null) refresh()
    }

    private fun Exception.toMessageRes(): Int = when (this) {
        is SessionExpiredException -> R.string.error_session_expired
        is NetworkException -> R.string.error_network
        else -> R.string.error_generic
    }

    companion object {
        val Factory = viewModelFactory {
            initializer {
                val app = this[APPLICATION_KEY] as FortisApplication
                HomeViewModel(
                    repository = app.container.homeRepository,
                    accountStore = app.container.accountStore,
                )
            }
        }
    }
}
