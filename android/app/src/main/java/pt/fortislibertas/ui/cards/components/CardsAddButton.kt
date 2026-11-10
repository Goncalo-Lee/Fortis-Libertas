package pt.fortislibertas.ui.cards.components

import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Add
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import pt.fortislibertas.core.designsystem.preview.FortisPreviewTheme
import pt.fortislibertas.core.designsystem.preview.FortisPreviews
import pt.fortislibertas.core.designsystem.theme.CuriousBlue
import pt.fortislibertas.core.designsystem.theme.White

/** Blue "+" square at the bottom right: Add card or Add bank, depending on the page. */
@Composable
fun CardsAddButton(contentDescription: String, onClick: () -> Unit, modifier: Modifier = Modifier) {
    FloatingActionButton(
        onClick = onClick,
        shape = RoundedCornerShape(16.dp),
        containerColor = CuriousBlue,
        contentColor = White,
        modifier = modifier,
    ) {
        Icon(Icons.Outlined.Add, contentDescription = contentDescription)
    }
}

@FortisPreviews
@Composable
private fun CardsAddButtonPreview() {
    FortisPreviewTheme {
        CardsAddButton(contentDescription = "Add", onClick = {}, modifier = Modifier.padding(16.dp))
    }
}
