package pt.fortislibertas.core.designsystem.components

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Notifications
import androidx.compose.material3.Badge
import androidx.compose.material3.BadgedBox
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedIconButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import pt.fortislibertas.core.designsystem.preview.FortisPreviewTheme
import pt.fortislibertas.core.designsystem.preview.FortisPreviews

/**
 * Shared header (Home, Dashboard, Register…):
 * avatar + title on the left, notifications with a counter on the right.
 */
@Composable
fun FortisTopBar(
    title: String,
    avatarName: String?,
    avatarUrl: String?,
    notificationCount: Int,
    notificationsLabel: String,
    onNotificationsClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Row(
        modifier = modifier.fillMaxWidth(),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        UserAvatar(name = avatarName.orEmpty(), imageUrl = avatarUrl)
        Text(
            text = title,
            style = MaterialTheme.typography.titleLarge,
            modifier = Modifier.weight(1f),
        )
        BadgedBox(
            badge = {
                if (notificationCount > 0) {
                    Badge { Text(if (notificationCount > 99) "99+" else notificationCount.toString()) }
                }
            },
        ) {
            OutlinedIconButton(onClick = onNotificationsClick, shape = RoundedCornerShape(12.dp)) {
                Icon(Icons.Outlined.Notifications, contentDescription = notificationsLabel)
            }
        }
    }
}

@FortisPreviews
@Composable
private fun FortisTopBarPreview() {
    FortisPreviewTheme {
        FortisTopBar(
            title = "Home",
            avatarName = "Ana Silva",
            avatarUrl = null,
            notificationCount = 3,
            notificationsLabel = "Notifications",
            onNotificationsClick = {},
            modifier = Modifier.padding(16.dp),
        )
    }
}
