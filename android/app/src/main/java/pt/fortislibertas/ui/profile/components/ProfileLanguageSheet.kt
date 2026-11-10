package pt.fortislibertas.ui.profile.components

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.selection.selectable
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.RadioButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.unit.dp
import pt.fortislibertas.R
import pt.fortislibertas.core.designsystem.preview.FortisPreviewTheme
import pt.fortislibertas.core.designsystem.preview.FortisPreviews
import pt.fortislibertas.data.model.AppLanguage

/** Sheet to choose the app language. */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProfileLanguageSheet(
    selected: AppLanguage,
    onSelect: (AppLanguage) -> Unit,
    onDismiss: () -> Unit,
) {
    ModalBottomSheet(onDismissRequest = onDismiss) {
        ProfileLanguageOptions(selected = selected, onSelect = onSelect)
    }
}

@Composable
private fun ProfileLanguageOptions(selected: AppLanguage, onSelect: (AppLanguage) -> Unit) {
    Column(Modifier.padding(start = 20.dp, end = 20.dp, bottom = 32.dp)) {
        Text(stringResource(R.string.profile_language), style = MaterialTheme.typography.titleLarge)
        Spacer(Modifier.height(8.dp))
        AppLanguage.entries.forEach { language ->
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .selectable(
                        selected = language == selected,
                        role = Role.RadioButton,
                        onClick = { onSelect(language) },
                    )
                    .padding(vertical = 10.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                RadioButton(selected = language == selected, onClick = null)
                Spacer(Modifier.size(12.dp))
                Text(language.displayName(), style = MaterialTheme.typography.bodyLarge)
            }
        }
    }
}

@FortisPreviews
@Composable
private fun ProfileLanguageOptionsPreview() {
    FortisPreviewTheme {
        ProfileLanguageOptions(selected = AppLanguage.Portuguese, onSelect = {})
    }
}
