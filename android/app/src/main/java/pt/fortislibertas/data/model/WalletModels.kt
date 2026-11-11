package pt.fortislibertas.data.model

import java.math.BigDecimal
import java.time.LocalDate

/** Credit or debit (type_card in the API). */
enum class CardType { CREDIT, DEBIT }

/** A bank account the user belongs to (Bank_Account table). */
data class BankAccount(
    val id: String,
    val name: String,
    val currency: String,
    val balance: BigDecimal,
    val isFrozen: Boolean,
    val isOwner: Boolean,                  // the user's role on this account is "owner"
    val canAddCards: Boolean = isOwner,    // owner or editor (POST /bank-accounts/{id}/cards)
)

/**
 * A payment card as the UI uses it. Named PaymentCard so it does not clash with FortisCard.
 * The full number is never available: only the last 4 digits.
 */
data class PaymentCard(
    val id: String,
    val bankId: String,
    val bankName: String,
    val colorHex: String,
    val colorId: String? = null,           // color_id in the API (null in previews / old data)
    val cardholderName: String,
    val type: CardType,
    val last4: String?,
    val expiryDate: LocalDate?,
    val isFrozen: Boolean,
    val canManage: Boolean,                // card owner or owner of the bank account (freeze, edit)
) {
    fun isExpired(today: LocalDate = LocalDate.now()): Boolean = expiryDate?.isBefore(today) == true
}

/**
 * What the Edit card form sends. [cardNumber] and [cvv] are write-only in the API:
 * null = keep the current ones.
 */
data class CardUpdate(
    val cardholderName: String,
    val type: CardType,
    val expiryDate: LocalDate?,
    val colorId: String?,                   // null = keep the current colour
    val cardNumber: String? = null,
    val cvv: String? = null,
)

/** A colour a card can have (the API's colour catalog without the 2 reserved ones). */
data class CardColor(val id: String, val hex: String)

/** Cards, bank accounts and the card colours, loaded together for the Cards / Banks screen. */
data class Wallet(
    val cards: List<PaymentCard>,
    val banks: List<BankAccount>,
    val colors: List<CardColor> = emptyList(),
)

/** A person in a bank account (read only in the app: managing members is done on the web). */
data class BankMember(
    val id: String,
    val fullName: String,
    val userName: String?,
    val imageUrl: String?,
    val role: String,                      // owner, editor, viewer
)

/** What the Add card form sends. Number, expiry date and CVV are optional in the API. */
data class NewCard(
    val bankId: String,
    val cardholderName: String,
    val type: CardType,
    val cardNumber: String?,
    val expiryDate: LocalDate?,
    val cvv: String?,
    val colorId: String?,                   // null = the server picks one from the palette
)

/** What the Add bank form sends. The creator becomes the owner. */
data class NewBankAccount(
    val name: String,
    val initialBalance: BigDecimal,
    val currency: String,
)
