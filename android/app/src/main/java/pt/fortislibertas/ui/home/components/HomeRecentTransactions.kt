package pt.fortislibertas.ui.home.components

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.util.Locale
import pt.fortislibertas.R
import pt.fortislibertas.core.designsystem.components.TransactionGroup
import pt.fortislibertas.core.designsystem.theme.FortisLibertasTheme
import pt.fortislibertas.data.fake.FakeHomeData
import pt.fortislibertas.data.model.TransactionItem

private const val MAX_RECENT = 5

/** "Recent transactions" title with "See all", then the last [MAX_RECENT] transactions grouped by day. */
@Composable
fun HomeRecentTransactions(
    transactions: List<TransactionItem>,
    onSeeAll: () -> Unit,
    onTransactionClick: (TransactionItem) -> Unit,
    modifier: Modifier = Modifier,
) {
    Column(modifier) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text(
                text = stringResource(R.string.recent_transactions),
                style = MaterialTheme.typography.titleMedium,
                modifier = Modifier.weight(1f),
            )
            TextButton(onClick = onSeeAll) {
                Text(stringResource(R.string.see_all))
            }
        }
        Spacer(Modifier.height(8.dp))

        val recent = transactions.take(MAX_RECENT)
        if (recent.isEmpty()) {
            Text(
                text = stringResource(R.string.home_no_transactions),
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                textAlign = TextAlign.Center,
                modifier = Modifier.fillMaxWidth().padding(vertical = 24.dp),
            )
        } else {
            Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
                // Group by day, keeping the order (newest first)
                recent.groupBy { it.date }.forEach { (date, items) ->
                    TransactionGroup(
                        title = dayTitle(date),
                        items = items,
                        onItemClick = onTransactionClick,
                    )
                }
            }
        }
    }
}

/** "Today", "Yesterday" or the date ("24 Oct"). */
@Composable
private fun dayTitle(date: LocalDate): String {
    val today = LocalDate.now()
    return when (date) {
        today -> stringResource(R.string.today)
        today.minusDays(1) -> stringResource(R.string.yesterday)
        else -> date.format(DateTimeFormatter.ofPattern("d MMM", Locale.getDefault()))
    }
}

@Preview(showBackground = true)
@Composable
private fun HomeRecentTransactionsPreview() {
    FortisLibertasTheme {
        HomeRecentTransactions(
            transactions = FakeHomeData.build().recent,
            onSeeAll = {},
            onTransactionClick = {},
        )
    }
}
