package pt.fortislibertas.ui.cards.components

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.DeleteForever
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.input.KeyboardCapitalization
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import pt.fortislibertas.R
import pt.fortislibertas.core.designsystem.components.DateField
import pt.fortislibertas.core.designsystem.components.FormActions
import pt.fortislibertas.core.designsystem.components.FormTextField
import pt.fortislibertas.core.designsystem.components.SelectField
import pt.fortislibertas.core.designsystem.preview.FortisPreviewTheme
import pt.fortislibertas.core.designsystem.preview.FortisScreenPreviews
import pt.fortislibertas.data.fake.FakeWalletData
import pt.fortislibertas.data.model.CardColor
import pt.fortislibertas.data.model.CardType
import pt.fortislibertas.ui.cards.CardEditField
import pt.fortislibertas.ui.cards.CardEditForm

/**
 * Edit card form (inside the bottom sheet): cardholder, type, expiry date and colour.
 * Number and CVV are write-only in the API, so they only show after "Replace card number"
 * and are only sent when filled. "Delete card" at the end asks for confirmation first.
 */
@Composable
fun CardsEditCardForm(
    form: CardEditForm,
    colors: List<CardColor>,
    isSaving: Boolean,
    onUpdate: (CardEditField?, (CardEditForm) -> CardEditForm) -> Unit,
    onCancel: () -> Unit,
    onSave: () -> Unit,
    onDelete: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Column(modifier.fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Text(
            text = stringResource(R.string.cards_edit_title),
            style = MaterialTheme.typography.titleLarge,
            modifier = Modifier.padding(bottom = 4.dp),
        )
        Text(
            text = "${form.card.bankName} · •••• ${form.card.last4 ?: "----"}",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )

        FormTextField(
            label = stringResource(R.string.cards_info_holder),
            value = form.cardholderName,
            onValueChange = { v -> onUpdate(CardEditField.CardholderName) { it.copy(cardholderName = v) } },
            errorText = form.errors[CardEditField.CardholderName]?.let { stringResource(it) },
            maxLength = 50,
            keyboardOptions = KeyboardOptions(capitalization = KeyboardCapitalization.Words),
        )

        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            SelectField(
                label = stringResource(R.string.cards_info_type),
                options = CardType.entries,
                selected = form.type,
                optionLabel = {
                    stringResource(if (it == CardType.CREDIT) R.string.cards_type_credit else R.string.cards_type_debit)
                },
                onSelect = { v -> onUpdate(null) { it.copy(type = v) } },
                modifier = Modifier.weight(1f),
            )
            DateField(
                label = stringResource(R.string.cards_expiry),
                date = form.expiryDate,
                onDateChange = { v -> onUpdate(null) { it.copy(expiryDate = v) } },
                confirmLabel = stringResource(R.string.cards_ok),
                dismissLabel = stringResource(R.string.action_cancel),
                modifier = Modifier.weight(1f),
            )
        }

        // ── Colour (palette of the API) ──
        Text(
            text = stringResource(R.string.cards_color),
            style = MaterialTheme.typography.labelLarge,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier.padding(start = 4.dp),
        )
        CardsColorPicker(
            colors = colors,
            selectedId = form.colorId,
            onSelect = { id -> onUpdate(null) { it.copy(colorId = id) } },
        )

        // ── Number + CVV (write-only: only when replacing) ──
        if (form.replaceNumber) {
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                FormTextField(
                    label = stringResource(R.string.cards_field_number),
                    value = form.cardNumber,
                    onValueChange = { v ->
                        onUpdate(CardEditField.CardNumber) { it.copy(cardNumber = v.filter(Char::isDigit).take(16)) }
                    },
                    errorText = form.errors[CardEditField.CardNumber]?.let { stringResource(it) },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    modifier = Modifier.weight(2f),
                )
                FormTextField(
                    label = stringResource(R.string.cards_field_cvv),
                    value = form.cvv,
                    onValueChange = { v -> onUpdate(CardEditField.Cvv) { it.copy(cvv = v.filter(Char::isDigit).take(3)) } },
                    errorText = form.errors[CardEditField.Cvv]?.let { stringResource(it) },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.NumberPassword),
                    modifier = Modifier.weight(1f),
                )
            }
        }
        TextButton(
            onClick = {
                onUpdate(CardEditField.CardNumber) {
                    it.copy(replaceNumber = !it.replaceNumber, cardNumber = "", cvv = "", errors = it.errors - CardEditField.Cvv)
                }
            },
            enabled = !isSaving,
        ) {
            Text(stringResource(if (form.replaceNumber) R.string.cards_keep_number else R.string.cards_replace_number))
        }

        FormActions(
            cancelLabel = stringResource(R.string.action_cancel),
            saveLabel = stringResource(R.string.action_save),
            onCancel = onCancel,
            onSave = onSave,
            isSaving = isSaving,
        )

        // ── Delete (asks for confirmation) ──
        TextButton(onClick = onDelete, enabled = !isSaving, modifier = Modifier.fillMaxWidth()) {
            Icon(
                Icons.Outlined.DeleteForever,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.error,
                modifier = Modifier.size(18.dp),
            )
            Spacer(Modifier.size(8.dp))
            Text(stringResource(R.string.cards_delete), color = MaterialTheme.colorScheme.error)
        }
    }
}

@FortisScreenPreviews
@Composable
private fun CardsEditCardFormPreview() {
    FortisPreviewTheme {
        CardsEditCardForm(
            form = CardEditForm(FakeWalletData.cards.first()).copy(replaceNumber = true, cardNumber = "4111"),
            colors = FakeWalletData.colors,
            isSaving = false,
            onUpdate = { _, _ -> },
            onCancel = {},
            onSave = {},
            onDelete = {},
            modifier = Modifier.padding(24.dp),
        )
    }
}
