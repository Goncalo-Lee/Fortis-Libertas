package pt.fortislibertas.ui.profile.components

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.Logout
import androidx.compose.material.icons.outlined.Block
import androidx.compose.material.icons.outlined.DeleteForever
import androidx.compose.runtime.Composable
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.tooling.preview.Preview
import pt.fortislibertas.R
import pt.fortislibertas.core.designsystem.components.ConfirmDialog
import pt.fortislibertas.core.designsystem.theme.FortisLibertasTheme
import pt.fortislibertas.ui.profile.ProfileDialog

/**
 * Shows the confirmation dialog that is open in ProfileUiState.dialog, or nothing when it is null.
 * All three dialogs use the same [ConfirmDialog]; delete also asks the user to type their [email].
 */
@Composable
fun ProfileDialogs(
    dialog: ProfileDialog?,
    email: String,
    isWorking: Boolean,
    onConfirm: () -> Unit,
    onDismiss: () -> Unit,
) {
    when (dialog) {
        ProfileDialog.SignOut -> ConfirmDialog(
            icon = Icons.AutoMirrored.Outlined.Logout,
            title = stringResource(R.string.dialog_sign_out_title),
            message = stringResource(R.string.dialog_sign_out_message),
            confirmLabel = stringResource(R.string.profile_sign_out),
            dismissLabel = stringResource(R.string.action_cancel),
            isWorking = isWorking,
            onConfirm = onConfirm,
            onDismiss = onDismiss,
        )
        ProfileDialog.Deactivate -> ConfirmDialog(
            icon = Icons.Outlined.Block,
            title = stringResource(R.string.dialog_deactivate_title),
            message = stringResource(R.string.dialog_deactivate_message),
            confirmLabel = stringResource(R.string.action_deactivate),
            dismissLabel = stringResource(R.string.action_cancel),
            destructive = true,
            isWorking = isWorking,
            onConfirm = onConfirm,
            onDismiss = onDismiss,
        )
        ProfileDialog.Delete -> {
            ConfirmDialog(
                icon = Icons.Outlined.DeleteForever,
                title = stringResource(R.string.dialog_delete_title),
                message = stringResource(R.string.dialog_delete_message),
                confirmLabel = stringResource(R.string.action_delete),
                dismissLabel = stringResource(R.string.action_cancel),
                destructive = true,
                requiredText = email,                       // the user must type their email to confirm
                requiredTextHint = stringResource(R.string.dialog_delete_confirm_hint, email),
                isWorking = isWorking,
                onConfirm = onConfirm,
                onDismiss = onDismiss,
            )
        }
        null -> Unit
    }
}

@Preview(showBackground = true)
@Composable
private fun ProfileDeleteDialogPreview() {
    FortisLibertasTheme {
        ProfileDialogs(dialog = ProfileDialog.Delete, email = "ana@example.com", isWorking = false, onConfirm = {}, onDismiss = {})
    }
}
