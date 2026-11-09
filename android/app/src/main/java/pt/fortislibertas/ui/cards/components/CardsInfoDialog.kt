package pt.fortislibertas.ui.cards.components

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import pt.fortislibertas.R
import pt.fortislibertas.core.designsystem.components.BlurDialog
import pt.fortislibertas.core.designsystem.components.LabeledValue
import pt.fortislibertas.core.designsystem.preview.FortisPreviewTheme
import pt.fortislibertas.core.designsystem.preview.FortisPreviews
import pt.fortislibertas.data.fake.FakeWalletData
import pt.fortislibertas.data.model.CardType
import pt.fortislibertas.data.model.PaymentCard
import java.time.format.DateTimeFormatter

/** Dialog of the 💳 button: the card data, read only (number and CVV are never available). */
@Composable
fun CardsInfoDialog(card: PaymentCard, onDismiss: () -> Unit) {
    BlurDialog(onDismissRequest = onDismiss) {
        Text(stringResource(R.string.cards_info), style = MaterialTheme.typography.titleLarge)
        Spacer(Modifier.height(16.dp))

        InfoRow(
            stringResource(R.string.cards_info_bank) to card.bankName,
            stringResource(R.string.cards_info_holder) to card.cardholderName,
        )
        Spacer(Modifier.height(12.dp))
        InfoRow(
            stringResource(R.string.cards_number) to (card.last4?.let { "•••• $it" } ?: "••••"),
            stringResource(R.string.cards_expiry) to
                (card.expiryDate?.format(DateTimeFormatter.ofPattern("MM/yyyy")) ?: "--/----"),
        )
        Spacer(Modifier.height(12.dp))
        InfoRow(
            stringResource(R.string.cards_info_type) to stringResource(
                if (card.type == CardType.CREDIT) R.string.cards_type_credit else R.string.cards_type_debit,
            ),
            stringResource(R.string.cards_info_status) to stringResource(
                when {
                    card.isFrozen -> R.string.cards_status_frozen
                    card.isExpired() -> R.string.cards_expired
                    else -> R.string.cards_status_active
                },
            ),
        )

        Spacer(Modifier.height(16.dp))
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End) {
            TextButton(onClick = onDismiss) { Text(stringResource(R.string.cards_close)) }
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

@FortisPreviews
@Composable
private fun CardsInfoDialogPreview() {
    FortisPreviewTheme {
        CardsInfoDialog(card = FakeWalletData.cards.first(), onDismiss = {})
    }
}
