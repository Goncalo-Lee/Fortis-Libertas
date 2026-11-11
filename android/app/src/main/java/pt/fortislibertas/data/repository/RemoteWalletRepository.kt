package pt.fortislibertas.data.repository

import java.io.IOException
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.async
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.flow.first
import pt.fortislibertas.data.local.AccountStore
import pt.fortislibertas.data.model.BankMember
import pt.fortislibertas.data.model.CardColor
import pt.fortislibertas.data.model.CardType
import pt.fortislibertas.data.model.CardUpdate
import pt.fortislibertas.data.model.NewBankAccount
import pt.fortislibertas.data.model.NewCard
import pt.fortislibertas.data.model.Wallet
import pt.fortislibertas.data.remote.WalletApi
import pt.fortislibertas.data.remote.dto.CreateBankRequestDto
import pt.fortislibertas.data.remote.dto.CreateCardRequestDto
import pt.fortislibertas.data.remote.dto.UpdateCardRequestDto
import retrofit2.HttpException

/**
 * API mode: loads cards and bank accounts at the same time and joins them
 * (bank name and the user's role come from the bank account).
 */
class RemoteWalletRepository(
    private val api: WalletApi,
    private val accountStore: AccountStore,
) : WalletRepository {

    override suspend fun getWallet(): Wallet = call {
        coroutineScope {
            val cards = async { api.getCards().data }
            val banks = async { api.getBankAccounts().data }
            // The palette is only for the forms: if it fails, the cards still show
            val colors = async {
                try {
                    api.getCardColors().data.map { CardColor(it.id, it.codeColor) }
                } catch (e: CancellationException) {
                    throw e
                } catch (_: Exception) {
                    emptyList()
                }
            }
            val banksById = banks.await().associateBy { it.id }
            val userId = accountStore.activeAccountId.first()
            Wallet(
                cards = cards.await().map { it.toModel(banksById[it.bankId], userId) },
                banks = banks.await().map { it.toModel() },
                colors = colors.await(),
            )
        }
    }

    override suspend fun freezeCard(cardId: String) = call { api.freezeCard(cardId); Unit }

    override suspend fun unfreezeCard(cardId: String) = call { api.unfreezeCard(cardId); Unit }

    override suspend fun updateCard(cardId: String, update: CardUpdate) = call {
        api.updateCard(
            cardId,
            UpdateCardRequestDto(
                cardholderName = update.cardholderName.trim(),
                typeCard = if (update.type == CardType.CREDIT) "credit" else "debit",
                expiryDate = update.expiryDate?.toString(),        // ISO: 2027-05-01
                cardNumber = update.cardNumber,
                cvv = update.cvv,
                colorId = update.colorId,
            ),
        )
        Unit
    }

    override suspend fun getMembers(bankId: String): List<BankMember> = call {
        api.getMembers(bankId).data.map { it.toModel() }
    }

    override suspend fun createCard(card: NewCard) = call {
        api.createCard(
            card.bankId,
            CreateCardRequestDto(
                cardholderName = card.cardholderName.trim(),
                typeCard = if (card.type == CardType.CREDIT) "credit" else "debit",
                cardNumber = card.cardNumber,
                expiryDate = card.expiryDate?.toString(),
                cvv = card.cvv,
                colorId = card.colorId,
            ),
        )
        Unit
    }

    override suspend fun createBankAccount(bank: NewBankAccount) = call {
        api.createBankAccount(
            CreateBankRequestDto(
                name = bank.name.trim(),
                initialBalance = bank.initialBalance.setScale(2).toPlainString(),
                currency = bank.currency,
            ),
        )
        Unit
    }

    override suspend fun deleteCard(cardId: String) = call { api.deleteCard(cardId) }

    /** Turns Retrofit/OkHttp errors into the errors the UI knows. */
    private suspend fun <T> call(block: suspend () -> T): T =
        try {
            block()
        } catch (e: HttpException) {
            if (e.code() == 401) throw SessionExpiredException() else throw e
        } catch (e: IOException) {
            throw NetworkException(e)
        }
}
