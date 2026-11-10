package pt.fortislibertas.ui.cards.components

import android.os.Build
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.AcUnit
import androidx.compose.material.icons.outlined.CreditCard
import androidx.compose.material.icons.outlined.Settings
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.blur
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.luminance
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import pt.fortislibertas.R
import pt.fortislibertas.core.designsystem.components.colorFromHex
import pt.fortislibertas.core.designsystem.preview.FortisPreviewTheme
import pt.fortislibertas.core.designsystem.preview.FortisPreviews
import pt.fortislibertas.core.designsystem.theme.CodGray
import pt.fortislibertas.core.designsystem.theme.PaleSky
import pt.fortislibertas.core.designsystem.theme.White
import pt.fortislibertas.data.fake.FakeWalletData
import pt.fortislibertas.data.model.PaymentCard
import java.time.format.DateTimeFormatter

private val EXPIRY_FORMAT = DateTimeFormatter.ofPattern("MM/yy")

/**
 * One payment card from the wireframe: bank name on top, number and expiry date
 * and the round buttons in the bottom-left corner.
 *
 * Frozen: everything is blurred (Android 12+; older versions only get a darker layer)
 * and only the snowflake in the middle works, to unfreeze.
 * [onEdit] = null hides the edit button (no edit form yet).
 */
@Composable
fun CardsPaymentCard(
    card: PaymentCard,
    onFreeze: () -> Unit,
    onUnfreeze: () -> Unit,
    onShowInfo: () -> Unit,
    modifier: Modifier = Modifier,
    onEdit: (() -> Unit)? = null,
) {
    val cardColor = colorFromHex(card.colorHex)
    // Dark text on light cards (yellow), white text on dark cards (blue)
    val textColor = if (cardColor.luminance() > 0.5f) CodGray else White
    val active = !card.isFrozen

    Box(
        modifier = modifier
            .fillMaxWidth()
            .height(200.dp)
            .clip(RoundedCornerShape(28.dp))
            .background(cardColor),
    ) {
        // ── Card content (blurred when frozen) ──
        Box(Modifier.fillMaxSize().then(if (card.isFrozen) Modifier.blur(16.dp) else Modifier)) {
            Column(Modifier.fillMaxSize().padding(24.dp)) {
                Text(
                    text = card.bankName,
                    style = MaterialTheme.typography.headlineMedium,
                    color = textColor,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
                Spacer(Modifier.weight(1f))
                Row(horizontalArrangement = Arrangement.spacedBy(32.dp)) {
                    CardField(
                        label = stringResource(R.string.cards_number),
                        value = card.last4?.let { "•••• $it" } ?: "••••",
                        color = textColor,
                    )
                    CardField(
                        label = stringResource(R.string.cards_expiry),
                        value = card.expiryDate?.format(EXPIRY_FORMAT)?.let {
                            if (card.isExpired()) "$it · ${stringResource(R.string.cards_expired)}" else it
                        } ?: "--/--",
                        color = textColor,
                    )
                }
                Spacer(Modifier.height(12.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    if (card.canManage) {
                        CardsActionButton(Icons.Outlined.AcUnit, stringResource(R.string.cards_freeze), onFreeze, enabled = active)
                        if (onEdit != null) {
                            CardsActionButton(Icons.Outlined.Settings, stringResource(R.string.cards_edit), onEdit, enabled = active)
                        }
                    }
                    CardsActionButton(Icons.Outlined.CreditCard, stringResource(R.string.cards_info), onShowInfo, enabled = active)
                }
            }
        }

        // ── Frozen: darker layer + snowflake in the middle ──
        if (card.isFrozen) {
            val dim = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) 0.15f else 0.45f
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(Color.Black.copy(alpha = dim)),
                contentAlignment = Alignment.Center,
            ) {
                CardsActionButton(
                    icon = Icons.Outlined.AcUnit,
                    contentDescription = stringResource(R.string.cards_unfreeze),
                    onClick = onUnfreeze,
                    enabled = card.canManage,
                    size = 64.dp,
                    containerColor = PaleSky,
                )
            }
        }
    }
}

@Composable
private fun CardField(label: String, value: String, color: Color) {
    Column {
        Text(label, style = MaterialTheme.typography.labelMedium, color = color)
        Text(value, style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.SemiBold), color = color)
    }
}

@FortisPreviews
@Composable
private fun CardsPaymentCardPreview() {
    FortisPreviewTheme {
        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
            FakeWalletData.cards.forEach { card ->
                CardsPaymentCard(card = card, onFreeze = {}, onUnfreeze = {}, onShowInfo = {}, onEdit = {})
            }
        }
    }
}
