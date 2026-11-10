package pt.fortislibertas.ui.newrecord.components

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.pluralStringResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.input.KeyboardCapitalization
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import pt.fortislibertas.R
import pt.fortislibertas.core.designsystem.components.ColorDot
import pt.fortislibertas.core.designsystem.components.DateField
import pt.fortislibertas.core.designsystem.components.FormActions
import pt.fortislibertas.core.designsystem.components.FormTextField
import pt.fortislibertas.core.designsystem.components.PickerField
import pt.fortislibertas.core.designsystem.components.SelectField
import pt.fortislibertas.core.designsystem.components.colorFromHex
import pt.fortislibertas.core.designsystem.preview.FortisPreviewTheme
import pt.fortislibertas.core.designsystem.preview.FortisScreenPreviews
import pt.fortislibertas.data.fake.FakeRecordData
import pt.fortislibertas.data.model.Category
import pt.fortislibertas.data.model.InstalmentPlanOption
import pt.fortislibertas.data.model.PaymentMethod
import pt.fortislibertas.data.model.RecordFormOptions
import pt.fortislibertas.data.model.RecordStatus
import pt.fortislibertas.data.model.RecordType
import pt.fortislibertas.ui.newrecord.FormField
import pt.fortislibertas.ui.newrecord.FormLimits
import pt.fortislibertas.ui.newrecord.RecordFormState
import pt.fortislibertas.ui.newrecord.label
import pt.fortislibertas.ui.newrecord.messageFor

/** "New financial record" form (wireframe image 2). */
@Composable
fun NewRecordFinancialRecordForm(
    form: RecordFormState,
    options: RecordFormOptions,
    isSaving: Boolean,
    onUpdate: (FormField?, (RecordFormState) -> RecordFormState) -> Unit,
    onOpenCategory: () -> Unit,
    onOpenTags: () -> Unit,
    onCancel: () -> Unit,
    onSave: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val category = options.categories.firstOrNull { it.id == form.categoryId }
    val none = stringResource(R.string.hint_none)
    val select = stringResource(R.string.hint_select)

    Column(
        modifier = modifier.fillMaxWidth(),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Text(
            text = stringResource(R.string.register_new_record),
            style = MaterialTheme.typography.titleLarge,
            modifier = Modifier.padding(bottom = 4.dp),
        )

        FormTextField(
            label = stringResource(R.string.field_name),
            value = form.name,
            onValueChange = { v -> onUpdate(FormField.Name) { it.copy(name = v) } },
            errorText = form.errors.messageFor(FormField.Name),
            maxLength = FormLimits.NAME,
            keyboardOptions = KeyboardOptions(capitalization = KeyboardCapitalization.Sentences),
        )

        FormTextField(
            label = stringResource(R.string.field_description),
            value = form.description,
            onValueChange = { v -> onUpdate(null) { it.copy(description = v) } },
            minLines = 3,
            maxLines = FormLimits.DESCRIPTION_VISIBLE_LINES,
            maxLength = FormLimits.DESCRIPTION,
            keyboardOptions = KeyboardOptions(capitalization = KeyboardCapitalization.Sentences),
        )

        SelectField(
            label = stringResource(R.string.field_record_type),
            options = RecordType.entries,
            selected = form.type,
            optionLabel = { it.label() },
            onSelect = { v -> onUpdate(FormField.Type) { it.copy(type = v) } },
            placeholder = select,
            errorText = form.errors.messageFor(FormField.Type),
        )

        // Amount + Currency
        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            FormTextField(
                label = stringResource(R.string.field_price),
                value = form.price,
                onValueChange = { v -> onUpdate(FormField.Price) { it.copy(price = v) } },
                placeholder = "0,00",
                errorText = form.errors.messageFor(FormField.Price),
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                modifier = Modifier.weight(2f),
            )
            SelectField(
                label = stringResource(R.string.field_currency),
                options = options.currencies,
                selected = form.currency,
                optionLabel = { it },
                onSelect = { v -> onUpdate(null) { it.copy(currency = v) } },
                modifier = Modifier.weight(1.2f),
            )
        }

        // Required: every record in the API has a payment method
        SelectField(
            label = stringResource(R.string.field_payment_method),
            options = options.paymentMethods,
            selected = options.paymentMethods.firstOrNull { it.id == form.paymentMethodId },
            optionLabel = { it.name },
            onSelect = { v -> onUpdate(FormField.PaymentMethod) { it.copy(paymentMethodId = v.id) } },
            errorText = form.errors.messageFor(FormField.PaymentMethod),
        )

        // Date + Status
        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            DateField(
                label = stringResource(R.string.field_payment_date),
                date = form.paymentDate,
                onDateChange = { v -> onUpdate(FormField.PaymentDate) { it.copy(paymentDate = v) } },
                confirmLabel = stringResource(R.string.action_ok),
                dismissLabel = stringResource(R.string.action_cancel),
                errorText = form.errors.messageFor(FormField.PaymentDate),
                modifier = Modifier.weight(1f),
            )
            SelectField(
                label = stringResource(R.string.field_status),
                options = RecordStatus.entries,
                selected = form.status,
                optionLabel = { it.label() },
                onSelect = { v -> onUpdate(null) { it.copy(status = v) } },
                modifier = Modifier.weight(1f),
            )
        }

        // Category + Tags
        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            NewRecordCategoryField(
                category = category,
                errorText = form.errors.messageFor(FormField.Category),
                onClick = onOpenCategory,
                modifier = Modifier.weight(1.4f),
            )
            NewRecordTagsField(
                count = form.tagIds.size,
                onClick = onOpenTags,
                modifier = Modifier.weight(1f),
            )
        }

        SelectField(
            label = stringResource(R.string.field_instalment_plan),
            options = listOf<InstalmentPlanOption?>(null) + options.instalmentPlans,
            selected = options.instalmentPlans.firstOrNull { it.id == form.instalmentPlanId },
            optionLabel = { it?.name ?: none },
            onSelect = { v -> onUpdate(null) { it.copy(instalmentPlanId = v?.id) } },
            placeholder = none,
        )

        FormActions(
            cancelLabel = stringResource(R.string.action_cancel),
            saveLabel = stringResource(R.string.action_save),
            onCancel = onCancel,
            onSave = onSave,
            isSaving = isSaving,
            modifier = Modifier.padding(top = 8.dp),
        )
    }
}

/** Category field: shows the colour dot + name, or "Choose". */
@Composable
fun NewRecordCategoryField(
    category: Category?,
    errorText: String?,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    PickerField(
        label = stringResource(R.string.field_category),
        value = category?.name,
        placeholder = stringResource(R.string.hint_select),
        onClick = onClick,
        errorText = errorText,
        leadingContent = category?.let { { ColorDot(colorFromHex(it.colorHex)) } },
        modifier = modifier,
    )
}

/** Tags field: shows "3 tags" or "Add". */
@Composable
fun NewRecordTagsField(
    count: Int,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    PickerField(
        label = stringResource(R.string.field_tags),
        value = if (count > 0) pluralStringResource(R.plurals.tags_count, count, count) else null,
        placeholder = stringResource(R.string.hint_add_tags),
        onClick = onClick,
        modifier = modifier,
    )
}

@FortisScreenPreviews
@Composable
private fun NewRecordFinancialRecordFormPreview() {
    FortisPreviewTheme {
        NewRecordFinancialRecordForm(
            form = RecordFormState(name = "Lunch", price = "12,50"),
            options = FakeRecordData.options(),
            isSaving = false,
            onUpdate = { _, _ -> },
            onOpenCategory = {},
            onOpenTags = {},
            onCancel = {},
            onSave = {},
        )
    }
}
