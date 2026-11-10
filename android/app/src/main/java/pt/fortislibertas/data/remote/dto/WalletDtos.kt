package pt.fortislibertas.data.remote.dto

import java.math.BigDecimal
import java.time.LocalDate
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import pt.fortislibertas.data.model.BankAccount
import pt.fortislibertas.data.model.BankMember
import pt.fortislibertas.data.model.CardType
import pt.fortislibertas.data.model.PaymentCard

/** Collection envelope of the v1 API: { "data": [ ... ], "meta": { ... } }. */
@Serializable
data class ListResponseDto<T>(val data: List<T>)

/** Single resource envelope: { "data": { ... } }. */
@Serializable
data class ItemResponseDto<T>(val data: T)

/** JSON of a card (endpoints.md §7.2). color and bank_name are planned (see plano-api-cartoes). */
@Serializable
data class CardDto(
    @SerialName("card_id") val id: String,
    @SerialName("bank_id") val bankId: String,
    @SerialName("user_id") val userId: String,
    @SerialName("cardholder_name") val cardholderName: String,
    @SerialName("type_card") val typeCard: String,
    @SerialName("card_number_last4") val last4: String? = null,
    @SerialName("expiry_date") val expiryDate: String? = null,
    @SerialName("frozen_at") val frozenAt: String? = null,
    @SerialName("bank_name") val bankName: String? = null,
    val color: WalletColorDto? = null,
) {
    /** [bank] and [currentUserId] fill what the card JSON does not have yet. */
    fun toModel(bank: BankAccountDto?, currentUserId: String?) = PaymentCard(
        id = id,
        bankId = bankId,
        bankName = bankName ?: bank?.name.orEmpty(),
        colorHex = color?.hexLight ?: CardColors.fallbackFor(id),
        cardholderName = cardholderName,
        type = if (typeCard == "credit") CardType.CREDIT else CardType.DEBIT,
        last4 = last4,
        expiryDate = expiryDate?.let { runCatching { LocalDate.parse(it.take(10)) }.getOrNull() },
        isFrozen = frozenAt != null,
        canManage = userId == currentUserId || bank?.role == "owner",
    )
}

@Serializable
data class WalletColorDto(
    @SerialName("hex_light") val hexLight: String,
)

/** JSON of a bank account (endpoints.md §5.2). */
@Serializable
data class BankAccountDto(
    @SerialName("bank_account_id") val id: String,
    val name: String,
    val currency: String = "EUR",
    val balance: String = "0",
    @SerialName("frozen_at") val frozenAt: String? = null,
    val role: String = "viewer",
) {
    fun toModel() = BankAccount(
        id = id,
        name = name,
        currency = currency,
        balance = balance.toBigDecimalOrNull() ?: BigDecimal.ZERO,
        isFrozen = frozenAt != null,
        isOwner = role == "owner",
        canAddCards = role == "owner" || role == "editor",
    )
}

/**
 * Body of PATCH /api/v1/cards/{card_id} (endpoints.md §7.3).
 * Null fields are not sent (encodeDefaults is off), so the number and CVV are kept when null.
 * No color yet: the API rejects unknown keys (422) until color_id exists (see plano-api-cartoes).
 */
@Serializable
data class UpdateCardRequestDto(
    @SerialName("cardholder_name") val cardholderName: String,
    @SerialName("type_card") val typeCard: String,
    @SerialName("expiry_date") val expiryDate: String? = null,
    @SerialName("card_number") val cardNumber: String? = null,
    val cvv: String? = null,
)

/** JSON of a bank account member (endpoints.md §6.2). */
@Serializable
data class BankMemberDto(
    @SerialName("user_id") val id: String,
    @SerialName("user_name") val userName: String? = null,
    @SerialName("full_name") val fullName: String,
    val image: String? = null,
    val role: String,
) {
    fun toModel() = BankMember(id = id, fullName = fullName, userName = userName, imageUrl = image, role = role)
}

/** Body of POST /api/v1/bank-accounts/{id}/cards (§7.3). Null fields are not sent. */
@Serializable
data class CreateCardRequestDto(
    @SerialName("cardholder_name") val cardholderName: String,
    @SerialName("type_card") val typeCard: String,
    @SerialName("card_number") val cardNumber: String? = null,
    @SerialName("expiry_date") val expiryDate: String? = null,
    val cvv: String? = null,
)

/** Body of POST /api/v1/bank-accounts (§5.3). */
@Serializable
data class CreateBankRequestDto(
    val name: String,
    @SerialName("initial_balance") val initialBalance: String,
    val currency: String,
)

/** Card colours while the API has no color field: always the same colour for the same card. */
object CardColors {
    /** Colours the user can pick in the Edit card form. */
    val palette = listOf("#FFE761", "#2092E9", "#76C352", "#F97316", "#7C3AED", "#06B6D4")

    fun fallbackFor(cardId: String): String = palette[Math.floorMod(cardId.hashCode(), palette.size)]
}
