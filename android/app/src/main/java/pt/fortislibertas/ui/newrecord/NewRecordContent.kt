package pt.fortislibertas.ui.newrecord

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.CalendarMonth
import androidx.compose.material.icons.outlined.PostAdd
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import pt.fortislibertas.R
import pt.fortislibertas.core.designsystem.components.ActionTile
import pt.fortislibertas.core.designsystem.components.FortisTopBar
import pt.fortislibertas.core.designsystem.preview.FortisPreviewTheme
import pt.fortislibertas.core.designsystem.preview.FortisScreenPreviews

/** Fixed part of the Register tab: top bar and the three tiles. Stateless, easy to preview. */
@Composable
fun NewRecordContent(
    avatarName: String?,
    avatarUrl: String?,
    contentPadding: PaddingValues,
    onOpenNotifications: () -> Unit,
    onNewRecord: () -> Unit,
    onNewPlan: () -> Unit,
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(contentPadding)
            .padding(horizontal = 20.dp, vertical = 16.dp),
    ) {
        FortisTopBar(
            title = stringResource(R.string.register_title),
            avatarName = avatarName,
            avatarUrl = avatarUrl,
            notificationCount = 0,       // TODO: connect to the notifications count
            notificationsLabel = stringResource(R.string.notifications),
            onNotificationsClick = onOpenNotifications,
        )

        Spacer(Modifier.height(32.dp))

        val tiles = listOf(
            Triple(Icons.Outlined.PostAdd, R.string.register_new_record, onNewRecord),
            Triple(Icons.Outlined.CalendarMonth, R.string.register_new_plan, onNewPlan),
        )

        // 2-column grid (built by hand: there are only 2 tiles)
        Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
            tiles.chunked(2).forEach { row ->
                Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                    row.forEach { (icon, titleRes, onClick) ->
                        ActionTile(
                            icon = icon,
                            title = stringResource(titleRes),
                            onClick = onClick,
                            modifier = Modifier.weight(1f),
                        )
                    }
                    if (row.size == 1) Spacer(Modifier.weight(1f))
                }
            }
        }
    }
}

// ── Previews ────────────────────────────────────────────

@FortisScreenPreviews
@Composable
private fun NewRecordContentPreview() {
    FortisPreviewTheme {
        NewRecordContent(
            avatarName = "Ana Silva",
            avatarUrl = null,
            contentPadding = PaddingValues(),
            onOpenNotifications = {},
            onNewRecord = {},
            onNewPlan = {},
        )
    }
}
