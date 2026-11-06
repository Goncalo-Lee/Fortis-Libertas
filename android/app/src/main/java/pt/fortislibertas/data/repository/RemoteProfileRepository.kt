package pt.fortislibertas.data.repository

import kotlinx.coroutines.CancellationException
import pt.fortislibertas.data.model.UserProfile
import pt.fortislibertas.data.remote.FortisApi
import retrofit2.HttpException
import java.io.IOException

/** API mode: talks to Next.js using the active account's Bearer token. */
class RemoteProfileRepository(
    private val api: FortisApi,
) : ProfileRepository {

    override suspend fun getProfile(): UserProfile = call { api.getMe().toModel() }

    override suspend fun deactivateAccount() = call { api.deactivateMe() }

    override suspend fun deleteAccount() = call { api.deleteMe() }

    /** Signs out even without network: the token is deleted locally anyway. */
    override suspend fun signOut() {
        try {
            api.signOut()
        } catch (e: CancellationException) {
            throw e
        } catch (_: Exception) {
            // No network or session already expired: does not block the local sign out
        }
    }

    /** Turns Retrofit/OkHttp errors into the errors the UI knows. */
    private suspend fun <T> call(block: suspend () -> T): T =
        try {
            block()
        } catch (e: HttpException) {
            if (e.code() == 401) throw SessionExpiredException() else throw e
        } catch (e: IOException) {
            throw NetworkException(e)
        }
}
