package pt.fortislibertas.ui.home

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import pt.fortislibertas.R
import pt.fortislibertas.core.designsystem.components.CardStack
import pt.fortislibertas.core.designsystem.components.FortisTopBar
import pt.fortislibertas.core.designsystem.components.colorFromHex
import pt.fortislibertas.core.designsystem.preview.FortisScreenPreviews
import pt.fortislibertas.core.designsystem.theme.FortisLibertasTheme
import pt.fortislibertas.data.fake.FakeHomeData
import pt.fortislibertas.data.model.HomeSummary
import pt.fortislibertas.data.model.TransactionItem
import pt.fortislibertas.ui.home.components.HomeBalanceSummary
import pt.fortislibertas.ui.home.components.HomeChartLegend
import pt.fortislibertas.ui.home.components.HomeGreetingHeader
import pt.fortislibertas.ui.home.components.HomeRecentTransactions
import pt.fortislibertas.ui.home.components.HomeWeekChart

/**
 * Stateless version of the Home tab: top bar, greeting and balance with the card stack,
 * the week chart and the recent transactions. Easy to preview.
 */
@Composable
fun HomeContent(
    summary: HomeSummary,
    userName: String?,
    avatarUrl: String?,
    contentPadding: PaddingValues,
    onOpenNotifications: () -> Unit,
    onOpenBanks: () -> Unit,
    onSeeAllTransactions: () -> Unit,
    onTransactionClick: (TransactionItem) -> Unit,
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(contentPadding)
            .padding(horizontal = 20.dp, vertical = 16.dp),
    ) {
        FortisTopBar(
            title = stringResource(R.string.home_title),
            avatarName = userName,
            avatarUrl = avatarUrl,
            notificationCount = 0,                      // TODO: connect to the notifications count
            notificationsLabel = stringResource(R.string.notifications),
            onNotificationsClick = onOpenNotifications,
        )

        Spacer(Modifier.height(24.dp))

        // ── Greeting + balance, with the card stack on the right ──
        Box(Modifier.fillMaxWidth()) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(end = 96.dp),               // room for the cards
                verticalArrangement = Arrangement.spacedBy(24.dp),
            ) {
                HomeGreetingHeader(fullName = userName)
                HomeBalanceSummary(
                    balance = summary.totalBalance,
                    change = summary.balanceChange,
                    changePercent = summary.balanceChangePercent,
                    currency = summary.currency,
                )
            }
            CardStack(
                colors = summary.cards.map { colorFromHex(it.colorHex) },
                onClick = onOpenBanks,
                onClickLabel = stringResource(R.string.banks_and_cards),
                modifier = Modifier
                    .align(Alignment.TopEnd)
                    // pushed off-screen: 20 dp of margin + 36 dp cut off
                    .offset(x = 66.dp),
            )
        }

        HorizontalDivider(Modifier.padding(vertical = 24.dp))

        // ── Week chart ──
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text(
                text = stringResource(R.string.overview_week),
                style = MaterialTheme.typography.titleMedium,
                modifier = Modifier.weight(1f),
            )
            HomeChartLegend()
        }
        Spacer(Modifier.height(16.dp))
        HomeWeekChart(summary)

        HorizontalDivider(Modifier.padding(vertical = 24.dp))

        HomeRecentTransactions(
            transactions = summary.recent,
            onSeeAll = onSeeAllTransactions,
            onTransactionClick = onTransactionClick,
        )
    }
}

// ── Previews ────────────────────────────────────────────

@FortisScreenPreviews
@Composable
private fun HomeContentPreview() {
    FortisLibertasTheme {
        HomeContent(
            summary = FakeHomeData.build(),
            userName = "Ana Silva",
            avatarUrl = null,
            contentPadding = PaddingValues(),
            onOpenNotifications = {},
            onOpenBanks = {},
            onSeeAllTransactions = {},
            onTransactionClick = {},
        )
    }
}
