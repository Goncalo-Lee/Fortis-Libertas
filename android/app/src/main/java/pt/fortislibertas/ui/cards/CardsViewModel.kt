package pt.fortislibertas.ui.cards

import androidx.annotation.StringRes
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.ViewModelProvider.AndroidViewModelFactory.Companion.APPLICATION_KEY
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import java.math.BigDecimal
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
import pt.fortislibertas.core.designsystem.util.MoneyParser
import pt.fortislibertas.data.local.AccountStore
import pt.fortislibertas.data.model.BankAccount
import pt.fortislibertas.data.model.CardUpdate
import pt.fortislibertas.data.model.NewBankAccount
import pt.fortislibertas.data.model.NewCard
import pt.fortislibertas.data.model.PaymentCard
import pt.fortislibertas.data.repository.NetworkException
import pt.fortislibertas.data.repository.SessionExpiredException
import pt.fortislibertas.data.repository.WalletRepository

/** Same limits as the API (cardholder_name and bank name: 1–50 chars). */
private const val CARDHOLDER_MAX = 50
private const val BANK_NAME_MAX = 50

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
                reload()
                _state.update { it.copy(isLoading = false) }
            } catch (e: CancellationException) {
                throw e
            } catch (e: Exception) {
                _state.update { it.copy(isLoading = false, errorMessage = e.toMessageRes()) }
            }
        }
    }

    private suspend fun reload() {
        val wallet = repository.getWallet()
        _state.update { it.copy(cards = wallet.cards, banks = wallet.banks, colors = wallet.colors) }
    }

    // ── Page and filter ─────────────────────────────────

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

    /** Confirms freeze / unfreeze / delete, then reloads so the list shows the new state. */
    fun confirmDialog() {
        val dialog = _state.value.dialog ?: return
        if (_state.value.isWorking || dialog is CardsDialog.Info) return

        runAction(onDone = { it.copy(dialog = null) }) {
            when (dialog) {
                is CardsDialog.Freeze -> {
                    repository.freezeCard(dialog.card.id); R.string.msg_card_frozen
                }
                is CardsDialog.Unfreeze -> {
                    repository.unfreezeCard(dialog.card.id); R.string.msg_card_unfrozen
                }
                is CardsDialog.Delete -> {
                    repository.deleteCard(dialog.card.id)
                    _state.update { it.copy(editForm = null) }       // the card no longer exists
                    R.string.msg_card_deleted
                }
                is CardsDialog.Info -> R.string.error_generic       // never reached (checked above)
            }
        }
    }

    // ── Edit card (bottom sheet) ────────────────────────

    fun openEdit(card: PaymentCard) = _state.update { it.copy(editForm = CardEditForm(card)) }

    fun closeEdit() {
        if (_state.value.isWorking) return
        _state.update { it.copy(editForm = null) }
    }

    /** Changes the form and clears the error of [field] (if any). */
    fun updateEdit(field: CardEditField?, change: (CardEditForm) -> CardEditForm) = _state.update { s ->
        val form = s.editForm ?: return@update s
        val changed = change(form)
        s.copy(editForm = changed.copy(errors = if (field == null) changed.errors else changed.errors - field))
    }

    /** "Delete card" button inside the sheet: asks first. */
    fun requestDelete() {
        val card = _state.value.editForm?.card ?: return
        _state.update { it.copy(dialog = CardsDialog.Delete(card)) }
    }

    fun saveEdit() {
        val form = _state.value.editForm ?: return
        if (_state.value.isWorking) return

        val errors = validate(form)
        if (errors.isNotEmpty()) {
            _state.update { it.copy(editForm = form.copy(errors = errors)) }
            return
        }

        runAction(onDone = { it.copy(editForm = null) }) {
            repository.updateCard(
                form.card.id,
                CardUpdate(
                    cardholderName = form.cardholderName.trim(),
                    type = form.type,
                    expiryDate = form.expiryDate,
                    colorId = form.colorId,
                    cardNumber = form.cardNumber.takeIf { form.replaceNumber },
                    cvv = form.cvv.takeIf { form.replaceNumber && it.isNotEmpty() },
                ),
            )
            R.string.msg_card_saved
        }
    }

    // ── Bank details (members are read only) ────────────

    fun openBank(bank: BankAccount) {
        _state.update { it.copy(bankDetail = BankDetailState(bank)) }
        viewModelScope.launch {
            try {
                val members = repository.getMembers(bank.id)
                _state.update { s -> s.copy(bankDetail = s.bankDetail?.copy(members = members, isLoading = false)) }
            } catch (e: CancellationException) {
                throw e
            } catch (e: Exception) {
                _state.update { s ->
                    s.copy(bankDetail = s.bankDetail?.copy(isLoading = false, error = R.string.banks_members_error))
                }
            }
        }
    }

    fun closeBank() = _state.update { it.copy(bankDetail = null) }

    // ── Add card / Add bank ("+" button: depends on the page) ──

    fun openAdd() = _state.update { s ->
        when (s.page) {
            CardsPage.Cards -> s.copy(
                addCardForm = CardAddForm(
                    // Only one bank where cards can be added → already chosen
                    bankId = s.banks.filter { it.canAddCards }.singleOrNull()?.id,
                ),
            )
            CardsPage.Banks -> s.copy(addBankForm = BankAddForm())
        }
    }

    fun closeAdd() {
        if (_state.value.isWorking) return
        _state.update { it.copy(addCardForm = null, addBankForm = null) }
    }

    fun updateAddCard(field: AddField?, change: (CardAddForm) -> CardAddForm) = _state.update { s ->
        val form = s.addCardForm ?: return@update s
        val changed = change(form)
        s.copy(addCardForm = changed.copy(errors = if (field == null) changed.errors else changed.errors - field))
    }

    fun updateAddBank(field: AddField?, change: (BankAddForm) -> BankAddForm) = _state.update { s ->
        val form = s.addBankForm ?: return@update s
        val changed = change(form)
        s.copy(addBankForm = changed.copy(errors = if (field == null) changed.errors else changed.errors - field))
    }

    fun saveAddCard() {
        val f = _state.value.addCardForm ?: return
        if (_state.value.isWorking) return
        val errors = buildMap<AddField, Int> {
            if (f.bankId == null) put(AddField.Bank, R.string.cards_choose_bank)
            if (f.cardholderName.isBlank() || f.cardholderName.trim().length > CARDHOLDER_MAX) {
                put(AddField.CardholderName, R.string.cards_error_required)
            }
            // Number and CVV are optional, but must be valid when filled
            if (f.cardNumber.isNotEmpty() && !isValidCardNumber(f.cardNumber)) put(AddField.CardNumber, R.string.cards_error_number)
            if (f.cvv.isNotEmpty() && f.cvv.length != 3) put(AddField.Cvv, R.string.cards_error_cvv)
        }
        if (errors.isNotEmpty()) {
            _state.update { it.copy(addCardForm = f.copy(errors = errors)) }
            return
        }
        runAction(onDone = { it.copy(addCardForm = null) }) {
            repository.createCard(
                NewCard(
                    bankId = f.bankId!!,
                    cardholderName = f.cardholderName.trim(),
                    type = f.type,
                    cardNumber = f.cardNumber.ifEmpty { null },
                    expiryDate = f.expiryDate,
                    cvv = f.cvv.ifEmpty { null },
                    colorId = f.colorId,
                ),
            )
            R.string.msg_card_created
        }
    }

    fun saveAddBank() {
        val f = _state.value.addBankForm ?: return
        if (_state.value.isWorking) return
        val balance = MoneyParser.parse(f.initialBalance.ifBlank { "0" })
        val errors = buildMap<AddField, Int> {
            if (f.name.isBlank() || f.name.trim().length > BANK_NAME_MAX) put(AddField.Name, R.string.cards_error_required)
            // API: up to 8 digits before the decimal point (decimal(10,2))
            if (balance == null || balance.abs() >= BigDecimal("100000000")) put(AddField.InitialBalance, R.string.banks_error_amount)
        }
        if (errors.isNotEmpty()) {
            _state.update { it.copy(addBankForm = f.copy(errors = errors)) }
            return
        }
        runAction(onDone = { it.copy(addBankForm = null) }) {
            repository.createBankAccount(NewBankAccount(name = f.name.trim(), initialBalance = balance!!, currency = f.currency))
            R.string.msg_bank_created
        }
    }

    private fun validate(f: CardEditForm): Map<CardEditField, Int> = buildMap {
        if (f.cardholderName.isBlank() || f.cardholderName.trim().length > CARDHOLDER_MAX) {
            put(CardEditField.CardholderName, R.string.cards_error_required)
        }
        if (f.replaceNumber) {
            if (!isValidCardNumber(f.cardNumber)) put(CardEditField.CardNumber, R.string.cards_error_number)
            if (f.cvv.isNotEmpty() && !Regex("^\\d{3}$").matches(f.cvv)) put(CardEditField.Cvv, R.string.cards_error_cvv)
        }
    }

    /**
     * Runs a request with the "working" flag, reloads the wallet and shows [block]'s message.
     * [onDone] closes what was open (dialog or sheet) on success; errors keep it open.
     */
    private fun runAction(onDone: (CardsUiState) -> CardsUiState, block: suspend () -> Int) {
        viewModelScope.launch {
            _state.update { it.copy(isWorking = true) }
            try {
                val message = block()
                reload()
                _state.update { onDone(it).copy(isWorking = false, dialog = null) }
                _events.send(CardsEvent.ShowMessage(message))
            } catch (e: CancellationException) {
                throw e
            } catch (e: Exception) {
                _state.update { it.copy(isWorking = false, dialog = null) }
                _events.send(CardsEvent.ShowMessage(e.toMessageRes()))
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

/** 16 digits and a valid Luhn check digit (same rule as the API, §7.3). */
internal fun isValidCardNumber(number: String): Boolean {
    if (!Regex("^\\d{16}$").matches(number)) return false
    val sum = number.reversed().mapIndexed { i, ch ->
        val d = ch - '0'
        if (i % 2 == 1) (d * 2).let { if (it > 9) it - 9 else it } else d
    }.sum()
    return sum % 10 == 0
}
