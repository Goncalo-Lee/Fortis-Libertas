package pt.fortislibertas.ui.notifications

import androidx.annotation.StringRes
import pt.fortislibertas.data.model.AppNotification

/**
 * [names]: dashboard and bank account names by id, so the text can say
 * "added to the dashboard Casa" instead of an id.
 */
data class NotificationsUiState(
    val isLoading: Boolean = true,
    @StringRes val errorMessage: Int? = null,
    val notifications: List<AppNotification> = emptyList(),
    val names: Map<String, String> = emptyMap(),
    val onlyUnread: Boolean = false,
) {
    val visible: List<AppNotification>
        get() = if (onlyUnread) notifications.filterNot { it.isRead } else notifications
    val hasUnread: Boolean get() = notifications.any { !it.isRead }
}

sealed interface NotificationsEvent {
    data class ShowMessage(@StringRes val messageRes: Int) : NotificationsEvent
}
