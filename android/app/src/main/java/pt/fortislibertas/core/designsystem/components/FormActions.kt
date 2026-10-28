package pt.fortislibertas.core.designsystem.components

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.FilledTonalButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

/** Botões Cancelar / Guardar no fim de um formulário. */
@Composable
fun FormActions(
    cancelLabel: String,
    saveLabel: String,
    onCancel: () -> Unit,
    onSave: () -> Unit,
    modifier: Modifier = Modifier,
    isSaving: Boolean = false,
) {
    val shape = RoundedCornerShape(12.dp)
    Row(
        modifier = modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        FilledTonalButton(
            onClick = onCancel,
            enabled = !isSaving,
            shape = shape,
            modifier = Modifier.weight(1f).height(52.dp),
        ) { Text(cancelLabel) }

        Button(
            onClick = onSave,
            enabled = !isSaving,
            shape = shape,
            modifier = Modifier.weight(1f).height(52.dp),
        ) {
            if (isSaving) {
                CircularProgressIndicator(
                    modifier = Modifier.size(20.dp),
                    strokeWidth = 2.dp,
                    color = MaterialTheme.colorScheme.onPrimary,
                )
            } else {
                Text(saveLabel)
            }
        }
    }
}
