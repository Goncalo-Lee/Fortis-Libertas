package pt.fortislibertas.data.remote

import kotlinx.coroutines.runBlocking
import okhttp3.Interceptor
import okhttp3.Response
import pt.fortislibertas.data.local.AccountStore

/**
 * Mete o token da conta ativa em todos os pedidos:
 *   Authorization: Bearer <token>
 *
 * O OkHttp corre os interceptors numa thread de rede, por isso o
 * runBlocking aqui não bloqueia a UI.
 */
class AuthInterceptor(private val accountStore: AccountStore) : Interceptor {

    override fun intercept(chain: Interceptor.Chain): Response {
        val token = runBlocking { accountStore.activeToken() }

        val request = chain.request().newBuilder().apply {
            if (token != null) header("Authorization", "Bearer $token")
        }.build()

        val response = chain.proceed(request)

        // Plugin bearer do Better Auth: se a sessão for renovada, o token novo vem neste header
        response.header("set-auth-token")?.let { newToken ->
            runBlocking { accountStore.updateActiveToken(newToken) }
        }

        return response
    }
}
