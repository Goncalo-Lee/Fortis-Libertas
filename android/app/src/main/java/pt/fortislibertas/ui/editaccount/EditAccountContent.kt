package pt.fortislibertas.ui.editaccount

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.ArrowBack
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.input.KeyboardCapitalization
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import java.time.LocalDate
import pt.fortislibertas.R
import pt.fortislibertas.core.designsystem.components.DateField
import pt.fortislibertas.core.designsystem.components.ErrorContent
import pt.fortislibertas.core.designsystem.components.FormActions
import pt.fortislibertas.core.designsystem.components.FormTextField
import pt.fortislibertas.core.designsystem.components.LabeledValue
import pt.fortislibertas.core.designsystem.components.LoadingContent
import pt.fortislibertas.core.designsystem.components.SelectField
import pt.fortislibertas.core.designsystem.components.UserAvatar
import pt.fortislibertas.core.designsystem.preview.FortisPreviewTheme
import pt.fortislibertas.core.designsystem.preview.FortisScreenPreviews
import pt.fortislibertas.data.model.AccountDetails
import pt.fortislibertas.data.model.BankAccount
import pt.fortislibertas.data.model.SUPPORTED_CURRENCIES

/** Stateless Edit account screen: back arrow + title, avatar and the form. */
@Composable
fun EditAccountContent(
    state: EditAccountUiState,
    contentPadding: PaddingValues,
    onBack: () -> Unit,
    onRetry: () -> Unit,
    onFullNameChange: (String) -> Unit,
    onUserNameChange: (String) -> Unit,
    onPhoneChange: (String) -> Unit,
    onBirthDateChange: (LocalDate) -> Unit,
    onCurrencyChange: (String) -> Unit,
    onPrimaryBankChange: (String?) -> Unit,
    onSave: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Column(modifier.fillMaxSize().padding(contentPadding)) {
        Row(
            modifier = Modifier.fillMaxWidth().padding(horizontal = 8.dp, vertical = 8.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            IconButton(onClick = onBack) {
                Icon(Icons.AutoMirrored.Outlined.ArrowBack, contentDescription = stringResource(R.string.account_back))
            }
            Text(stringResource(R.string.account_title), style = MaterialTheme.typography.titleLarge)
        }

        when {
            state.isLoading -> LoadingContent()
            state.loadError != null -> ErrorContent(
                message = stringResource(state.loadError),
                retryLabel = stringResource(R.string.action_retry),
                onRetry = onRetry,
            )
            else -> EditAccountForm(
                state = state,
                onFullNameChange = onFullNameChange,
                onUserNameChange = onUserNameChange,
                onPhoneChange = onPhoneChange,
                onBirthDateChange = onBirthDateChange,
                onCurrencyChange = onCurrencyChange,
                onPrimaryBankChange = onPrimaryBankChange,
                onCancel = onBack,
                onSave = onSave,
            )
        }
    }
}

@Composable
private fun EditAccountForm(
    state: EditAccountUiState,
    onFullNameChange: (String) -> Unit,
    onUserNameChange: (String) -> Unit,
    onPhoneChange: (String) -> Unit,
    onBirthDateChange: (LocalDate) -> Unit,
    onCurrencyChange: (String) -> Unit,
    onPrimaryBankChange: (String?) -> Unit,
    onCancel: () -> Unit,
    onSave: () -> Unit,
) {
    val original = state.original ?: return
    val error = { field: AccountField -> state.errors[field] }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .imePadding()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 20.dp, vertical = 8.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        // Photo: read only (no upload in the API yet)
        Column(Modifier.fillMaxWidth(), horizontalAlignment = Alignment.CenterHorizontally) {
            UserAvatar(name = state.fullName.ifBlank { original.fullName }, imageUrl = original.imageUrl, size = 80.dp)
            Text(
                stringResource(R.string.account_photo_web),
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.padding(top = 6.dp),
            )
        }

        FormTextField(
            label = stringResource(R.string.account_full_name),
            value = state.fullName,
            onValueChange = onFullNameChange,
            errorText = error(AccountField.FullName)?.let { stringResource(it) },
            maxLength = 254,
            keyboardOptions = KeyboardOptions(capitalization = KeyboardCapitalization.Words),
        )
        FormTextField(
            label = stringResource(R.string.account_username),
            value = state.userName,
            onValueChange = onUserNameChange,
            errorText = error(AccountField.UserName)?.let { stringResource(it) },
            supportingText = stringResource(R.string.account_username_hint),
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Ascii),
        )

        // Email: read only, changed on the website (Better Auth)
        Column {
            LabeledValue(label = stringResource(R.string.account_email), value = original.email)
            Text(
                stringResource(R.string.account_email_web),
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }

        FormTextField(
            label = stringResource(R.string.account_phone),
            value = state.phone,
            onValueChange = onPhoneChange,
            errorText = error(AccountField.Phone)?.let { stringResource(it) },
            placeholder = "+351 912 345 678",
            maxLength = 20,
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
        )
        DateField(
            label = stringResource(R.string.account_birth_date),
            date = state.birthDate,
            onDateChange = onBirthDateChange,
            confirmLabel = stringResource(R.string.cards_ok),
            dismissLabel = stringResource(R.string.action_cancel),
            errorText = error(AccountField.BirthDate)?.let { stringResource(it) },
        )
        SelectField(
            label = stringResource(R.string.account_currency),
            options = SUPPORTED_CURRENCIES,
            selected = state.currency,
            optionLabel = { it },
            onSelect = onCurrencyChange,
        )
        if (state.banks.isNotEmpty()) {
            val none = stringResource(R.string.account_primary_bank_none)
            SelectField(
                label = stringResource(R.string.account_primary_bank),
                options = listOf<BankAccount?>(null) + state.banks,
                selected = state.banks.find { it.id == state.primaryBankAccountId },
                optionLabel = { it?.name ?: none },
                onSelect = { onPrimaryBankChange(it?.id) },
                placeholder = none,
            )
        }

        state.formError?.let {
            Text(stringResource(it), color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall)
        }

        FormActions(
            cancelLabel = stringResource(R.string.action_cancel),
            saveLabel = stringResource(R.string.account_save),
            onCancel = onCancel,
            onSave = onSave,
            isSaving = state.isSaving,
            modifier = Modifier.padding(vertical = 8.dp),
        )
    }
}

@FortisScreenPreviews
@Composable
private fun EditAccountContentPreview() {
    val details = AccountDetails(
        fullName = "Ana Silva", userName = "ana.silva", email = "ana@example.com", imageUrl = null,
        phone = "+351 912 345 678", birthDate = LocalDate.of(2004, 3, 12), currency = "EUR", primaryBankAccountId = null,
    )
    FortisPreviewTheme {
        EditAccountContent(
            state = EditAccountUiState(
                isLoading = false, original = details, fullName = details.fullName, userName = "a",
                phone = details.phone.orEmpty(), birthDate = details.birthDate,
                errors = mapOf(AccountField.UserName to R.string.account_error_username),
            ),
            contentPadding = PaddingValues(),
            onBack = {}, onRetry = {}, onFullNameChange = {}, onUserNameChange = {}, onPhoneChange = {},
            onBirthDateChange = {}, onCurrencyChange = {}, onPrimaryBankChange = {}, onSave = {},
        )
    }
}
