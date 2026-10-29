package pt.fortislibertas.ui.transactions

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider.AndroidViewModelFactory.Companion.APPLICATION_KEY
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.FlowPreview
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.debounce
import kotlinx.coroutines.flow.distinctUntilChanged
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import pt.fortislibertas.FortisApplication
import pt.fortislibertas.R
import pt.fortislibertas.data.local.AccountStore
import pt.fortislibertas.data.model.RecordType
import pt.fortislibertas.data.model.TransactionFilter
import pt.fortislibertas.data.repository.NetworkException
import pt.fortislibertas.data.repository.SessionExpiredException
import pt.fortislibertas.data.repository.TransactionRepository
import java.math.BigDecimal

@OptIn(FlowPreview::class)
class TransactionsViewModel(
    private val repository: TransactionRepository,
    accountStore: AccountStore,
) : ViewModel() {

    private val _state = MutableStateFlow(TransactionsUiState())
    val state: StateFlow<TransactionsUiState> = _state.asStateFlow()

    /** Aumentar este número força um novo pedido com o mesmo filtro. */
    private val refreshTick = MutableStateFlow(0)

    init {
        // Nome e foto da conta ativa para o cabeçalho
        viewModelScope.launch {
            combine(accountStore.accounts, accountStore.activeAccountId) { accounts, activeId ->
                accounts.firstOrNull { it.id == activeId }
            }.collect { account ->
                _state.update { it.copy(userName = account?.fullName, avatarUrl = account?.imageUrl) }
            }
        }

        // Sempre que o filtro, a conta ou o refresh mudam → novo pedido.
        // debounce: ao escrever na pesquisa, espera 300 ms de pausa antes de pedir.
        // collectLatest: se chegar um filtro novo, cancela o pedido anterior.
        viewModelScope.launch {
            combine(
                _state.map { it.filter }.distinctUntilChanged().debounce(300),
                accountStore.activeAccountId,
                refreshTick,
            ) { filter, accountId, _ -> filter to accountId }
                .collectLatest { (filter, accountId) ->
                    if (accountId == null) {
                        _state.update { it.copy(isLoading = false, items = emptyList()) }
                    } else {
                        load(filter)
                    }
                }
        }

        loadOptions()
    }

    private suspend fun load(filter: TransactionFilter) {
        _state.update { it.copy(isLoading = true, errorMessage = null) }
        try {
            val items = repository.getTransactions(filter)
            _state.update { it.copy(isLoading = false, hasLoaded = true, items = items) }
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            _state.update { it.copy(isLoading = false, errorMessage = e.toMessageRes()) }
        }
    }

    private fun loadOptions() {
        viewModelScope.launch {
            try {
                val options = repository.getFilterOptions()
                _state.update { it.copy(options = options) }
            } catch (e: CancellationException) {
                throw e
            } catch (_: Exception) {
                // Sem opções o diálogo mostra "a carregar"; tenta outra vez ao abrir
            }
        }
    }

    // ── Ações do ecrã ───────────────────────────────────

    fun onQueryChange(query: String) =
        _state.update { it.copy(filter = it.filter.copy(query = query)) }

    fun onTypeChange(type: RecordType?) =
        _state.update { it.copy(filter = it.filter.copy(type = type)) }

    fun openFilter() {
        _state.update { it.copy(showFilter = true) }
        if (_state.value.options == null) loadOptions()
    }

    fun closeFilter() = _state.update { it.copy(showFilter = false) }

    fun applyFilter(
        categoryIds: Set<String>,
        tagIds: Set<String>,
        minAmount: BigDecimal?,
        maxAmount: BigDecimal?,
    ) {
        _state.update {
            it.copy(
                showFilter = false,
                filter = it.filter.copy(
                    categoryIds = categoryIds,
                    tagIds = tagIds,
                    minAmount = minAmount,
                    maxAmount = maxAmount,
                ),
            )
        }
    }

    fun retry() = refreshTick.update { it + 1 }

    /** Ao voltar ao separador: atualiza a lista e as opções (categorias/tags novas). */
    fun onScreenShown() {
        if (!_state.value.hasLoaded) return
        refreshTick.update { it + 1 }
        loadOptions()
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
                TransactionsViewModel(
                    repository = app.container.transactionRepository,
                    accountStore = app.container.accountStore,
                )
            }
        }
    }
}
