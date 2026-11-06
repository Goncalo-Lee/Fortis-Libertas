package pt.fortislibertas.ui.transactions

import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import pt.fortislibertas.data.model.TransactionItem
import pt.fortislibertas.ui.transactions.components.TransactionsFilterDialog

/**
 * Stateful version of the Transactions tab, used by the NavHost.
 * Connects [TransactionsViewModel] to [TransactionsContent] and opens the filter dialog.
 */
@Composable
fun TransactionsScreen(
    contentPadding: PaddingValues,
    onOpenNotifications: () -> Unit = {},
    onTransactionClick: (TransactionItem) -> Unit = {},
    viewModel: TransactionsViewModel = viewModel(factory = TransactionsViewModel.Factory),
) {
    val state by viewModel.state.collectAsStateWithLifecycle()

    LaunchedEffect(Unit) { viewModel.onScreenShown() }

    TransactionsContent(
        state = state,
        contentPadding = contentPadding,
        onOpenNotifications = onOpenNotifications,
        onTransactionClick = onTransactionClick,
        onQueryChange = viewModel::onQueryChange,
        onOpenFilter = viewModel::openFilter,
        onTypeChange = viewModel::onTypeChange,
        onRetry = viewModel::retry,
    )

    if (state.showFilter) {
        TransactionsFilterDialog(
            options = state.options,
            current = state.filter,
            currency = state.items.firstOrNull()?.currency ?: "EUR",
            onApply = viewModel::applyFilter,
            onDismiss = viewModel::closeFilter,
        )
    }
}
