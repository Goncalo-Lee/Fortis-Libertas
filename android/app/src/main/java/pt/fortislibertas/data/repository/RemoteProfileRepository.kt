package pt.fortislibertas.data.repository

import kotlinx.coroutines.CancellationException
import pt.fortislibertas.data.model.UserProfile
import pt.fortislibertas.data.remote.FortisApi
import retrofit2.HttpException
import java.io.IOException

/** Modo API: fala com o Next.js usando o token Bearer da conta ativa. */
class RemoteProfileRepository(
    private val api: FortisApi,
) : ProfileRepository {

    override suspend fun getProfile(): UserProfile = call { api.getMe().toModel() }

    override suspend fun deactivateAccount() = call { api.deactivateMe() }

    override suspend fun deleteAccount() = call { api.deleteMe() }

    /** Termina sessão mesmo sem rede: o token é apagado localmente na mesma. */
    override suspend fun signOut() {
        try {
            api.signOut()
        } catch (e: CancellationException) {
            throw e
        } catch (_: Exception) {
            // Sem rede ou sessão já expirada: não impede a saída local
        }
    }

    /** Converte os erros do Retrofit/OkHttp nos erros que a UI conhece. */
    private suspend fun <T> call(block: suspend () -> T): T =
        try {
            block()
        } catch (e: HttpException) {
            if (e.code() == 401) throw SessionExpiredException() else throw e
        } catch (e: IOException) {
            throw NetworkException(e)
        }
}
