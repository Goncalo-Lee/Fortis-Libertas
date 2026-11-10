package pt.fortislibertas.ui.home

import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import pt.fortislibertas.R
import pt.fortislibertas.core.designsystem.components.EmptyContent
import pt.fortislibertas.core.designsystem.components.ErrorContent
import pt.fortislibertas.core.designsystem.components.LoadingContent
import pt.fortislibertas.data.model.TransactionItem
import pt.fortislibertas.ui.transactiondetail.TransactionDetailDialog

/**
 * Stateful version of the Home tab, used by the NavHost.
 * Connects [HomeViewModel] to [HomeContent] and shows loading, error or signed-out states.
 */
@Composable
fun HomeScreen(
    contentPadding: PaddingValues,
    onOpenBanks: () -> Unit,
    onSeeAllTransactions: () -> Unit,
    onSignIn: () -> Unit,
    onOpenNotifications: () -> Unit = {},
    viewModel: HomeViewModel = viewModel(factory = HomeViewModel.Factory),
) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    var selected by remember { mutableStateOf<TransactionItem?>(null) }   // details dialog

    // When coming back to this tab (e.g. after creating a record), refresh silently
    LaunchedEffect(Unit) { viewModel.onScreenShown() }

    val summary = state.summary
    when {
        !state.isSignedIn -> EmptyContent(
            title = stringResource(R.string.empty_signed_out_title),
            message = stringResource(R.string.empty_signed_out_message),
            actionLabel = stringResource(R.string.action_sign_in),
            onAction = onSignIn,
            modifier = Modifier.padding(contentPadding),
        )
        summary != null -> HomeContent(
            summary = summary,
            userName = state.userName,
            avatarUrl = state.avatarUrl,
            contentPadding = contentPadding,
            onOpenNotifications = onOpenNotifications,
            onOpenBanks = onOpenBanks,
            onSeeAllTransactions = onSeeAllTransactions,
            onTransactionClick = { selected = it },
        )
        state.errorMessage != null -> ErrorContent(
            message = stringResource(state.errorMessage!!),
            retryLabel = stringResource(R.string.action_retry),
            onRetry = viewModel::refresh,
            modifier = Modifier.padding(contentPadding),
        )
        else -> LoadingContent(Modifier.padding(contentPadding))
    }

    selected?.let { item ->
        TransactionDetailDialog(
            summary = item,
            onDismiss = { selected = null },
            onDeleted = {
                selected = null
                viewModel.refresh()                       // reload Home without the deleted record
            },
        )
    }
}
