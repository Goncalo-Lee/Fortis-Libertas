package pt.fortislibertas.ui.auth.components

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Visibility
import androidx.compose.material.icons.outlined.VisibilityOff
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextField
import androidx.compose.material3.TextFieldDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import pt.fortislibertas.R
import pt.fortislibertas.core.designsystem.preview.FortisPreviewTheme
import pt.fortislibertas.core.designsystem.preview.FortisPreviews
import pt.fortislibertas.core.designsystem.theme.CuriousBlue

/**
 * Auth field from the wireframe: label on top and only a line underneath (no box).
 * With [isPassword] the text is hidden and an eye button shows/hides it.
 */
@Composable
fun AuthTextField(
    label: String,
    value: String,
    onValueChange: (String) -> Unit,
    modifier: Modifier = Modifier,
    errorText: String? = null,
    isPassword: Boolean = false,
    keyboardType: KeyboardType = KeyboardType.Text,
    imeAction: ImeAction = ImeAction.Next,
    onImeAction: () -> Unit = {},
    enabled: Boolean = true,
) {
    var visible by rememberSaveable { mutableStateOf(false) }
    val lineColor = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.8f)

    Column(modifier.fillMaxWidth()) {
        Text(
            text = label,
            style = MaterialTheme.typography.titleSmall,
            color = MaterialTheme.colorScheme.onSurface,
            modifier = Modifier.padding(start = 4.dp),
        )
        TextField(
            value = value,
            onValueChange = onValueChange,
            modifier = Modifier.fillMaxWidth(),
            enabled = enabled,
            singleLine = true,
            isError = errorText != null,
            supportingText = errorText?.let { { Text(it) } },
            visualTransformation =
                if (isPassword && !visible) PasswordVisualTransformation() else VisualTransformation.None,
            keyboardOptions = KeyboardOptions(
                keyboardType = if (isPassword) KeyboardType.Password else keyboardType,
                imeAction = imeAction,
            ),
            keyboardActions = KeyboardActions(onAny = { onImeAction() }),
            trailingIcon = if (isPassword) {
                {
                    IconButton(onClick = { visible = !visible }) {
                        Icon(
                            imageVector = if (visible) Icons.Outlined.VisibilityOff else Icons.Outlined.Visibility,
                            contentDescription = stringResource(
                                if (visible) R.string.auth_hide_password else R.string.auth_show_password,
                            ),
                        )
                    }
                }
            } else null,
            // Transparent box: only the bottom line is visible, like the wireframe
            colors = TextFieldDefaults.colors(
                focusedContainerColor = Color.Transparent,
                unfocusedContainerColor = Color.Transparent,
                disabledContainerColor = Color.Transparent,
                errorContainerColor = Color.Transparent,
                focusedIndicatorColor = CuriousBlue,
                unfocusedIndicatorColor = lineColor,
                cursorColor = CuriousBlue,
            ),
        )
    }
}

@FortisPreviews
@Composable
private fun AuthTextFieldPreview() {
    FortisPreviewTheme {
        Column(Modifier.padding(16.dp)) {
            AuthTextField(label = "Email", value = "ana@example.com", onValueChange = {})
            AuthTextField(label = "Password", value = "secret123", onValueChange = {}, isPassword = true)
            AuthTextField(label = "Email", value = "ana@", onValueChange = {}, errorText = "Invalid email")
        }
    }
}
