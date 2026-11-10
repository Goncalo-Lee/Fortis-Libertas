package pt.fortislibertas.data.remote

import pt.fortislibertas.data.remote.dto.ProfileDto
import pt.fortislibertas.data.remote.dto.UpdateProfileRequestDto
import retrofit2.http.Body
import retrofit2.http.DELETE
import retrofit2.http.GET
import retrofit2.http.PATCH
import retrofit2.http.POST

/**
 * Next.js API endpoints. The "Authorization: Bearer <token>" header
 * is added by AuthInterceptor, so it does not appear here.
 */
interface FortisApi {

    @GET("api/v1/me")
    suspend fun getMe(): ProfileDto

    /** Suspends the account (fills suspended_at). */
    @POST("api/v1/me/deactivate")
    suspend fun deactivateMe()

    /** Soft delete (fills deleted_at; recoverable for 30 days). */
    @DELETE("api/v1/me")
    suspend fun deleteMe()

    /** Changes only the fields that are sent (endpoints.md §3.5). */
    @PATCH("api/v1/me/profile")
    suspend fun updateMyProfile(@Body body: UpdateProfileRequestDto)

    /** Better Auth endpoint: invalidates the session of the current token. */
    @POST("api/auth/sign-out")
    suspend fun signOut()
}
