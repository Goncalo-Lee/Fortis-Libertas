package pt.fortislibertas.ui.cards.components

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.AcUnit
import androidx.compose.material.icons.outlined.AccountBalance
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import pt.fortislibertas.R
import pt.fortislibertas.core.designsystem.components.FortisCard
import pt.fortislibertas.core.designsystem.components.IconTile
import pt.fortislibertas.core.designsystem.preview.FortisPreviewTheme
import pt.fortislibertas.core.designsystem.preview.FortisPreviews
import pt.fortislibertas.core.designsystem.util.MoneyFormatter
import pt.fortislibertas.data.fake.FakeWalletData
import pt.fortislibertas.data.model.BankAccount

/**
 * One bank account on the Banks page: name, the user's role and the balance.
 * Tapping it opens the bank details (with the members).
 */
@Composable
fun CardsBankItem(bank: BankAccount, onClick: () -> Unit, modifier: Modifier = Modifier) {
    FortisCard(modifier = modifier, onClick = onClick) {
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            IconTile(
                icon = Icons.Outlined.AccountBalance,
                containerColor = MaterialTheme.colorScheme.secondary,
                contentColor = MaterialTheme.colorScheme.onSecondary,
            )
            Column(Modifier.weight(1f)) {
                Text(bank.name, style = MaterialTheme.typography.titleMedium, maxLines = 1, overflow = TextOverflow.Ellipsis)
                Text(
                    text = stringResource(if (bank.isOwner) R.string.banks_role_owner else R.string.banks_role_member),
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
            if (bank.isFrozen) {
                Icon(
                    Icons.Outlined.AcUnit,
                    contentDescription = stringResource(R.string.cards_status_frozen),
                    tint = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
            Text(MoneyFormatter.format(bank.balance, bank.currency), style = MaterialTheme.typography.titleMedium)
        }
    }
}

@FortisPreviews
@Composable
private fun CardsBankItemPreview() {
    FortisPreviewTheme {
        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            FakeWalletData.banks.forEach { CardsBankItem(it, onClick = {}) }
        }
    }
}
