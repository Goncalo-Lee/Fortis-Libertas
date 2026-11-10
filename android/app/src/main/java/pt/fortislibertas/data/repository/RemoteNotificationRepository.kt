package pt.fortislibertas.data.repository

import java.io.IOException
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import pt.fortislibertas.data.model.AppNotification
import pt.fortislibertas.data.remote.NotificationApi
import pt.fortislibertas.data.remote.dto.NotificationReadRequestDto
import retrofit2.HttpException

/** API mode: /api/v1/me/notifications with the active account's token. */
class RemoteNotificationRepository(private val api: NotificationApi) : NotificationRepository {

    private val _unreadCount = MutableStateFlow(0)
    override val unreadCount: StateFlow<Int> = _unreadCount.asStateFlow()

    override suspend fun refreshUnreadCount() {
        _unreadCount.value = call { api.getUnreadCount().data.unread }
    }

    override suspend fun getNotifications(): List<AppNotification> =
        call { api.getNotifications().data.map { it.toModel() } }

    override suspend fun setRead(id: String, read: Boolean) = changed { api.setRead(id, NotificationReadRequestDto(read)) }

    override suspend fun markAllRead() = changed { api.markAllRead() }

    override suspend fun delete(id: String) = changed { api.delete(id) }

    /** After a change the badge is refreshed; if only that fails, the change still counts. */
    private suspend fun changed(block: suspend () -> Unit) {
        call { block() }
        runCatching { refreshUnreadCount() }
    }

    private suspend fun <T> call(block: suspend () -> T): T =
        try {
            block()
        } catch (e: HttpException) {
            if (e.code() == 401) throw SessionExpiredException() else throw e
        } catch (e: IOException) {
            throw NetworkException(e)
        }
}
