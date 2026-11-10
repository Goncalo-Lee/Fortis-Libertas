package pt.fortislibertas.ui.dashboard.components

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import pt.fortislibertas.R
import pt.fortislibertas.core.designsystem.components.BlurDialog
import pt.fortislibertas.core.designsystem.components.ColorDot
import pt.fortislibertas.core.designsystem.components.colorFromHex
import pt.fortislibertas.core.designsystem.preview.FortisPreviewTheme
import pt.fortislibertas.core.designsystem.preview.FortisPreviews
import pt.fortislibertas.core.designsystem.util.MoneyFormatter
import pt.fortislibertas.data.model.CategoryTotal
import java.math.BigDecimal

/** "View all >": every category of the period with its total and share. */
@Composable
fun DashboardAllCategoriesDialog(categories: List<CategoryTotal>, currency: String, onDismiss: () -> Unit) {
    val total = categories.sumOf { it.total }
    BlurDialog(onDismissRequest = onDismiss) {
        Text(stringResource(R.string.dash_by_category), style = MaterialTheme.typography.titleLarge)
        Spacer(Modifier.height(12.dp))
        Column(
            Modifier
                .heightIn(max = 360.dp)
                .verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            categories.forEach { category ->
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    ColorDot(color = colorFromHex(category.colorHex), size = 14.dp)
                    Text(category.name, style = MaterialTheme.typography.bodyLarge, modifier = Modifier.weight(1f))
                    Text(percent(category.total, total), style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant)
                    Text(MoneyFormatter.format(category.total, currency), style = MaterialTheme.typography.titleSmall)
                }
            }
        }
        Spacer(Modifier.height(8.dp))
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End) {
            TextButton(onClick = onDismiss) { Text(stringResource(R.string.cards_close)) }
        }
    }
}

@FortisPreviews
@Composable
private fun DashboardAllCategoriesDialogPreview() {
    FortisPreviewTheme {
        DashboardAllCategoriesDialog(
            categories = listOf(
                CategoryTotal("a", "Restaurantes", "#F97316", BigDecimal("97.90")),
                CategoryTotal("b", "Supermercado", "#22C55E", BigDecimal("61.88")),
            ),
            currency = "EUR",
            onDismiss = {},
        )
    }
}
