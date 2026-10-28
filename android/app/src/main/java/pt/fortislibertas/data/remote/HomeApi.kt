package pt.fortislibertas.data.remote

import pt.fortislibertas.data.remote.dto.HomeDto
import retrofit2.http.GET

interface HomeApi {

    /** Um só pedido com tudo o que o Home precisa. */
    @GET("api/v1/home")
    suspend fun getHome(): HomeDto
}
