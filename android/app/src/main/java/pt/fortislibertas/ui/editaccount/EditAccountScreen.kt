package pt.fortislibertas.ui.editaccount

import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel

/** Stateful version used in the NavHost. [onSaved] goes back to the Profile. */
@Composable
fun EditAccountScreen(
    contentPadding: PaddingValues,
    onBack: () -> Unit,
    onSaved: () -> Unit,
    viewModel: EditAccountViewModel = viewModel(factory = EditAccountViewModel.Factory),
) {
    val state by viewModel.state.collectAsStateWithLifecycle()

    LaunchedEffect(viewModel) {
        viewModel.events.collect { event ->
            when (event) {
                EditAccountEvent.Saved -> onSaved()
            }
        }
    }

    EditAccountContent(
        state = state,
        contentPadding = contentPadding,
        onBack = onBack,
        onRetry = viewModel::load,
        onFullNameChange = viewModel::onFullNameChange,
        onUserNameChange = viewModel::onUserNameChange,
        onPhoneChange = viewModel::onPhoneChange,
        onBirthDateChange = viewModel::onBirthDateChange,
        onCurrencyChange = viewModel::onCurrencyChange,
        onPrimaryBankChange = viewModel::onPrimaryBankChange,
        onSave = viewModel::save,
    )
}
