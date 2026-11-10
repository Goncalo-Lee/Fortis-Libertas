package pt.fortislibertas.ui.cards.components

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import pt.fortislibertas.R
import pt.fortislibertas.core.designsystem.components.BlurDialog
import pt.fortislibertas.core.designsystem.components.LabeledValue
import pt.fortislibertas.core.designsystem.components.UserAvatar
import pt.fortislibertas.core.designsystem.preview.FortisPreviewTheme
import pt.fortislibertas.core.designsystem.preview.FortisPreviews
import pt.fortislibertas.core.designsystem.util.MoneyFormatter
import pt.fortislibertas.data.fake.FakeWalletData
import pt.fortislibertas.data.model.BankMember
import pt.fortislibertas.ui.cards.BankDetailState

/**
 * Details of one bank account, like the transaction details: data in pairs and the
 * members list. Members are read only — managing them is done on the website.
 */
@Composable
fun CardsBankDetailDialog(state: BankDetailState, cardCount: Int, onDismiss: () -> Unit) {
    val bank = state.bank
    BlurDialog(onDismissRequest = onDismiss) {
        Text(bank.name, style = MaterialTheme.typography.titleLarge)
        Spacer(Modifier.height(8.dp))
        Text(
            text = MoneyFormatter.format(bank.balance, bank.currency),
            style = MaterialTheme.typography.headlineMedium.copy(fontWeight = FontWeight.Bold),
        )
        Spacer(Modifier.height(16.dp))

        Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
            InfoRow(
                stringResource(R.string.banks_detail_role) to roleLabel(if (bank.isOwner) "owner" else if (bank.canAddCards) "editor" else "viewer"),
                stringResource(R.string.banks_detail_status) to stringResource(
                    if (bank.isFrozen) R.string.cards_status_frozen else R.string.cards_status_active,
                ),
            )
            InfoRow(
                stringResource(R.string.banks_field_currency) to bank.currency,
                stringResource(R.string.banks_detail_cards) to cardCount.toString(),
            )
        }

        // ── Members (read only) ──
        Spacer(Modifier.height(16.dp))
        HorizontalDivider()
        Spacer(Modifier.height(12.dp))
        Text(stringResource(R.string.banks_detail_members), style = MaterialTheme.typography.titleMedium)
        Spacer(Modifier.height(8.dp))
        when {
            state.isLoading -> LinearProgressIndicator(Modifier.fillMaxWidth())
            state.error != null -> Text(
                stringResource(state.error),
                color = MaterialTheme.colorScheme.error,
                style = MaterialTheme.typography.bodySmall,
            )
            else -> Column(
                // Many members: the list scrolls, the buttons stay visible
                modifier = Modifier
                    .heightIn(max = 240.dp)
                    .verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                state.members.forEach { MemberRow(it) }
            }
        }
        Spacer(Modifier.height(8.dp))
        Text(
            stringResource(R.string.banks_members_web),
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )

        Spacer(Modifier.height(8.dp))
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End) {
            TextButton(onClick = onDismiss) { Text(stringResource(R.string.cards_close)) }
        }
    }
}

@Composable
private fun MemberRow(member: BankMember) {
    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
        UserAvatar(name = member.fullName, imageUrl = member.imageUrl, size = 36.dp)
        Column(Modifier.weight(1f)) {
            Text(member.fullName, style = MaterialTheme.typography.bodyLarge, maxLines = 1, overflow = TextOverflow.Ellipsis)
            member.userName?.let {
                Text("@$it", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
        }
        Text(roleLabel(member.role), style = MaterialTheme.typography.labelLarge, color = MaterialTheme.colorScheme.onSurfaceVariant)
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

/** API role key → text. */
@Composable
private fun roleLabel(role: String): String = stringResource(
    when (role) {
        "owner" -> R.string.banks_role_owner
        "editor" -> R.string.banks_role_editor
        else -> R.string.banks_role_viewer
    },
)

@FortisPreviews
@Composable
private fun CardsBankDetailDialogPreview() {
    FortisPreviewTheme {
        CardsBankDetailDialog(
            state = BankDetailState(
                bank = FakeWalletData.banks.first(),
                members = FakeWalletData.members.getValue("bank-1"),
                isLoading = false,
            ),
            cardCount = 2,
            onDismiss = {},
        )
    }
}
