package pt.fortislibertas.ui.notifications.components

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.AccountBalance
import androidx.compose.material.icons.outlined.Delete
import androidx.compose.material.icons.outlined.Group
import androidx.compose.material.icons.outlined.Notifications
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.SwipeToDismissBox
import androidx.compose.material3.SwipeToDismissBoxValue
import androidx.compose.material3.Text
import androidx.compose.material3.rememberSwipeToDismissBoxState
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import java.time.Duration
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import pt.fortislibertas.R
import pt.fortislibertas.core.designsystem.preview.FortisPreviewTheme
import pt.fortislibertas.core.designsystem.preview.FortisPreviews
import pt.fortislibertas.data.model.AppNotification

/** One notification. Tap = mark as read; swipe to the left = delete. */
@Composable
fun NotificationsItem(
    notification: AppNotification,
    names: Map<String, String>,
    onOpen: () -> Unit,
    onDelete: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val shape = RoundedCornerShape(16.dp)
    val unreadLabel = stringResource(R.string.notif_unread_state)
    val dismissState = rememberSwipeToDismissBoxState(
        confirmValueChange = { value ->
            if (value == SwipeToDismissBoxValue.EndToStart) onDelete()
            value == SwipeToDismissBoxValue.EndToStart
        },
    )
    SwipeToDismissBox(
        state = dismissState,
        enableDismissFromStartToEnd = false,
        modifier = modifier.clip(shape),
        backgroundContent = {
            Box(
                Modifier.fillMaxSize().background(MaterialTheme.colorScheme.error).padding(horizontal = 20.dp),
                contentAlignment = Alignment.CenterEnd,
            ) {
                Icon(Icons.Outlined.Delete, contentDescription = stringResource(R.string.notif_delete),
                    tint = MaterialTheme.colorScheme.onError)
            }
        },
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .background(
                    if (notification.isRead) MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)
                    else MaterialTheme.colorScheme.surfaceVariant,
                )
                .clickable(onClick = onOpen)
                // TalkBack reads "unread" (the dot and the bold text are only visual)
                .semantics(mergeDescendants = true) { if (!notification.isRead) stateDescription = unreadLabel }
                .padding(14.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Box(
                Modifier.size(40.dp).clip(CircleShape).background(MaterialTheme.colorScheme.primary.copy(alpha = 0.12f)),
                contentAlignment = Alignment.Center,
            ) {
                Icon(
                    imageVector = when (notification.type) {
                        AppNotification.TYPE_DASHBOARD_MEMBER_ADDED -> Icons.Outlined.Group
                        AppNotification.TYPE_BANK_MEMBER_ADDED -> Icons.Outlined.AccountBalance
                        else -> Icons.Outlined.Notifications
                    },
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.primary,
                )
            }
            Column(Modifier.weight(1f)) {
                Text(
                    notificationText(notification, names),
                    style = MaterialTheme.typography.bodyMedium,
                    fontWeight = if (notification.isRead) FontWeight.Normal else FontWeight.SemiBold,
                )
                Text(
                    relativeTime(notification.createdAt),
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
            if (!notification.isRead) {
                // Unread dot
                Box(Modifier.size(10.dp).clip(CircleShape).background(MaterialTheme.colorScheme.primary))
            }
        }
    }
}

/** Builds the sentence from the type, the name of the dashboard / bank and the role. */
@Composable
private fun notificationText(notification: AppNotification, names: Map<String, String>): String {
    val role = when (notification.role) {
        "owner" -> stringResource(R.string.notif_role_owner)
        "editor" -> stringResource(R.string.notif_role_editor)
        else -> stringResource(R.string.notif_role_viewer)
    }
    val text = when (notification.type) {
        AppNotification.TYPE_DASHBOARD_MEMBER_ADDED -> stringResource(
            R.string.notif_dashboard_added,
            notification.dashboardId?.let { names[it] } ?: stringResource(R.string.notif_unknown_dashboard),
            role,
        )
        AppNotification.TYPE_BANK_MEMBER_ADDED -> stringResource(
            R.string.notif_bank_added,
            notification.bankAccountId?.let { names[it] } ?: stringResource(R.string.notif_unknown_bank),
            role,
        )
        else -> stringResource(R.string.notif_generic)
    }
    return text
}

/** "now", "15 min ago", "2 h ago", "yesterday" or the date. */
@Composable
private fun relativeTime(instant: Instant): String {
    val now = Instant.now()
    val minutes = Duration.between(instant, now).toMinutes()
    val zone = ZoneId.systemDefault()
    val date = instant.atZone(zone).toLocalDate()
    return when {
        minutes < 1 -> stringResource(R.string.notif_time_now)
        minutes < 60 -> stringResource(R.string.notif_time_minutes, minutes)
        date == LocalDate.now(zone) -> stringResource(R.string.notif_time_hours, minutes / 60)
        date == LocalDate.now(zone).minusDays(1) -> stringResource(R.string.notif_time_yesterday)
        else -> date.format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))
    }
}

@FortisPreviews
@Composable
private fun NotificationsItemPreview() {
    FortisPreviewTheme {
        NotificationsItem(
            notification = AppNotification("1", AppNotification.TYPE_DASHBOARD_MEMBER_ADDED, dashboardId = "d",
                role = "editor", createdAt = Instant.now().minus(Duration.ofHours(2))),
            names = mapOf("d" to "Casa"),
            onOpen = {}, onDelete = {},
            modifier = Modifier.padding(16.dp),
        )
    }
}
