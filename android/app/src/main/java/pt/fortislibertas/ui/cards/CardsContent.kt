package pt.fortislibertas.ui.cards

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
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.ArrowBack
import androidx.compose.material.icons.outlined.AccountBalance
import androidx.compose.material.icons.outlined.CreditCard
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import pt.fortislibertas.R
import pt.fortislibertas.core.designsystem.components.ErrorContent
import pt.fortislibertas.core.designsystem.components.FortisTopBar
import pt.fortislibertas.core.designsystem.components.LoadingContent
import pt.fortislibertas.core.designsystem.preview.FortisPreviewTheme
import pt.fortislibertas.core.designsystem.preview.FortisScreenPreviews
import pt.fortislibertas.data.fake.FakeWalletData
import pt.fortislibertas.data.model.PaymentCard
import pt.fortislibertas.ui.cards.components.CardsActionButton
import pt.fortislibertas.ui.cards.components.CardsBankItem
import pt.fortislibertas.ui.cards.components.CardsPaymentCard
import pt.fortislibertas.ui.cards.components.CardsStatusChips

/**
 * Stateless Cards / Banks screen. The header (top bar, back arrow, status chips) stays fixed;
 * only the list scrolls. The round button at the bottom switches between Cards and Banks.
 */
@Composable
fun CardsContent(
    state: CardsUiState,
    contentPadding: PaddingValues,
    onBack: () -> Unit,
    onOpenNotifications: () -> Unit,
    onTogglePage: () -> Unit,
    onFilterChange: (CardsFilter) -> Unit,
    onRetry: () -> Unit,
    onFreeze: (PaymentCard) -> Unit,
    onUnfreeze: (PaymentCard) -> Unit,
    onShowInfo: (PaymentCard) -> Unit,
    onEdit: (PaymentCard) -> Unit,
    modifier: Modifier = Modifier,
) {
    val onCards = state.page == CardsPage.Cards
    val layoutDirection = LocalLayoutDirection.current

    Box(modifier.fillMaxSize()) {
        Column(
            Modifier
                .fillMaxSize()
                .padding(
                    top = contentPadding.calculateTopPadding(),
                    start = contentPadding.calculateStartPadding(layoutDirection),
                    end = contentPadding.calculateEndPadding(layoutDirection),
                ),
        ) {
            // ── Fixed header ──
            Column(
                modifier = Modifier.padding(start = 20.dp, end = 20.dp, top = 16.dp, bottom = 12.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                FortisTopBar(
                    title = stringResource(if (onCards) R.string.cards_title else R.string.banks_title),
                    avatarName = state.userName,
                    avatarUrl = state.avatarUrl,
                    notificationCount = 0,               // TODO: connect to the notifications count
                    notificationsLabel = stringResource(R.string.notifications),
                    onNotificationsClick = onOpenNotifications,
                )
                // Back arrow on its own line, under the top bar (design decision)
                IconButton(onClick = onBack) {
                    Icon(Icons.AutoMirrored.Outlined.ArrowBack, contentDescription = stringResource(R.string.cards_back))
                }
                CardsStatusChips(selected = state.filter, onSelect = onFilterChange, showInactive = onCards)
            }

            // ── List (only this part scrolls) ──
            val listModifier = Modifier
                .weight(1f)
                .fillMaxWidth()
            when {
                state.isLoading && state.cards.isEmpty() && state.banks.isEmpty() -> LoadingContent(listModifier)

                state.errorMessage != null -> ErrorContent(
                    message = stringResource(state.errorMessage),
                    retryLabel = stringResource(R.string.action_retry),
                    onRetry = onRetry,
                    modifier = listModifier,
                )

                else -> LazyColumn(
                    modifier = listModifier,
                    contentPadding = PaddingValues(
                        start = 20.dp,
                        end = 20.dp,
                        top = 4.dp,
                        // room for the toggle button and the bottom bar
                        bottom = contentPadding.calculateBottomPadding() + 80.dp,
                    ),
                    verticalArrangement = Arrangement.spacedBy(20.dp),
                ) {
                    if (onCards) {
                        val cards = state.visibleCards
                        when {
                            state.cards.isEmpty() -> item { EmptyText(stringResource(R.string.cards_empty)) }
                            cards.isEmpty() -> item { EmptyText(stringResource(R.string.cards_empty_filter)) }
                            else -> items(cards, key = { it.id }) { card ->
                                CardsPaymentCard(
                                    card = card,
                                    onFreeze = { onFreeze(card) },
                                    onUnfreeze = { onUnfreeze(card) },
                                    onShowInfo = { onShowInfo(card) },
                                    onEdit = { onEdit(card) },
                                )
                            }
                        }
                    } else {
                        val banks = state.visibleBanks
                        when {
                            state.banks.isEmpty() -> item { EmptyText(stringResource(R.string.banks_empty)) }
                            banks.isEmpty() -> item { EmptyText(stringResource(R.string.cards_empty_filter)) }
                            else -> items(banks, key = { it.id }) { bank -> CardsBankItem(bank) }
                        }
                    }
                }
            }
        }

        // Round button: Cards ↔ Banks (shows the icon of the page it goes to)
        CardsActionButton(
            icon = if (onCards) Icons.Outlined.AccountBalance else Icons.Outlined.CreditCard,
            contentDescription = stringResource(if (onCards) R.string.cards_show_banks else R.string.cards_show_cards),
            onClick = onTogglePage,
            size = 48.dp,
            containerColor = MaterialTheme.colorScheme.surface,
            contentColor = MaterialTheme.colorScheme.onSurface,
            borderColor = MaterialTheme.colorScheme.onSurface,
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .padding(bottom = contentPadding.calculateBottomPadding() + 8.dp),
        )
    }
}

@Composable
private fun EmptyText(text: String) {
    Text(
        text = text,
        style = MaterialTheme.typography.bodyMedium,
        color = MaterialTheme.colorScheme.onSurfaceVariant,
        textAlign = TextAlign.Center,
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 48.dp),
    )
}

// ── Previews ────────────────────────────────────────────

@FortisScreenPreviews
@Composable
private fun CardsContentPreview() {
    FortisPreviewTheme {
        CardsContent(
            state = CardsUiState(
                cards = FakeWalletData.cards,
                banks = FakeWalletData.banks,
                isLoading = false,
                userName = "Ana Silva",
            ),
            contentPadding = PaddingValues(),
            onBack = {}, onOpenNotifications = {}, onTogglePage = {}, onRetry = {},
            onFilterChange = {}, onFreeze = {}, onUnfreeze = {}, onShowInfo = {}, onEdit = {},
        )
    }
}

@FortisScreenPreviews
@Composable
private fun CardsContentBanksPreview() {
    FortisPreviewTheme {
        CardsContent(
            state = CardsUiState(
                page = CardsPage.Banks,
                banks = FakeWalletData.banks,
                isLoading = false,
                userName = "Ana Silva",
            ),
            contentPadding = PaddingValues(),
            onBack = {}, onOpenNotifications = {}, onTogglePage = {}, onRetry = {},
            onFilterChange = {}, onFreeze = {}, onUnfreeze = {}, onShowInfo = {}, onEdit = {},
        )
    }
}
