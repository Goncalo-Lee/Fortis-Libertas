package pt.fortislibertas.data.remote

import pt.fortislibertas.data.remote.dto.CategoryRefDto
import pt.fortislibertas.data.remote.dto.DashboardDto
import pt.fortislibertas.data.remote.dto.ItemResponseDto
import pt.fortislibertas.data.remote.dto.ListResponseDto
import pt.fortislibertas.data.remote.dto.RecordTypeDto
import pt.fortislibertas.data.remote.dto.ReportSummaryDto
import retrofit2.http.GET
import retrofit2.http.Path
import retrofit2.http.Query

/** Dashboards and their reports (endpoints.md §8, §10, §11 and §16). */
interface DashboardApi {

    @GET("api/v1/dashboards")
    suspend fun getDashboards(@Query("per_page") perPage: Int = 100): ListResponseDto<DashboardDto>

    /** Totals grouped by record_type, category or month. Dates: ISO, inclusive, max 366 days. */
    @GET("api/v1/dashboards/{dashboard_id}/reports/summary")
    suspend fun getSummary(
        @Path("dashboard_id") dashboardId: String,
        @Query("payment_date_from") from: String,
        @Query("payment_date_to") to: String,
        @Query("group_by") groupBy: String,
    ): ItemResponseDto<ReportSummaryDto>

    @GET("api/v1/dashboards/{dashboard_id}/record-types")
    suspend fun getRecordTypes(
        @Path("dashboard_id") dashboardId: String,
        @Query("per_page") perPage: Int = 100,
    ): ListResponseDto<RecordTypeDto>

    @GET("api/v1/dashboards/{dashboard_id}/categories")
    suspend fun getCategories(
        @Path("dashboard_id") dashboardId: String,
        @Query("per_page") perPage: Int = 100,
    ): ListResponseDto<CategoryRefDto>
}
