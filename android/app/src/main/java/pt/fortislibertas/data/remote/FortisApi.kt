package pt.fortislibertas.data.remote

import kotlinx.serialization.json.JsonObject
import pt.fortislibertas.data.remote.dto.ItemResponseDto
import pt.fortislibertas.data.remote.dto.MeDto
import pt.fortislibertas.data.remote.dto.ProfileDto
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

    /** Same endpoint as getMe, in the API format (snake_case + "data"), for Edit account. */
    @GET("api/v1/me")
    suspend fun getMeDetails(): ItemResponseDto<MeDto>

    /**
     * PATCH bodies are JSON objects built by hand: only changed fields are sent,
     * and a field sent as null clears it (a data class would drop the nulls).
     */
    @PATCH("api/v1/me")
    suspend fun updateMe(@Body body: JsonObject)

    /** Changes only the fields that are sent (endpoints.md §3.5). */
    @PATCH("api/v1/me/profile")
    suspend fun updateMyProfile(@Body body: JsonObject)

    /** Better Auth endpoint: invalidates the session of the current token. */
    @POST("api/auth/sign-out")
    suspend fun signOut()
}
