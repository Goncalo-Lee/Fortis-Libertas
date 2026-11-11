package pt.fortislibertas.ui.cards.components

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import pt.fortislibertas.core.designsystem.components.ColorDot
import pt.fortislibertas.core.designsystem.components.colorFromHex
import pt.fortislibertas.core.designsystem.preview.FortisPreviewTheme
import pt.fortislibertas.core.designsystem.preview.FortisPreviews
import pt.fortislibertas.data.fake.FakeWalletData
import pt.fortislibertas.data.model.CardColor

/**
 * Colour picker of the card forms. The API palette has ~22 colours, so the dots wrap
 * onto several lines. [selectedId] null = nothing chosen yet.
 */
@OptIn(ExperimentalLayoutApi::class)
@Composable
fun CardsColorPicker(
    colors: List<CardColor>,
    selectedId: String?,
    onSelect: (String) -> Unit,
    modifier: Modifier = Modifier,
) {
    FlowRow(
        modifier = modifier.fillMaxWidth().padding(horizontal = 4.dp),
        horizontalArrangement = Arrangement.spacedBy(12.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        colors.forEach { color ->
            ColorDot(
                color = colorFromHex(color.hex),
                size = 32.dp,
                selected = color.id == selectedId,
                onClick = { onSelect(color.id) },
            )
        }
    }
}

@FortisPreviews
@Composable
private fun CardsColorPickerPreview() {
    FortisPreviewTheme {
        CardsColorPicker(colors = FakeWalletData.colors, selectedId = FakeWalletData.colors[1].id, onSelect = {})
    }
}
