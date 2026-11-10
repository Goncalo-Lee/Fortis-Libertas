package pt.fortislibertas.ui.dashboard

import androidx.annotation.StringRes
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider.AndroidViewModelFactory.Companion.APPLICATION_KEY
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.receiveAsFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import pt.fortislibertas.FortisApplication
import pt.fortislibertas.R
import pt.fortislibertas.data.local.DashboardStore
import pt.fortislibertas.data.repository.DashboardRepository
import pt.fortislibertas.data.repository.NetworkException
import pt.fortislibertas.data.repository.SessionExpiredException

/** The "New dashboard" dialog. Used by the Home and the Dashboard tab when there is none. */
data class DashboardCreateUiState(
    val name: String = "",
    @StringRes val error: Int? = null,
    val isSaving: Boolean = false,
)

class DashboardCreateViewModel(
    private val repository: DashboardRepository,
    private val dashboardStore: DashboardStore,
) : ViewModel() {

    private val _state = MutableStateFlow(DashboardCreateUiState())
    val state: StateFlow<DashboardCreateUiState> = _state.asStateFlow()

    /** Sends Unit when the dashboard is created and is already the active one. */
    private val _created = Channel<Unit>(Channel.BUFFERED)
    val created = _created.receiveAsFlow()

    fun onNameChange(value: String) = _state.update { it.copy(name = value.take(50), error = null) }

    fun reset() {
        if (!_state.value.isSaving) _state.value = DashboardCreateUiState()
    }

    fun create() {
        val s = _state.value
        if (s.isSaving) return
        val name = s.name.trim()
        if (name.isEmpty()) {
            _state.update { it.copy(error = R.string.dash_error_name) }
            return
        }
        viewModelScope.launch {
            _state.update { it.copy(isSaving = true, error = null) }
            try {
                val dashboard = repository.createDashboard(name)
                dashboardStore.setActive(dashboard.id)          // the screens follow the active dashboard
                _state.value = DashboardCreateUiState()
                _created.send(Unit)
            } catch (e: CancellationException) {
                throw e
            } catch (e: Exception) {
                val message = when (e) {
                    is SessionExpiredException -> R.string.error_session_expired
                    is NetworkException -> R.string.error_network
                    else -> R.string.error_generic
                }
                _state.update { it.copy(isSaving = false, error = message) }
            }
        }
    }

    companion object {
        val Factory = viewModelFactory {
            initializer {
                val app = this[APPLICATION_KEY] as FortisApplication
                DashboardCreateViewModel(app.container.dashboardRepository, app.container.dashboardStore)
            }
        }
    }
}
