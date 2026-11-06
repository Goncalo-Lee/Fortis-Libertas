package pt.fortislibertas.data.remote

import kotlinx.coroutines.runBlocking
import okhttp3.Interceptor
import okhttp3.Response
import pt.fortislibertas.data.local.AccountStore

/**
 * Adds the active account's token to every request:
 *   Authorization: Bearer <token>
 *
 * OkHttp runs interceptors on a network thread, so the
 * runBlocking here does not block the UI.
 */
class AuthInterceptor(private val accountStore: AccountStore) : Interceptor {

    override fun intercept(chain: Interceptor.Chain): Response {
        val token = runBlocking { accountStore.activeToken() }

        val request = chain.request().newBuilder().apply {
            if (token != null) header("Authorization", "Bearer $token")
        }.build()

        val response = chain.proceed(request)

        // Better Auth bearer plugin: if the session is renewed, the new token comes in this header
        response.header("set-auth-token")?.let { newToken ->
            runBlocking { accountStore.updateActiveToken(newToken) }
        }

        return response
    }
}
