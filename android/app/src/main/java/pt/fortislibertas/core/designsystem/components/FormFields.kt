package pt.fortislibertas.core.designsystem.components

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Add
import androidx.compose.material.icons.outlined.CalendarMonth
import androidx.compose.material.icons.outlined.KeyboardArrowDown
import androidx.compose.material.icons.outlined.KeyboardArrowUp
import androidx.compose.material.icons.outlined.Search
import androidx.compose.material3.DatePicker
import androidx.compose.material3.DatePickerDialog
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.rememberDatePickerState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneOffset
import java.time.format.DateTimeFormatter

/*
 * Campos de formulário reutilizáveis, todos com o mesmo aspeto:
 * rótulo por cima (como no wireframe), cantos de 12 dp e erro por baixo.
 */

private val FieldShape = RoundedCornerShape(12.dp)

@Composable
fun FieldLabel(text: String, modifier: Modifier = Modifier) {
    Text(
        text = text,
        style = MaterialTheme.typography.labelLarge,
        color = MaterialTheme.colorScheme.onSurfaceVariant,
        maxLines = 1,
        overflow = TextOverflow.Ellipsis,
        modifier = modifier.padding(start = 4.dp, bottom = 6.dp),
    )
}

/** Campo de texto normal. Com minLines > 1 passa a ter várias linhas (descrição). */
@Composable
fun FormTextField(
    label: String,
    value: String,
    onValueChange: (String) -> Unit,
    modifier: Modifier = Modifier,
    placeholder: String? = null,
    errorText: String? = null,
    supportingText: String? = null,
    minLines: Int = 1,
    maxLines: Int = if (minLines == 1) 1 else Int.MAX_VALUE,
    maxLength: Int? = null,
    keyboardOptions: KeyboardOptions = KeyboardOptions.Default,
) {

    val helper = errorText ?: supportingText
    val showSupporting = helper != null || maxLength != null

    Column(modifier) {
        FieldLabel(label)
        OutlinedTextField(
            value = value,
            onValueChange = { new ->
                onValueChange(if (maxLength != null) new.take(maxLength) else new)
            },
            modifier = Modifier.fillMaxWidth(),
            placeholder = placeholder?.let { { Text(it) } },
            isError = errorText != null,
            supportingText = if (showSupporting) {
                {
                    Row(Modifier.fillMaxWidth()) {
                        Text(helper.orEmpty(), modifier = Modifier.weight(1f))
                        if (maxLength != null) Text("${value.length}/$maxLength")
                    }
                }
            } else null,
            singleLine = minLines == 1,
            minLines = minLines,
            maxLines = maxLines,
            keyboardOptions = keyboardOptions,
            shape = FieldShape,
        )
    }
}

/**
 * Campo só de leitura que abre algo ao tocar (menu, calendário, diálogo).
 * Base do SelectField, DateField e PickerField.
 */
@Composable
private fun ClickableField(
    value: String,
    placeholder: String,
    trailingIcon: ImageVector,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    errorText: String? = null,
    leadingContent: (@Composable () -> Unit)? = null,
) {
    Box(modifier) {
        OutlinedTextField(
            value = value,
            onValueChange = {},
            readOnly = true,
            modifier = Modifier.fillMaxWidth(),
            placeholder = { Text(placeholder, maxLines = 1, overflow = TextOverflow.Ellipsis) },
            leadingIcon = leadingContent,
            trailingIcon = { Icon(trailingIcon, contentDescription = null) },
            isError = errorText != null,
            supportingText = errorText?.let { { Text(it) } },
            singleLine = true,
            shape = FieldShape,
        )
        // Camada invisível por cima: o toque abre o seletor em vez do teclado
        Box(
            Modifier
                .matchParentSize()
                .clickable(role = Role.Button, onClick = onClick),
        )
    }
}

/** Lista de escolha (Record type, Currency, Payment method, Status…). */
@Composable
fun <T> SelectField(
    label: String?,
    options: List<T>,
    selected: T?,
    optionLabel: @Composable (T) -> String,
    onSelect: (T) -> Unit,
    modifier: Modifier = Modifier,
    placeholder: String = "",
    errorText: String? = null,
) {
    var expanded by remember { mutableStateOf(false) }

    Column(modifier) {
        if (label != null) FieldLabel(label)
        Box {
            ClickableField(
                value = if (selected != null) optionLabel(selected) else "",
                placeholder = placeholder,
                trailingIcon = if (expanded) Icons.Outlined.KeyboardArrowUp else Icons.Outlined.KeyboardArrowDown,
                onClick = { expanded = true },
                errorText = errorText,
            )
            DropdownMenu(expanded = expanded, onDismissRequest = { expanded = false }) {
                options.forEach { option ->
                    DropdownMenuItem(
                        text = { Text(optionLabel(option)) },
                        onClick = {
                            onSelect(option)
                            expanded = false
                        },
                    )
                }
            }
        }
    }
}

/** Campo de data que abre o calendário do Material 3. */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DateField(
    label: String,
    date: LocalDate?,
    onDateChange: (LocalDate) -> Unit,
    confirmLabel: String,
    dismissLabel: String,
    modifier: Modifier = Modifier,
    placeholder: String = "dd/mm/aaaa",
    errorText: String? = null,
) {
    var open by rememberSaveable { mutableStateOf(false) }
    val formatter = remember { DateTimeFormatter.ofPattern("dd/MM/yyyy") }

    Column(modifier) {
        FieldLabel(label)
        ClickableField(
            value = date?.format(formatter).orEmpty(),
            placeholder = placeholder,
            trailingIcon = Icons.Outlined.CalendarMonth,
            onClick = { open = true },
            errorText = errorText,
        )
    }

    if (open) {
        // O DatePicker trabalha em milissegundos UTC; convertemos de/para LocalDate
        val state = rememberDatePickerState(
            initialSelectedDateMillis = date?.atStartOfDay(ZoneOffset.UTC)?.toInstant()?.toEpochMilli(),
        )
        DatePickerDialog(
            onDismissRequest = { open = false },
            confirmButton = {
                TextButton(onClick = {
                    state.selectedDateMillis?.let { millis ->
                        onDateChange(Instant.ofEpochMilli(millis).atZone(ZoneOffset.UTC).toLocalDate())
                    }
                    open = false
                }) { Text(confirmLabel) }
            },
            dismissButton = {
                TextButton(onClick = { open = false }) { Text(dismissLabel) }
            },
        ) {
            DatePicker(state = state)
        }
    }
}

/**
 * Campo que abre um diálogo próprio (Categoria, Tags).
 * Mostra o valor escolhido ou o texto de ajuda, com um "+" à direita.
 */
@Composable
fun PickerField(
    label: String,
    value: String?,
    placeholder: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    errorText: String? = null,
    trailingIcon: ImageVector = Icons.Outlined.Add,
    leadingContent: (@Composable () -> Unit)? = null,
) {
    Column(modifier) {
        FieldLabel(label)
        ClickableField(
            value = value.orEmpty(),
            placeholder = placeholder,
            trailingIcon = trailingIcon,
            onClick = onClick,
            errorText = errorText,
            leadingContent = leadingContent,
        )
    }
}

/** Caixa de pesquisa compacta (diálogos de Tags e Categoria). */
@Composable
fun SearchField(
    query: String,
    onQueryChange: (String) -> Unit,
    placeholder: String,
    modifier: Modifier = Modifier,
) {
    OutlinedTextField(
        value = query,
        onValueChange = onQueryChange,
        modifier = modifier.fillMaxWidth(),
        placeholder = { Text(placeholder) },
        leadingIcon = { Icon(Icons.Outlined.Search, contentDescription = null) },
        singleLine = true,
        shape = FieldShape,
    )
}
