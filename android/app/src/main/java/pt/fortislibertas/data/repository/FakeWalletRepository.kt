package pt.fortislibertas.data.repository

import kotlinx.coroutines.delay
import pt.fortislibertas.data.fake.FakeWalletData
import pt.fortislibertas.data.model.CardUpdate
import pt.fortislibertas.data.model.Wallet

/** Local mode: the test wallet in memory; freezing lasts while the app is open. */
class FakeWalletRepository : WalletRepository {

    private var cards = FakeWalletData.cards

    override suspend fun getWallet(): Wallet {
        delay(400)
        return Wallet(cards = cards, banks = FakeWalletData.banks)
    }

    override suspend fun freezeCard(cardId: String) = setFrozen(cardId, true)

    override suspend fun unfreezeCard(cardId: String) = setFrozen(cardId, false)

    override suspend fun updateCard(cardId: String, update: CardUpdate) {
        delay(500)
        cards = cards.map {
            if (it.id != cardId) it
            else it.copy(
                cardholderName = update.cardholderName,
                type = update.type,
                expiryDate = update.expiryDate,
                colorHex = update.colorHex,
                last4 = update.cardNumber?.takeLast(4) ?: it.last4,
            )
        }
    }

    override suspend fun deleteCard(cardId: String) {
        delay(500)
        cards = cards.filterNot { it.id == cardId }
    }

    private suspend fun setFrozen(cardId: String, frozen: Boolean) {
        delay(400)
        cards = cards.map { if (it.id == cardId) it.copy(isFrozen = frozen) else it }
    }
}
