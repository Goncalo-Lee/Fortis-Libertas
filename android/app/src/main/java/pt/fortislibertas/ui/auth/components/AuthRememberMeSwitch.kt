package pt.fortislibertas.ui.auth.components

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.selection.toggleable
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.unit.dp
import pt.fortislibertas.core.designsystem.components.FortisSwitch
import pt.fortislibertas.core.designsystem.preview.FortisPreviewTheme
import pt.fortislibertas.core.designsystem.preview.FortisPreviews

/** "Remember me" label + [FortisSwitch]. The whole row is clickable, not only the switch. */
@Composable
fun AuthRememberMeSwitch(
    label: String,
    checked: Boolean,
    onCheckedChange: (Boolean) -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
) {
    Row(
        modifier = modifier.toggleable(
            value = checked,
            enabled = enabled,
            role = Role.Switch,
            onValueChange = onCheckedChange,
        ),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        Text(
            text = label,
            style = MaterialTheme.typography.titleSmall,
            color = MaterialTheme.colorScheme.onSurface,
        )
        FortisSwitch(checked = checked, onCheckedChange = null, enabled = enabled)  // the Row handles the click
    }
}

@FortisPreviews
@Composable
private fun AuthRememberMeSwitchPreview() {
    FortisPreviewTheme {
        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            AuthRememberMeSwitch(label = "Remember me", checked = false, onCheckedChange = {})
            AuthRememberMeSwitch(label = "Remember me", checked = true, onCheckedChange = {})
        }
    }
}
