package pt.fortislibertas.core.designsystem.components

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
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
import pt.fortislibertas.core.designsystem.preview.FortisPreviewTheme
import pt.fortislibertas.core.designsystem.preview.FortisPreviews

/*
 * Reusable form fields, all with the same look:
 * label on top (like the wireframe), 12 dp corners and the error below.
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

/** Plain text field. With minLines > 1 it becomes multi-line (description). */
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
 * Read-only field that opens something on tap (menu, calendar, dialog).
 * Base of SelectField, DateField and PickerField.
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
        // Invisible layer on top: a tap opens the picker instead of the keyboard
        Box(
            Modifier
                .matchParentSize()
                .clickable(role = Role.Button, onClick = onClick),
        )
    }
}

/** Choice list (Record type, Currency, Payment method, Status…). */
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

/** Date field that opens the Material 3 calendar. */
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
        // The DatePicker works in UTC milliseconds; we convert from/to LocalDate
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
 * Field that opens its own dialog (Category, Tags).
 * Shows the chosen value or the hint text, with a "+" on the right.
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

/** Compact search box (Tags and Category dialogs). */
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

@FortisPreviews
@Composable
private fun FormFieldsPreview() {
    FortisPreviewTheme {
        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            FormTextField(label = "Name", value = "Lunch", onValueChange = {})
            FormTextField(label = "Price", value = "12,5x", onValueChange = {}, errorText = "Invalid amount")
            SelectField(
                label = "Status",
                options = listOf("Paid", "Pending"),
                selected = "Paid",
                optionLabel = { it },
                onSelect = {},
            )
            DateField(
                label = "Payment date",
                date = LocalDate.of(2026, 11, 6),
                onDateChange = {},
                confirmLabel = "OK",
                dismissLabel = "Cancel",
            )
            PickerField(label = "Category", value = null, placeholder = "Choose", onClick = {})
            SearchField(query = "", onQueryChange = {}, placeholder = "Search")
        }
    }
}
