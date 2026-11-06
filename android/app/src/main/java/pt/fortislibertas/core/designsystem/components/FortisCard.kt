package pt.fortislibertas.core.designsystem.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedCard
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import pt.fortislibertas.core.designsystem.preview.FortisPreviewTheme
import pt.fortislibertas.core.designsystem.preview.FortisPreviews

/**
 * Outlined card with rounded corners, like the ones in the wireframe.
 * With onClick it is clickable (touch effect included); without it, it is just a container.
 */
@Composable
fun FortisCard(
    modifier: Modifier = Modifier,
    onClick: (() -> Unit)? = null,
    contentPadding: PaddingValues = PaddingValues(16.dp),
    content: @Composable ColumnScope.() -> Unit,
) {
    val shape = RoundedCornerShape(16.dp)
    val colors = CardDefaults.outlinedCardColors(containerColor = MaterialTheme.colorScheme.surface)
    val border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline)

    if (onClick != null) {
        OutlinedCard(
            onClick = onClick,
            modifier = modifier.fillMaxWidth(),
            shape = shape,
            colors = colors,
            border = border,
        ) {
            Column(Modifier.padding(contentPadding), content = content)
        }
    } else {
        OutlinedCard(
            modifier = modifier.fillMaxWidth(),
            shape = shape,
            colors = colors,
            border = border,
        ) {
            Column(Modifier.padding(contentPadding), content = content)
        }
    }
}

@FortisPreviews
@Composable
private fun FortisCardPreview() {
    FortisPreviewTheme {
        FortisCard(modifier = Modifier.padding(16.dp)) {
            Text("Account details")
            Text("Ana Silva")
        }
    }
}
