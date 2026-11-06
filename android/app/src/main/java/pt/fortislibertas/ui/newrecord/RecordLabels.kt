package pt.fortislibertas.ui.newrecord

import androidx.compose.runtime.Composable
import androidx.compose.ui.res.stringResource
import pt.fortislibertas.R
import pt.fortislibertas.data.model.RecordStatus
import pt.fortislibertas.data.model.RecordType

/** Translated texts for the enums (the API sends "expense", the UI shows "Despesa"). */

@Composable
fun RecordType.label(): String = stringResource(
    when (this) {
        RecordType.EXPENSE -> R.string.type_expense
        RecordType.INCOME -> R.string.type_income
        RecordType.INVESTMENT -> R.string.type_investment
    },
)

@Composable
fun RecordStatus.label(): String = stringResource(
    when (this) {
        RecordStatus.PAID -> R.string.status_paid
        RecordStatus.PENDING -> R.string.status_pending
    },
)

/** Error message of a field, or null if the field is fine. */
@Composable
fun Map<FormField, Int>.messageFor(field: FormField): String? =
    this[field]?.let { stringResource(it) }
