package pt.fortislibertas.ui.transactions.components

import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.rememberScrollState
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import pt.fortislibertas.R
import pt.fortislibertas.core.designsystem.components.SelectableChip
import pt.fortislibertas.core.designsystem.preview.FortisPreviewTheme
import pt.fortislibertas.core.designsystem.preview.FortisPreviews
import pt.fortislibertas.data.model.RecordType

/** All · Income · Expenses · Investments (only one at a time). */
@Composable
fun TransactionsTypeChips(
    selected: RecordType?,
    onSelect: (RecordType?) -> Unit,
    modifier: Modifier = Modifier,
) {
    val options = listOf(
        null to R.string.filter_all,
        RecordType.INCOME to R.string.legend_income,
        RecordType.EXPENSE to R.string.legend_expense,
        RecordType.INVESTMENT to R.string.filter_investments,
    )
    Row(
        modifier = modifier.horizontalScroll(rememberScrollState()),
        horizontalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        options.forEach { (type, labelRes) ->
            SelectableChip(
                label = stringResource(labelRes),
                selected = selected == type,
                onClick = { onSelect(type) },
            )
        }
    }
}

@FortisPreviews
@Composable
private fun TransactionsTypeChipsPreview() {
    FortisPreviewTheme {
        TransactionsTypeChips(selected = null, onSelect = {})
    }
}
