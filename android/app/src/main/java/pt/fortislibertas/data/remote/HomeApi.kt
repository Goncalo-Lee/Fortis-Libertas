package pt.fortislibertas.data.remote

import pt.fortislibertas.data.remote.dto.HomeDto
import retrofit2.http.GET

interface HomeApi {

    /** A single request with everything the Home needs. */
    @GET("api/v1/home")
    suspend fun getHome(): HomeDto
}
