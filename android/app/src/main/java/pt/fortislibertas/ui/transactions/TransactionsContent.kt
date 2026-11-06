package pt.fortislibertas.ui.transactions

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.calculateEndPadding
import androidx.compose.foundation.layout.calculateStartPadding
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import pt.fortislibertas.R
import pt.fortislibertas.core.designsystem.components.ErrorContent
import pt.fortislibertas.core.designsystem.components.FortisTopBar
import pt.fortislibertas.core.designsystem.components.LoadingContent
import pt.fortislibertas.core.designsystem.components.TransactionGroup
import pt.fortislibertas.core.designsystem.components.dayLabel
import pt.fortislibertas.core.designsystem.theme.FortisLibertasTheme
import pt.fortislibertas.data.fake.FakeTransactionData
import pt.fortislibertas.data.model.RecordType
import pt.fortislibertas.data.model.TransactionItem
import pt.fortislibertas.ui.transactions.components.TransactionsSearchBar
import pt.fortislibertas.ui.transactions.components.TransactionsTypeChips

/**
 * Stateless version of the Transactions tab: top bar, search, type chips and the list grouped by day.
 * Easy to preview.
 */
@Composable
fun TransactionsContent(
    state: TransactionsUiState,
    contentPadding: PaddingValues,
    onOpenNotifications: () -> Unit,
    onTransactionClick: (TransactionItem) -> Unit,
    onQueryChange: (String) -> Unit,
    onOpenFilter: () -> Unit,
    onTypeChange: (RecordType?) -> Unit,
    onRetry: () -> Unit,
) {
    val layoutDirection = LocalLayoutDirection.current

    // Fixed header on top; only the list scrolls (and slides under the blurred bottom bar)
    Column(
        Modifier
            .fillMaxSize()
            .padding(
                top = contentPadding.calculateTopPadding(),
                start = contentPadding.calculateStartPadding(layoutDirection),
                end = contentPadding.calculateEndPadding(layoutDirection),
            ),
    ) {
        Column(
            modifier = Modifier.padding(horizontal = 20.dp, vertical = 16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            FortisTopBar(
                title = stringResource(R.string.transactions_title),
                avatarName = state.userName,
                avatarUrl = state.avatarUrl,
                notificationCount = 0,                   // TODO: connect to the notifications count
                notificationsLabel = stringResource(R.string.notifications),
                onNotificationsClick = onOpenNotifications,
            )

            TransactionsSearchBar(
                query = state.filter.query,
                activeFilterCount = state.filter.activeCount,
                onQueryChange = onQueryChange,
                onOpenFilter = onOpenFilter,
            )

            TransactionsTypeChips(selected = state.filter.type, onSelect = onTypeChange)
        }

        // Thin bar while refreshing a list that is already on screen
        if (state.isLoading && state.hasLoaded) {
            LinearProgressIndicator(Modifier.fillMaxWidth())
        }

        val listModifier = Modifier.weight(1f).fillMaxWidth()
        when {
            !state.hasLoaded && state.isLoading -> LoadingContent(listModifier)

            state.errorMessage != null && state.items.isEmpty() -> ErrorContent(
                message = stringResource(state.errorMessage!!),
                retryLabel = stringResource(R.string.action_retry),
                onRetry = onRetry,
                modifier = listModifier,
            )

            state.items.isEmpty() -> Box(listModifier.padding(32.dp), contentAlignment = Alignment.Center) {
                Text(
                    text = stringResource(R.string.transactions_empty),
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    textAlign = TextAlign.Center,
                )
            }

            else -> {
                // Group by day (the list is already sorted, newest first)
                val groups = state.items.groupBy { it.date }.entries.toList()
                LazyColumn(
                    modifier = listModifier,
                    contentPadding = PaddingValues(
                        start = 20.dp,
                        end = 20.dp,
                        top = 4.dp,
                        bottom = contentPadding.calculateBottomPadding() + 16.dp,
                    ),
                    verticalArrangement = Arrangement.spacedBy(16.dp),
                ) {
                    items(groups, key = { it.key.toString() }) { (date, dayItems) ->
                        TransactionGroup(
                            title = dayLabel(date),
                            items = dayItems,
                            onItemClick = onTransactionClick,
                        )
                    }
                }
            }
        }
    }
}

// ── Previews ────────────────────────────────────────────

@Preview(showBackground = true, heightDp = 900)
@Composable
private fun TransactionsContentPreview() {
    FortisLibertasTheme {
        TransactionsContent(
            state = TransactionsUiState(
                items = FakeTransactionData.build().map { it.item },
                isLoading = false,
                hasLoaded = true,
                userName = "Ana Silva",
            ),
            contentPadding = PaddingValues(),
            onOpenNotifications = {},
            onTransactionClick = {},
            onQueryChange = {},
            onOpenFilter = {},
            onTypeChange = {},
            onRetry = {},
        )
    }
}
