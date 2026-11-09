package pt.fortislibertas.ui.auth

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import pt.fortislibertas.R
import pt.fortislibertas.core.designsystem.components.SegmentedToggle
import pt.fortislibertas.core.designsystem.preview.FortisPreviewTheme
import pt.fortislibertas.core.designsystem.preview.FortisScreenPreviews
import pt.fortislibertas.core.designsystem.theme.CuriousBlue
import pt.fortislibertas.core.designsystem.theme.FortisTheme
import pt.fortislibertas.core.designsystem.theme.White
import pt.fortislibertas.ui.auth.components.AuthRememberMeSwitch
import pt.fortislibertas.ui.auth.components.AuthTextField

/**
 * Stateless Sign in / Sign up screen: logo on top and the light blue panel with the
 * Sign In | Sign Up toggle, the form of the chosen mode and the submit button.
 */
@Composable
fun AuthContent(
    state: AuthUiState,
    contentPadding: PaddingValues,
    onModeChange: (AuthMode) -> Unit,
    onNameChange: (String) -> Unit,
    onEmailChange: (String) -> Unit,
    onPasswordChange: (String) -> Unit,
    onConfirmPasswordChange: (String) -> Unit,
    onRememberMeChange: (Boolean) -> Unit,
    onSubmit: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val isSignUp = state.mode == AuthMode.SignUp
    val enabled = !state.isLoading
    fun error(field: AuthField): Int? = state.errors[field]

    Column(
        modifier = modifier
            .fillMaxSize()
            .imePadding(),                                  // the keyboard does not cover the fields
    ) {
        // ── Logo ──
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = contentPadding.calculateTopPadding())
                .padding(vertical = 48.dp),
            contentAlignment = Alignment.Center,
        ) {
            Image(
                painter = painterResource(R.drawable.ic_logo),
                contentDescription = stringResource(R.string.auth_logo_description),
                modifier = Modifier.size(width = 70.dp, height = 87.dp),
            )
        }

        // ── Panel (fills the rest of the screen, rounded on top; scrolls inside on small screens) ──
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .weight(1f)
                .background(
                    color = FortisTheme.colors.authPanel,
                    shape = RoundedCornerShape(topStart = 32.dp, topEnd = 32.dp),
                )
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 32.dp)
                .padding(top = 40.dp, bottom = contentPadding.calculateBottomPadding() + 32.dp),
            verticalArrangement = Arrangement.spacedBy(20.dp),
        ) {
            SegmentedToggle(
                options = listOf(stringResource(R.string.auth_sign_in), stringResource(R.string.auth_sign_up)),
                selectedIndex = state.mode.ordinal,
                onSelect = { onModeChange(AuthMode.entries[it]) },
            )

            Spacer(Modifier.height(if (isSignUp) 4.dp else 32.dp))

            if (isSignUp) {
                AuthTextField(
                    label = stringResource(R.string.auth_username),
                    value = state.name,
                    onValueChange = onNameChange,
                    errorText = error(AuthField.Name)?.let { stringResource(it) },
                    enabled = enabled,
                )
            }
            AuthTextField(
                label = stringResource(R.string.auth_email),
                value = state.email,
                onValueChange = onEmailChange,
                errorText = error(AuthField.Email)?.let { stringResource(it) },
                keyboardType = KeyboardType.Email,
                enabled = enabled,
            )
            AuthTextField(
                label = stringResource(R.string.auth_password),
                value = state.password,
                onValueChange = onPasswordChange,
                errorText = error(AuthField.Password)?.let { stringResource(it) },
                isPassword = true,
                imeAction = if (isSignUp) ImeAction.Next else ImeAction.Done,
                onImeAction = { if (!isSignUp) onSubmit() },
                enabled = enabled,
            )
            if (isSignUp) {
                AuthTextField(
                    label = stringResource(R.string.auth_confirm_password),
                    value = state.confirmPassword,
                    onValueChange = onConfirmPasswordChange,
                    errorText = error(AuthField.ConfirmPassword)?.let { stringResource(it) },
                    isPassword = true,
                    imeAction = ImeAction.Done,
                    onImeAction = onSubmit,
                    enabled = enabled,
                )
            } else {
                AuthRememberMeSwitch(
                    label = stringResource(R.string.auth_remember_me),
                    checked = state.rememberMe,
                    onCheckedChange = onRememberMeChange,
                    enabled = enabled,
                )
            }

            Spacer(Modifier.height(24.dp))

            state.formError?.let {
                Text(
                    text = stringResource(it),
                    color = MaterialTheme.colorScheme.error,
                    style = MaterialTheme.typography.bodyMedium,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.fillMaxWidth(),
                )
            }

            Button(
                onClick = onSubmit,
                enabled = enabled,
                shape = RoundedCornerShape(16.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = CuriousBlue,
                    contentColor = White,
                    disabledContainerColor = CuriousBlue.copy(alpha = 0.6f),
                    disabledContentColor = White,
                ),
                modifier = Modifier
                    .fillMaxWidth()
                    .height(56.dp),
            ) {
                if (state.isLoading) {
                    CircularProgressIndicator(color = White, strokeWidth = 2.dp, modifier = Modifier.size(22.dp))
                } else {
                    Text(
                        text = stringResource(if (isSignUp) R.string.auth_sign_up else R.string.auth_sign_in),
                        style = MaterialTheme.typography.titleMedium,
                    )
                }
            }
        }
    }
}

// ── Previews ────────────────────────────────────────────

@FortisScreenPreviews
@Composable
private fun AuthSignInPreview() {
    FortisPreviewTheme {
        AuthContent(
            state = AuthUiState(email = "ana.silva@example.com", password = "password"),
            contentPadding = PaddingValues(),
            onModeChange = {}, onNameChange = {}, onEmailChange = {}, onPasswordChange = {},
            onConfirmPasswordChange = {}, onRememberMeChange = {}, onSubmit = {},
        )
    }
}

@FortisScreenPreviews
@Composable
private fun AuthSignUpPreview() {
    FortisPreviewTheme {
        AuthContent(
            state = AuthUiState(
                mode = AuthMode.SignUp,
                name = "anasilva",
                email = "ana@",
                errors = mapOf(AuthField.Email to R.string.auth_error_email_invalid),
            ),
            contentPadding = PaddingValues(),
            onModeChange = {}, onNameChange = {}, onEmailChange = {}, onPasswordChange = {},
            onConfirmPasswordChange = {}, onRememberMeChange = {}, onSubmit = {},
        )
    }
}
