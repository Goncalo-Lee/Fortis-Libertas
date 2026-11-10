package pt.fortislibertas.ui.profile

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import pt.fortislibertas.R
import pt.fortislibertas.core.designsystem.components.AccountSwitcherSheet
import pt.fortislibertas.ui.profile.components.ProfileDialogs
import pt.fortislibertas.ui.profile.components.ProfileLanguageSheet

/**
 * Stateful version of the Profile tab: connects [ProfileViewModel] to [ProfileContent].
 * This is the one used in the NavHost. It also shows the snackbar, the account switcher
 * and the confirmation dialogs.
 */
@Composable
fun ProfileScreen(
    contentPadding: PaddingValues,
    onNavigateToSignIn: () -> Unit,
    onEditProfile: () -> Unit = {},
    onOpenPassword: () -> Unit = {},
    onOpenBanks: () -> Unit = {},
    onOpenDashboards: () -> Unit = {},
    viewModel: ProfileViewModel = viewModel(factory = ProfileViewModel.Factory),
) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    val snackbarHostState = remember { SnackbarHostState() }
    val resources = LocalContext.current.resources

    // One-time events: navigate and show messages
    LaunchedEffect(viewModel) {
        viewModel.events.collect { event ->
            when (event) {
                ProfileEvent.NavigateToSignIn -> onNavigateToSignIn()
                is ProfileEvent.ShowMessage ->
                    snackbarHostState.showSnackbar(resources.getString(event.messageRes))
            }
        }
    }

    Box(Modifier.fillMaxSize()) {
        ProfileContent(
            state = state,
            contentPadding = contentPadding,
            onRetry = viewModel::loadProfile,
            onSignIn = onNavigateToSignIn,
            onEditProfile = onEditProfile,
            onSwitchAccount = viewModel::openAccountSwitcher,
            onOpenPassword = onOpenPassword,
            onOpenBanks = onOpenBanks,
            onOpenDashboards = onOpenDashboards,
            onRequestDialog = viewModel::openDialog,
            onThemeModeChange = viewModel::setThemeMode,
            onOpenLanguage = viewModel::openLanguageSheet,
        )

        SnackbarHost(
            hostState = snackbarHostState,
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .padding(contentPadding),
        )
    }

    // Account switcher
    if (state.showAccountSwitcher) {
        AccountSwitcherSheet(
            accounts = state.accounts,
            activeAccountId = state.activeAccountId,
            title = stringResource(R.string.accounts_title),
            addAccountLabel = stringResource(R.string.accounts_add),
            onSelect = viewModel::switchAccount,
            onAddAccount = viewModel::addAccount,
            onDismiss = viewModel::closeAccountSwitcher,
        )
    }

    if (state.showLanguageSheet) {
        ProfileLanguageSheet(
            selected = state.language,
            onSelect = viewModel::setLanguage,
            onDismiss = viewModel::closeLanguageSheet,
        )
    }

    // Confirmation dialogs (sign out, deactivate, delete)
    ProfileDialogs(
        dialog = state.dialog,
        email = state.profile?.email.orEmpty(),
        isWorking = state.isWorking,
        onConfirm = viewModel::confirmDialog,
        onDismiss = viewModel::closeDialog,
    )
}
