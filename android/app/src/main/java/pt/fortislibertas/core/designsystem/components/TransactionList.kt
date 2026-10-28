package pt.fortislibertas.core.designsystem.components

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import pt.fortislibertas.core.designsystem.theme.FortisTheme
import pt.fortislibertas.core.designsystem.util.MoneyFormatter
import pt.fortislibertas.data.model.RecordType
import pt.fortislibertas.data.model.TransactionItem
import java.time.format.DateTimeFormatter
import java.util.Locale

/**
 * Grupo de transações de um dia: "Hoje" por cima e as linhas
 * dentro de um só cartão, separadas por linhas finas.
 * Reutilizável no separador Transaction.
 */
@Composable
fun TransactionGroup(
    title: String,
    items: List<TransactionItem>,
    onItemClick: (TransactionItem) -> Unit,
    modifier: Modifier = Modifier,
) {
    Column(modifier, verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Text(
            text = title,
            style = MaterialTheme.typography.labelLarge,
            color = MaterialTheme.colorScheme.primary,
            modifier = Modifier.padding(start = 4.dp),
        )
        FortisCard(contentPadding = PaddingValues(0.dp)) {
            items.forEachIndexed { index, item ->
                if (index > 0) HorizontalDivider()
                TransactionRow(item = item, onClick = { onItemClick(item) })
            }
        }
    }
}

@Composable
fun TransactionRow(
    item: TransactionItem,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val categoryColor = colorFromHex(item.categoryColorHex)
    val dateFormatter = DateTimeFormatter.ofPattern("d MMM", Locale.getDefault())

    Row(
        modifier = modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
            .padding(horizontal = 16.dp, vertical = 14.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        CategoryTile(name = item.categoryName, color = categoryColor)

        Column(Modifier.weight(1f)) {
            Text(
                text = item.categoryName,
                style = MaterialTheme.typography.labelLarge,
                color = MaterialTheme.colorScheme.primary,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
            )
            Text(
                text = item.name,
                style = MaterialTheme.typography.bodyMedium,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
            )
        }

        Column(horizontalAlignment = Alignment.End) {
            Text(
                text = signedAmount(item),
                style = MaterialTheme.typography.titleSmall.copy(
                    fontWeight = FontWeight.SemiBold,
                    fontFeatureSettings = "tnum",
                ),
                color = amountColor(item.type),
            )
            Text(
                text = item.date.format(dateFormatter),
                style = MaterialTheme.typography.labelMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
    }
}

/** Quadrado com a cor da categoria e a primeira letra do nome. */
@Composable
private fun CategoryTile(name: String, color: Color) {
    Box(
        modifier = Modifier
            .size(40.dp)
            .clip(RoundedCornerShape(12.dp))
            .background(color.copy(alpha = 0.18f)),
        contentAlignment = Alignment.Center,
    ) {
        Text(
            text = name.take(1).uppercase(),
            style = MaterialTheme.typography.titleMedium,
            color = color,
        )
    }
}

/** "+50,00 €" nas receitas, "−24,68 €" nas despesas e investimentos. */
private fun signedAmount(item: TransactionItem): String {
    val sign = if (item.type == RecordType.INCOME) "+" else "−"
    return sign + MoneyFormatter.format(item.amount, item.currency)
}

@Composable
private fun amountColor(type: RecordType): Color = when (type) {
    RecordType.INCOME -> FortisTheme.colors.income
    RecordType.EXPENSE -> FortisTheme.colors.expense
    RecordType.INVESTMENT -> MaterialTheme.colorScheme.primary
}
