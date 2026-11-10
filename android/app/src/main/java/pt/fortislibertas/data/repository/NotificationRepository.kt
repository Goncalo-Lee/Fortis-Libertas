package pt.fortislibertas.data.repository

import kotlinx.coroutines.flow.StateFlow
import pt.fortislibertas.data.model.AppNotification

/**
 * Notifications of the active account. [unreadCount] is shared by every top bar (the bell badge)
 * and is updated after each change made here.
 */
interface NotificationRepository {
    val unreadCount: StateFlow<Int>
    suspend fun refreshUnreadCount()
    suspend fun getNotifications(): List<AppNotification>
    suspend fun setRead(id: String, read: Boolean)
    suspend fun markAllRead()
    suspend fun delete(id: String)
}
