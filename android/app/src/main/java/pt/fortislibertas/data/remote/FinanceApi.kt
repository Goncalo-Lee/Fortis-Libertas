package pt.fortislibertas.data.remote

import pt.fortislibertas.data.remote.dto.BalanceDto
import pt.fortislibertas.data.remote.dto.CatalogColorDto
import pt.fortislibertas.data.remote.dto.CategoryApiDto
import pt.fortislibertas.data.remote.dto.CreateCategoryDto
import pt.fortislibertas.data.remote.dto.CreateFinancialRecordDto
import pt.fortislibertas.data.remote.dto.CreateInstallmentPlanDto
import pt.fortislibertas.data.remote.dto.CreatePaymentMethodRequestDto
import pt.fortislibertas.data.remote.dto.CreateTagDto
import pt.fortislibertas.data.remote.dto.CurrencyDto
import pt.fortislibertas.data.remote.dto.FinancialRecordDto
import pt.fortislibertas.data.remote.dto.HomeResponseDto
import pt.fortislibertas.data.remote.dto.IconDto
import pt.fortislibertas.data.remote.dto.InstallmentPlanApiDto
import pt.fortislibertas.data.remote.dto.ItemResponseDto
import pt.fortislibertas.data.remote.dto.ListResponseDto
import pt.fortislibertas.data.remote.dto.PaymentMethodDto
import pt.fortislibertas.data.remote.dto.RecordDetailDto
import pt.fortislibertas.data.remote.dto.RecordTypeDto
import pt.fortislibertas.data.remote.dto.TagApiDto
import retrofit2.http.Body
import retrofit2.http.DELETE
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Path
import retrofit2.http.Query

/**
 * Dashboard data used by Home, Transactions and New record (endpoints.md §10–§18).
 * Every path is under /api/v1/dashboards/{dashboard_id}, except the global catalogs.
 * Multi-value filters go comma-separated (record_type_id=a,b).
 */
interface FinanceApi {

    // ── Home and balance ──

    @GET("api/v1/dashboards/{dashboard_id}/home")
    suspend fun getHome(@Path("dashboard_id") dashboardId: String): ItemResponseDto<HomeResponseDto>

    @GET("api/v1/dashboards/{dashboard_id}/balance")
    suspend fun getBalance(@Path("dashboard_id") dashboardId: String): ItemResponseDto<BalanceDto>

    // ── Lists of the dashboard ──

    @GET("api/v1/dashboards/{dashboard_id}/record-types")
    suspend fun getRecordTypes(
        @Path("dashboard_id") dashboardId: String,
        @Query("per_page") perPage: Int = 100,
    ): ListResponseDto<RecordTypeDto>

    @GET("api/v1/dashboards/{dashboard_id}/categories")
    suspend fun getCategories(
        @Path("dashboard_id") dashboardId: String,
        @Query("per_page") perPage: Int = 100,
    ): ListResponseDto<CategoryApiDto>

    @GET("api/v1/dashboards/{dashboard_id}/tags")
    suspend fun getTags(
        @Path("dashboard_id") dashboardId: String,
        @Query("include") include: String = "categories",
        @Query("per_page") perPage: Int = 100,
    ): ListResponseDto<TagApiDto>

    @GET("api/v1/dashboards/{dashboard_id}/payment-methods")
    suspend fun getPaymentMethods(
        @Path("dashboard_id") dashboardId: String,
        @Query("per_page") perPage: Int = 100,
    ): ListResponseDto<PaymentMethodDto>

    /** Only plans that can still get records. */
    @GET("api/v1/dashboards/{dashboard_id}/installment-plans")
    suspend fun getInstallmentPlans(
        @Path("dashboard_id") dashboardId: String,
        @Query("status") status: String = "pending,late",
        @Query("per_page") perPage: Int = 100,
    ): ListResponseDto<InstallmentPlanApiDto>

    // ── Financial records ──

    @GET("api/v1/dashboards/{dashboard_id}/financial-records")
    suspend fun getRecords(
        @Path("dashboard_id") dashboardId: String,
        @Query("q") query: String? = null,
        @Query("record_type_id") recordTypeIds: String? = null,
        @Query("category_id") categoryIds: String? = null,
        @Query("tag_id") tagIds: String? = null,
        @Query("min_price") minPrice: String? = null,
        @Query("max_price") maxPrice: String? = null,
        @Query("payment_date_from") from: String? = null,
        @Query("payment_date_to") to: String? = null,
        @Query("status") status: String? = null,
        @Query("sort") sort: String? = null,
        @Query("per_page") perPage: Int = 100,
    ): ListResponseDto<FinancialRecordDto>

    /** One record with the names of its category, payment method and plan (§15). */
    @GET("api/v1/dashboards/{dashboard_id}/financial-records/{record_id}")
    suspend fun getRecord(
        @Path("dashboard_id") dashboardId: String,
        @Path("record_id") recordId: String,
        @Query("include") include: String = "category,payment_method,installment_plan",
    ): ItemResponseDto<RecordDetailDto>

    @POST("api/v1/dashboards/{dashboard_id}/financial-records")
    suspend fun createRecord(@Path("dashboard_id") dashboardId: String, @Body body: CreateFinancialRecordDto)

    /** Soft delete (§15). */
    @DELETE("api/v1/dashboards/{dashboard_id}/financial-records/{record_id}")
    suspend fun deleteRecord(@Path("dashboard_id") dashboardId: String, @Path("record_id") recordId: String)

    // ── Create options ──

    @POST("api/v1/dashboards/{dashboard_id}/installment-plans")
    suspend fun createInstallmentPlan(
        @Path("dashboard_id") dashboardId: String,
        @Body body: CreateInstallmentPlanDto,
    ): ItemResponseDto<InstallmentPlanApiDto>

    @POST("api/v1/dashboards/{dashboard_id}/tags")
    suspend fun createTag(@Path("dashboard_id") dashboardId: String, @Body body: CreateTagDto): ItemResponseDto<TagApiDto>

    /** Links a tag to a category (idempotent). */
    @POST("api/v1/dashboards/{dashboard_id}/categories/{category_id}/tags/{tag_id}")
    suspend fun linkTagToCategory(
        @Path("dashboard_id") dashboardId: String,
        @Path("category_id") categoryId: String,
        @Path("tag_id") tagId: String,
    )

    @POST("api/v1/dashboards/{dashboard_id}/categories")
    suspend fun createCategory(
        @Path("dashboard_id") dashboardId: String,
        @Body body: CreateCategoryDto,
    ): ItemResponseDto<CategoryApiDto>

    @POST("api/v1/dashboards/{dashboard_id}/payment-methods")
    suspend fun createPaymentMethod(
        @Path("dashboard_id") dashboardId: String,
        @Body body: CreatePaymentMethodRequestDto,
    ): ItemResponseDto<PaymentMethodDto>

    // ── Global catalogs (§17) ──

    /** With dashboard_id + scope each colour says if a category already uses it (in_use). */
    @GET("api/v1/colors")
    suspend fun getColors(
        @Query("dashboard_id") dashboardId: String,
        @Query("scope") scope: String = "category",
        @Query("per_page") perPage: Int = 100,
    ): ListResponseDto<CatalogColorDto>

    @GET("api/v1/icons")
    suspend fun getIcons(@Query("q") query: String? = null): ListResponseDto<IconDto>

    @GET("api/v1/currencies")
    suspend fun getCurrencies(): ListResponseDto<CurrencyDto>
}
