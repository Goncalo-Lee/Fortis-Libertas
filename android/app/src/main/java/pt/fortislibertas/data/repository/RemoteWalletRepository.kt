package pt.fortislibertas.data.repository

import kotlinx.coroutines.async
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.flow.first
import pt.fortislibertas.data.local.AccountStore
import pt.fortislibertas.data.model.Wallet
import pt.fortislibertas.data.remote.WalletApi
import retrofit2.HttpException
import java.io.IOException

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
            val banksById = banks.await().associateBy { it.id }
            val userId = accountStore.activeAccountId.first()
            Wallet(
                cards = cards.await().map { it.toModel(banksById[it.bankId], userId) },
                banks = banks.await().map { it.toModel() },
            )
        }
    }

    override suspend fun freezeCard(cardId: String) = call { api.freezeCard(cardId); Unit }

    override suspend fun unfreezeCard(cardId: String) = call { api.unfreezeCard(cardId); Unit }

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
