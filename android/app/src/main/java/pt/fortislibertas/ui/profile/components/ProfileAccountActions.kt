package pt.fortislibertas.ui.profile.components

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.Logout
import androidx.compose.material.icons.outlined.Block
import androidx.compose.material.icons.outlined.DeleteForever
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import pt.fortislibertas.R
import pt.fortislibertas.core.designsystem.components.ActionRow
import pt.fortislibertas.core.designsystem.components.ActionTone
import pt.fortislibertas.core.designsystem.theme.FortisLibertasTheme
import pt.fortislibertas.ui.profile.ProfileDialog

/**
 * Account section: sign out, deactivate and delete.
 * Each action only asks for a confirmation dialog; the ViewModel does the real work.
 */
@Composable
fun ProfileAccountActions(
    onRequestDialog: (ProfileDialog) -> Unit,
    modifier: Modifier = Modifier,
) {
    Column(modifier, verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Text(
            text = stringResource(R.string.profile_section_account),
            style = MaterialTheme.typography.titleSmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
        ActionRow(
            icon = Icons.AutoMirrored.Outlined.Logout,
            title = stringResource(R.string.profile_sign_out),
            description = stringResource(R.string.profile_sign_out_desc),
            onClick = { onRequestDialog(ProfileDialog.SignOut) },
            showChevron = false,
        )
        ActionRow(
            icon = Icons.Outlined.Block,
            title = stringResource(R.string.profile_deactivate),
            description = stringResource(R.string.profile_deactivate_desc),
            onClick = { onRequestDialog(ProfileDialog.Deactivate) },
            tone = ActionTone.Warning,
            showChevron = false,
        )
        ActionRow(
            icon = Icons.Outlined.DeleteForever,
            title = stringResource(R.string.profile_delete),
            description = stringResource(R.string.profile_delete_desc),
            onClick = { onRequestDialog(ProfileDialog.Delete) },
            tone = ActionTone.Danger,
            showChevron = false,
        )
    }
}

@Preview(showBackground = true)
@Composable
private fun ProfileAccountActionsPreview() {
    FortisLibertasTheme {
        ProfileAccountActions(onRequestDialog = {})
    }
}
