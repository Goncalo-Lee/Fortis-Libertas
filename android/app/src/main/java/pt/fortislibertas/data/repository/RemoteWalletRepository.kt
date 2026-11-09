package pt.fortislibertas.data.repository

import java.io.IOException
import kotlinx.coroutines.async
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.flow.first
import pt.fortislibertas.data.local.AccountStore
import pt.fortislibertas.data.local.CardColorStore
import pt.fortislibertas.data.model.CardType
import pt.fortislibertas.data.model.CardUpdate
import pt.fortislibertas.data.model.Wallet
import pt.fortislibertas.data.remote.WalletApi
import pt.fortislibertas.data.remote.dto.UpdateCardRequestDto
import retrofit2.HttpException

/**
 * API mode: loads cards and bank accounts at the same time and joins them
 * (bank name and the user's role come from the bank account).
 */
class RemoteWalletRepository(
    private val api: WalletApi,
    private val accountStore: AccountStore,
    private val colorStore: CardColorStore,
) : WalletRepository {

    override suspend fun getWallet(): Wallet = call {
        coroutineScope {
            val cards = async { api.getCards().data }
            val banks = async { api.getBankAccounts().data }
            val banksById = banks.await().associateBy { it.id }
            val userId = accountStore.activeAccountId.first()
            val localColors = colorStore.all()               // TEMPORARY until the API has card colours
            Wallet(
                cards = cards.await().map { dto ->
                    val card = dto.toModel(banksById[dto.bankId], userId)
                    localColors[card.id]?.let { card.copy(colorHex = it) } ?: card
                },
                banks = banks.await().map { it.toModel() },
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
            ),
        )
        colorStore.set(cardId, update.colorHex)          // TEMPORARY: send color_id when the API has it
    }

    override suspend fun deleteCard(cardId: String) = call {
        api.deleteCard(cardId)
        colorStore.remove(cardId)
    }

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
