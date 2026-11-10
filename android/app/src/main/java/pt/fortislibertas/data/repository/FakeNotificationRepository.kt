package pt.fortislibertas.data.repository

import java.time.Duration
import java.time.Instant
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import pt.fortislibertas.data.model.AppNotification

/** Local mode: 3 test notifications, kept in memory while the app is open. */
class FakeNotificationRepository : NotificationRepository {

    private val now = Instant.now()
    private var items = listOf(
        AppNotification(
            id = "n1", type = AppNotification.TYPE_DASHBOARD_MEMBER_ADDED,
            dashboardId = "dash-home", role = "editor", createdAt = now.minus(Duration.ofHours(2)),
        ),
        AppNotification(
            id = "n2", type = AppNotification.TYPE_BANK_MEMBER_ADDED,
            bankAccountId = "bank-2", role = "viewer", createdAt = now.minus(Duration.ofDays(1)),
        ),
        AppNotification(
            id = "n3", type = AppNotification.TYPE_DASHBOARD_MEMBER_ADDED,
            dashboardId = "dash-personal", role = "owner", createdAt = now.minus(Duration.ofDays(5)),
            readAt = now.minus(Duration.ofDays(4)),
        ),
    )

    private val _unreadCount = MutableStateFlow(items.count { !it.isRead })
    override val unreadCount: StateFlow<Int> = _unreadCount.asStateFlow()

    override suspend fun refreshUnreadCount() {
        _unreadCount.value = items.count { !it.isRead }
    }

    override suspend fun getNotifications(): List<AppNotification> {
        delay(400)
        return items.sortedByDescending { it.createdAt }
    }

    override suspend fun setRead(id: String, read: Boolean) = change {
        items = items.map { if (it.id == id) it.copy(readAt = if (read) Instant.now() else null) else it }
    }

    override suspend fun markAllRead() = change {
        items = items.map { it.copy(readAt = it.readAt ?: Instant.now()) }
    }

    override suspend fun delete(id: String) = change { items = items.filterNot { it.id == id } }

    private suspend fun change(block: () -> Unit) {
        delay(200)
        block()
        refreshUnreadCount()
    }
}
