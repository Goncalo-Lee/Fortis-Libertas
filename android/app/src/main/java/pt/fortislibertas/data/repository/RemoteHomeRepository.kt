package pt.fortislibertas.data.repository

import pt.fortislibertas.data.model.HomeSummary
import pt.fortislibertas.data.remote.HomeApi
import retrofit2.HttpException
import java.io.IOException

/** API mode: GET /api/v1/home with the active account's Bearer token. */
class RemoteHomeRepository(
    private val api: HomeApi,
) : HomeRepository {

    override suspend fun getHome(): HomeSummary =
        try {
            api.getHome().toModel()
        } catch (e: HttpException) {
            if (e.code() == 401) throw SessionExpiredException() else throw e
        } catch (e: IOException) {
            throw NetworkException(e)
        }
}
