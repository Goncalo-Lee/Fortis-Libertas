package pt.fortislibertas.ui.notifications

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider.AndroidViewModelFactory.Companion.APPLICATION_KEY
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import java.time.Instant
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.async
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.receiveAsFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import pt.fortislibertas.FortisApplication
import pt.fortislibertas.R
import pt.fortislibertas.data.model.AppNotification
import pt.fortislibertas.data.repository.DashboardRepository
import pt.fortislibertas.data.repository.NetworkException
import pt.fortislibertas.data.repository.NotificationRepository
import pt.fortislibertas.data.repository.SessionExpiredException
import pt.fortislibertas.data.repository.WalletRepository

class NotificationsViewModel(
    private val repository: NotificationRepository,
    private val dashboardRepository: DashboardRepository,
    private val walletRepository: WalletRepository,
) : ViewModel() {

    private val _state = MutableStateFlow(NotificationsUiState())
    val state: StateFlow<NotificationsUiState> = _state.asStateFlow()

    private val _events = Channel<NotificationsEvent>(Channel.BUFFERED)
    val events = _events.receiveAsFlow()

    init {
        load()
    }

    fun load() {
        viewModelScope.launch {
            _state.update { it.copy(isLoading = true, errorMessage = null) }
            try {
                // Names are only for the text: if they fail, the list still shows
                val dashboards = async { runCatching { dashboardRepository.getDashboards() }.getOrDefault(emptyList()) }
                val banks = async { runCatching { walletRepository.getWallet().banks }.getOrDefault(emptyList()) }
                val notifications = repository.getNotifications()
                val names = dashboards.await().associate { it.id to it.name } + banks.await().associate { it.id to it.name }
                _state.update { it.copy(isLoading = false, notifications = notifications, names = names) }
                runCatching { repository.refreshUnreadCount() }
            } catch (e: CancellationException) {
                throw e
            } catch (e: Exception) {
                _state.update { it.copy(isLoading = false, errorMessage = e.toMessageRes()) }
            }
        }
    }

    fun setOnlyUnread(value: Boolean) = _state.update { it.copy(onlyUnread = value) }

    /** Tapping an unread notification marks it as read. */
    fun open(notification: AppNotification) {
        if (notification.isRead) return
        change(update = { list -> list.map { if (it.id == notification.id) it.copy(readAt = Instant.now()) else it } }) {
            repository.setRead(notification.id, read = true)
        }
    }

    fun markAllRead() = change(update = { list -> list.map { it.copy(readAt = it.readAt ?: Instant.now()) } }) {
        repository.markAllRead()
    }

    fun delete(notification: AppNotification) = change(update = { list -> list.filterNot { it.id == notification.id } }) {
        repository.delete(notification.id)
    }

    /** Optimistic: the list changes at once; if the server fails, it is put back and a message shows. */
    private fun change(update: (List<AppNotification>) -> List<AppNotification>, request: suspend () -> Unit) {
        val before = _state.value.notifications
        _state.update { it.copy(notifications = update(it.notifications)) }
        viewModelScope.launch {
            try {
                request()
            } catch (e: CancellationException) {
                throw e
            } catch (e: Exception) {
                _state.update { it.copy(notifications = before) }
                _events.send(NotificationsEvent.ShowMessage(e.toMessageRes()))
            }
        }
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
                NotificationsViewModel(
                    repository = app.container.notificationRepository,
                    dashboardRepository = app.container.dashboardRepository,
                    walletRepository = app.container.walletRepository,
                )
            }
        }
    }
}
