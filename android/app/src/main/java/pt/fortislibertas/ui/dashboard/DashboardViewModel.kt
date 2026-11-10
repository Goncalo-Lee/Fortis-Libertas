package pt.fortislibertas.ui.dashboard

import androidx.annotation.StringRes
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider.AndroidViewModelFactory.Companion.APPLICATION_KEY
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import java.time.LocalDate
import java.time.YearMonth
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.Job
import kotlinx.coroutines.async
import kotlinx.coroutines.awaitAll
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import pt.fortislibertas.FortisApplication
import pt.fortislibertas.R
import pt.fortislibertas.data.local.AccountStore
import pt.fortislibertas.data.local.DashboardStore
import pt.fortislibertas.data.model.RecordKind
import pt.fortislibertas.data.repository.DashboardRepository
import pt.fortislibertas.data.repository.NetworkException
import pt.fortislibertas.data.repository.RecordRepository
import pt.fortislibertas.data.repository.SessionExpiredException
import pt.fortislibertas.data.repository.WalletRepository

class DashboardViewModel(
    private val repository: DashboardRepository,
    private val recordRepository: RecordRepository,
    private val walletRepository: WalletRepository,
    private val dashboardStore: DashboardStore,
    accountStore: AccountStore,
) : ViewModel() {

    private val _state = MutableStateFlow(DashboardUiState())
    val state: StateFlow<DashboardUiState> = _state.asStateFlow()

    private var loadJob: Job? = null

    init {
        // Name and photo of the active account for the header
        viewModelScope.launch {
            combine(accountStore.accounts, accountStore.activeAccountId) { accounts, activeId ->
                accounts.firstOrNull { it.id == activeId }
            }.collect { account ->
                _state.update { it.copy(userName = account?.fullName, avatarUrl = account?.imageUrl) }
            }
        }
        // Whenever the active dashboard changes (or is chosen for the first time) → reload
        viewModelScope.launch {
            dashboardStore.activeDashboardId.collect { id ->
                _state.update { it.copy(activeDashboardId = id) }
                loadAll()
            }
        }
    }

    fun refresh() = loadAll()

    /**
     * Called every time the Dashboard tab shows up again (e.g. after a new record):
     * reloads with the data still on screen (only the thin bar on top shows).
     */
    fun onScreenShown() {
        if (_state.value.months.isNotEmpty()) loadAll()
    }

    fun setPeriod(period: DashboardPeriod) {
        if (period == _state.value.period) return
        _state.update { it.copy(period = period) }
        loadAll()
    }

    fun setBreakdownKind(kind: RecordKind) {
        if (kind == _state.value.breakdownKind) return
        _state.update { it.copy(breakdownKind = kind) }
        loadAll()
    }

    fun setTrendType(typeId: String) = _state.update { it.copy(trendTypeId = typeId) }

    fun showAllCategories(show: Boolean) = _state.update { it.copy(showAllCategories = show) }

    /** Called by the "Switch dashboard" dialog. */
    fun switchDashboard(dashboardId: String) {
        _state.update { it.copy(manage = null) }
        viewModelScope.launch { dashboardStore.setActive(dashboardId) }
    }

    // ── Management button (ArcMenu) ─────────────────────

    fun openManage(dialog: ManageDialog) {
        _state.update { it.copy(manage = ManageState(dialog)) }
        if (dialog != ManageDialog.SwitchDashboard) loadManageOptions()
    }

    fun closeManage() {
        if (_state.value.manage?.isSaving == true) return
        _state.update { it.copy(manage = null) }
    }

    fun updateManage(change: (ManageState) -> ManageState) = _state.update { s ->
        s.copy(manage = s.manage?.let { change(it).copy(error = null) })
    }

    /** Adds what the form has (category, tag or payment method) and reloads the list. */
    fun saveManage() {
        val m = _state.value.manage ?: return
        if (m.isSaving) return
        val name = m.newName.trim()
        val error = when {
            name.isEmpty() -> R.string.dash_error_name
            m.dialog == ManageDialog.Categories && m.newColorKey == null -> R.string.dash_error_color
            else -> null
        }
        if (error != null) {
            _state.update { it.copy(manage = m.copy(error = error)) }
            return
        }
        viewModelScope.launch {
            _state.update { it.copy(manage = it.manage?.copy(isSaving = true)) }
            try {
                when (m.dialog) {
                    ManageDialog.Categories -> recordRepository.createCategory(name, m.newType, m.newColorKey!!)
                    ManageDialog.Tags -> recordRepository.createTag(name, categoryId = null)
                    ManageDialog.PaymentMethods -> recordRepository.createPaymentMethod(name, m.newCardId)
                    ManageDialog.SwitchDashboard -> Unit
                }
                val options = recordRepository.getFormOptions()
                _state.update {
                    it.copy(manage = it.manage?.copy(options = options, isSaving = false, newName = "", newColorKey = null, newCardId = null))
                }
                if (m.dialog == ManageDialog.Categories) loadAll()      // new category on the charts
            } catch (e: CancellationException) {
                throw e
            } catch (e: Exception) {
                _state.update { it.copy(manage = it.manage?.copy(isSaving = false, error = e.toMessageRes())) }
            }
        }
    }

    private fun loadManageOptions() {
        viewModelScope.launch {
            try {
                val options = recordRepository.getFormOptions()
                // Payment methods can be linked to a card: only active cards that are not expired
                val cards = if (_state.value.manage?.dialog == ManageDialog.PaymentMethods) {
                    runCatching { walletRepository.getWallet().cards }
                        .getOrDefault(emptyList())
                        .filter { !it.isFrozen && !it.isExpired() }
                } else {
                    emptyList()
                }
                _state.update { it.copy(manage = it.manage?.copy(options = options, cards = cards, isLoading = false)) }
            } catch (e: CancellationException) {
                throw e
            } catch (e: Exception) {
                _state.update { it.copy(manage = it.manage?.copy(isLoading = false, error = e.toMessageRes())) }
            }
        }
    }

    private fun loadAll() {
        loadJob?.cancel()
        loadJob = viewModelScope.launch {
            _state.update { it.copy(isLoading = true, errorMessage = null) }
            try {
                val dashboards = repository.getDashboards()
                _state.update { it.copy(dashboards = dashboards) }

                // No choice yet (or it no longer exists) → the first dashboard becomes the active one
                val active = _state.value.activeDashboardId?.takeIf { id -> dashboards.any { it.id == id } }
                if (active == null) {
                    dashboards.firstOrNull()?.let { dashboardStore.setActive(it.id) }   // the collector reloads
                    if (dashboards.isEmpty()) _state.update { it.copy(isLoading = false) }
                    return@launch
                }
                loadSummary(active)
                _state.update { it.copy(isLoading = false) }
            } catch (e: CancellationException) {
                throw e
            } catch (e: Exception) {
                _state.update { it.copy(isLoading = false, errorMessage = e.toMessageRes()) }
            }
        }
    }

    /** Current period, previous period, category breakdown and one total per month, all in parallel. */
    private suspend fun loadSummary(dashboardId: String) = coroutineScope {
        val s = _state.value
        val today = LocalDate.now()
        // Month: this month vs the previous one, 6 months on the charts.
        // Year: this year vs the previous one, 12 months on the charts.
        val isMonth = s.period == DashboardPeriod.Month
        val from = if (isMonth) today.withDayOfMonth(1) else today.withDayOfYear(1)
        val prevFrom = if (isMonth) from.minusMonths(1) else from.minusYears(1)
        val prevTo = from.minusDays(1)
        val monthCount = if (isMonth) 6 else 12

        val current = async { repository.getRecordTypeTotals(dashboardId, from, today) }
        val previous = async { repository.getRecordTypeTotals(dashboardId, prevFrom, prevTo) }
        val categories = async { repository.getCategoryTotals(dashboardId, from, today, s.breakdownKind) }
        val thisMonth = YearMonth.from(today)
        val months = (monthCount - 1 downTo 0).map { back ->
            val month = thisMonth.minusMonths(back.toLong())
            async {
                val end = if (back == 0) today else month.atEndOfMonth()
                MonthTotals(month, repository.getRecordTypeTotals(dashboardId, month.atDay(1), end))
            }
        }

        _state.update {
            it.copy(
                typeTotals = current.await(),
                previousSpent = previous.await().filter { t -> t.kind == RecordKind.EXPENSE }.sumOf { t -> t.total },
                categoryTotals = categories.await(),
                months = months.awaitAll(),
            )
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
                DashboardViewModel(
                    repository = app.container.dashboardRepository,
                    recordRepository = app.container.recordRepository,
                    walletRepository = app.container.walletRepository,
                    dashboardStore = app.container.dashboardStore,
                    accountStore = app.container.accountStore,
                )
            }
        }
    }
}
