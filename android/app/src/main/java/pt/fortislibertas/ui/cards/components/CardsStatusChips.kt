package pt.fortislibertas.ui.cards.components

import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import pt.fortislibertas.R
import pt.fortislibertas.core.designsystem.components.SelectableChip
import pt.fortislibertas.core.designsystem.preview.FortisPreviewTheme
import pt.fortislibertas.core.designsystem.preview.FortisPreviews
import pt.fortislibertas.ui.cards.CardsFilter

/** All · Active · Frozen · Inactive (one at a time), like the type chips of Transactions. */
@Composable
fun CardsStatusChips(
    selected: CardsFilter,
    onSelect: (CardsFilter) -> Unit,
    modifier: Modifier = Modifier,
    showInactive: Boolean = true,                       // false on the Banks page (banks do not expire)
) {
    val options = buildList {
        add(CardsFilter.All to R.string.filter_all)
        add(CardsFilter.Active to R.string.cards_filter_active)
        add(CardsFilter.Frozen to R.string.cards_filter_frozen)
        if (showInactive) add(CardsFilter.Inactive to R.string.cards_filter_inactive)
    }
    Row(
        modifier = modifier.horizontalScroll(rememberScrollState()),
        horizontalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        options.forEach { (filter, labelRes) ->
            SelectableChip(
                label = stringResource(labelRes),
                selected = selected == filter,
                onClick = { onSelect(filter) },
            )
        }
    }
}

@FortisPreviews
@Composable
private fun CardsStatusChipsPreview() {
    FortisPreviewTheme {
        Column(Modifier.padding(16.dp)) {
            CardsStatusChips(selected = CardsFilter.All, onSelect = {})
            CardsStatusChips(selected = CardsFilter.Frozen, onSelect = {}, showInactive = false)
        }
    }
}
