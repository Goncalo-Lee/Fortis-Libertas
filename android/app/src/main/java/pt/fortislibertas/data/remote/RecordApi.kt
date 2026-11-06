package pt.fortislibertas.data.remote

import pt.fortislibertas.data.remote.dto.CategoryDto
import pt.fortislibertas.data.remote.dto.CreateCategoryRequest
import pt.fortislibertas.data.remote.dto.CreateInstalmentPlanRequest
import pt.fortislibertas.data.remote.dto.CreateRecordRequest
import pt.fortislibertas.data.remote.dto.CreateTagRequest
import pt.fortislibertas.data.remote.dto.FormOptionsDto
import pt.fortislibertas.data.remote.dto.OptionDto
import pt.fortislibertas.data.remote.dto.TagDto
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST

/**
 * Register endpoints. The Bearer token comes from AuthInterceptor.
 * The server uses the user's active dashboard (see the note in SETUP).
 */
interface RecordApi {

    @GET("api/v1/records/form-options")
    suspend fun getFormOptions(): FormOptionsDto

    @POST("api/v1/records")
    suspend fun createRecord(@Body body: CreateRecordRequest)

    @POST("api/v1/instalment-plans")
    suspend fun createInstalmentPlan(@Body body: CreateInstalmentPlanRequest): OptionDto

    @POST("api/v1/tags")
    suspend fun createTag(@Body body: CreateTagRequest): TagDto

    @POST("api/v1/categories")
    suspend fun createCategory(@Body body: CreateCategoryRequest): CategoryDto
}