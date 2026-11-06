package pt.fortislibertas.ui.profile.components

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.AccountBalance
import androidx.compose.material.icons.outlined.Dashboard
import androidx.compose.material.icons.outlined.Lock
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import pt.fortislibertas.R
import pt.fortislibertas.core.designsystem.components.ActionRow
import pt.fortislibertas.core.designsystem.preview.FortisPreviews
import pt.fortislibertas.core.designsystem.theme.FortisLibertasTheme

/** Shortcuts to other screens: password, banks and cards, dashboards. */
@Composable
fun ProfileShortcuts(
    onOpenPassword: () -> Unit,
    onOpenBanks: () -> Unit,
    onOpenDashboards: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Column(modifier, verticalArrangement = Arrangement.spacedBy(12.dp)) {
        ActionRow(
            icon = Icons.Outlined.Lock,
            title = stringResource(R.string.profile_password),
            description = stringResource(R.string.profile_password_desc),
            onClick = onOpenPassword,
        )
        ActionRow(
            icon = Icons.Outlined.AccountBalance,
            title = stringResource(R.string.profile_banks),
            description = stringResource(R.string.profile_banks_desc),
            onClick = onOpenBanks,
        )
        ActionRow(
            icon = Icons.Outlined.Dashboard,
            title = stringResource(R.string.profile_dashboards),
            description = stringResource(R.string.profile_dashboards_desc),
            onClick = onOpenDashboards,
        )
    }
}

@FortisPreviews
@Composable
private fun ProfileShortcutsPreview() {
    FortisLibertasTheme {
        ProfileShortcuts(onOpenPassword = {}, onOpenBanks = {}, onOpenDashboards = {})
    }
}
