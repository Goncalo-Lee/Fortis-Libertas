package pt.fortislibertas.data.remote

import pt.fortislibertas.data.remote.dto.BankAccountDto
import pt.fortislibertas.data.remote.dto.CardDto
import pt.fortislibertas.data.remote.dto.ItemResponseDto
import pt.fortislibertas.data.remote.dto.ListResponseDto
import pt.fortislibertas.data.remote.dto.UpdateCardRequestDto
import retrofit2.http.Body
import retrofit2.http.DELETE
import retrofit2.http.GET
import retrofit2.http.PATCH
import retrofit2.http.POST
import retrofit2.http.Path
import retrofit2.http.Query

/** Cards and bank accounts (endpoints.md §5 and §7). */
interface WalletApi {

    /** Cards owned by the caller, across bank accounts. */
    @GET("api/v1/cards")
    suspend fun getCards(@Query("per_page") perPage: Int = 100): ListResponseDto<CardDto>

    /** Bank accounts the caller belongs to. */
    @GET("api/v1/bank-accounts")
    suspend fun getBankAccounts(@Query("per_page") perPage: Int = 100): ListResponseDto<BankAccountDto>

    @POST("api/v1/cards/{card_id}/freeze")
    suspend fun freezeCard(@Path("card_id") id: String): ItemResponseDto<CardDto>

    @POST("api/v1/cards/{card_id}/unfreeze")
    suspend fun unfreezeCard(@Path("card_id") id: String): ItemResponseDto<CardDto>

    @PATCH("api/v1/cards/{card_id}")
    suspend fun updateCard(@Path("card_id") id: String, @Body body: UpdateCardRequestDto): ItemResponseDto<CardDto>

    /** Soft delete. The payment methods that used the card lose the link (§7.5). */
    @DELETE("api/v1/cards/{card_id}")
    suspend fun deleteCard(@Path("card_id") id: String)
}
