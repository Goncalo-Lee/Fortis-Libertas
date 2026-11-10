package pt.fortislibertas.ui.cards.components

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
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.input.KeyboardCapitalization
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import pt.fortislibertas.R
import pt.fortislibertas.core.designsystem.components.ColorDot
import pt.fortislibertas.core.designsystem.components.DateField
import pt.fortislibertas.core.designsystem.components.FormActions
import pt.fortislibertas.core.designsystem.components.FormTextField
import pt.fortislibertas.core.designsystem.components.SelectField
import pt.fortislibertas.core.designsystem.components.colorFromHex
import pt.fortislibertas.core.designsystem.preview.FortisPreviewTheme
import pt.fortislibertas.core.designsystem.preview.FortisScreenPreviews
import pt.fortislibertas.data.fake.FakeWalletData
import pt.fortislibertas.data.model.BankAccount
import pt.fortislibertas.data.model.CardType
import pt.fortislibertas.data.remote.dto.CardColors
import pt.fortislibertas.ui.cards.AddField
import pt.fortislibertas.ui.cards.BankAddForm
import pt.fortislibertas.ui.cards.CardAddForm

/** Currencies of the API catalog for bank accounts (endpoints.md §5.2). */
private val CURRENCIES = listOf("EUR", "USD", "GBP", "BRL")

/**
 * Add card form (bottom sheet). Only banks where the user is owner or editor can be chosen.
 * Number, expiry date and CVV are optional; when filled they are checked like in Edit card.
 */
@Composable
fun CardsAddCardForm(
    form: CardAddForm,
    banks: List<BankAccount>,
    isSaving: Boolean,
    onUpdate: (AddField?, (CardAddForm) -> CardAddForm) -> Unit,
    onCancel: () -> Unit,
    onSave: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val allowed = banks.filter { it.canAddCards }
    Column(modifier.fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Text(stringResource(R.string.cards_add_card), style = MaterialTheme.typography.titleLarge)

        if (allowed.isEmpty()) {
            Text(
                stringResource(R.string.cards_no_bank_for_cards),
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                style = MaterialTheme.typography.bodyMedium,
            )
        }
        SelectField(
            label = stringResource(R.string.cards_field_bank),
            options = allowed,
            selected = allowed.firstOrNull { it.id == form.bankId },
            optionLabel = { it.name },
            onSelect = { bank -> onUpdate(AddField.Bank) { it.copy(bankId = bank.id) } },
            placeholder = stringResource(R.string.cards_choose_bank),
            errorText = form.errors[AddField.Bank]?.let { stringResource(it) },
        )
        FormTextField(
            label = stringResource(R.string.cards_info_holder),
            value = form.cardholderName,
            onValueChange = { v -> onUpdate(AddField.CardholderName) { it.copy(cardholderName = v) } },
            errorText = form.errors[AddField.CardholderName]?.let { stringResource(it) },
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
                label = stringResource(R.string.cards_field_optional, stringResource(R.string.cards_expiry)),
                date = form.expiryDate,
                onDateChange = { v -> onUpdate(null) { it.copy(expiryDate = v) } },
                confirmLabel = stringResource(R.string.cards_ok),
                dismissLabel = stringResource(R.string.action_cancel),
                modifier = Modifier.weight(1f),
            )
        }
        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            FormTextField(
                label = stringResource(R.string.cards_field_optional, stringResource(R.string.cards_field_number)),
                value = form.cardNumber,
                onValueChange = { v -> onUpdate(AddField.CardNumber) { it.copy(cardNumber = v.filter(Char::isDigit).take(16)) } },
                errorText = form.errors[AddField.CardNumber]?.let { stringResource(it) },
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                modifier = Modifier.weight(2f),
            )
            FormTextField(
                label = stringResource(R.string.cards_field_cvv),
                value = form.cvv,
                onValueChange = { v -> onUpdate(AddField.Cvv) { it.copy(cvv = v.filter(Char::isDigit).take(3)) } },
                errorText = form.errors[AddField.Cvv]?.let { stringResource(it) },
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.NumberPassword),
                modifier = Modifier.weight(1f),
            )
        }
        Text(
            text = stringResource(R.string.cards_color),
            style = MaterialTheme.typography.labelLarge,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier.padding(start = 4.dp),
        )
        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            CardColors.palette.forEach { hex ->
                ColorDot(
                    color = colorFromHex(hex),
                    size = 32.dp,
                    selected = hex.equals(form.colorHex, ignoreCase = true),
                    onClick = { onUpdate(null) { it.copy(colorHex = hex) } },
                )
            }
        }
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

/** Add bank form (bottom sheet): name, initial balance and currency. The creator becomes the owner. */
@Composable
fun CardsAddBankForm(
    form: BankAddForm,
    isSaving: Boolean,
    onUpdate: (AddField?, (BankAddForm) -> BankAddForm) -> Unit,
    onCancel: () -> Unit,
    onSave: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Column(modifier.fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Text(stringResource(R.string.cards_add_bank), style = MaterialTheme.typography.titleLarge)

        FormTextField(
            label = stringResource(R.string.banks_field_name),
            value = form.name,
            onValueChange = { v -> onUpdate(AddField.Name) { it.copy(name = v) } },
            errorText = form.errors[AddField.Name]?.let { stringResource(it) },
            maxLength = 50,
            keyboardOptions = KeyboardOptions(capitalization = KeyboardCapitalization.Words),
        )
        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            FormTextField(
                label = stringResource(R.string.banks_field_initial_balance),
                value = form.initialBalance,
                onValueChange = { v -> onUpdate(AddField.InitialBalance) { it.copy(initialBalance = v) } },
                placeholder = "0,00",
                errorText = form.errors[AddField.InitialBalance]?.let { stringResource(it) },
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                modifier = Modifier.weight(2f),
            )
            SelectField(
                label = stringResource(R.string.banks_field_currency),
                options = CURRENCIES,
                selected = form.currency,
                optionLabel = { it },
                onSelect = { v -> onUpdate(null) { it.copy(currency = v) } },
                modifier = Modifier.weight(1f),
            )
        }
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

@FortisScreenPreviews
@Composable
private fun CardsAddCardFormPreview() {
    FortisPreviewTheme {
        CardsAddCardForm(
            form = CardAddForm(bankId = "bank-1", cardholderName = "Ana Silva", colorHex = CardColors.palette.first()),
            banks = FakeWalletData.banks,
            isSaving = false,
            onUpdate = { _, _ -> }, onCancel = {}, onSave = {},
            modifier = Modifier.padding(24.dp),
        )
    }
}

@FortisScreenPreviews
@Composable
private fun CardsAddBankFormPreview() {
    FortisPreviewTheme {
        CardsAddBankForm(
            form = BankAddForm(name = "Banco Demo", initialBalance = "150,00"),
            isSaving = false,
            onUpdate = { _, _ -> }, onCancel = {}, onSave = {},
            modifier = Modifier.padding(24.dp),
        )
    }
}
