package pt.fortislibertas.ui.profile.components

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.size
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Contrast
import androidx.compose.material.icons.outlined.Language
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import pt.fortislibertas.R
import pt.fortislibertas.core.designsystem.components.ActionRow
import pt.fortislibertas.core.designsystem.components.SegmentedToggle
import pt.fortislibertas.core.designsystem.preview.FortisPreviewTheme
import pt.fortislibertas.core.designsystem.preview.FortisPreviews
import pt.fortislibertas.data.model.AppLanguage
import pt.fortislibertas.data.model.ThemeMode

/** "Preferences" section of the Profile: light/dark mode and language. */
@Composable
fun ProfilePreferences(
    themeMode: ThemeMode,
    language: AppLanguage,
    onThemeModeChange: (ThemeMode) -> Unit,
    onOpenLanguage: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Column(modifier, verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Text(
            text = stringResource(R.string.profile_section_preferences),
            style = MaterialTheme.typography.titleSmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )

        // Appearance: the 3 options are always visible, so it is one tap to change
        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Outlined.Contrast, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                Spacer(Modifier.size(12.dp))
                Text(stringResource(R.string.profile_appearance), style = MaterialTheme.typography.bodyLarge)
            }
            SegmentedToggle(
                options = listOf(
                    stringResource(R.string.profile_theme_system),
                    stringResource(R.string.profile_theme_light),
                    stringResource(R.string.profile_theme_dark),
                ),
                selectedIndex = themeMode.ordinal,
                onSelect = { onThemeModeChange(ThemeMode.entries[it]) },
                height = 44.dp,
            )
        }

        ActionRow(
            icon = Icons.Outlined.Language,
            title = stringResource(R.string.profile_language),
            description = language.displayName(),
            onClick = onOpenLanguage,
        )
    }
}

/** Each language is written in its own language, so anyone can find theirs. */
fun AppLanguage.displayName(): String = when (this) {
    AppLanguage.Portuguese -> "Português"
    AppLanguage.English -> "English"
}

@FortisPreviews
@Composable
private fun ProfilePreferencesPreview() {
    FortisPreviewTheme {
        ProfilePreferences(
            themeMode = ThemeMode.System,
            language = AppLanguage.Portuguese,
            onThemeModeChange = {},
            onOpenLanguage = {},
        )
    }
}
