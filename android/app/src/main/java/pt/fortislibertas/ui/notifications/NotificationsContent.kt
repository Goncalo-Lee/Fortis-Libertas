package pt.fortislibertas.ui.notifications

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.ArrowBack
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import java.time.Duration
import java.time.Instant
import pt.fortislibertas.R
import pt.fortislibertas.core.designsystem.components.ErrorContent
import pt.fortislibertas.core.designsystem.components.LoadingContent
import pt.fortislibertas.core.designsystem.components.SegmentedToggle
import pt.fortislibertas.core.designsystem.preview.FortisPreviewTheme
import pt.fortislibertas.core.designsystem.preview.FortisScreenPreviews
import pt.fortislibertas.data.model.AppNotification
import pt.fortislibertas.ui.notifications.components.NotificationsItem

/** Stateless notifications screen: header, All / Unread toggle and the list. */
@Composable
fun NotificationsContent(
    state: NotificationsUiState,
    contentPadding: PaddingValues,
    onBack: () -> Unit,
    onRetry: () -> Unit,
    onOnlyUnreadChange: (Boolean) -> Unit,
    onMarkAllRead: () -> Unit,
    onOpen: (AppNotification) -> Unit,
    onDelete: (AppNotification) -> Unit,
    modifier: Modifier = Modifier,
) {
    Column(modifier.fillMaxSize().padding(contentPadding)) {
        Row(
            modifier = Modifier.fillMaxWidth().padding(horizontal = 8.dp, vertical = 8.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            IconButton(onClick = onBack) {
                Icon(Icons.AutoMirrored.Outlined.ArrowBack, contentDescription = stringResource(R.string.account_back))
            }
            Text(
                stringResource(R.string.notif_title),
                style = MaterialTheme.typography.titleLarge,
                modifier = Modifier.weight(1f),
            )
            if (state.hasUnread) {
                TextButton(onClick = onMarkAllRead) { Text(stringResource(R.string.notif_mark_all)) }
            }
        }

        SegmentedToggle(
            options = listOf(stringResource(R.string.notif_all), stringResource(R.string.notif_unread)),
            selectedIndex = if (state.onlyUnread) 1 else 0,
            onSelect = { onOnlyUnreadChange(it == 1) },
            height = 44.dp,
            modifier = Modifier.padding(horizontal = 20.dp),
        )

        when {
            state.isLoading -> LoadingContent()
            state.errorMessage != null -> ErrorContent(
                message = stringResource(state.errorMessage),
                retryLabel = stringResource(R.string.action_retry),
                onRetry = onRetry,
            )
            state.visible.isEmpty() -> Text(
                stringResource(if (state.onlyUnread) R.string.notif_empty_unread else R.string.notif_empty),
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.fillMaxWidth().padding(32.dp),
            )
            else -> LazyColumn(
                contentPadding = PaddingValues(horizontal = 20.dp, vertical = 16.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                items(state.visible, key = { it.id }) { notification ->
                    NotificationsItem(
                        notification = notification,
                        names = state.names,
                        onOpen = { onOpen(notification) },
                        onDelete = { onDelete(notification) },
                        modifier = Modifier.animateItem(),
                    )
                }
            }
        }
    }
}

@FortisScreenPreviews
@Composable
private fun NotificationsContentPreview() {
    val now = Instant.now()
    FortisPreviewTheme {
        NotificationsContent(
            state = NotificationsUiState(
                isLoading = false,
                notifications = listOf(
                    AppNotification("1", AppNotification.TYPE_DASHBOARD_MEMBER_ADDED, dashboardId = "d",
                        role = "editor", createdAt = now.minus(Duration.ofHours(2))),
                    AppNotification("2", AppNotification.TYPE_BANK_MEMBER_ADDED, bankAccountId = "b",
                        role = "viewer", createdAt = now.minus(Duration.ofDays(1)), readAt = now),
                ),
                names = mapOf("d" to "Casa", "b" to "Millennium"),
            ),
            contentPadding = PaddingValues(),
            onBack = {}, onRetry = {}, onOnlyUnreadChange = {}, onMarkAllRead = {}, onOpen = {}, onDelete = {},
        )
    }
}
