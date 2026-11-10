package pt.fortislibertas.ui.dashboard.components

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.RadioButton
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.text.input.KeyboardCapitalization
import androidx.compose.ui.unit.dp
import pt.fortislibertas.R
import pt.fortislibertas.core.designsystem.components.BlurDialog
import pt.fortislibertas.core.designsystem.components.ColorDot
import pt.fortislibertas.core.designsystem.components.FormTextField
import pt.fortislibertas.core.designsystem.components.SelectField
import pt.fortislibertas.core.designsystem.components.SelectableChip
import pt.fortislibertas.core.designsystem.components.colorFromHex
import pt.fortislibertas.core.designsystem.preview.FortisPreviewTheme
import pt.fortislibertas.core.designsystem.preview.FortisPreviews
import pt.fortislibertas.data.fake.FakeDashboardData
import pt.fortislibertas.data.fake.FakeRecordData
import pt.fortislibertas.data.model.Dashboard
import pt.fortislibertas.data.model.PaymentCard
import pt.fortislibertas.data.model.RecordType
import pt.fortislibertas.ui.dashboard.ManageDialog
import pt.fortislibertas.ui.dashboard.ManageState
import pt.fortislibertas.ui.newrecord.label

/**
 * One dialog for the 4 actions of the management button:
 * switch dashboard (choose from the list) or categories / tags / payment methods (list + add).
 */
@OptIn(ExperimentalLayoutApi::class)
@Composable
fun DashboardManageDialog(
    state: ManageState,
    dashboards: List<Dashboard>,
    activeDashboardId: String?,
    onSelectDashboard: (String) -> Unit,
    onUpdate: ((ManageState) -> ManageState) -> Unit,
    onAdd: () -> Unit,
    onDismiss: () -> Unit,
) {
    val title = stringResource(
        when (state.dialog) {
            ManageDialog.SwitchDashboard -> R.string.dash_switch
            ManageDialog.Categories -> R.string.dash_categories_title
            ManageDialog.Tags -> R.string.dash_tags
            ManageDialog.PaymentMethods -> R.string.dash_payment_methods
        },
    )
    BlurDialog(onDismissRequest = onDismiss) {
        Text(title, style = MaterialTheme.typography.titleLarge)
        Spacer(Modifier.height(12.dp))

        if (state.dialog == ManageDialog.SwitchDashboard) {
            // ── Choose the active dashboard ──
            Column(Modifier.heightIn(max = 320.dp).verticalScroll(rememberScrollState())) {
                dashboards.forEach { dashboard ->
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable(role = Role.RadioButton) { onSelectDashboard(dashboard.id) }
                            .padding(vertical = 4.dp),
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        RadioButton(selected = dashboard.id == activeDashboardId, onClick = null)
                        Spacer(Modifier.size(8.dp))
                        Text(dashboard.name, style = MaterialTheme.typography.bodyLarge)
                    }
                }
            }
        } else {
            val options = state.options
            // ── Current list ──
            when {
                state.isLoading -> LinearProgressIndicator(Modifier.fillMaxWidth())
                options != null -> Column(
                    Modifier.heightIn(max = 240.dp).verticalScroll(rememberScrollState()),
                    verticalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    when (state.dialog) {
                        ManageDialog.Categories -> options.categories.forEach { category ->
                            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                                ColorDot(color = colorFromHex(category.colorHex), size = 12.dp)
                                Text(category.name, Modifier.weight(1f))
                                Text(
                                    category.type.label(),
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                                )
                            }
                        }
                        ManageDialog.Tags -> FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            options.tags.forEach { SelectableChip(label = it.name, selected = false, onClick = {}) }
                        }
                        ManageDialog.PaymentMethods -> options.paymentMethods.forEach { Text(it.name) }
                        ManageDialog.SwitchDashboard -> Unit
                    }
                    val empty = when (state.dialog) {
                        ManageDialog.Categories -> options.categories.isEmpty()
                        ManageDialog.Tags -> options.tags.isEmpty()
                        else -> options.paymentMethods.isEmpty()
                    }
                    if (empty) Text(stringResource(R.string.dash_empty_list), color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            }

            // ── Add ──
            Spacer(Modifier.height(12.dp))
            HorizontalDivider()
            Spacer(Modifier.height(12.dp))
            FormTextField(
                label = stringResource(R.string.dash_new_name),
                value = state.newName,
                onValueChange = { v -> onUpdate { it.copy(newName = v) } },
                maxLength = 50,
                keyboardOptions = KeyboardOptions(capitalization = KeyboardCapitalization.Sentences),
            )
            if (state.dialog == ManageDialog.Categories && options != null) {
                Spacer(Modifier.height(8.dp))
                SelectField(
                    label = stringResource(R.string.dash_type),
                    options = RecordType.entries,
                    selected = state.newType,
                    optionLabel = { it.label() },
                    onSelect = { v -> onUpdate { it.copy(newType = v) } },
                )
                Spacer(Modifier.height(8.dp))
                Text(stringResource(R.string.dash_color), style = MaterialTheme.typography.labelLarge,
                    color = MaterialTheme.colorScheme.onSurfaceVariant)
                Spacer(Modifier.height(6.dp))
                // A colour can only be used by one category of the dashboard
                val used = options.categories.map { it.colorHex.lowercase() }.toSet()
                FlowRow(horizontalArrangement = Arrangement.spacedBy(10.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    options.colors.filter { it.hex.lowercase() !in used }.forEach { color ->
                        ColorDot(
                            color = colorFromHex(color.hex),
                            size = 28.dp,
                            selected = color.key == state.newColorKey,
                            onClick = { onUpdate { it.copy(newColorKey = color.key) } },
                        )
                    }
                }
            }
            if (state.dialog == ManageDialog.PaymentMethods && state.cards.isNotEmpty()) {
                Spacer(Modifier.height(8.dp))
                // Optional: first option = no card (cash, transfer...)
                val noCard = stringResource(R.string.dash_no_card)
                SelectField(
                    label = stringResource(R.string.dash_card_optional),
                    options = listOf<PaymentCard?>(null) + state.cards,
                    selected = state.cards.find { it.id == state.newCardId },
                    optionLabel = { card -> card?.let { "${it.bankName} •••• ${it.last4 ?: "----"}" } ?: noCard },
                    onSelect = { card -> onUpdate { it.copy(newCardId = card?.id) } },
                    placeholder = noCard,
                )
            }
            state.error?.let {
                Spacer(Modifier.height(8.dp))
                Text(stringResource(it), color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall)
            }
            Spacer(Modifier.height(12.dp))
            Button(onClick = onAdd, enabled = !state.isSaving && !state.isLoading, modifier = Modifier.fillMaxWidth()) {
                if (state.isSaving) CircularProgressIndicator(Modifier.size(18.dp), strokeWidth = 2.dp)
                else Text(stringResource(R.string.dash_add))
            }
            Spacer(Modifier.height(8.dp))
            Text(
                stringResource(R.string.dash_manage_web),
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }

        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End) {
            TextButton(onClick = onDismiss) { Text(stringResource(R.string.cards_close)) }
        }
    }
}

@FortisPreviews
@Composable
private fun DashboardManageDialogPreview() {
    FortisPreviewTheme {
        DashboardManageDialog(
            state = ManageState(ManageDialog.Categories, options = FakeRecordData.options(), isLoading = false),
            dashboards = FakeDashboardData.dashboards,
            activeDashboardId = FakeDashboardData.dashboards.first().id,
            onSelectDashboard = {}, onUpdate = {}, onAdd = {}, onDismiss = {},
        )
    }
}
