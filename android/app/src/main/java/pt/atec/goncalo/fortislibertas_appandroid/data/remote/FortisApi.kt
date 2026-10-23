package pt.atec.goncalo.fortislibertas_appandroid.data.remote

import pt.atec.goncalo.fortislibertas_appandroid.data.remote.dto.CategoryDto
import pt.atec.goncalo.fortislibertas_appandroid.data.remote.dto.FinancialRecordDto
import retrofit2.http.Body
import retrofit2.http.DELETE
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.PUT
import retrofit2.http.Path

interface FortisApi {

    @GET("records")
    suspend fun getRecords(): List<FinancialRecordDto>

    @GET("categories")
    suspend fun getCategories(): List<CategoryDto>

    @POST("records")
    suspend fun createRecord(@Body body: FinancialRecordDto): FinancialRecordDto

    @PUT("records/{id}")
    suspend fun updateRecord(@Path("id") id: Long, @Body body: FinancialRecordDto): FinancialRecordDto

    @DELETE("records/{id}")
    suspend fun deleteRecord(@Path("id") id: Long)
}
