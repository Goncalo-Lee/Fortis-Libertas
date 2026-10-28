package pt.fortislibertas.ui.newrecord

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Add
import androidx.compose.material.icons.outlined.Check
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.HorizontalDivider
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
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.text.input.KeyboardCapitalization
import androidx.compose.ui.unit.dp
import pt.fortislibertas.R
import pt.fortislibertas.core.designsystem.components.BlurDialog
import pt.fortislibertas.core.designsystem.components.ColorDot
import pt.fortislibertas.core.designsystem.components.SearchField
import pt.fortislibertas.core.designsystem.components.colorFromHex
import pt.fortislibertas.data.model.Category
import pt.fortislibertas.data.model.ColorOption
import pt.fortislibertas.data.model.RecordType

/**
 * Seletor de categoria, com o mesmo estilo do seletor de tags.
 * Diferenças: escolhe só UMA (tocar escolhe e fecha) e a categoria nova
 * precisa de cor e herda o tipo do formulário.
 */
@OptIn(ExperimentalLayoutApi::class)
@Composable
fun CategoryPickerDialog(
    categories: List<Category>,
    colors: List<ColorOption>,
    selectedId: String?,
    type: RecordType?,
    isCreating: Boolean,
    onSelect: (String) -> Unit,
    onCreate: (name: String, colorKey: String) -> Unit,
    onDismiss: () -> Unit,
) {
    var query by rememberSaveable { mutableStateOf("") }
    var creating by rememberSaveable { mutableStateOf(false) }
    var newName by rememberSaveable { mutableStateOf("") }
    var newColorKey by rememberSaveable { mutableStateOf(colors.firstOrNull()?.key.orEmpty()) }

    // Só mostra as categorias do tipo escolhido (se ainda não há tipo, mostra todas)
    val visible = categories
        .filter { type == null || it.type == type }
        .filter { query.isBlank() || it.name.contains(query.trim(), ignoreCase = true) }

    BlurDialog(onDismissRequest = onDismiss) {
        Text(stringResource(R.string.category_title), style = MaterialTheme.typography.titleLarge)
        Spacer(Modifier.size(12.dp))
        SearchField(
            query = query,
            onQueryChange = { query = it },
            placeholder = stringResource(R.string.search),
        )

        Column(
            modifier = Modifier
                .padding(vertical = 8.dp)
                .heightIn(max = 300.dp)
                .verticalScroll(rememberScrollState()),
        ) {
            if (visible.isEmpty()) {
                Text(
                    text = stringResource(R.string.no_results),
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.padding(vertical = 12.dp),
                )
            }
            visible.forEach { category ->
                val selected = category.id == selectedId
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(12.dp))
                        .selectable(
                            selected = selected,
                            onClick = { onSelect(category.id) },
                            role = Role.RadioButton,
                        )
                        .padding(horizontal = 8.dp, vertical = 12.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                ) {
                    ColorDot(colorFromHex(category.colorHex), size = 16.dp)
                    Text(category.name, style = MaterialTheme.typography.bodyLarge, modifier = Modifier.weight(1f))
                    if (selected) {
                        Icon(Icons.Outlined.Check, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                    }
                }
            }
        }

        HorizontalDivider()

        if (!creating) {
            TextButton(
                onClick = {
                    newName = query.trim()
                    creating = true
                },
                modifier = Modifier.padding(top = 8.dp),
            ) {
                Icon(Icons.Outlined.Add, contentDescription = null, modifier = Modifier.size(18.dp))
                Spacer(Modifier.size(8.dp))
                Text(stringResource(R.string.action_new_category))
            }
        } else if (type == null) {
            // Sem tipo não se sabe se é despesa, receita ou investimento
            Text(
                text = stringResource(R.string.category_choose_type_first),
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.padding(top = 12.dp),
            )
        } else {
            Column(
                modifier = Modifier.padding(top = 12.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                OutlinedTextField(
                    value = newName,
                    onValueChange = { newName = it },
                    placeholder = { Text(stringResource(R.string.category_new_name)) },
                    singleLine = true,
                    enabled = !isCreating,
                    shape = RoundedCornerShape(12.dp),
                    keyboardOptions = KeyboardOptions(capitalization = KeyboardCapitalization.Sentences),
                    modifier = Modifier.fillMaxWidth(),
                )
                Text(
                    text = stringResource(R.string.category_color),
                    style = MaterialTheme.typography.labelLarge,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
                FlowRow(
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                ) {
                    colors.forEach { option ->
                        ColorDot(
                            color = colorFromHex(option.hex),
                            size = 32.dp,
                            selected = option.key == newColorKey,
                            onClick = { newColorKey = option.key },
                        )
                    }
                }
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    TextButton(onClick = { creating = false }, enabled = !isCreating) {
                        Text(stringResource(R.string.action_cancel))
                    }
                    Spacer(Modifier.weight(1f))
                    Button(
                        onClick = { onCreate(newName, newColorKey) },
                        enabled = newName.isNotBlank() && newColorKey.isNotEmpty() && !isCreating,
                        shape = RoundedCornerShape(12.dp),
                    ) {
                        if (isCreating) CircularProgressIndicator(Modifier.size(18.dp), strokeWidth = 2.dp)
                        else Text(stringResource(R.string.action_create))
                    }
                }
            }
        }
    }
}