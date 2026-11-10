package pt.fortislibertas.ui.dashboard.components

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Add
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.FilledIconButton
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardCapitalization
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import pt.fortislibertas.R
import pt.fortislibertas.core.designsystem.components.BlurDialog
import pt.fortislibertas.core.designsystem.components.FormTextField
import pt.fortislibertas.core.designsystem.preview.FortisPreviewTheme
import pt.fortislibertas.core.designsystem.preview.FortisPreviews
import pt.fortislibertas.ui.dashboard.DashboardCreateUiState
import pt.fortislibertas.ui.dashboard.DashboardCreateViewModel

/** The account has no dashboard: a big "+" in the middle of the screen to create the first one. */
@Composable
fun DashboardEmptyState(
    onCreate: () -> Unit,
    modifier: Modifier = Modifier,
    contentPadding: PaddingValues = PaddingValues(),
) {
    Column(
        modifier = modifier.fillMaxSize().padding(contentPadding).padding(32.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        FilledIconButton(onClick = onCreate, shape = CircleShape, modifier = Modifier.size(88.dp)) {
            Icon(Icons.Outlined.Add, contentDescription = stringResource(R.string.dash_create), modifier = Modifier.size(44.dp))
        }
        Spacer(Modifier.height(20.dp))
        Text(stringResource(R.string.dash_empty_title), style = MaterialTheme.typography.titleMedium, textAlign = TextAlign.Center)
        Spacer(Modifier.height(6.dp))
        Text(
            stringResource(R.string.dash_empty_message),
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            textAlign = TextAlign.Center,
        )
    }
}

/** "New dashboard" dialog. [onCreated] runs after it is created and set as the active one. */
@Composable
fun DashboardCreateDialog(
    onDismiss: () -> Unit,
    onCreated: () -> Unit,
    viewModel: DashboardCreateViewModel = viewModel(factory = DashboardCreateViewModel.Factory),
) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    LaunchedEffect(viewModel) { viewModel.created.collect { onCreated() } }

    DashboardCreateDialogContent(
        state = state,
        onNameChange = viewModel::onNameChange,
        onCreate = viewModel::create,
        onDismiss = {
            viewModel.reset()
            onDismiss()
        },
    )
}

@Composable
private fun DashboardCreateDialogContent(
    state: DashboardCreateUiState,
    onNameChange: (String) -> Unit,
    onCreate: () -> Unit,
    onDismiss: () -> Unit,
) {
    BlurDialog(onDismissRequest = { if (!state.isSaving) onDismiss() }) {
        Text(stringResource(R.string.dash_create_title), style = MaterialTheme.typography.titleLarge)
        Spacer(Modifier.height(16.dp))
        FormTextField(
            label = stringResource(R.string.dash_new_name),
            value = state.name,
            onValueChange = onNameChange,
            placeholder = stringResource(R.string.dash_create_placeholder),
            errorText = state.error?.let { stringResource(it) },
            maxLength = 50,
            keyboardOptions = KeyboardOptions(capitalization = KeyboardCapitalization.Sentences, imeAction = ImeAction.Done),
        )
        Spacer(Modifier.height(16.dp))
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End, verticalAlignment = Alignment.CenterVertically) {
            TextButton(onClick = onDismiss, enabled = !state.isSaving) { Text(stringResource(R.string.action_cancel)) }
            Spacer(Modifier.size(8.dp))
            Button(onClick = onCreate, enabled = !state.isSaving) {
                if (state.isSaving) CircularProgressIndicator(Modifier.size(18.dp), strokeWidth = 2.dp)
                else Text(stringResource(R.string.dash_create_action))
            }
        }
    }
}

@FortisPreviews
@Composable
private fun DashboardEmptyStatePreview() {
    FortisPreviewTheme { DashboardEmptyState(onCreate = {}) }
}

@FortisPreviews
@Composable
private fun DashboardCreateDialogPreview() {
    FortisPreviewTheme {
        DashboardCreateDialogContent(DashboardCreateUiState(name = "Casa"), onNameChange = {}, onCreate = {}, onDismiss = {})
    }
}
