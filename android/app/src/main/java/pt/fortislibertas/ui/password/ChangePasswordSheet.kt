package pt.fortislibertas.ui.password

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.Text
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import pt.fortislibertas.R
import pt.fortislibertas.core.designsystem.components.FortisSwitch
import pt.fortislibertas.core.designsystem.preview.FortisPreviewTheme
import pt.fortislibertas.core.designsystem.preview.FortisPreviews
import pt.fortislibertas.ui.auth.components.AuthTextField

/**
 * Change password, in a sheet that opens from the Profile.
 * [onSaved] is called after the server accepts the new password (the sheet closes itself).
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ChangePasswordSheet(
    onDismiss: () -> Unit,
    onSaved: () -> Unit,
    viewModel: ChangePasswordViewModel = viewModel(factory = ChangePasswordViewModel.Factory),
) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)

    LaunchedEffect(viewModel) {
        viewModel.events.collect { event ->
            when (event) {
                ChangePasswordEvent.Saved -> onSaved()
            }
        }
    }

    ModalBottomSheet(
        onDismissRequest = {
            viewModel.reset()
            onDismiss()
        },
        sheetState = sheetState,
    ) {
        ChangePasswordContent(
            state = state,
            onCurrentChange = viewModel::onCurrentChange,
            onNewChange = viewModel::onNewChange,
            onConfirmChange = viewModel::onConfirmChange,
            onRevokeChange = viewModel::onRevokeChange,
            onSave = viewModel::save,
        )
    }
}

/** Stateless form, easy to preview. */
@Composable
fun ChangePasswordContent(
    state: ChangePasswordUiState,
    onCurrentChange: (String) -> Unit,
    onNewChange: (String) -> Unit,
    onConfirmChange: (String) -> Unit,
    onRevokeChange: (Boolean) -> Unit,
    onSave: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val enabled = !state.isSaving
    Column(
        modifier = modifier
            .fillMaxWidth()
            .imePadding()
            .verticalScroll(rememberScrollState())
            .padding(start = 20.dp, end = 20.dp, bottom = 24.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Text(stringResource(R.string.password_title), style = MaterialTheme.typography.titleLarge)

        AuthTextField(
            label = stringResource(R.string.password_current),
            value = state.currentPassword,
            onValueChange = onCurrentChange,
            errorText = state.errors[PasswordField.Current]?.let { stringResource(it) },
            isPassword = true,
            enabled = enabled,
        )
        AuthTextField(
            label = stringResource(R.string.password_new),
            value = state.newPassword,
            onValueChange = onNewChange,
            errorText = state.errors[PasswordField.New]?.let { stringResource(it) },
            isPassword = true,
            enabled = enabled,
        )
        AuthTextField(
            label = stringResource(R.string.password_confirm),
            value = state.confirmPassword,
            onValueChange = onConfirmChange,
            errorText = state.errors[PasswordField.Confirm]?.let { stringResource(it) },
            isPassword = true,
            imeAction = ImeAction.Done,
            onImeAction = onSave,
            enabled = enabled,
        )

        Row(verticalAlignment = Alignment.CenterVertically) {
            Text(
                stringResource(R.string.password_revoke_others),
                style = MaterialTheme.typography.bodyMedium,
                modifier = Modifier.weight(1f).padding(end = 12.dp),
            )
            FortisSwitch(checked = state.revokeOtherSessions, onCheckedChange = onRevokeChange, enabled = enabled)
        }

        state.formError?.let {
            Text(stringResource(it), color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall)
        }

        Spacer(Modifier.height(4.dp))
        Button(onClick = onSave, enabled = enabled, modifier = Modifier.fillMaxWidth().height(48.dp)) {
            if (state.isSaving) CircularProgressIndicator(Modifier.size(20.dp), strokeWidth = 2.dp)
            else Text(stringResource(R.string.password_save))
        }
    }
}

@FortisPreviews
@Composable
private fun ChangePasswordContentPreview() {
    FortisPreviewTheme {
        ChangePasswordContent(
            state = ChangePasswordUiState(
                currentPassword = "secret123",
                newPassword = "short",
                errors = mapOf(PasswordField.New to R.string.auth_error_password_length),
            ),
            onCurrentChange = {}, onNewChange = {}, onConfirmChange = {}, onRevokeChange = {}, onSave = {},
        )
    }
}
