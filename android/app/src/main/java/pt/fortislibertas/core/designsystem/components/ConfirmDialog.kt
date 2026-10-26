package pt.fortislibertas.core.designsystem.components

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.size
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.dp

/**
 * Diálogo de confirmação reutilizável.
 *
 * - destructive = true: botão de confirmar a vermelho (apagar, desativar…)
 * - requiredText: obriga a escrever um texto (ex.: o email) antes de confirmar
 * - isWorking: mostra um indicador e impede fechar enquanto o pedido corre
 */
@Composable
fun ConfirmDialog(
    title: String,
    message: String,
    confirmLabel: String,
    dismissLabel: String,
    onConfirm: () -> Unit,
    onDismiss: () -> Unit,
    modifier: Modifier = Modifier,
    icon: ImageVector? = null,
    destructive: Boolean = false,
    requiredText: String? = null,
    requiredTextHint: String? = null,
    isWorking: Boolean = false,
) {
    var typed by rememberSaveable { mutableStateOf("") }
    val canConfirm = !isWorking &&
            (requiredText == null || typed.trim().equals(requiredText.trim(), ignoreCase = true))

    val confirmColor =
        if (destructive) MaterialTheme.colorScheme.error else MaterialTheme.colorScheme.primary

    AlertDialog(
        onDismissRequest = { if (!isWorking) onDismiss() },
        modifier = modifier,
        icon = icon?.let { { Icon(it, contentDescription = null, tint = confirmColor) } },
        title = { Text(title) },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
                Text(message)
                if (requiredText != null) {
                    OutlinedTextField(
                        value = typed,
                        onValueChange = { typed = it },
                        label = requiredTextHint?.let { { Text(it) } },
                        singleLine = true,
                        enabled = !isWorking,
                        modifier = Modifier.fillMaxWidth(),
                    )
                }
            }
        },
        confirmButton = {
            TextButton(
                onClick = onConfirm,
                enabled = canConfirm,
                colors = ButtonDefaults.textButtonColors(contentColor = confirmColor),
            ) {
                if (isWorking) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(18.dp),
                        strokeWidth = 2.dp,
                        color = confirmColor,
                    )
                } else {
                    Text(confirmLabel)
                }
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss, enabled = !isWorking) { Text(dismissLabel) }
        },
    )
}
