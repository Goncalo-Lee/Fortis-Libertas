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
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Add
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.FilledTonalButton
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.pluralStringResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.input.KeyboardCapitalization
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import pt.fortislibertas.R
import pt.fortislibertas.core.designsystem.components.BlurDialog
import pt.fortislibertas.core.designsystem.components.SearchField
import pt.fortislibertas.core.designsystem.components.SelectableChip
import pt.fortislibertas.core.designsystem.theme.FortisLibertasTheme
import pt.fortislibertas.data.local.FakeRecordData
import pt.fortislibertas.data.model.Category
import pt.fortislibertas.data.model.Tag

/**
 * Seletor de tags (imagem 4 do wireframe).
 * A escolha só é aplicada ao carregar em "Aplicar".
 * Tocar fora, ou no botão de voltar, fecha sem alterar nada.
 */
@OptIn(ExperimentalLayoutApi::class)
@Composable
fun TagPickerDialog(
    tags: List<Tag>,
    category: Category?,
    initialSelection: Set<String>,
    isCreating: Boolean,
    onCreateTag: (name: String, onCreated: (Tag) -> Unit) -> Unit,
    onApply: (Set<String>) -> Unit,
    onDismiss: () -> Unit,
) {
    // Seleção "rascunho": só passa para o formulário no Aplicar
    var selection by remember { mutableStateOf(initialSelection) }
    var query by rememberSaveable { mutableStateOf("") }
    var newTagName by rememberSaveable { mutableStateOf<String?>(null) }  // null = não está a criar

    val filtered = tags.filter { query.isBlank() || it.name.contains(query.trim(), ignoreCase = true) }
    val related = if (category == null) emptyList() else filtered.filter { category.id in it.categoryIds }
    val others = filtered - related.toSet()

    fun toggle(tag: Tag) {
        selection = if (tag.id in selection) selection - tag.id else selection + tag.id
    }

    BlurDialog(onDismissRequest = onDismiss) {
        Text(stringResource(R.string.tags_title), style = MaterialTheme.typography.titleLarge)
        Spacer(Modifier.size(12.dp))
        SearchField(
            query = query,
            onQueryChange = { query = it },
            placeholder = stringResource(R.string.search),
        )

        // Zona com scroll: com muitas tags, os botões ficam sempre visíveis
        Column(
            modifier = Modifier
                .padding(vertical = 12.dp)
                .heightIn(max = 320.dp)
                .verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            if (category != null && related.isNotEmpty()) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        text = stringResource(R.string.tags_related, category.name),
                        style = MaterialTheme.typography.titleSmall,
                        modifier = Modifier.weight(1f),
                    )
                    TextButton(onClick = { selection = selection + related.map { it.id } }) {
                        Text(stringResource(R.string.action_select_all))
                    }
                }
                TagChips(related, selection, ::toggle)
            }

            if (others.isNotEmpty()) {
                Text(
                    text = stringResource(R.string.tags_all),
                    style = MaterialTheme.typography.titleSmall,
                    modifier = Modifier.padding(top = 4.dp),
                )
                TagChips(others, selection, ::toggle)
            }

            if (related.isEmpty() && others.isEmpty()) {
                Text(
                    text = stringResource(R.string.no_results),
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
        }

        // Criar tag nova (aparece ao carregar em "Nova tag")
        newTagName?.let { name ->
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                modifier = Modifier.padding(bottom = 12.dp),
            ) {
                OutlinedTextField(
                    value = name,
                    onValueChange = { newTagName = it },
                    placeholder = { Text(stringResource(R.string.tags_new_name)) },
                    singleLine = true,
                    enabled = !isCreating,
                    shape = RoundedCornerShape(12.dp),
                    keyboardOptions = KeyboardOptions(capitalization = KeyboardCapitalization.Sentences),
                    modifier = Modifier.weight(1f),
                )
                TextButton(
                    onClick = {
                        onCreateTag(name) { tag ->
                            selection = selection + tag.id
                            newTagName = null
                            query = ""
                        }
                    },
                    enabled = name.isNotBlank() && !isCreating,
                ) {
                    if (isCreating) CircularProgressIndicator(Modifier.size(18.dp), strokeWidth = 2.dp)
                    else Text(stringResource(R.string.action_create))
                }
            }
        }

        Text(
            text = pluralStringResource(R.plurals.tags_selected, selection.size, selection.size),
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
        Spacer(Modifier.size(8.dp))

        // Os 3 botões do wireframe numa linha que cabe num telemóvel estreito:
        // Nova tag à esquerda; Limpar e Aplicar à direita
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            TextButton(
                onClick = { newTagName = query.trim() },   // aproveita o que já foi pesquisado
                contentPadding = ButtonDefaults.TextButtonWithIconContentPadding,
            ) {
                Icon(Icons.Outlined.Add, contentDescription = null, modifier = Modifier.size(18.dp))
                Spacer(Modifier.size(4.dp))
                Text(stringResource(R.string.action_new_tag))
            }
            Spacer(Modifier.weight(1f))
            FilledTonalButton(
                onClick = { selection = emptySet() },
                shape = RoundedCornerShape(12.dp),
                contentPadding = ButtonDefaults.TextButtonContentPadding,
            ) {
                Text(
                    text = stringResource(R.string.action_clear_all),
                    maxLines = 1,
                )
            }
            Spacer(Modifier.size(8.dp))
            Button(
                onClick = { onApply(selection) },
                shape = RoundedCornerShape(12.dp),
                contentPadding = ButtonDefaults.TextButtonContentPadding,
            ) {
                Text(
                    text = stringResource(R.string.action_apply),
                    maxLines = 1,
                    softWrap = false,
                )
            }
        }
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun TagChips(tags: List<Tag>, selection: Set<String>, onToggle: (Tag) -> Unit) {
    FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        tags.forEach { tag ->
            SelectableChip(
                label = tag.name,
                selected = tag.id in selection,
                onClick = { onToggle(tag) },
            )
        }
    }
}

@Preview(showBackground = true)
@Composable
private fun TagPickerDialogPreview() {
    FortisLibertasTheme {
        TagPickerDialog(
            tags = FakeRecordData.options().tags,
            category = null,
            initialSelection = setOf("tag-lunch"),
            isCreating = false,
            onCreateTag = { _, _ -> },
            onApply = {},
            onDismiss = {},
        )
    }
}

@Preview(showBackground = true)
@Composable
private fun TagChipsPreview() {
    FortisLibertasTheme {
        TagChips(
            tags = FakeRecordData.options().tags,
            selection = setOf("tag-lunch", "tag-work"),
            onToggle = {},
        )
    }
}