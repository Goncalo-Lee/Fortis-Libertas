package pt.fortislibertas.data.repository

import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.first
import pt.fortislibertas.data.local.AccountStore
import pt.fortislibertas.data.local.FakeData
import pt.fortislibertas.data.model.UserProfile

/**
 * Modo local: devolve os dados de FakeData com um pequeno atraso,
 * para veres o estado de carregamento como se fosse a API.
 */
class FakeProfileRepository(
    private val accountStore: AccountStore,
) : ProfileRepository {

    override suspend fun getProfile(): UserProfile {
        delay(400)
        val activeId = accountStore.activeAccountId.first() ?: throw NotSignedInException()
        return FakeData.profiles[activeId] ?: throw NotSignedInException()
    }

    override suspend fun deactivateAccount() = delay(600)

    override suspend fun deleteAccount() = delay(600)

    override suspend fun signOut() = delay(200)
}
