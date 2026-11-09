package pt.fortislibertas.ui.auth

import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.rememberUpdatedState
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel

/**
 * Stateful version of the Sign in / Sign up screen, used by the NavHost.
 * Connects [AuthViewModel] to [AuthContent]; [onSignedIn] runs after the account is saved.
 */
@Composable
fun AuthScreen(
    contentPadding: PaddingValues,
    onSignedIn: () -> Unit,
    viewModel: AuthViewModel = viewModel(factory = AuthViewModel.Factory),
) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    val currentOnSignedIn by rememberUpdatedState(onSignedIn)

    // One-time event: go to the app after signing in
    LaunchedEffect(viewModel) {
        viewModel.events.collect { event ->
            when (event) {
                AuthEvent.SignedIn -> currentOnSignedIn()
            }
        }
    }

    AuthContent(
        state = state,
        contentPadding = contentPadding,
        onModeChange = viewModel::onModeChange,
        onNameChange = viewModel::onNameChange,
        onEmailChange = viewModel::onEmailChange,
        onPasswordChange = viewModel::onPasswordChange,
        onConfirmPasswordChange = viewModel::onConfirmPasswordChange,
        onRememberMeChange = viewModel::onRememberMeChange,
        onSubmit = viewModel::submit,
    )
}
