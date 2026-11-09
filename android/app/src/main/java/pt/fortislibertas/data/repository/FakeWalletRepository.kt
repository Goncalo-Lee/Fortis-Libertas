package pt.fortislibertas.data.repository

import kotlinx.coroutines.delay
import pt.fortislibertas.data.fake.FakeWalletData
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

    private suspend fun setFrozen(cardId: String, frozen: Boolean) {
        delay(400)
        cards = cards.map { if (it.id == cardId) it.copy(isFrozen = frozen) else it }
    }
}
