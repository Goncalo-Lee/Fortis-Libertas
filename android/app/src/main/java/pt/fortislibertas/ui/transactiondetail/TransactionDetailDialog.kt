package pt.fortislibertas.ui.transactiondetail

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.size
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.DeleteForever
import androidx.compose.material3.Icon
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import pt.fortislibertas.R
import pt.fortislibertas.core.designsystem.components.BlurDialog
import pt.fortislibertas.core.designsystem.components.ColorDot
import pt.fortislibertas.core.designsystem.components.ConfirmDialog
import pt.fortislibertas.core.designsystem.components.LabeledValue
import pt.fortislibertas.core.designsystem.components.colorFromHex
import pt.fortislibertas.core.designsystem.preview.FortisPreviewTheme
import pt.fortislibertas.core.designsystem.preview.FortisPreviews
import pt.fortislibertas.core.designsystem.theme.FortisTheme
import pt.fortislibertas.core.designsystem.util.MoneyFormatter
import pt.fortislibertas.data.fake.FakeTransactionData
import pt.fortislibertas.data.model.RecordType
import pt.fortislibertas.data.model.TransactionItem
import pt.fortislibertas.ui.newrecord.label
import java.time.format.DateTimeFormatter

/**
 * Stateful details dialog of one transaction, opened from Home and Transactions.
 * [onDeleted] runs after a successful delete, so the screen can reload its list.
 */
@Composable
fun TransactionDetailDialog(
    summary: TransactionItem,
    onDismiss: () -> Unit,
    onDeleted: () -> Unit,
) {
    val viewModel: TransactionDetailViewModel = viewModel(
        key = "transaction-detail-${summary.id}",
        factory = TransactionDetailViewModel.factory(summary),
    )
    val state by viewModel.state.collectAsStateWithLifecycle()
    val currentOnDeleted by rememberUpdatedState(onDeleted)

    LaunchedEffect(viewModel) {
        viewModel.events.collect { event ->
            when (event) {
                TransactionDetailEvent.Deleted -> currentOnDeleted()
            }
        }
    }

    TransactionDetailContent(state = state, onDismiss = onDismiss, onDelete = viewModel::requestDelete)

    if (state.confirmDelete) {
        ConfirmDialog(
            icon = Icons.Outlined.DeleteForever,
            title = stringResource(R.string.detail_delete_title),
            message = stringResource(R.string.detail_delete_message),
            confirmLabel = stringResource(R.string.detail_delete),
            dismissLabel = stringResource(R.string.action_cancel),
            destructive = true,
            isWorking = state.isDeleting,
            onConfirm = viewModel::confirmDelete,
            onDismiss = viewModel::cancelDelete,
        )
    }
}

/**
 * Stateless details dialog: name and category, the amount (green/red, like Home)
 * and the record data in pairs, the same way as the card details dialog.
 */
@Composable
fun TransactionDetailContent(
    state: TransactionDetailUiState,
    onDismiss: () -> Unit,
    onDelete: () -> Unit,
) {
    val summary = state.summary
    val detail = state.detail
    val none = stringResource(R.string.detail_none)
    val isIncome = summary.type == RecordType.INCOME
    val sign = if (isIncome) "+" else "−"

    BlurDialog(onDismissRequest = onDismiss) {
        // ── Name + category ──
        Text(summary.name, style = MaterialTheme.typography.titleLarge)
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            ColorDot(color = colorFromHex(summary.categoryColorHex), size = 10.dp)
            Text(
                text = summary.categoryName,
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
        Spacer(Modifier.height(16.dp))

        // ── Amount ──
        Text(
            text = sign + MoneyFormatter.format(summary.amount, summary.currency),
            style = MaterialTheme.typography.headlineMedium.copy(fontWeight = FontWeight.Bold),
            color = if (isIncome) FortisTheme.colors.income else FortisTheme.colors.expense,
        )
        Spacer(Modifier.height(16.dp))

        if (state.isLoading) {
            LinearProgressIndicator(Modifier.fillMaxWidth())
            Spacer(Modifier.height(16.dp))
        }

        // ── Data in pairs ──
        Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
            InfoRow(
                stringResource(R.string.detail_type) to summary.type.label(),
                stringResource(R.string.detail_status) to (detail?.status?.let { statusLabel(it) } ?: none),
            )
            InfoRow(
                stringResource(R.string.detail_date) to summary.date.format(DateTimeFormatter.ofPattern("dd/MM/yyyy")),
                stringResource(R.string.detail_payment_method) to (detail?.paymentMethodName ?: none),
            )
            detail?.instalmentPlanName?.let {
                LabeledValue(label = stringResource(R.string.detail_plan), value = it)
            }
            detail?.tagNames?.takeIf { it.isNotEmpty() }?.let {
                LabeledValue(label = stringResource(R.string.detail_tags), value = it.joinToString(", "))
            }
            detail?.description?.let {
                LabeledValue(label = stringResource(R.string.detail_description), value = it)
            }
        }

        (state.loadError ?: state.deleteError)?.let {
            Spacer(Modifier.height(12.dp))
            Text(stringResource(it), color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall)
        }

        // ── Delete (asks first) · Close ──
        Spacer(Modifier.height(16.dp))
        Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
            TextButton(onClick = onDelete, enabled = !state.isDeleting) {
                Icon(
                    Icons.Outlined.DeleteForever,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.error,
                    modifier = Modifier.size(18.dp),
                )
                Spacer(Modifier.size(6.dp))
                Text(stringResource(R.string.detail_delete), color = MaterialTheme.colorScheme.error)
            }
            Spacer(Modifier.weight(1f))
            TextButton(onClick = onDismiss) { Text(stringResource(R.string.detail_close)) }
        }
    }
}

/** Two label/value pairs side by side. */
@Composable
private fun InfoRow(left: Pair<String, String>, right: Pair<String, String>) {
    Row(Modifier.fillMaxWidth()) {
        LabeledValue(label = left.first, value = left.second, modifier = Modifier.weight(1f))
        LabeledValue(label = right.first, value = right.second, modifier = Modifier.weight(1f))
    }
}

/** API status key → text. */
@Composable
private fun statusLabel(status: String): String = when (status) {
    "paid" -> stringResource(R.string.status_paid)
    "pending" -> stringResource(R.string.status_pending)
    "active" -> stringResource(R.string.status_active)
    "settled" -> stringResource(R.string.status_settled)
    "cancelled" -> stringResource(R.string.status_cancelled)
    "late" -> stringResource(R.string.status_late)
    else -> status
}

@FortisPreviews
@Composable
private fun TransactionDetailContentPreview() {
    val summary = FakeTransactionData.build()[1].item
    FortisPreviewTheme {
        TransactionDetailContent(
            state = TransactionDetailUiState(
                summary = summary,
                isLoading = false,
                detail = pt.fortislibertas.data.model.TransactionDetail(
                    id = summary.id, name = summary.name, description = FakeTransactionData.descriptions["t2"],
                    type = summary.type, amount = summary.amount, currency = summary.currency, date = summary.date,
                    status = "paid", categoryName = summary.categoryName, categoryColorHex = summary.categoryColorHex,
                    paymentMethodName = "MB WAY", tagNames = listOf("Almoço", "Trabalho"), instalmentPlanName = null,
                ),
            ),
            onDismiss = {},
            onDelete = {},
        )
    }
}
