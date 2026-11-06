package pt.fortislibertas.ui.transactions.components

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.FilterAlt
import androidx.compose.material3.Badge
import androidx.compose.material3.BadgedBox
import androidx.compose.material3.Icon
import androidx.compose.material3.OutlinedIconButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import pt.fortislibertas.R
import pt.fortislibertas.core.designsystem.components.SearchField
import pt.fortislibertas.core.designsystem.preview.FortisPreviews
import pt.fortislibertas.core.designsystem.theme.FortisLibertasTheme

/** Search field with the filter button; the badge shows how many filters are active. */
@Composable
fun TransactionsSearchBar(
    query: String,
    activeFilterCount: Int,
    onQueryChange: (String) -> Unit,
    onOpenFilter: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Row(
        modifier = modifier,
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        SearchField(
            query = query,
            onQueryChange = onQueryChange,
            placeholder = stringResource(R.string.search),
            modifier = Modifier.weight(1f),
        )
        BadgedBox(
            badge = {
                if (activeFilterCount > 0) Badge { Text(activeFilterCount.toString()) }
            },
        ) {
            OutlinedIconButton(
                onClick = onOpenFilter,
                shape = RoundedCornerShape(12.dp),
            ) {
                Icon(Icons.Outlined.FilterAlt, contentDescription = stringResource(R.string.filter_title))
            }
        }
    }
}

@FortisPreviews
@Composable
private fun TransactionsSearchBarPreview() {
    FortisLibertasTheme {
        TransactionsSearchBar(query = "", activeFilterCount = 2, onQueryChange = {}, onOpenFilter = {})
    }
}
