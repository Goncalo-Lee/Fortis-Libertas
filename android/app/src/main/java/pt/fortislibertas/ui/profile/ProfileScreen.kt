package pt.fortislibertas.ui.profile

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.Logout
import androidx.compose.material.icons.outlined.AccountBalance
import androidx.compose.material.icons.outlined.Block
import androidx.compose.material.icons.outlined.Dashboard
import androidx.compose.material.icons.outlined.DeleteForever
import androidx.compose.material.icons.outlined.Edit
import androidx.compose.material.icons.outlined.Lock
import androidx.compose.material.icons.outlined.SwapHoriz
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedIconButton
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import pt.fortislibertas.R
import pt.fortislibertas.core.designsystem.components.AccountSwitcherSheet
import pt.fortislibertas.core.designsystem.components.ActionRow
import pt.fortislibertas.core.designsystem.components.ActionTone
import pt.fortislibertas.core.designsystem.components.ConfirmDialog
import pt.fortislibertas.core.designsystem.components.EmptyContent
import pt.fortislibertas.core.designsystem.components.ErrorContent
import pt.fortislibertas.core.designsystem.components.FortisCard
import pt.fortislibertas.core.designsystem.components.LabeledValue
import pt.fortislibertas.core.designsystem.components.LoadingContent
import pt.fortislibertas.core.designsystem.components.UserAvatar
import pt.fortislibertas.core.designsystem.theme.FortisLibertasTheme
import pt.fortislibertas.core.designsystem.util.MoneyFormatter
import pt.fortislibertas.data.local.FakeData
import pt.fortislibertas.data.model.UserProfile

/**
 * Versão "com estado": liga o ViewModel ao ecrã.
 * É esta que se usa no NavHost.
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

    // Eventos de uma só vez: navegar e mostrar mensagens
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
        )

        SnackbarHost(
            hostState = snackbarHostState,
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .padding(contentPadding),
        )
    }

    // Seletor de contas
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

    // Diálogos de confirmação (todos usam o mesmo componente)
    when (state.dialog) {
        ProfileDialog.SignOut -> ConfirmDialog(
            icon = Icons.AutoMirrored.Outlined.Logout,
            title = stringResource(R.string.dialog_sign_out_title),
            message = stringResource(R.string.dialog_sign_out_message),
            confirmLabel = stringResource(R.string.profile_sign_out),
            dismissLabel = stringResource(R.string.action_cancel),
            isWorking = state.isWorking,
            onConfirm = viewModel::confirmDialog,
            onDismiss = viewModel::closeDialog,
        )
        ProfileDialog.Deactivate -> ConfirmDialog(
            icon = Icons.Outlined.Block,
            title = stringResource(R.string.dialog_deactivate_title),
            message = stringResource(R.string.dialog_deactivate_message),
            confirmLabel = stringResource(R.string.action_deactivate),
            dismissLabel = stringResource(R.string.action_cancel),
            destructive = true,
            isWorking = state.isWorking,
            onConfirm = viewModel::confirmDialog,
            onDismiss = viewModel::closeDialog,
        )
        ProfileDialog.Delete -> {
            val email = state.profile?.email.orEmpty()
            ConfirmDialog(
                icon = Icons.Outlined.DeleteForever,
                title = stringResource(R.string.dialog_delete_title),
                message = stringResource(R.string.dialog_delete_message),
                confirmLabel = stringResource(R.string.action_delete),
                dismissLabel = stringResource(R.string.action_cancel),
                destructive = true,
                requiredText = email,                       // tem de escrever o email
                requiredTextHint = stringResource(R.string.dialog_delete_confirm_hint, email),
                isWorking = state.isWorking,
                onConfirm = viewModel::confirmDialog,
                onDismiss = viewModel::closeDialog,
            )
        }
        null -> Unit
    }
}

/**
 * Versão "sem estado": só desenha o que recebe.
 * Fácil de pré-visualizar e de testar.
 */
@Composable
fun ProfileContent(
    state: ProfileUiState,
    contentPadding: PaddingValues,
    onRetry: () -> Unit,
    onSignIn: () -> Unit,
    onEditProfile: () -> Unit,
    onSwitchAccount: () -> Unit,
    onOpenPassword: () -> Unit,
    onOpenBanks: () -> Unit,
    onOpenDashboards: () -> Unit,
    onRequestDialog: (ProfileDialog) -> Unit,
    modifier: Modifier = Modifier,
) {
    val waitingForProfile =
        state.profile == null && state.activeAccountId != null && state.errorMessage == null

    when {
        state.isLoading || waitingForProfile ->
            LoadingContent(modifier.padding(contentPadding))

        state.errorMessage != null -> ErrorContent(
            message = stringResource(state.errorMessage),
            retryLabel = stringResource(R.string.action_retry),
            onRetry = onRetry,
            modifier = modifier.padding(contentPadding),
        )

        state.profile == null -> EmptyContent(
            title = stringResource(R.string.empty_signed_out_title),
            message = stringResource(R.string.empty_signed_out_message),
            actionLabel = stringResource(R.string.action_sign_in),
            onAction = onSignIn,
            modifier = modifier.padding(contentPadding),
        )

        else -> ProfileBody(
            profile = state.profile,
            contentPadding = contentPadding,
            onEditProfile = onEditProfile,
            onSwitchAccount = onSwitchAccount,
            onOpenPassword = onOpenPassword,
            onOpenBanks = onOpenBanks,
            onOpenDashboards = onOpenDashboards,
            onRequestDialog = onRequestDialog,
            modifier = modifier,
        )
    }
}

@Composable
private fun ProfileBody(
    profile: UserProfile,
    contentPadding: PaddingValues,
    onEditProfile: () -> Unit,
    onSwitchAccount: () -> Unit,
    onOpenPassword: () -> Unit,
    onOpenBanks: () -> Unit,
    onOpenDashboards: () -> Unit,
    onRequestDialog: (ProfileDialog) -> Unit,
    modifier: Modifier = Modifier,
) {
    Column(
        modifier = modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(contentPadding)          // depois do scroll: o conteúdo passa por baixo da barra (blur)
            .padding(horizontal = 20.dp, vertical = 16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        // ── Título + editar ──────────────────────────────
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text(
                text = stringResource(R.string.profile_title),
                style = MaterialTheme.typography.headlineSmall,
                modifier = Modifier.weight(1f),
            )
            OutlinedIconButton(onClick = onEditProfile, shape = RoundedCornerShape(12.dp)) {
                Icon(Icons.Outlined.Edit, contentDescription = stringResource(R.string.profile_edit))
            }
        }

        // ── Avatar, nome, email | username ───────────────
        Column(
            modifier = Modifier.fillMaxWidth(),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            UserAvatar(
                name = profile.fullName,
                imageUrl = profile.imageUrl,
                size = 112.dp,
                contentDescription = stringResource(R.string.avatar_description),
            )
            Text(
                text = profile.fullName,
                style = MaterialTheme.typography.headlineMedium,
                textAlign = TextAlign.Center,
            )
            Text(
                text = listOfNotNull(profile.email, profile.userName).joinToString("  |  "),
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                textAlign = TextAlign.Center,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
            )
            OutlinedButton(
                onClick = onSwitchAccount,
                contentPadding = ButtonDefaults.ButtonWithIconContentPadding,
            ) {
                Icon(Icons.Outlined.SwapHoriz, contentDescription = null, modifier = Modifier.size(18.dp))
                Spacer(Modifier.size(8.dp))
                Text(stringResource(R.string.profile_switch_account))
            }
        }

        Spacer(Modifier.height(4.dp))

        // ── Account details ─────────────────────────────
        FortisCard {
            Text(stringResource(R.string.profile_account_details), style = MaterialTheme.typography.titleMedium)
            HorizontalDivider(Modifier.padding(vertical = 12.dp))
            Text(profile.fullName, style = MaterialTheme.typography.bodyLarge)
            Text(
                text = stringResource(R.string.profile_account_id, profile.id),
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
            )
            Spacer(Modifier.height(16.dp))
            Row(Modifier.fillMaxWidth()) {
                LabeledValue(
                    label = stringResource(R.string.profile_balance),
                    value = MoneyFormatter.format(profile.accountBalance, profile.currency),
                    modifier = Modifier.weight(1f),
                )
                LabeledValue(
                    label = stringResource(R.string.profile_saved),
                    value = MoneyFormatter.format(profile.amountSaved, profile.currency),
                    modifier = Modifier.weight(1f),
                )
            }
        }

        HorizontalDivider(Modifier.padding(vertical = 8.dp))

        // ── Atalhos ─────────────────────────────────────
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

        HorizontalDivider(Modifier.padding(vertical = 8.dp))

        // ── Conta: sair, desativar, apagar ──────────────
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

// ── Pré-visualizações ───────────────────────────────────

@Preview(showBackground = true, heightDp = 1400)
@Composable
private fun ProfileContentPreview() {
    FortisLibertasTheme(darkTheme = false) {
        ProfileContent(
            state = ProfileUiState(
                isLoading = false,
                profile = FakeData.profiles.values.first(),
                accounts = FakeData.accounts,
                activeAccountId = FakeData.accounts.first().id,
            ),
            contentPadding = PaddingValues(),
            onRetry = {}, onSignIn = {}, onEditProfile = {}, onSwitchAccount = {},
            onOpenPassword = {}, onOpenBanks = {}, onOpenDashboards = {}, onRequestDialog = {},
        )
    }
}

@Preview(showBackground = true, heightDp = 1400, backgroundColor = 0xFF171717)
@Composable
private fun ProfileContentDarkPreview() {
    FortisLibertasTheme(darkTheme = true) {
        ProfileContent(
            state = ProfileUiState(
                isLoading = false,
                profile = FakeData.profiles.values.first(),
                activeAccountId = FakeData.accounts.first().id,
            ),
            contentPadding = PaddingValues(),
            onRetry = {}, onSignIn = {}, onEditProfile = {}, onSwitchAccount = {},
            onOpenPassword = {}, onOpenBanks = {}, onOpenDashboards = {}, onRequestDialog = {},
        )
    }
}
