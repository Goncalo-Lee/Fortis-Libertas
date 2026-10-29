package pt.fortislibertas.data.remote

import pt.fortislibertas.data.remote.dto.FilterOptionsDto
import pt.fortislibertas.data.remote.dto.TransactionListDto
import retrofit2.http.GET
import retrofit2.http.Query

interface TransactionApi {

    /**
     * Lista filtrada. Os parâmetros a null não são enviados.
     * Listas vão separadas por vírgulas: categoryIds=a,b,c
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
}