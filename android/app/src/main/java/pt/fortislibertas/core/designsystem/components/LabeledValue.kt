package pt.fortislibertas.core.designsystem.components

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import pt.fortislibertas.core.designsystem.preview.FortisPreviewTheme
import pt.fortislibertas.core.designsystem.preview.FortisPreviews

/** Small blue label with the value below ("Account Balance / 200 €"). */
@Composable
fun LabeledValue(
    label: String,
    value: String,
    modifier: Modifier = Modifier,
) {
    Column(modifier) {
        Text(
            text = label,
            style = MaterialTheme.typography.labelMedium,
            color = MaterialTheme.colorScheme.primary,
        )
        Text(
            text = value,
            // tnum: digits with the same width, so the values line up
            style = MaterialTheme.typography.titleMedium.copy(
                fontWeight = FontWeight.SemiBold,
                fontFeatureSettings = "tnum",
            ),
            color = MaterialTheme.colorScheme.onSurface,
        )
    }
}

@FortisPreviews
@Composable
private fun LabeledValuePreview() {
    FortisPreviewTheme {
        LabeledValue(label = "Account Balance", value = "1 250,40 €", modifier = Modifier.padding(16.dp))
    }
}
