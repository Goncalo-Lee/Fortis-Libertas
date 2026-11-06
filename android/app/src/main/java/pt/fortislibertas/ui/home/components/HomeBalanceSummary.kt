package pt.fortislibertas.ui.home.components

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowDropDown
import androidx.compose.material.icons.filled.ArrowDropUp
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import java.math.BigDecimal
import java.text.NumberFormat
import java.util.Locale
import pt.fortislibertas.R
import pt.fortislibertas.core.designsystem.preview.FortisPreviews
import pt.fortislibertas.core.designsystem.theme.FortisLibertasTheme
import pt.fortislibertas.core.designsystem.theme.FortisTheme
import pt.fortislibertas.core.designsystem.util.MoneyFormatter

/** "Total balance", the big amount and "▲ 100,00 € (40 %) vs last week". */
@Composable
fun HomeBalanceSummary(
    balance: BigDecimal,
    change: BigDecimal,
    changePercent: BigDecimal?,
    currency: String,
    modifier: Modifier = Modifier,
) {
    val trendColor = when (change.signum()) {
        1 -> FortisTheme.colors.income
        -1 -> FortisTheme.colors.expense
        else -> MaterialTheme.colorScheme.onSurfaceVariant
    }

    Column(modifier) {
        Text(
            text = stringResource(R.string.total_balance),
            style = MaterialTheme.typography.labelLarge,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
        Text(
            text = MoneyFormatter.format(balance, currency),
            style = MaterialTheme.typography.displaySmall.copy(
                fontWeight = FontWeight.Bold,
                fontFeatureSettings = "tnum",
            ),
            maxLines = 1,
        )
        Row(verticalAlignment = Alignment.CenterVertically) {
            when (change.signum()) {
                1 -> Icon(Icons.Filled.ArrowDropUp, contentDescription = null, tint = trendColor)
                -1 -> Icon(Icons.Filled.ArrowDropDown, contentDescription = null, tint = trendColor)
            }
            val percentText = changePercent?.let { " (${formatPercent(it)})" }.orEmpty()
            Text(
                text = MoneyFormatter.format(change.abs(), currency) + percentText,
                style = MaterialTheme.typography.labelLarge,
                color = trendColor,
            )
            Text(
                text = "  " + stringResource(R.string.vs_last_week),
                style = MaterialTheme.typography.labelLarge,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
    }
}

private fun formatPercent(value: BigDecimal): String {
    val nf = NumberFormat.getNumberInstance(Locale.getDefault()).apply { maximumFractionDigits = 1 }
    return nf.format(value.abs()) + "%"
}

@FortisPreviews
@Composable
private fun HomeBalanceSummaryPreview() {
    FortisLibertasTheme {
        HomeBalanceSummary(
            balance = BigDecimal("1250.40"),
            change = BigDecimal("100.00"),
            changePercent = BigDecimal("8.7"),
            currency = "EUR",
        )
    }
}
