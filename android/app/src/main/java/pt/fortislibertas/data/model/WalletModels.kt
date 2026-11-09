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
    val cardholderName: String,
    val type: CardType,
    val last4: String?,
    val expiryDate: LocalDate?,
    val isFrozen: Boolean,
    val canManage: Boolean,                // card owner or owner of the bank account (freeze, edit)
) {
    fun isExpired(today: LocalDate = LocalDate.now()): Boolean = expiryDate?.isBefore(today) == true
}

/** Cards and bank accounts, loaded together for the Cards / Banks screen. */
data class Wallet(
    val cards: List<PaymentCard>,
    val banks: List<BankAccount>,
)
