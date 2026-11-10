package pt.fortislibertas.data.remote

import pt.fortislibertas.data.remote.dto.FilterOptionsDto
import pt.fortislibertas.data.remote.dto.ItemResponseDto
import pt.fortislibertas.data.remote.dto.RecordDetailDto
import pt.fortislibertas.data.remote.dto.TransactionListDto
import retrofit2.http.DELETE
import retrofit2.http.GET
import retrofit2.http.Path
import retrofit2.http.Query

interface TransactionApi {

    /**
     * Filtered list. Null parameters are not sent.
     * Lists are comma-separated: categoryIds=a,b,c
     */
    @GET("api/v1/records")
    suspend fun getRecords(
        @Query("search") search: String?,
        @Query("type") type: String?,
        @Query("categoryIds") categoryIds: String?,
        @Query("tagIds") tagIds: String?,
        @Query("minAmount") minAmount: String?,
        @Query("maxAmount") maxAmount: String?,
    ): TransactionListDto

    @GET("api/v1/records/filter-options")
    suspend fun getFilterOptions(): FilterOptionsDto

    /** One record with the names of its category, payment method and plan (§15). */
    @GET("api/v1/dashboards/{dashboard_id}/financial-records/{record_id}")
    suspend fun getRecord(
        @Path("dashboard_id") dashboardId: String,
        @Path("record_id") recordId: String,
        @Query("include") include: String = "category,payment_method,installment_plan",
    ): ItemResponseDto<RecordDetailDto>

    /** Soft delete (§15). */
    @DELETE("api/v1/dashboards/{dashboard_id}/financial-records/{record_id}")
    suspend fun deleteRecord(
        @Path("dashboard_id") dashboardId: String,
        @Path("record_id") recordId: String,
    )
}