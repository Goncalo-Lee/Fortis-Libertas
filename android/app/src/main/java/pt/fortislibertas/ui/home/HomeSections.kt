package pt.fortislibertas.ui.home

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowDropDown
import androidx.compose.material.icons.filled.ArrowDropUp
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import pt.fortislibertas.R
import pt.fortislibertas.core.designsystem.theme.FortisTheme
import pt.fortislibertas.core.designsystem.util.MoneyFormatter
import java.math.BigDecimal
import java.text.NumberFormat
import java.time.LocalTime
import java.util.Locale

/** "Boa tarde," + primeiro nome, conforme a hora do telemóvel. */
@Composable
fun GreetingHeader(fullName: String?, modifier: Modifier = Modifier) {
    val hour = remember { LocalTime.now().hour }
    val greeting = when (hour) {
        in 5..11 -> R.string.greeting_morning
        in 12..19 -> R.string.greeting_afternoon
        else -> R.string.greeting_evening
    }

    Column(modifier) {
        Text(stringResource(greeting), style = MaterialTheme.typography.headlineSmall)
        if (!fullName.isNullOrBlank()) {
            Text(
                text = fullName.trim().substringBefore(' '),
                style = MaterialTheme.typography.headlineMedium.copy(fontWeight = FontWeight.Bold),
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
            )
        }
    }
}

/** "Saldo total" + valor grande + "▲ 100,00 € (40 %) vs semana passada". */
@Composable
fun BalanceSummary(
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

/** Legenda do gráfico: ● Receitas  ● Despesas */
@Composable
fun ChartLegend(modifier: Modifier = Modifier) {
    Row(modifier, horizontalArrangement = Arrangement.spacedBy(16.dp)) {
        LegendItem(FortisTheme.colors.income, stringResource(R.string.legend_income))
        LegendItem(FortisTheme.colors.expense, stringResource(R.string.legend_expense))
    }
}

@Composable
private fun LegendItem(color: Color, label: String) {
    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
        Box(Modifier.size(10.dp).background(color, CircleShape))
        Text(label, style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
    }
}

private fun formatPercent(value: BigDecimal): String {
    val nf = NumberFormat.getNumberInstance(Locale.getDefault()).apply { maximumFractionDigits = 1 }
    return nf.format(value.abs()) + "%"
}
