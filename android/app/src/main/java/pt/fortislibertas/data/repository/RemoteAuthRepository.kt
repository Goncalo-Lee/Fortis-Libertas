package pt.fortislibertas.data.repository

import kotlinx.coroutines.CancellationException
import pt.fortislibertas.data.model.SavedAccount
import pt.fortislibertas.data.remote.AuthApi
import pt.fortislibertas.data.remote.dto.AuthResponseDto
import pt.fortislibertas.data.remote.dto.SignInRequestDto
import pt.fortislibertas.data.remote.dto.SignUpRequestDto
import retrofit2.Response
import java.io.IOException

/** API mode: Better Auth email + password. */
class RemoteAuthRepository(
    private val api: AuthApi,
) : AuthRepository {

    override suspend fun signIn(email: String, password: String, remember: Boolean): SavedAccount =
        call(remember, onError = { code -> if (code == 401) InvalidCredentialsException() else httpError(code) }) {
            api.signIn(SignInRequestDto(email = email.trim(), password = password, rememberMe = remember))
        }

    override suspend fun signUp(name: String, email: String, password: String, remember: Boolean): SavedAccount =
        // Better Auth answers 422 (USER_ALREADY_EXISTS) when the email is taken
        call(remember, onError = { code -> if (code == 422 || code == 400) EmailTakenException() else httpError(code) }) {
            api.signUp(SignUpRequestDto(name = name.trim(), email = email.trim(), password = password))
        }

    private suspend fun call(
        remember: Boolean,
        onError: (code: Int) -> Exception,
        block: suspend () -> Response<AuthResponseDto>,
    ): SavedAccount {
        val response = try {
            block()
        } catch (e: CancellationException) {
            throw e
        } catch (e: IOException) {
            throw NetworkException(e)
        }
        val body = response.body()
        if (!response.isSuccessful || body == null) throw onError(response.code())

        // The header is the official place for the token (bearer plugin); the body is a fallback
        val token = response.headers()["set-auth-token"] ?: body.token
            ?: throw IllegalStateException("No session token in the response")
        return body.toSavedAccount(token, remember)
    }

    private fun httpError(code: Int) = IllegalStateException("Unexpected HTTP $code")
}
