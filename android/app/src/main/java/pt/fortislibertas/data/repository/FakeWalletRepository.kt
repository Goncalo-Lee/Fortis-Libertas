package pt.fortislibertas.data.repository

import java.util.UUID
import kotlinx.coroutines.delay
import pt.fortislibertas.data.fake.FakeWalletData
import pt.fortislibertas.data.model.BankAccount
import pt.fortislibertas.data.model.BankMember
import pt.fortislibertas.data.model.CardUpdate
import pt.fortislibertas.data.model.NewBankAccount
import pt.fortislibertas.data.model.NewCard
import pt.fortislibertas.data.model.PaymentCard
import pt.fortislibertas.data.model.Wallet

/** Local mode: the test wallet in memory; freezing lasts while the app is open. */
class FakeWalletRepository : WalletRepository {

    private var cards = FakeWalletData.cards
    private var banks = FakeWalletData.banks

    override suspend fun getWallet(): Wallet {
        delay(400)
        return Wallet(cards = cards, banks = banks)
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

    override suspend fun getMembers(bankId: String): List<BankMember> {
        delay(300)
        return FakeWalletData.members[bankId] ?: FakeWalletData.members.values.first().take(1)
    }

    override suspend fun createCard(card: NewCard) {
        delay(500)
        val bank = banks.first { it.id == card.bankId }
        cards = cards + PaymentCard(
            id = UUID.randomUUID().toString(),
            bankId = bank.id,
            bankName = bank.name,
            colorHex = card.colorHex,
            cardholderName = card.cardholderName,
            type = card.type,
            last4 = card.cardNumber?.takeLast(4),
            expiryDate = card.expiryDate,
            isFrozen = false,
            canManage = true,
        )
    }

    override suspend fun createBankAccount(bank: NewBankAccount) {
        delay(500)
        banks = banks + BankAccount(
            id = UUID.randomUUID().toString(),
            name = bank.name,
            currency = bank.currency,
            balance = bank.initialBalance,
            isFrozen = false,
            isOwner = true,
        )
    }

    private suspend fun setFrozen(cardId: String, frozen: Boolean) {
        delay(400)
        cards = cards.map { if (it.id == cardId) it.copy(isFrozen = frozen) else it }
    }
}
