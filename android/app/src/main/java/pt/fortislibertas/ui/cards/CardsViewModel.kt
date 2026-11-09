package pt.fortislibertas.ui.cards

import androidx.annotation.StringRes
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.ViewModelProvider.AndroidViewModelFactory.Companion.APPLICATION_KEY
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.receiveAsFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import pt.fortislibertas.FortisApplication
import pt.fortislibertas.R
import pt.fortislibertas.data.local.AccountStore
import pt.fortislibertas.data.model.PaymentCard
import pt.fortislibertas.data.repository.NetworkException
import pt.fortislibertas.data.repository.SessionExpiredException
import pt.fortislibertas.data.repository.WalletRepository

class CardsViewModel(
    private val repository: WalletRepository,
    private val accountStore: AccountStore,
    initialPage: CardsPage,
) : ViewModel() {

    private val _state = MutableStateFlow(CardsUiState(page = initialPage))
    val state: StateFlow<CardsUiState> = _state.asStateFlow()

    private val _events = Channel<CardsEvent>(Channel.BUFFERED)
    val events = _events.receiveAsFlow()

    init {
        // Name and photo of the active account for the header
        viewModelScope.launch {
            combine(accountStore.accounts, accountStore.activeAccountId) { accounts, activeId ->
                accounts.firstOrNull { it.id == activeId }
            }.collect { account ->
                _state.update { it.copy(userName = account?.fullName, avatarUrl = account?.imageUrl) }
            }
        }
        load()
    }

    fun load() {
        viewModelScope.launch {
            _state.update { it.copy(isLoading = true, errorMessage = null) }
            try {
                val wallet = repository.getWallet()
                _state.update { it.copy(isLoading = false, cards = wallet.cards, banks = wallet.banks) }
            } catch (e: CancellationException) {
                throw e
            } catch (e: Exception) {
                _state.update { it.copy(isLoading = false, errorMessage = e.toMessageRes()) }
            }
        }
    }

    /** Round button at the bottom: Cards ↔ Banks. "Inactive" only exists for cards, so it falls back to All. */
    fun togglePage() = _state.update {
        val page = if (it.page == CardsPage.Cards) CardsPage.Banks else CardsPage.Cards
        val filter = if (page == CardsPage.Banks && it.filter == CardsFilter.Inactive) CardsFilter.All else it.filter
        it.copy(page = page, filter = filter)
    }

    fun onFilterChange(filter: CardsFilter) = _state.update { it.copy(filter = filter) }

    // ── Dialogs ─────────────────────────────────────────

    fun requestFreeze(card: PaymentCard) = _state.update { it.copy(dialog = CardsDialog.Freeze(card)) }
    fun requestUnfreeze(card: PaymentCard) = _state.update { it.copy(dialog = CardsDialog.Unfreeze(card)) }
    fun showInfo(card: PaymentCard) = _state.update { it.copy(dialog = CardsDialog.Info(card)) }

    fun closeDialog() {
        if (_state.value.isWorking) return               // does not close in the middle of the request
        _state.update { it.copy(dialog = null) }
    }

    /** Confirms freeze / unfreeze, then reloads so the card shows its new state. */
    fun confirmDialog() {
        val dialog = _state.value.dialog ?: return
        if (_state.value.isWorking || dialog is CardsDialog.Info) return

        viewModelScope.launch {
            _state.update { it.copy(isWorking = true) }
            try {
                val message = when (dialog) {
                    is CardsDialog.Freeze -> {
                        repository.freezeCard(dialog.card.id)
                        R.string.msg_card_frozen
                    }
                    is CardsDialog.Unfreeze -> {
                        repository.unfreezeCard(dialog.card.id)
                        R.string.msg_card_unfrozen
                    }
                    is CardsDialog.Info -> return@launch
                }
                val wallet = repository.getWallet()
                _state.update { it.copy(cards = wallet.cards, banks = wallet.banks) }
                _events.send(CardsEvent.ShowMessage(message))
            } catch (e: CancellationException) {
                throw e
            } catch (e: Exception) {
                _events.send(CardsEvent.ShowMessage(e.toMessageRes()))
            } finally {
                _state.update { it.copy(isWorking = false, dialog = null) }
            }
        }
    }

    @StringRes
    private fun Exception.toMessageRes(): Int = when (this) {
        is SessionExpiredException -> R.string.error_session_expired
        is NetworkException -> R.string.error_network
        else -> R.string.error_generic
    }

    companion object {
        fun factory(initialPage: CardsPage): ViewModelProvider.Factory = viewModelFactory {
            initializer {
                val app = this[APPLICATION_KEY] as FortisApplication
                CardsViewModel(
                    repository = app.container.walletRepository,
                    accountStore = app.container.accountStore,
                    initialPage = initialPage,
                )
            }
        }
    }
}
