package pt.fortislibertas.data.remote

import pt.fortislibertas.data.remote.dto.ProfileDto
import retrofit2.http.DELETE
import retrofit2.http.GET
import retrofit2.http.POST

/**
 * Endpoints da API Next.js. O header "Authorization: Bearer <token>"
 * é acrescentado pelo AuthInterceptor, por isso não aparece aqui.
 */
interface FortisApi {

    @GET("api/v1/me")
    suspend fun getMe(): ProfileDto

    /** Suspende a conta (preenche suspended_at). */
    @POST("api/v1/me/deactivate")
    suspend fun deactivateMe()

    /** Soft delete (preenche deleted_at; recuperável durante 30 dias). */
    @DELETE("api/v1/me")
    suspend fun deleteMe()

    /** Endpoint do Better Auth: invalida a sessão do token atual. */
    @POST("api/auth/sign-out")
    suspend fun signOut()
}
