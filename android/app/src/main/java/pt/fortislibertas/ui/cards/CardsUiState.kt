package pt.fortislibertas.ui.cards

import androidx.annotation.StringRes
import pt.fortislibertas.data.model.BankAccount
import pt.fortislibertas.data.model.CardType
import pt.fortislibertas.data.model.PaymentCard
import java.time.LocalDate

/** Which list is showing; the round button at the bottom switches between them. */
enum class CardsPage { Cards, Banks }

/**
 * Status filter (chips under the header). Inactive = expired card;
 * bank accounts do not expire, so the Banks page only shows All / Active / Frozen.
 */
enum class CardsFilter { All, Active, Frozen, Inactive }

/** Which dialog is open, and for which card. */
sealed interface CardsDialog {
    val card: PaymentCard
    data class Freeze(override val card: PaymentCard) : CardsDialog
    data class Unfreeze(override val card: PaymentCard) : CardsDialog
    data class Info(override val card: PaymentCard) : CardsDialog
    data class Delete(override val card: PaymentCard) : CardsDialog
}

/** Fields of the Edit card form that can have a validation error. */
enum class CardEditField { CardholderName, CardNumber, Cvv }

/** What the user has typed so far in the Edit card form (bottom sheet). */
data class CardEditForm(
    val card: PaymentCard,
    val cardholderName: String = card.cardholderName,
    val type: CardType = card.type,
    val expiryDate: LocalDate? = card.expiryDate,
    val colorHex: String = card.colorHex,
    val replaceNumber: Boolean = false,          // number + CVV fields only show after "Replace card number"
    val cardNumber: String = "",
    val cvv: String = "",
    val errors: Map<CardEditField, Int> = emptyMap(),   // field → @StringRes of the message
)

/** Everything the Cards / Banks screen needs to draw itself. */
data class CardsUiState(
    val page: CardsPage = CardsPage.Cards,
    val filter: CardsFilter = CardsFilter.All,
    val cards: List<PaymentCard> = emptyList(),
    val banks: List<BankAccount> = emptyList(),
    val isLoading: Boolean = true,
    @StringRes val errorMessage: Int? = null,
    val dialog: CardsDialog? = null,
    val editForm: CardEditForm? = null,          // not null = Edit card sheet open
    val isWorking: Boolean = false,              // freeze / unfreeze / save / delete request running
    val userName: String? = null,
    val avatarUrl: String? = null,
) {
    /** Cards that match the filter. A frozen card counts as Frozen even if it is also expired. */
    val visibleCards: List<PaymentCard>
        get() = cards.filter {
            when (filter) {
                CardsFilter.All -> true
                CardsFilter.Active -> !it.isFrozen && !it.isExpired()
                CardsFilter.Frozen -> it.isFrozen
                CardsFilter.Inactive -> !it.isFrozen && it.isExpired()
            }
        }

    /** Bank accounts that match the filter (they have no Inactive state). */
    val visibleBanks: List<BankAccount>
        get() = banks.filter {
            when (filter) {
                CardsFilter.All, CardsFilter.Inactive -> true
                CardsFilter.Active -> !it.isFrozen
                CardsFilter.Frozen -> it.isFrozen
            }
        }
}

/** Things that happen only once. */
sealed interface CardsEvent {
    data class ShowMessage(@StringRes val messageRes: Int) : CardsEvent
}
