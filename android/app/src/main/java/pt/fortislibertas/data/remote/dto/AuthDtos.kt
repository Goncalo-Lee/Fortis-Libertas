package pt.fortislibertas.data.remote.dto

import kotlinx.serialization.Serializable
import pt.fortislibertas.data.model.SavedAccount

// ── Requests ────────────────────────────────────────────

/** Body of POST /api/auth/sign-in/email (Better Auth). */
@Serializable
data class SignInRequestDto(
    val email: String,
    val password: String,
    val rememberMe: Boolean,
)

/** Body of POST /api/auth/sign-up/email (Better Auth). The "Username" field is sent as name. */
@Serializable
data class SignUpRequestDto(
    val name: String,
    val email: String,
    val password: String,
)

// ── Responses ───────────────────────────────────────────

@Serializable
data class AuthUserDto(
    val id: String,
    val email: String,
    val name: String,
    val image: String? = null,
)

/** Response of sign-in and sign-up. The token also comes in the "set-auth-token" header. */
@Serializable
data class AuthResponseDto(
    val token: String? = null,
    val user: AuthUserDto,
) {
    fun toSavedAccount(token: String, remember: Boolean) = SavedAccount(
        id = user.id,
        fullName = user.name,
        email = user.email,
        imageUrl = user.image,
        token = token,
        remember = remember,
    )
}
