package pt.fortislibertas.ui.profile.components

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Edit
import androidx.compose.material.icons.outlined.SwapHoriz
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedIconButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import pt.fortislibertas.R
import pt.fortislibertas.core.designsystem.components.UserAvatar
import pt.fortislibertas.core.designsystem.preview.FortisPreviews
import pt.fortislibertas.core.designsystem.theme.FortisLibertasTheme
import pt.fortislibertas.data.fake.FakeAccountData
import pt.fortislibertas.data.model.UserProfile

/** Title with the edit button, followed by the avatar, name, email and the switch account button. */
@Composable
fun ProfileHeader(
    profile: UserProfile,
    onEditProfile: () -> Unit,
    onSwitchAccount: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Column(
        modifier = modifier.fillMaxWidth(),
        verticalArrangement = Arrangement.spacedBy(12.dp),   // same spacing as the parent column
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text(
                text = stringResource(R.string.profile_title),
                style = MaterialTheme.typography.headlineSmall,
                modifier = Modifier.weight(1f),
            )
            OutlinedIconButton(onClick = onEditProfile, shape = RoundedCornerShape(12.dp)) {
                Icon(Icons.Outlined.Edit, contentDescription = stringResource(R.string.profile_edit))
            }
        }

        Column(
            modifier = Modifier.fillMaxWidth(),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            UserAvatar(
                name = profile.fullName,
                imageUrl = profile.imageUrl,
                size = 112.dp,
                contentDescription = stringResource(R.string.avatar_description),
            )
            Text(
                text = profile.fullName,
                style = MaterialTheme.typography.headlineMedium,
                textAlign = TextAlign.Center,
            )
            Text(
                text = listOfNotNull(profile.email, profile.userName).joinToString("  |  "),
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                textAlign = TextAlign.Center,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
            )
            OutlinedButton(
                onClick = onSwitchAccount,
                contentPadding = ButtonDefaults.ButtonWithIconContentPadding,
            ) {
                Icon(Icons.Outlined.SwapHoriz, contentDescription = null, modifier = Modifier.size(18.dp))
                Spacer(Modifier.size(8.dp))
                Text(stringResource(R.string.profile_switch_account))
            }
        }
    }
}

@FortisPreviews
@Composable
private fun ProfileHeaderPreview() {
    FortisLibertasTheme {
        ProfileHeader(profile = FakeAccountData.profiles.values.first(), onEditProfile = {}, onSwitchAccount = {})
    }
}
