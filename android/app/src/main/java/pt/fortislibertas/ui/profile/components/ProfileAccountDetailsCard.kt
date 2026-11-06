package pt.fortislibertas.ui.profile.components

import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import pt.fortislibertas.R
import pt.fortislibertas.core.designsystem.components.FortisCard
import pt.fortislibertas.core.designsystem.components.LabeledValue
import pt.fortislibertas.core.designsystem.preview.FortisPreviews
import pt.fortislibertas.core.designsystem.theme.FortisLibertasTheme
import pt.fortislibertas.core.designsystem.util.MoneyFormatter
import pt.fortislibertas.data.fake.FakeAccountData
import pt.fortislibertas.data.model.UserProfile

/** Card with the account name, id, balance and amount saved. */
@Composable
fun ProfileAccountDetailsCard(profile: UserProfile) {
    FortisCard {
        Text(stringResource(R.string.profile_account_details), style = MaterialTheme.typography.titleMedium)
        HorizontalDivider(Modifier.padding(vertical = 12.dp))
        Text(profile.fullName, style = MaterialTheme.typography.bodyLarge)
        Text(
            text = stringResource(R.string.profile_account_id, profile.id),
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
        )
        Spacer(Modifier.height(16.dp))
        Row(Modifier.fillMaxWidth()) {
            LabeledValue(
                label = stringResource(R.string.profile_balance),
                value = MoneyFormatter.format(profile.accountBalance, profile.currency),
                modifier = Modifier.weight(1f),
            )
            LabeledValue(
                label = stringResource(R.string.profile_saved),
                value = MoneyFormatter.format(profile.amountSaved, profile.currency),
                modifier = Modifier.weight(1f),
            )
        }
    }
}

@FortisPreviews
@Composable
private fun ProfileAccountDetailsCardPreview() {
    FortisLibertasTheme {
        ProfileAccountDetailsCard(profile = FakeAccountData.profiles.values.first())
    }
}
