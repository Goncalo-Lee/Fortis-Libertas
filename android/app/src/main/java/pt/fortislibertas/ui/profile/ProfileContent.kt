package pt.fortislibertas.ui.profile

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.HorizontalDivider
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import pt.fortislibertas.R
import pt.fortislibertas.core.designsystem.components.EmptyContent
import pt.fortislibertas.core.designsystem.components.ErrorContent
import pt.fortislibertas.core.designsystem.components.LoadingContent
import pt.fortislibertas.core.designsystem.preview.FortisScreenPreviews
import pt.fortislibertas.core.designsystem.theme.FortisLibertasTheme
import pt.fortislibertas.data.fake.FakeAccountData
import pt.fortislibertas.data.model.UserProfile
import pt.fortislibertas.ui.profile.components.ProfileAccountActions
import pt.fortislibertas.ui.profile.components.ProfileAccountDetailsCard
import pt.fortislibertas.ui.profile.components.ProfileHeader
import pt.fortislibertas.ui.profile.components.ProfileShortcuts

/**
 * Stateless version: only draws what it receives.
 * Picks between loading, error, signed out and the profile itself. Easy to preview and test.
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

/** The signed-in profile: header, account details, shortcuts and account actions. */
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
            .padding(contentPadding)          // after the scroll: content slides under the blurred bottom bar
            .padding(horizontal = 20.dp, vertical = 16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        ProfileHeader(
            profile = profile,
            onEditProfile = onEditProfile,
            onSwitchAccount = onSwitchAccount,
        )

        Spacer(Modifier.height(4.dp))

        ProfileAccountDetailsCard(profile)

        HorizontalDivider(Modifier.padding(vertical = 8.dp))

        ProfileShortcuts(
            onOpenPassword = onOpenPassword,
            onOpenBanks = onOpenBanks,
            onOpenDashboards = onOpenDashboards,
        )

        HorizontalDivider(Modifier.padding(vertical = 8.dp))

        ProfileAccountActions(onRequestDialog = onRequestDialog)
    }
}

// ── Previews ────────────────────────────────────────────

@FortisScreenPreviews
@Composable
private fun ProfileContentPreview() {
    FortisLibertasTheme {
        ProfileContent(
            state = ProfileUiState(
                isLoading = false,
                profile = FakeAccountData.profiles.values.first(),
                accounts = FakeAccountData.accounts,
                activeAccountId = FakeAccountData.accounts.first().id,
            ),
            contentPadding = PaddingValues(),
            onRetry = {}, onSignIn = {}, onEditProfile = {}, onSwitchAccount = {},
            onOpenPassword = {}, onOpenBanks = {}, onOpenDashboards = {}, onRequestDialog = {},
        )
    }
}
